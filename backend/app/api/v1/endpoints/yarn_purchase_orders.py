"""Yarn Purchase Order CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.core.database import get_db
from app.models.yarn_purchase import YarnPurchaseOrder, YarnPurchaseCountDetail, YarnPurchaseIndentDetail

router = APIRouter(prefix="/yarn-purchase-orders", tags=["Yarn Purchase Orders"])

class YarnPurchaseCountDetailIn(BaseModel):
    supplier_name: Optional[str] = None
    fibre_group: Optional[str] = None
    yarn_count: Optional[str] = None
    yarn_csp: Optional[float] = 0.0
    min_cone_wgt: Optional[float] = 0.0
    order_kgs: Optional[float] = 0.0
    mill_name: Optional[str] = None
    print_name: Optional[str] = None
    tolerance_pct: Optional[float] = 0.0

class YarnPurchaseIndentDetailIn(BaseModel):
    req_ind_no: Optional[str] = None
    design_no: Optional[str] = None
    ibpo_no: Optional[str] = None
    party_name: Optional[str] = None
    fabric_name: Optional[str] = None
    yarn_count: Optional[str] = None
    order_mtrs: Optional[float] = 0.0
    warp_qty: Optional[float] = 0.0
    weft_qty: Optional[float] = 0.0
    tot_reqd_qty: Optional[float] = 0.0
    appd_qty: Optional[float] = 0.0
    order_qty: Optional[float] = 0.0
    rate: Optional[float] = 0.0
    amount: Optional[float] = 0.0
    colour: Optional[str] = None
    delivery_date: Optional[str] = None
    packing_type: Optional[str] = None
    labeling: Optional[str] = None
    uom: Optional[str] = "KGS"

class YarnPurchaseOrderBase(BaseModel):
    po_date: date
    org_name: Optional[str] = None
    internal_po_no: Optional[str] = None
    used_for: Optional[str] = None
    against_ref: Optional[str] = None
    design_no: Optional[str] = None
    agent_name: Optional[str] = None
    supplier_name: Optional[str] = None
    delivery_at: Optional[str] = None
    
    freight_type: Optional[str] = None
    freight_chg: Optional[float] = 0.0
    insurance_chg: Optional[float] = 0.0
    total_order_kgs: Optional[float] = 0.0
    transport: Optional[str] = None
    tax_type: Optional[str] = None
    taxable_amount: Optional[float] = 0.0
    dispatch_date: Optional[date] = None
    packing_type: Optional[str] = None
    sgst_pct: Optional[float] = 0.0
    cgst_pct: Optional[float] = 0.0
    igst_pct: Optional[float] = 0.0
    labeling: Optional[str] = None
    colour: Optional[str] = None
    net_amount: Optional[float] = 0.0
    due_days: Optional[int] = 0
    remarks: Optional[str] = None
    status: Optional[str] = "Active"
    terms_conditions: Optional[List[str]] = []

class YarnPurchaseOrderCreate(YarnPurchaseOrderBase):
    count_details: List[YarnPurchaseCountDetailIn] = []
    indent_details: List[YarnPurchaseIndentDetailIn] = []

class YarnPurchaseCountDetailOut(YarnPurchaseCountDetailIn):
    id: int
    class Config:
        from_attributes = True

class YarnPurchaseIndentDetailOut(YarnPurchaseIndentDetailIn):
    id: int
    class Config:
        from_attributes = True

class YarnPurchaseOrderOut(YarnPurchaseOrderBase):
    id: int
    po_number: str
    count_details: List[YarnPurchaseCountDetailOut] = []
    indent_details: List[YarnPurchaseIndentDetailOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[YarnPurchaseOrderOut])
async def list_orders(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(YarnPurchaseOrder).options(
        selectinload(YarnPurchaseOrder.count_details),
        selectinload(YarnPurchaseOrder.indent_details)
    ).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=YarnPurchaseOrderOut, status_code=201)
async def create_order(data: YarnPurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(YarnPurchaseOrder.po_number))
    po_numbers = result.scalars().all()
    max_num = 0
    for po in po_numbers:
        if po and po.upper().startswith("YPO-"):
            try:
                num_part = int(po.split("-")[1])
                if num_part > max_num:
                    max_num = num_part
            except (ValueError, IndexError):
                pass
    po_no = f"YPO-{max_num + 1:05d}"


    counts_data = data.count_details or []
    indents_data = data.indent_details or []
    
    order_dict = data.model_dump(exclude={"count_details", "indent_details"})
    order = YarnPurchaseOrder(**order_dict, po_number=po_no)

    for c in counts_data:
        order.count_details.append(YarnPurchaseCountDetail(**c.model_dump()))
        
    for i in indents_data:
        order.indent_details.append(YarnPurchaseIndentDetail(**i.model_dump()))

    db.add(order)
    
    from app.models.notification import Notification
    # Create notification for Stores/Receiving Team
    notif = Notification(
        user_role="Store Manager",
        message=f"New Yarn Purchase Order ({po_no}) created for Supplier: {data.supplier_name}"
    )
    db.add(notif)
    
    await db.commit()
    
    # Create Draft Voucher in Finance
    try:
        from finance_app.database import SessionLocal as FinanceSessionLocal
        from finance_app.models.voucher import Voucher
        from finance_app.models.ledger import Ledger
        from datetime import date
        
        fin_db = FinanceSessionLocal()
        supplier_ledger = fin_db.query(Ledger).filter(Ledger.name == order.supplier_name).first()
        party_id = supplier_ledger.id if supplier_ledger else None
        
        v = Voucher(
            voucher_number=f"PV-DRAFT-{po_no}",
            voucher_type="Purchase",
            date=order.po_date or date.today(),
            status="Draft",
            total_amount=order.net_amount or 0.0,
            reference_no=po_no,
            company_id=1,
            party_id=party_id,
            narration=f"Draft Accounts Payable generated from Yarn PO: {po_no} for Supplier: {order.supplier_name}"
        )
        fin_db.add(v)
        fin_db.commit()
        fin_db.close()
    except Exception as e:
        import logging
        logging.getLogger("finance_sync").error(f"Failed to create draft voucher: {e}")
        
    await db.refresh(order)
    
    result = await db.execute(
        select(YarnPurchaseOrder).options(
            selectinload(YarnPurchaseOrder.count_details),
            selectinload(YarnPurchaseOrder.indent_details)
        ).where(YarnPurchaseOrder.id == order.id)
    )
    return result.scalar_one()

@router.get("/{order_id}", response_model=YarnPurchaseOrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnPurchaseOrder).options(
            selectinload(YarnPurchaseOrder.count_details),
            selectinload(YarnPurchaseOrder.indent_details)
        ).where(YarnPurchaseOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=YarnPurchaseOrderOut)
async def update_order(order_id: int, data: YarnPurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnPurchaseOrder).options(
            selectinload(YarnPurchaseOrder.count_details),
            selectinload(YarnPurchaseOrder.indent_details)
        ).where(YarnPurchaseOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    counts_data = data.count_details or []
    indents_data = data.indent_details or []
    order_dict = data.model_dump(exclude={"count_details", "indent_details"})
    
    for key, value in order_dict.items():
        setattr(order, key, value)
        
    for item in order.count_details:
        await db.delete(item)
    for item in order.indent_details:
        await db.delete(item)
        
    order.count_details = []
    order.indent_details = []
    
    for c in counts_data:
        order.count_details.append(YarnPurchaseCountDetail(**c.model_dump()))
    for i in indents_data:
        order.indent_details.append(YarnPurchaseIndentDetail(**i.model_dump()))

    await db.commit()
    await db.refresh(order)
    
    result = await db.execute(
        select(YarnPurchaseOrder).options(
            selectinload(YarnPurchaseOrder.count_details),
            selectinload(YarnPurchaseOrder.indent_details)
        ).where(YarnPurchaseOrder.id == order_id)
    )
    return result.scalar_one()

@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(YarnPurchaseOrder).where(YarnPurchaseOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    await db.delete(order)
    await db.commit()
    return None
