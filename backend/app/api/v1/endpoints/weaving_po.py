from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.weaving_po import WeavingPO, WeavingPOItem

router = APIRouter()

class WeavingPOItemCreate(BaseModel):
    fabric_code: Optional[str] = None
    fabric_name: Optional[str] = None
    design_no: Optional[str] = None
    fabric_type: Optional[str] = None
    color: Optional[str] = None
    gsm: Optional[str] = None
    width: Optional[str] = None
    uom: Optional[str] = "MTRS"
    qty_mtrs: Optional[float] = 0
    rate_per_mtr: Optional[float] = 0
    amount: Optional[float] = 0

class WeavingPOCreate(BaseModel):
    po_no: str
    po_date: date
    supplier_weaver: Optional[str] = None
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

    # New top-level specification and vendor order detail fields from client form
    order_type: Optional[str] = None
    design_color: Optional[str] = None
    fabric: Optional[str] = None
    weaving_type: Optional[str] = None
    loom_type: Optional[str] = None
    fabric_type: Optional[str] = None
    reed: Optional[str] = None
    pick: Optional[str] = None
    warp_width: Optional[str] = None
    warp_ends: Optional[str] = None
    warp_meters: Optional[str] = None
    weft_meters: Optional[str] = None
    fabric_width: Optional[str] = None
    finished_width: Optional[str] = None
    wages_mtr_kgs: Optional[str] = None
    selected_count: Optional[str] = None
    merchandiser: Optional[str] = None
    certificate_type: Optional[str] = None

    cooly_mtr: Optional[float] = 0
    cooly_pick: Optional[float] = 0
    salvage_waste_pct: Optional[float] = 0
    no_repeat: Optional[str] = None
    crimp_pct: Optional[float] = 0
    shrinkage: Optional[str] = None
    v_order_mtrs: Optional[float] = 0
    min_mtrs: Optional[float] = 0
    delivery_at: Optional[str] = None
    warp_isu_mtrs: Optional[float] = 0
    warp_issued: Optional[bool] = False
    delivery_command: Optional[str] = None

    taxable_value: Optional[float] = 0
    weaving_charge: Optional[float] = 0
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

    items: List[WeavingPOItemCreate] = []

@router.get("/")
async def get_weaving_pos(db: Session = Depends(get_db)):
    result = await db.execute(select(WeavingPO).options(selectinload(WeavingPO.items)).order_by(WeavingPO.id.desc()))
    return result.scalars().all()

@router.post("/")
async def create_weaving_po(data: WeavingPOCreate, db: Session = Depends(get_db)):
    new_po = WeavingPO(
        po_no=data.po_no,
        po_date=data.po_date,
        supplier_weaver=data.supplier_weaver,
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
        # new fields
        order_type=data.order_type,
        design_color=data.design_color,
        fabric=data.fabric,
        weaving_type=data.weaving_type,
        loom_type=data.loom_type,
        fabric_type=data.fabric_type,
        reed=data.reed,
        pick=data.pick,
        warp_width=data.warp_width,
        warp_ends=data.warp_ends,
        warp_meters=data.warp_meters,
        weft_meters=data.weft_meters,
        fabric_width=data.fabric_width,
        finished_width=data.finished_width,
        wages_mtr_kgs=data.wages_mtr_kgs,
        selected_count=data.selected_count,
        merchandiser=data.merchandiser,
        certificate_type=data.certificate_type,
        cooly_mtr=data.cooly_mtr,
        cooly_pick=data.cooly_pick,
        salvage_waste_pct=data.salvage_waste_pct,
        no_repeat=data.no_repeat,
        crimp_pct=data.crimp_pct,
        shrinkage=data.shrinkage,
        v_order_mtrs=data.v_order_mtrs,
        min_mtrs=data.min_mtrs,
        delivery_at=data.delivery_at,
        warp_isu_mtrs=data.warp_isu_mtrs,
        warp_issued=data.warp_issued,
        delivery_command=data.delivery_command,
        # totals
        taxable_value=data.taxable_value,
        weaving_charge=data.weaving_charge,
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
        db_item = WeavingPOItem(**item.dict(), po_id=new_po.id)
        db.add(db_item)
    await db.commit()
    await db.commit()
    
    # Create Draft Voucher in Finance
    try:
        from finance_app.database import SessionLocal as FinanceSessionLocal
        from finance_app.models.voucher import Voucher
        from finance_app.models.ledger import Ledger
        from datetime import date
        
        fin_db = FinanceSessionLocal()
        supplier_ledger = fin_db.query(Ledger).filter(Ledger.name == new_po.supplier_weaver).first()
        party_id = supplier_ledger.id if supplier_ledger else None
        
        v = Voucher(
            voucher_number=f"JV-DRAFT-{new_po.po_no}",
            voucher_type="Journal",
            date=new_po.po_date or date.today(),
            status="Draft",
            total_amount=new_po.net_amount or 0.0,
            reference_no=new_po.po_no,
            company_id=1,
            party_id=party_id,
            narration=f"Draft Job Work Payable generated from Weaving PO: {new_po.po_no} for Weaver: {new_po.supplier_weaver}"
        )
        fin_db.add(v)
        fin_db.commit()
        fin_db.close()
    except Exception as e:
        import logging
        logging.getLogger("finance_sync").error(f"Failed to create draft voucher: {e}")

    return new_po

@router.put("/{id}")
async def update_weaving_po(id: int, data: WeavingPOCreate, db: Session = Depends(get_db)):
    result = await db.execute(select(WeavingPO).options(selectinload(WeavingPO.items)).where(WeavingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    po.po_no = data.po_no
    po.po_date = data.po_date
    po.supplier_weaver = data.supplier_weaver
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
    
    # new fields
    po.order_type = data.order_type
    po.design_color = data.design_color
    po.fabric = data.fabric
    po.weaving_type = data.weaving_type
    po.loom_type = data.loom_type
    po.fabric_type = data.fabric_type
    po.reed = data.reed
    po.pick = data.pick
    po.warp_width = data.warp_width
    po.warp_ends = data.warp_ends
    po.warp_meters = data.warp_meters
    po.weft_meters = data.weft_meters
    po.fabric_width = data.fabric_width
    po.finished_width = data.finished_width
    po.wages_mtr_kgs = data.wages_mtr_kgs
    po.selected_count = data.selected_count
    po.merchandiser = data.merchandiser
    po.certificate_type = data.certificate_type
    po.cooly_mtr = data.cooly_mtr
    po.cooly_pick = data.cooly_pick
    po.salvage_waste_pct = data.salvage_waste_pct
    po.no_repeat = data.no_repeat
    po.crimp_pct = data.crimp_pct
    po.shrinkage = data.shrinkage
    po.v_order_mtrs = data.v_order_mtrs
    po.min_mtrs = data.min_mtrs
    po.delivery_at = data.delivery_at
    po.warp_isu_mtrs = data.warp_isu_mtrs
    po.warp_issued = data.warp_issued
    po.delivery_command = data.delivery_command

    # totals
    po.taxable_value = data.taxable_value
    po.weaving_charge = data.weaving_charge
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

    await db.execute(WeavingPOItem.__table__.delete().where(WeavingPOItem.po_id == id))
    
    for item in data.items:
        db_item = WeavingPOItem(**item.dict(), po_id=id)
        db.add(db_item)
        
    await db.commit()
    await db.refresh(po)
    return po

@router.delete("/{id}")
async def delete_weaving_po(id: int, db: Session = Depends(get_db)):
    result = await db.execute(select(WeavingPO).where(WeavingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    await db.delete(po)
    await db.commit()
    return {"status": "success"}
