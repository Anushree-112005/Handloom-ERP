from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.processing_po import ProcessingPO, ProcessingPOItem

router = APIRouter()

class ProcessingPOItemCreate(BaseModel):
    design_no: Optional[str] = None
    ibpo_no: Optional[str] = None
    fabric_construction: Optional[str] = None
    colour_process: Optional[str] = None
    mtr: Optional[float] = 0
    kgs: Optional[float] = 0
    rate: Optional[float] = 0
    amount: Optional[float] = 0

class ProcessingPOCreate(BaseModel):
    po_s_no: Optional[str] = None
    po_date: date
    party_name: Optional[str] = None
    po_no: str
    delivery_date: Optional[date] = None
    
    merchandiser: Optional[str] = None
    merchandiser_ext: Optional[str] = None
    fob_point: Optional[str] = None
    glm: Optional[str] = None
    
    process_sequence: Optional[str] = None
    process_sequence_ext: Optional[str] = None
    grey_rate: Optional[float] = 0
    
    order_type: Optional[str] = None
    order_type_ext: Optional[str] = None
    
    status: Optional[str] = "Active"

    total_mtr: Optional[float] = 0
    gross_amt: Optional[float] = 0
    
    tax_type: Optional[str] = None
    cgst: Optional[float] = 0
    sgst: Optional[float] = 0
    igst: Optional[float] = 0
    total_gst: Optional[float] = 0
    
    payment: Optional[str] = None
    packing: Optional[str] = None
    ship_pack_chg: Optional[float] = 0
    add_other: Optional[float] = 0
    tax_value: Optional[float] = 0
    
    delivery_instruction: Optional[str] = None
    round_off: Optional[float] = 0
    net_amount: Optional[float] = 0
    remarks: Optional[str] = None

    items: List[ProcessingPOItemCreate] = []

@router.get("/")
async def get_processing_pos(db: Session = Depends(get_db)):
    result = await db.execute(select(ProcessingPO).options(selectinload(ProcessingPO.items)).order_by(ProcessingPO.id.desc()))
    return result.scalars().all()

@router.post("/")
async def create_processing_po(data: ProcessingPOCreate, db: Session = Depends(get_db)):
    new_po = ProcessingPO(
        po_s_no=data.po_s_no,
        po_date=data.po_date,
        party_name=data.party_name,
        po_no=data.po_no,
        delivery_date=data.delivery_date,
        merchandiser=data.merchandiser,
        merchandiser_ext=data.merchandiser_ext,
        fob_point=data.fob_point,
        glm=data.glm,
        process_sequence=data.process_sequence,
        process_sequence_ext=data.process_sequence_ext,
        grey_rate=data.grey_rate,
        order_type=data.order_type,
        order_type_ext=data.order_type_ext,
        status=data.status,
        total_mtr=data.total_mtr,
        gross_amt=data.gross_amt,
        tax_type=data.tax_type,
        cgst=data.cgst,
        sgst=data.sgst,
        igst=data.igst,
        total_gst=data.total_gst,
        payment=data.payment,
        packing=data.packing,
        ship_pack_chg=data.ship_pack_chg,
        add_other=data.add_other,
        tax_value=data.tax_value,
        delivery_instruction=data.delivery_instruction,
        round_off=data.round_off,
        net_amount=data.net_amount,
        remarks=data.remarks
    )
    db.add(new_po)
    await db.commit()
    await db.refresh(new_po)

    for item in data.items:
        db_item = ProcessingPOItem(**item.dict(), po_id=new_po.id)
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
        supplier_ledger = fin_db.query(Ledger).filter(Ledger.name == new_po.party_name).first()
        party_id = supplier_ledger.id if supplier_ledger else None
        
        v = Voucher(
            voucher_number=f"JV-DRAFT-{new_po.po_s_no}",
            voucher_type="Journal",
            date=new_po.po_date or date.today(),
            status="Draft",
            total_amount=new_po.net_amount or 0.0,
            reference_no=new_po.po_s_no,
            company_id=1,
            party_id=party_id,
            narration=f"Draft Job Work Payable generated from Finishing PO: {new_po.po_s_no} for Party: {new_po.party_name}"
        )
        fin_db.add(v)
        fin_db.commit()
        fin_db.close()
    except Exception as e:
        import logging
        logging.getLogger("finance_sync").error(f"Failed to create draft voucher: {e}")

    return new_po

@router.put("/{id}")
async def update_processing_po(id: int, data: ProcessingPOCreate, db: Session = Depends(get_db)):
    result = await db.execute(select(ProcessingPO).options(selectinload(ProcessingPO.items)).where(ProcessingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    po.po_s_no = data.po_s_no
    po.po_date = data.po_date
    po.party_name = data.party_name
    po.po_no = data.po_no
    po.delivery_date = data.delivery_date
    po.merchandiser = data.merchandiser
    po.merchandiser_ext = data.merchandiser_ext
    po.fob_point = data.fob_point
    po.glm = data.glm
    po.process_sequence = data.process_sequence
    po.process_sequence_ext = data.process_sequence_ext
    po.grey_rate = data.grey_rate
    po.order_type = data.order_type
    po.order_type_ext = data.order_type_ext
    po.status = data.status
    po.total_mtr = data.total_mtr
    po.gross_amt = data.gross_amt
    po.tax_type = data.tax_type
    po.cgst = data.cgst
    po.sgst = data.sgst
    po.igst = data.igst
    po.total_gst = data.total_gst
    po.payment = data.payment
    po.packing = data.packing
    po.ship_pack_chg = data.ship_pack_chg
    po.add_other = data.add_other
    po.tax_value = data.tax_value
    po.delivery_instruction = data.delivery_instruction
    po.round_off = data.round_off
    po.net_amount = data.net_amount
    po.remarks = data.remarks

    await db.execute(ProcessingPOItem.__table__.delete().where(ProcessingPOItem.po_id == id))
    
    for item in data.items:
        db_item = ProcessingPOItem(**item.dict(), po_id=id)
        db.add(db_item)
        
    await db.commit()
    await db.refresh(po)
    return po

@router.delete("/{id}")
async def delete_processing_po(id: int, db: Session = Depends(get_db)):
    result = await db.execute(select(ProcessingPO).where(ProcessingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    await db.delete(po)
    await db.commit()
    return {"status": "success"}
