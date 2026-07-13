from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.fabric_dyeing_po import FabricDyeingPO, FabricDyeingPOItem

router = APIRouter()

class FabricDyeingPOItemCreate(BaseModel):
    fabric_code: Optional[str] = None
    fabric_name: Optional[str] = None
    fabric_type: Optional[str] = None
    design_no: Optional[str] = None
    construction: Optional[str] = None
    gsm: Optional[str] = None
    width: Optional[str] = None
    color: Optional[str] = None
    batch_no: Optional[str] = None
    lot_no: Optional[str] = None
    uom: Optional[str] = "MTRS"
    qty: Optional[float] = 0
    rate: Optional[float] = 0
    amount: Optional[float] = 0

class FabricDyeingPOCreate(BaseModel):
    po_no: str
    po_date: date
    supplier_dyeing_unit: Optional[str] = None
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
    fabric_receipt_id: Optional[str] = None
    department: Optional[str] = None

    taxable_value: Optional[float] = 0
    dyeing_charge: Optional[float] = 0
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

    items: List[FabricDyeingPOItemCreate] = []

@router.get("/")
async def get_fabric_dyeing_pos(db: Session = Depends(get_db)):
    result = await db.execute(select(FabricDyeingPO).options(selectinload(FabricDyeingPO.items)).order_by(FabricDyeingPO.id.desc()))
    return result.scalars().all()

@router.post("/")
async def create_fabric_dyeing_po(data: FabricDyeingPOCreate, db: Session = Depends(get_db)):
    new_po = FabricDyeingPO(
        po_no=data.po_no,
        po_date=data.po_date,
        supplier_dyeing_unit=data.supplier_dyeing_unit,
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
        fabric_receipt_id=data.fabric_receipt_id,
        department=data.department,
        taxable_value=data.taxable_value,
        dyeing_charge=data.dyeing_charge,
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
        db_item = FabricDyeingPOItem(**item.dict(), po_id=new_po.id)
        db.add(db_item)
    await db.commit()
    return new_po

@router.put("/{id}")
async def update_fabric_dyeing_po(id: int, data: FabricDyeingPOCreate, db: Session = Depends(get_db)):
    result = await db.execute(select(FabricDyeingPO).options(selectinload(FabricDyeingPO.items)).where(FabricDyeingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    po.po_no = data.po_no
    po.po_date = data.po_date
    po.supplier_dyeing_unit = data.supplier_dyeing_unit
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
    po.fabric_receipt_id = data.fabric_receipt_id
    po.department = data.department
    po.taxable_value = data.taxable_value
    po.dyeing_charge = data.dyeing_charge
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

    await db.execute(FabricDyeingPOItem.__table__.delete().where(FabricDyeingPOItem.po_id == id))
    
    for item in data.items:
        db_item = FabricDyeingPOItem(**item.dict(), po_id=id)
        db.add(db_item)
        
    await db.commit()
    await db.refresh(po)
    return po

@router.delete("/{id}")
async def delete_fabric_dyeing_po(id: int, db: Session = Depends(get_db)):
    result = await db.execute(select(FabricDyeingPO).where(FabricDyeingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    await db.delete(po)
    await db.commit()
    return {"status": "success"}
