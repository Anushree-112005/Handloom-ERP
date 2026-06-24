from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.warping_sizing_po import WarpingSizingPO, WarpingSizingPOItem

router = APIRouter()

class WarpingSizingPOItemCreate(BaseModel):
    yarn_code: Optional[str] = None
    yarn_name: Optional[str] = None
    yarn_count: Optional[str] = None
    yarn_type: Optional[str] = None
    mill_name: Optional[str] = None
    lot_no: Optional[str] = None
    shade: Optional[str] = None
    uom: Optional[str] = "KGS"
    qty_kg: Optional[float] = 0
    rate_per_kg: Optional[float] = 0
    amount: Optional[float] = 0

class WarpingSizingPOCreate(BaseModel):
    po_no: str
    po_date: date
    supplier_job_worker: Optional[str] = None
    supplier_code: Optional[str] = None
    delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    buyer_name: Optional[str] = None
    status: Optional[str] = "Active"
    remarks: Optional[str] = None

    indent_no: Optional[str] = None
    sales_order_no: Optional[str] = None
    production_order_no: Optional[str] = None
    buyer_order_no: Optional[str] = None
    department: Optional[str] = None

    taxable_value: Optional[float] = 0
    warping_charge: Optional[float] = 0
    sizing_charge: Optional[float] = 0
    packing_charge: Optional[float] = 0
    loading_charge: Optional[float] = 0
    unloading_charge: Optional[float] = 0
    transport_charge: Optional[float] = 0
    other_charges: Optional[float] = 0
    cgst_pct: Optional[float] = 0
    cgst_amount: Optional[float] = 0
    sgst_pct: Optional[float] = 0
    sgst_amount: Optional[float] = 0
    igst_pct: Optional[float] = 0
    igst_amount: Optional[float] = 0
    round_off: Optional[float] = 0
    net_amount: Optional[float] = 0

    delivery_location: Optional[str] = None
    dispatch_mode: Optional[str] = None
    transport_name: Optional[str] = None
    vehicle_no: Optional[str] = None
    delivery_instructions: Optional[str] = None
    terms_conditions: List[str] = []

    items: List[WarpingSizingPOItemCreate] = []

@router.get("/")
async def get_warping_sizing_pos(db: Session = Depends(get_db)):
    result = await db.execute(select(WarpingSizingPO).options(selectinload(WarpingSizingPO.items)).order_by(WarpingSizingPO.id.desc()))
    return result.scalars().all()

@router.post("/")
async def create_warping_sizing_po(data: WarpingSizingPOCreate, db: Session = Depends(get_db)):
    new_po = WarpingSizingPO(
        po_no=data.po_no,
        po_date=data.po_date,
        supplier_job_worker=data.supplier_job_worker,
        supplier_code=data.supplier_code,
        delivery_date=data.delivery_date,
        payment_terms=data.payment_terms,
        buyer_name=data.buyer_name,
        status=data.status,
        remarks=data.remarks,
        indent_no=data.indent_no,
        sales_order_no=data.sales_order_no,
        production_order_no=data.production_order_no,
        buyer_order_no=data.buyer_order_no,
        department=data.department,
        taxable_value=data.taxable_value,
        warping_charge=data.warping_charge,
        sizing_charge=data.sizing_charge,
        packing_charge=data.packing_charge,
        loading_charge=data.loading_charge,
        unloading_charge=data.unloading_charge,
        transport_charge=data.transport_charge,
        other_charges=data.other_charges,
        cgst_pct=data.cgst_pct,
        cgst_amount=data.cgst_amount,
        sgst_pct=data.sgst_pct,
        sgst_amount=data.sgst_amount,
        igst_pct=data.igst_pct,
        igst_amount=data.igst_amount,
        round_off=data.round_off,
        net_amount=data.net_amount,
        delivery_location=data.delivery_location,
        dispatch_mode=data.dispatch_mode,
        transport_name=data.transport_name,
        vehicle_no=data.vehicle_no,
        delivery_instructions=data.delivery_instructions,
        terms_conditions=data.terms_conditions
    )
    db.add(new_po)
    await db.commit()
    await db.refresh(new_po)

    for item in data.items:
        db_item = WarpingSizingPOItem(**item.dict(), po_id=new_po.id)
        db.add(db_item)
    await db.commit()
    return new_po

@router.put("/{id}")
async def update_warping_sizing_po(id: int, data: WarpingSizingPOCreate, db: Session = Depends(get_db)):
    result = await db.execute(select(WarpingSizingPO).options(selectinload(WarpingSizingPO.items)).where(WarpingSizingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    po.po_no = data.po_no
    po.po_date = data.po_date
    po.supplier_job_worker = data.supplier_job_worker
    po.supplier_code = data.supplier_code
    po.delivery_date = data.delivery_date
    po.payment_terms = data.payment_terms
    po.buyer_name = data.buyer_name
    po.status = data.status
    po.remarks = data.remarks
    po.indent_no = data.indent_no
    po.sales_order_no = data.sales_order_no
    po.production_order_no = data.production_order_no
    po.buyer_order_no = data.buyer_order_no
    po.department = data.department
    po.taxable_value = data.taxable_value
    po.warping_charge = data.warping_charge
    po.sizing_charge = data.sizing_charge
    po.packing_charge = data.packing_charge
    po.loading_charge = data.loading_charge
    po.unloading_charge = data.unloading_charge
    po.transport_charge = data.transport_charge
    po.other_charges = data.other_charges
    po.cgst_pct = data.cgst_pct
    po.cgst_amount = data.cgst_amount
    po.sgst_pct = data.sgst_pct
    po.sgst_amount = data.sgst_amount
    po.igst_pct = data.igst_pct
    po.igst_amount = data.igst_amount
    po.round_off = data.round_off
    po.net_amount = data.net_amount
    po.delivery_location = data.delivery_location
    po.dispatch_mode = data.dispatch_mode
    po.transport_name = data.transport_name
    po.vehicle_no = data.vehicle_no
    po.delivery_instructions = data.delivery_instructions
    po.terms_conditions = data.terms_conditions

    await db.execute(WarpingSizingPOItem.__table__.delete().where(WarpingSizingPOItem.po_id == id))
    
    for item in data.items:
        db_item = WarpingSizingPOItem(**item.dict(), po_id=id)
        db.add(db_item)
        
    await db.commit()
    await db.refresh(po)
    return po

@router.delete("/{id}")
async def delete_warping_sizing_po(id: int, db: Session = Depends(get_db)):
    result = await db.execute(select(WarpingSizingPO).where(WarpingSizingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    await db.delete(po)
    await db.commit()
    return {"status": "success"}
