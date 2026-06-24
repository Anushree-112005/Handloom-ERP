from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.cloth_purchase_po import ClothPurchasePO, ClothPurchasePOItem

router = APIRouter()

class ClothPurchasePOItemCreate(BaseModel):
    fabric_code: Optional[str] = None
    fabric_name: Optional[str] = None
    fabric_type: Optional[str] = None
    design_no: Optional[str] = None
    construction: Optional[str] = None
    composition: Optional[str] = None
    gsm: Optional[str] = None
    width: Optional[str] = None
    color: Optional[str] = None
    uom: Optional[str] = "MTRS"
    quantity: Optional[float] = 0
    rate: Optional[float] = 0
    amount: Optional[float] = 0

class ClothPurchasePOCreate(BaseModel):
    po_no: str
    po_date: date
    supplier_name: Optional[str] = None
    supplier_code: Optional[str] = None
    contact_person: Optional[str] = None
    mobile_no: Optional[str] = None
    gst_no: Optional[str] = None
    delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = "Active"
    remarks: Optional[str] = None

    indent_no: Optional[str] = None
    requisition_no: Optional[str] = None
    buyer_order_no: Optional[str] = None
    department: Optional[str] = None
    purchase_type: Optional[str] = None

    taxable_value: Optional[float] = 0
    discount_pct: Optional[float] = 0
    discount_amount: Optional[float] = 0
    packing_charges: Optional[float] = 0
    freight_charges: Optional[float] = 0
    loading_charges: Optional[float] = 0
    unloading_charges: Optional[float] = 0
    other_charges: Optional[float] = 0
    cgst_pct: Optional[float] = 0
    cgst_amount: Optional[float] = 0
    sgst_pct: Optional[float] = 0
    sgst_amount: Optional[float] = 0
    igst_pct: Optional[float] = 0
    igst_amount: Optional[float] = 0
    round_off: Optional[float] = 0
    net_amount: Optional[float] = 0

    delivery_address: Optional[str] = None
    delivery_location: Optional[str] = None
    transport_name: Optional[str] = None
    lr_no: Optional[str] = None
    vehicle_no: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    delivery_instructions: Optional[str] = None
    terms_conditions: List[str] = []

    items: List[ClothPurchasePOItemCreate] = []

@router.get("/")
async def get_cloth_purchase_pos(db: Session = Depends(get_db)):
    result = await db.execute(select(ClothPurchasePO).options(selectinload(ClothPurchasePO.items)).order_by(ClothPurchasePO.id.desc()))
    return result.scalars().all()

@router.post("/")
async def create_cloth_purchase_po(data: ClothPurchasePOCreate, db: Session = Depends(get_db)):
    new_po = ClothPurchasePO(
        po_no=data.po_no,
        po_date=data.po_date,
        supplier_name=data.supplier_name,
        supplier_code=data.supplier_code,
        contact_person=data.contact_person,
        mobile_no=data.mobile_no,
        gst_no=data.gst_no,
        delivery_date=data.delivery_date,
        payment_terms=data.payment_terms,
        status=data.status,
        remarks=data.remarks,
        indent_no=data.indent_no,
        requisition_no=data.requisition_no,
        buyer_order_no=data.buyer_order_no,
        department=data.department,
        purchase_type=data.purchase_type,
        taxable_value=data.taxable_value,
        discount_pct=data.discount_pct,
        discount_amount=data.discount_amount,
        packing_charges=data.packing_charges,
        freight_charges=data.freight_charges,
        loading_charges=data.loading_charges,
        unloading_charges=data.unloading_charges,
        other_charges=data.other_charges,
        cgst_pct=data.cgst_pct,
        cgst_amount=data.cgst_amount,
        sgst_pct=data.sgst_pct,
        sgst_amount=data.sgst_amount,
        igst_pct=data.igst_pct,
        igst_amount=data.igst_amount,
        round_off=data.round_off,
        net_amount=data.net_amount,
        delivery_address=data.delivery_address,
        delivery_location=data.delivery_location,
        transport_name=data.transport_name,
        lr_no=data.lr_no,
        vehicle_no=data.vehicle_no,
        expected_delivery_date=data.expected_delivery_date,
        delivery_instructions=data.delivery_instructions,
        terms_conditions=data.terms_conditions
    )
    db.add(new_po)
    await db.commit()
    await db.refresh(new_po)

    for item in data.items:
        db_item = ClothPurchasePOItem(**item.dict(), po_id=new_po.id)
        db.add(db_item)
    await db.commit()
    return new_po

@router.put("/{id}")
async def update_cloth_purchase_po(id: int, data: ClothPurchasePOCreate, db: Session = Depends(get_db)):
    result = await db.execute(select(ClothPurchasePO).options(selectinload(ClothPurchasePO.items)).where(ClothPurchasePO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    po.po_no = data.po_no
    po.po_date = data.po_date
    po.supplier_name = data.supplier_name
    po.supplier_code = data.supplier_code
    po.contact_person = data.contact_person
    po.mobile_no = data.mobile_no
    po.gst_no = data.gst_no
    po.delivery_date = data.delivery_date
    po.payment_terms = data.payment_terms
    po.status = data.status
    po.remarks = data.remarks
    po.indent_no = data.indent_no
    po.requisition_no = data.requisition_no
    po.buyer_order_no = data.buyer_order_no
    po.department = data.department
    po.purchase_type = data.purchase_type
    po.taxable_value = data.taxable_value
    po.discount_pct = data.discount_pct
    po.discount_amount = data.discount_amount
    po.packing_charges = data.packing_charges
    po.freight_charges = data.freight_charges
    po.loading_charges = data.loading_charges
    po.unloading_charges = data.unloading_charges
    po.other_charges = data.other_charges
    po.cgst_pct = data.cgst_pct
    po.cgst_amount = data.cgst_amount
    po.sgst_pct = data.sgst_pct
    po.sgst_amount = data.sgst_amount
    po.igst_pct = data.igst_pct
    po.igst_amount = data.igst_amount
    po.round_off = data.round_off
    po.net_amount = data.net_amount
    po.delivery_address = data.delivery_address
    po.delivery_location = data.delivery_location
    po.transport_name = data.transport_name
    po.lr_no = data.lr_no
    po.vehicle_no = data.vehicle_no
    po.expected_delivery_date = data.expected_delivery_date
    po.delivery_instructions = data.delivery_instructions
    po.terms_conditions = data.terms_conditions

    await db.execute(ClothPurchasePOItem.__table__.delete().where(ClothPurchasePOItem.po_id == id))
    
    for item in data.items:
        db_item = ClothPurchasePOItem(**item.dict(), po_id=id)
        db.add(db_item)
        
    await db.commit()
    await db.refresh(po)
    return po

@router.delete("/{id}")
async def delete_cloth_purchase_po(id: int, db: Session = Depends(get_db)):
    result = await db.execute(select(ClothPurchasePO).where(ClothPurchasePO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    await db.delete(po)
    await db.commit()
    return {"status": "success"}
