"""Yarn Inward CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.core.database import get_db
from app.models.yarn_inward import YarnInward, YarnInwardItem
from app.models.notification import Notification

router = APIRouter(prefix="/yarn-inwards", tags=["Yarn Inwards"])

class YarnInwardItemIn(BaseModel):
    yarn_count: Optional[str] = None
    mill_name: Optional[str] = None
    colour: Optional[str] = None
    color_code: Optional[str] = None
    lot_no: Optional[str] = None
    our_id: Optional[str] = None
    rack_id: Optional[int] = None
    bags: Optional[int] = 0
    kgs: Optional[float] = 0.0
    rate: Optional[float] = 0.0
    amount: Optional[float] = 0.0

class YarnInwardCreate(BaseModel):
    entry_date: Optional[date] = None
    inward_date: Optional[date] = None
    status: Optional[str] = "Received"
    received_type: Optional[str] = None
    received_from: Optional[str] = None
    po_no_dt: Optional[str] = None
    agent_name: Optional[str] = None
    stock_godown: Optional[str] = None
    godown_id: Optional[int] = None
    cone_type: Optional[str] = None
    
    order_kgs: Optional[float] = 0.0
    received_kgs: Optional[float] = 0.0
    balance_kgs: Optional[float] = 0.0
    
    pc_id: Optional[str] = None
    tolerance_pct: Optional[float] = 0.0
    bill_no: Optional[str] = None
    bill_amount: Optional[float] = 0.0
    gross_kgs: Optional[float] = 0.0
    net_kgs: Optional[float] = 0.0
    chipnam: Optional[str] = None
    due_days: Optional[int] = 0
    
    transport: Optional[str] = None
    veh_no: Optional[str] = None
    total_bags: Optional[int] = 0
    eway_bill: Optional[str] = None
    org_grn_no: Optional[str] = None
    gate_no: Optional[str] = None
    wbridge_no: Optional[str] = None
    w_weight: Optional[float] = 0.0

    other_remarks: Optional[str] = None
    packing: Optional[str] = None
    freight: Optional[float] = 0.0
    gross_amount: Optional[float] = 0.0
    tax_type: Optional[str] = None
    cgst_pct: Optional[float] = 0.0
    sgst_pct: Optional[float] = 0.0
    igst_pct: Optional[float] = 0.0
    tax_value: Optional[float] = 0.0
    tcs_value: Optional[float] = 0.0
    tds_pct: Optional[float] = 0.0
    total_tax: Optional[float] = 0.0
    round_off: Optional[float] = 0.0
    net_amount: Optional[float] = 0.0
    remarks: Optional[str] = None
    terms_conditions: Optional[List[str]] = []
    
    items: Optional[List[YarnInwardItemIn]] = []

class YarnInwardItemOut(YarnInwardItemIn):
    id: int
    class Config:
        from_attributes = True

class YarnInwardOut(YarnInwardCreate):
    id: int
    ref_no: str
    items: List[YarnInwardItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[YarnInwardOut])
async def list_inwards(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(YarnInward).options(selectinload(YarnInward.items)).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=YarnInwardOut, status_code=201)
async def create_inward(data: YarnInwardCreate, db: AsyncSession = Depends(get_db)):
    # Generate ref_no by parsing the maximum numeric suffix from GRN-Y- ref_nos
    q = select(YarnInward.ref_no).where(YarnInward.ref_no.like("GRN-Y-%"))
    res = await db.execute(q)
    ref_nos = res.scalars().all()
    
    max_num = 0
    for r in ref_nos:
        if r:
            try:
                parts = r.split('-')
                val = int(parts[-1])
                if val > max_num:
                    max_num = val
            except (ValueError, IndexError):
                continue
    ref_no = f"GRN-Y-{max_num + 1:05d}"

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    order = YarnInward(**order_dict, ref_no=ref_no)

    for item in items_data:
      # Skip incomplete items - must have yarn_count
      if item.yarn_count:
        order.items.append(YarnInwardItem(**item.model_dump()))

    db.add(order)
    await db.commit()
    
    # Reload order with items loaded eagerly
    res_order = await db.execute(
        select(YarnInward).options(selectinload(YarnInward.items)).where(YarnInward.id == order.id)
    )
    order = res_order.scalar_one()

    # RULE 1: INVENTORY MODULE INTEGRATION
    try:
        from app.services.inventory_service import post_stock_ledger
        from finance_app.models.stock_item import StockItem

        for item in order.items:
            if not item.yarn_count: continue
            item_name_str = item.yarn_count
            stmt_item = select(StockItem).where(StockItem.name == item_name_str)
            res_item = await db.execute(stmt_item)
            stock_item = res_item.scalars().first()

            if not stock_item:
                stock_item = StockItem(
                    name=item_name_str,
                    item_code=f"YRN-{max_num + 1:04d}",
                    item_category="YARN",
                    yarn_form="CONE" if order.cone_type else "NA",
                    company_id=1,
                    unit="Kgs",
                    purchase_rate=float(item.rate or 0.0)
                )
                db.add(stock_item)
                await db.flush()

            await post_stock_ledger(
                db=db,
                stock_item_id=stock_item.id,
                status="AVAILABLE",
                movement_type="INWARD",
                qty=float(item.kgs or 0.0),
                rate=float(item.rate or 0.0),
                lot_no=item.lot_no,
                godown_id=order.godown_id or 1,
                ref_voucher_type="YARN_INWARD",
                ref_voucher_no=order.ref_no,
                remarks=f"Yarn Inward from {order.received_from}"
            )
        await db.commit()
    except Exception as e:
        import logging
        logging.getLogger("yarn_inward_inventory").error(f"Stock ledger error: {e}")

    return order


@router.get("/{inward_id}", response_model=YarnInwardOut)
async def get_inward(inward_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnInward).options(selectinload(YarnInward.items)).where(YarnInward.id == inward_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Yarn Inward not found")
    return order


@router.put("/{inward_id}", response_model=YarnInwardOut)
async def update_inward(inward_id: int, data: YarnInwardCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnInward).options(selectinload(YarnInward.items)).where(YarnInward.id == inward_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Yarn Inward not found")

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    
    for key, value in order_dict.items():
        setattr(order, key, value)
        
    for item in order.items:
        await db.delete(item)
    order.items = []

    for item in items_data:
      # Skip incomplete items - must have yarn_count
      if item.yarn_count:
        order.items.append(YarnInwardItem(**item.model_dump()))

    await db.commit()
    await db.refresh(order)
    
    result = await db.execute(
        select(YarnInward).options(selectinload(YarnInward.items)).where(YarnInward.id == inward_id)
    )
    return result.scalar_one()


@router.delete("/{inward_id}", status_code=204)
async def delete_inward(inward_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnInward).options(selectinload(YarnInward.items)).where(YarnInward.id == inward_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Yarn Inward not found")

    if order.ref_no:
        try:
            from app.models.inventory import StockLedger, StockBalance
            from app.models.stock import CurrentStock, StockMovement

            # Get ledger entries for this GRN
            res_led = await db.execute(select(StockLedger).where(StockLedger.ref_voucher_no == order.ref_no))
            ledgers = res_led.scalars().all()
            for leg in ledgers:
                res_bal = await db.execute(select(StockBalance).where(StockBalance.stock_item_id == leg.stock_item_id))
                bal = res_bal.scalars().first()
                if bal:
                    bal.closing_qty = max(0.0, float(bal.closing_qty) - float(leg.qty))
                await db.delete(leg)

            for item in order.items:
                if item.yarn_count:
                    res_curr = await db.execute(select(CurrentStock).where(CurrentStock.item_id == item.yarn_count))
                    curr = res_curr.scalars().first()
                    if curr:
                        curr.quantity = max(0.0, float(curr.quantity) - float(item.kgs or 0.0))
        except Exception as err:
            import logging
            logging.getLogger("delete_inward_stock").error(f"Error reverting stock on delete: {err}")

    await db.delete(order)
    await db.commit()
    return None

@router.post("/{inward_id}/confirm", response_model=YarnInwardOut)
async def confirm_inward(inward_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnInward).options(selectinload(YarnInward.items)).where(YarnInward.id == inward_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Yarn Inward not found")
        
    if order.status == "Confirmed":
        raise HTTPException(status_code=400, detail="Already confirmed")
        
    order.status = "Confirmed"
    
    # Update Notifications
    notif1 = Notification(
        user_role="Store Manager",
        message=f"Stock Updated for Yarn Inward GRN: {order.ref_no}"
    )
    notif2 = Notification(
        user_role="Merchandiser",
        message=f"Stock Updated for Yarn Inward GRN: {order.ref_no}"
    )
    notif3 = Notification(
        user_role="Accountant",
        message=f"Bill Entry Pending for GRN: {order.ref_no} - {order.received_from}"
    )
    db.add_all([notif1, notif2, notif3])
    
    await db.commit()
    await db.refresh(order)
    
    # Create Draft Voucher in Finance
    try:
        from finance_app.database import SessionLocal as FinanceSessionLocal
        from finance_app.models.voucher import Voucher
        from datetime import date
        
        fin_db = FinanceSessionLocal()
        v = Voucher(
            voucher_number=f"PV-DRAFT-{order.ref_no}",
            voucher_type="Purchase",
            date=order.inward_date or date.today(),
            status="Draft",
            total_amount=order.net_amount,
            reference_no=order.ref_no,
            company_id=1,
            narration=f"Draft Purchase Bill generated from GRN: {order.ref_no}"
        )
        fin_db.add(v)
        fin_db.commit()
        fin_db.close()
    except Exception as e:
        import logging
        logging.getLogger("finance_sync").error(f"Failed to create draft voucher: {e}")
        
    return order
