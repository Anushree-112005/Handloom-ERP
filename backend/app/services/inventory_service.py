from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from decimal import Decimal
import logging

from app.models.inventory import StockLedger, StockBalance

logger = logging.getLogger("inventory_service")

ALLOWED_STATUSES = {'AVAILABLE', 'AT_JOB_WORK', 'IN_TRANSIT', 'RESERVED', 'HOLD_REJECTED', 'SOLD', 'SURPLUS'}
ALLOWED_MOVEMENTS = {'INWARD', 'OUTWARD', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'}

async def post_stock_ledger(
    db: AsyncSession,
    stock_item_id: int,
    status: str,
    movement_type: str,
    qty: float,
    txn_date: Optional[datetime] = None,
    lot_no: Optional[str] = None,
    design_id: Optional[int] = None,
    ibpo_id: Optional[int] = None,
    party_id: Optional[int] = None,
    godown_id: Optional[int] = None,
    rate: Optional[float] = None,
    ref_voucher_type: Optional[str] = None,
    ref_voucher_no: Optional[str] = None,
    grade: Optional[str] = None,
    remarks: Optional[str] = None,
    created_by: Optional[int] = None,
    allow_negative: bool = False
):
    # Normalize godown_id default to 1 (Main Godown) if None
    effective_godown_id = godown_id if godown_id is not None else 1

    # Normalize status and movement_type
    norm_status = (status or "AVAILABLE").upper()
    if norm_status not in ALLOWED_STATUSES:
        norm_status = "AVAILABLE"

    norm_movement_type = (movement_type or "INWARD").upper()
    if norm_movement_type not in ALLOWED_MOVEMENTS:
        norm_movement_type = "INWARD"

    # Normalize qty sign based on movement direction
    is_outward = norm_movement_type in ['OUTWARD', 'TRANSFER_OUT', 'ADJUSTMENT_OUT']
    if is_outward and qty > 0:
        qty = -qty
    elif not is_outward and norm_movement_type in ['INWARD', 'TRANSFER_IN', 'ADJUSTMENT_IN'] and qty < 0:
        qty = abs(qty)

    if txn_date is None:
        txn_date = datetime.utcnow()
        
    value = None
    if rate is not None:
        try:
            value = float(Decimal(str(qty)) * Decimal(str(rate)))
        except Exception:
            value = qty * rate
        
    # Check rule 4 - Stock never goes negative (for outward movements unless allow_negative=True)
    if not allow_negative and is_outward:
        abs_qty = abs(qty)
        stmt = select(StockBalance).where(
            StockBalance.stock_item_id == stock_item_id,
            StockBalance.godown_id == effective_godown_id,
            StockBalance.status == norm_status
        )
        result = await db.execute(stmt)
        balance = result.scalars().first()
        
        closing_qty = float(getattr(balance, 'closing_qty', 0.0) or 0.0) if balance else 0.0
        if not balance or closing_qty < abs_qty:
            raise ValueError(f"Insufficient stock for item_id={stock_item_id}, godown_id={effective_godown_id}, status={norm_status}. Requested: {abs_qty}, Available: {closing_qty}")
            
    # Insert Stock Ledger
    ledger_entry = StockLedger(
        txn_date=txn_date,
        stock_item_id=stock_item_id,
        lot_no=lot_no,
        design_id=design_id,
        ibpo_id=ibpo_id,
        party_id=party_id,
        godown_id=effective_godown_id,
        status=norm_status,
        movement_type=norm_movement_type,
        qty=qty,
        rate=rate,
        value=value,
        ref_voucher_type=ref_voucher_type,
        ref_voucher_no=ref_voucher_no,
        grade=grade,
        remarks=remarks,
        created_by=created_by
    )
    db.add(ledger_entry)
    
    # Update Stock Balance
    stmt = select(StockBalance).where(
        StockBalance.stock_item_id == stock_item_id,
        StockBalance.godown_id == effective_godown_id,
        StockBalance.status == norm_status
    )
    result = await db.execute(stmt)
    balance = result.scalars().first()
    
    if balance:
        raw_qty = getattr(balance, "closing_qty", 0) or 0
        curr_qty = Decimal(str(raw_qty))
        setattr(balance, "closing_qty", float(curr_qty + Decimal(str(qty))))
        if value is not None:
            raw_val = getattr(balance, "closing_value", 0) or 0
            curr_val = Decimal(str(raw_val))
            setattr(balance, "closing_value", float(curr_val + Decimal(str(value))))
    else:
        balance = StockBalance(
            stock_item_id=stock_item_id,
            godown_id=effective_godown_id,
            status=norm_status,
            closing_qty=qty,
            closing_value=value if value is not None else 0.0
        )
        db.add(balance)
        
    # Flush to ensure constraints
    await db.flush()

    # Also sync with CurrentStock & StockMovement for ERP frontend endpoints
    try:
        from app.models.stock import CurrentStock, StockMovement
        from finance_app.models.stock_item import StockItem

        stmt_stk = select(StockItem).where(StockItem.id == stock_item_id)
        res_stk = await db.execute(stmt_stk)
        stk_obj = res_stk.scalars().first()
        stk_name = getattr(stk_obj, "name", None) if stk_obj else None
        item_id_str = stk_name if stk_name else f"YRN-{stock_item_id}"

        movement_entry = StockMovement(
            item_id=item_id_str,
            dest_location_id=effective_godown_id,
            location_type="MAIN",
            transaction_type="RECEIPT" if norm_movement_type == "INWARD" else norm_movement_type,
            quantity=float(qty),
            tracking_id=ref_voucher_no or lot_no or str(stock_item_id),
            user_id=created_by,
            status=norm_status
        )
        db.add(movement_entry)

        stmt_curr = select(CurrentStock).where(
            CurrentStock.item_id == item_id_str,
            CurrentStock.status == norm_status
        )
        res_curr = await db.execute(stmt_curr)
        curr_obj = res_curr.scalars().first()
        if curr_obj:
            raw_curr_qty = getattr(curr_obj, "quantity", 0) or 0
            curr_qty = Decimal(str(raw_curr_qty))
            setattr(curr_obj, "quantity", float(curr_qty + Decimal(str(qty))))
            if getattr(curr_obj, "reserved_quantity", None) is None:
                setattr(curr_obj, "reserved_quantity", 0.0)
            if lot_no:
                setattr(curr_obj, "lot_id", lot_no)
        else:
            new_curr = CurrentStock(
                item_id=item_id_str,
                location_id=effective_godown_id,
                location_type="MAIN",
                quantity=float(qty),
                reserved_quantity=0.0,
                batch_id=ref_voucher_no,
                lot_id=lot_no,
                status=norm_status
            )
            db.add(new_curr)
        await db.flush()
    except Exception as err:
        logger.error(f"Syncing CurrentStock failed: {err}")

    return ledger_entry
