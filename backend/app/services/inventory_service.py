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
    created_by: int = None
):
    if txn_date is None:
        txn_date = datetime.utcnow()
        
    value = None
    if rate is not None:
        value = float(Decimal(str(qty)) * Decimal(str(rate)))
        
    # Check rule 4 - Stock never goes negative (for outward movements)
    if movement_type in ['OUTWARD', 'TRANSFER_OUT', 'ADJUSTMENT_OUT'] and qty < 0:
        # The prompt says: Before any OUTWARD/TRANSFER_OUT/ADJUSTMENT_OUT insert, validate that
        # stock_balance.closing_qty >= requested qty
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
    return ledger_entry
