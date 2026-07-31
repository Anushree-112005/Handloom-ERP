from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from decimal import Decimal

from app.models.inventory import StockLedger, StockBalance

async def post_stock_ledger(
    db: AsyncSession,
    stock_item_id: int,
    status: str,
    movement_type: str,
    qty: float,
    txn_date: datetime = None,
    lot_no: str = None,
    design_id: int = None,
    ibpo_id: int = None,
    party_id: int = None,
    godown_id: int = None,
    rate: float = None,
    ref_voucher_type: str = None,
    ref_voucher_no: str = None,
    grade: str = None,
    remarks: str = None,
    created_by: int = None,
    allow_negative: bool = False
):
    if txn_date is None:
        txn_date = datetime.utcnow()
        
    value = None
    if rate is not None:
        value = float(Decimal(str(qty)) * Decimal(str(rate)))
        
    # Check rule 4 - Stock never goes negative (for outward movements unless allow_negative=True)
    if not allow_negative and movement_type in ['OUTWARD', 'TRANSFER_OUT', 'ADJUSTMENT_OUT'] and qty < 0:
        abs_qty = abs(qty)
        stmt = select(StockBalance).where(
            StockBalance.stock_item_id == stock_item_id,
            StockBalance.godown_id == godown_id,
            StockBalance.status == status
        )
        result = await db.execute(stmt)
        balance = result.scalars().first()
        
        if not balance or balance.closing_qty < abs_qty:
            raise ValueError(f"Insufficient stock for item_id={stock_item_id}, godown_id={godown_id}, status={status}. Requested: {abs_qty}, Available: {balance.closing_qty if balance else 0}")
            
    # Insert Stock Ledger
    ledger_entry = StockLedger(
        txn_date=txn_date,
        stock_item_id=stock_item_id,
        lot_no=lot_no,
        design_id=design_id,
        ibpo_id=ibpo_id,
        party_id=party_id,
        godown_id=godown_id,
        status=status,
        movement_type=movement_type,
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
        StockBalance.godown_id == godown_id,
        StockBalance.status == status
    )
    result = await db.execute(stmt)
    balance = result.scalars().first()
    
    if balance:
        balance.closing_qty = float(Decimal(str(balance.closing_qty)) + Decimal(str(qty)))
        if value is not None:
            balance.closing_value = float(Decimal(str(balance.closing_value)) + Decimal(str(value)))
    else:
        balance = StockBalance(
            stock_item_id=stock_item_id,
            godown_id=godown_id,
            status=status,
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
        item_id_str = stk_obj.name if stk_obj else f"YRN-{stock_item_id}"

        movement_entry = StockMovement(
            item_id=item_id_str,
            dest_location_id=godown_id,
            location_type="MAIN",
            transaction_type="RECEIPT" if movement_type == "INWARD" else movement_type,
            quantity=float(qty),
            tracking_id=ref_voucher_no or lot_no or str(stock_item_id),
            user_id=created_by,
            status=status or "AVAILABLE"
        )
        db.add(movement_entry)

        stmt_curr = select(CurrentStock).where(
            CurrentStock.item_id == item_id_str,
            CurrentStock.status == (status or "AVAILABLE")
        )
        res_curr = await db.execute(stmt_curr)
        curr_obj = res_curr.scalars().first()
        if curr_obj:
            curr_obj.quantity = float(Decimal(str(curr_obj.quantity)) + Decimal(str(qty)))
            if lot_no:
                curr_obj.lot_id = lot_no
        else:
            new_curr = CurrentStock(
                item_id=item_id_str,
                location_id=godown_id or 1,
                location_type="MAIN",
                quantity=float(qty),
                batch_id=ref_voucher_no,
                lot_id=lot_no,
                status=status or "AVAILABLE"
            )
            db.add(new_curr)
        await db.flush()
    except Exception as err:
        import logging
        logging.getLogger("post_stock_ledger").error(f"Syncing CurrentStock failed: {err}")

    return ledger_entry
