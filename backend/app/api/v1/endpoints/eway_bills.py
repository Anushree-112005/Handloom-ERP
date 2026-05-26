"""E-Way Bill Entry CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

from app.core.database import get_db
from app.models.eway_bill import EwayBill, EwayBillItem

router = APIRouter(prefix="/eway-bills", tags=["E-Way Bills"])

# Pydantic Schemas
class EwayBillItemBase(BaseModel):
    product_name: Optional[str] = None
    hsn_code: Optional[str] = None
    unit: Optional[str] = None
    qty: Decimal = Decimal('0')
    taxable_value: Decimal = Decimal('0')
    tax_rate: Decimal = Decimal('0')

class EwayBillItemCreate(EwayBillItemBase):
    pass

class EwayBillItemOut(EwayBillItemBase):
    id: int
    bill_id: int

    class Config:
        from_attributes = True

class EwayBillBase(BaseModel):
    eway_bill_no: Optional[str] = None
    eway_date: Optional[date] = None
    supply_type: Optional[str] = None
    sub_type: Optional[str] = None
    document_type: Optional[str] = None
    document_no: Optional[str] = None
    document_date: Optional[date] = None
    invoice_type: Optional[str] = None
    token_ex_date: Optional[str] = None
    org_name: Optional[str] = None
    dc_no_date: Optional[str] = None
    token_no: Optional[str] = None
    result: Optional[str] = None
    error: Optional[str] = None
    
    bill_from_name: Optional[str] = None
    bill_from_address: Optional[str] = None
    bill_from_gstin: Optional[str] = None
    bill_from_pin: Optional[str] = None
    bill_from_state: Optional[str] = None
    bill_from_state_code: Optional[str] = None
    
    dispatch_from_name: Optional[str] = None
    dispatch_from_address: Optional[str] = None
    dispatch_from_pin: Optional[str] = None
    dispatch_from_place: Optional[str] = None
    dispatch_from_state: Optional[str] = None
    dispatch_from_state_code: Optional[str] = None
    
    bill_to_name: Optional[str] = None
    bill_to_address: Optional[str] = None
    bill_to_gstin: Optional[str] = None
    bill_to_pin: Optional[str] = None
    bill_to_state: Optional[str] = None
    bill_to_state_code: Optional[str] = None
    
    dispatch_to_name: Optional[str] = None
    dispatch_to_address: Optional[str] = None
    dispatch_to_pin: Optional[str] = None
    dispatch_to_place: Optional[str] = None
    dispatch_to_state: Optional[str] = None
    dispatch_to_state_code: Optional[str] = None
    
    distance: Decimal = Decimal('0')
    total_value: Decimal = Decimal('0')
    sgst: Decimal = Decimal('0')
    cgst: Decimal = Decimal('0')
    igst: Decimal = Decimal('0')
    remarks: Optional[str] = None
    status: str = "Draft"

class EwayBillCreate(EwayBillBase):
    items: List[EwayBillItemCreate] = []

class EwayBillOut(EwayBillBase):
    id: int
    created_at: Optional[datetime] = None
    items: List[EwayBillItemOut] = []

    class Config:
        from_attributes = True

# API Routes
@router.get("/", response_model=List[EwayBillOut])
async def list_eway_bills(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(EwayBill).options(selectinload(EwayBill.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            EwayBill.eway_bill_no.ilike(search_filter) |
            EwayBill.bill_to_name.ilike(search_filter) |
            EwayBill.document_no.ilike(search_filter)
        )
    q = q.order_by(EwayBill.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.get("/{bill_id}", response_model=EwayBillOut)
async def get_eway_bill(bill_id: int, db: AsyncSession = Depends(get_db)):
    q = select(EwayBill).options(selectinload(EwayBill.items)).where(EwayBill.id == bill_id)
    result = await db.execute(q)
    bill = result.scalar_one_or_none()
    if not bill:
        raise HTTPException(status_code=404, detail="E-Way Bill not found")
    return bill

@router.post("/", response_model=EwayBillOut, status_code=201)
async def create_eway_bill(bill_data: EwayBillCreate, db: AsyncSession = Depends(get_db)):
    dump = bill_data.model_dump()
    items_data = dump.pop("items", [])
    
    # Generate automatic Eway Bill No if not provided
    if not dump.get("eway_bill_no"):
        import random
        # Eway bill is usually a 12 digit number
        dump["eway_bill_no"] = "".join([str(random.randint(0, 9)) for _ in range(12)])
        
    db_bill = EwayBill(**dump)
    db.add(db_bill)
    await db.commit()
    await db.refresh(db_bill)
    
    for item in items_data:
        db_item = EwayBillItem(bill_id=db_bill.id, **item)
        db.add(db_item)
    
    await db.commit()
    
    # Fetch complete bill with items
    q = select(EwayBill).options(selectinload(EwayBill.items)).where(EwayBill.id == db_bill.id)
    result = await db.execute(q)
    return result.scalar_one()

@router.put("/{bill_id}", response_model=EwayBillOut)
async def update_eway_bill(bill_id: int, bill_data: EwayBillCreate, db: AsyncSession = Depends(get_db)):
    q = select(EwayBill).options(selectinload(EwayBill.items)).where(EwayBill.id == bill_id)
    result = await db.execute(q)
    db_bill = result.scalar_one_or_none()
    if not db_bill:
        raise HTTPException(status_code=404, detail="E-Way Bill not found")
        
    dump = bill_data.model_dump()
    items_data = dump.pop("items", [])
    
    for k, v in dump.items():
        setattr(db_bill, k, v)
        
    # Clear and recreate nested items
    await db.execute(delete(EwayBillItem).where(EwayBillItem.bill_id == bill_id))
    for item in items_data:
        db_item = EwayBillItem(bill_id=bill_id, **item)
        db.add(db_item)
        
    await db.commit()
    
    # Refresh and return
    q2 = select(EwayBill).options(selectinload(EwayBill.items)).where(EwayBill.id == bill_id)
    result2 = await db.execute(q2)
    return result2.scalar_one()

@router.delete("/{bill_id}", status_code=204)
async def delete_eway_bill(bill_id: int, db: AsyncSession = Depends(get_db)):
    q = select(EwayBill).where(EwayBill.id == bill_id)
    result = await db.execute(q)
    db_bill = result.scalar_one_or_none()
    if not db_bill:
        raise HTTPException(status_code=404, detail="E-Way Bill not found")
        
    await db.delete(db_bill)
    await db.commit()
    return None
