from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from app.core.database import get_db
from app.models.twisting_doubling_po import TwistingDoublingPO, TwistingDoublingPOItem

router = APIRouter()

# --- Schemas ---

class TwistingDoublingPOItemBase(BaseModel):
    fibre_group: Optional[str] = None
    yarn_count: Optional[str] = None
    mill_name: Optional[str] = None
    design_no: Optional[str] = None
    colour: Optional[str] = None
    conversion_count: Optional[str] = None
    order_kgs: Optional[float] = 0
    job_work_charge: Optional[float] = 0
    tolerance_pct: Optional[float] = 0
    amount: Optional[float] = 0

class TwistingDoublingPOItemCreate(TwistingDoublingPOItemBase):
    pass

class TwistingDoublingPOItemResponse(TwistingDoublingPOItemBase):
    id: int
    order_id: int
    class Config:
        orm_mode = True

class TwistingDoublingPOCreate(BaseModel):
    po_no: str
    po_date: Optional[date] = None
    supplier_worker: Optional[str] = None
    supplier_code: Optional[str] = None
    delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    buyer_name: Optional[str] = None
    status: Optional[str] = "Active"
    remarks: Optional[str] = None

    ref_no_1: Optional[str] = None
    entry_against: Optional[str] = None
    packing_type: Optional[str] = None

    tax_type: Optional[str] = None
    taxable_amount: Optional[float] = 0
    total_order_kgs: Optional[float] = 0
    cgst_pct: Optional[float] = 0
    cgst_amount: Optional[float] = 0
    sgst_pct: Optional[float] = 0
    sgst_amount: Optional[float] = 0
    igst_pct: Optional[float] = 0
    igst_amount: Optional[float] = 0
    net_amount: Optional[float] = 0

    delivery_location: Optional[str] = None
    dispatch_mode: Optional[str] = None
    transport_name: Optional[str] = None
    vehicle_type: Optional[str] = None
    delivery_instructions: Optional[str] = None
    terms_conditions: List[str] = []

    items: List[TwistingDoublingPOItemCreate] = []

class TwistingDoublingPOResponse(TwistingDoublingPOCreate):
    id: int
    items: List[TwistingDoublingPOItemResponse] = []
    class Config:
        orm_mode = True

# --- Endpoints ---

@router.post("", response_model=TwistingDoublingPOResponse, status_code=status.HTTP_201_CREATED)
async def create_twisting_doubling_po(data: TwistingDoublingPOCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate PO No
    stmt = select(TwistingDoublingPO).where(TwistingDoublingPO.po_no == data.po_no)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="PO Number already exists")

    new_po = TwistingDoublingPO(
        po_no=data.po_no,
        po_date=data.po_date,
        supplier_worker=data.supplier_worker,
        supplier_code=data.supplier_code,
        delivery_date=data.delivery_date,
        payment_terms=data.payment_terms,
        buyer_name=data.buyer_name,
        status=data.status,
        remarks=data.remarks,

        ref_no_1=data.ref_no_1,
        entry_against=data.entry_against,
        packing_type=data.packing_type,

        tax_type=data.tax_type,
        taxable_amount=data.taxable_amount,
        total_order_kgs=data.total_order_kgs,
        cgst_pct=data.cgst_pct,
        cgst_amount=data.cgst_amount,
        sgst_pct=data.sgst_pct,
        sgst_amount=data.sgst_amount,
        igst_pct=data.igst_pct,
        igst_amount=data.igst_amount,
        net_amount=data.net_amount,

        delivery_location=data.delivery_location,
        dispatch_mode=data.dispatch_mode,
        transport_name=data.transport_name,
        vehicle_type=data.vehicle_type,
        delivery_instructions=data.delivery_instructions,
        terms_conditions=data.terms_conditions
    )
    db.add(new_po)
    await db.commit()
    await db.refresh(new_po)

    for item in data.items:
        new_item = TwistingDoublingPOItem(
            order_id=new_po.id,
            **item.dict()
        )
        db.add(new_item)
    await db.commit()
    await db.refresh(new_po)

    stmt_out = select(TwistingDoublingPO).options(selectinload(TwistingDoublingPO.items)).where(TwistingDoublingPO.id == new_po.id)
    res = await db.execute(stmt_out)
    return res.scalars().first()

@router.get("", response_model=List[TwistingDoublingPOResponse])
async def get_all_twisting_doubling_pos(db: AsyncSession = Depends(get_db)):
    stmt = select(TwistingDoublingPO).options(selectinload(TwistingDoublingPO.items)).order_by(TwistingDoublingPO.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{po_id}", response_model=TwistingDoublingPOResponse)
async def get_twisting_doubling_po(po_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(TwistingDoublingPO).options(selectinload(TwistingDoublingPO.items)).where(TwistingDoublingPO.id == po_id)
    result = await db.execute(stmt)
    db_po = result.scalars().first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_po

@router.put("/{po_id}", response_model=TwistingDoublingPOResponse)
async def update_twisting_doubling_po(po_id: int, data: TwistingDoublingPOCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(TwistingDoublingPO).options(selectinload(TwistingDoublingPO.items)).where(TwistingDoublingPO.id == po_id)
    result = await db.execute(stmt)
    db_po = result.scalars().first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check duplicate PO No if changed
    if db_po.po_no != data.po_no:
        dup_stmt = select(TwistingDoublingPO).where(TwistingDoublingPO.po_no == data.po_no)
        dup_result = await db.execute(dup_stmt)
        if dup_result.scalars().first():
            raise HTTPException(status_code=400, detail="PO Number already exists")

    update_data = data.dict(exclude={'items'})
    for key, value in update_data.items():
        setattr(db_po, key, value)

    # Recreate items
    for item in db_po.items:
        await db.delete(item)
    await db.commit()

    for item in data.items:
        new_item = TwistingDoublingPOItem(
            order_id=db_po.id,
            **item.dict()
        )
        db.add(new_item)
    await db.commit()

    stmt_out = select(TwistingDoublingPO).options(selectinload(TwistingDoublingPO.items)).where(TwistingDoublingPO.id == po_id)
    res = await db.execute(stmt_out)
    return res.scalars().first()

@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_twisting_doubling_po(po_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(TwistingDoublingPO).where(TwistingDoublingPO.id == po_id)
    result = await db.execute(stmt)
    db_po = result.scalars().first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.delete(db_po)
    await db.commit()
    return None
