"""On-Table Checking CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.cloth import OnTableChecking, OnTableCheckingItem

router = APIRouter(prefix="/on-table-checking", tags=["On-Table Checking"])

def parse_date_safe(v):
    if not v:
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return None
        # Try YYYY-MM-DD
        try:
            return date.fromisoformat(v)
        except ValueError:
            pass
        # Try DD/MM/YYYY
        try:
            return datetime.strptime(v, "%d/%m/%Y").date()
        except ValueError:
            pass
        # Try YYYY-MM-DDTHH:MM:SS...
        try:
            return datetime.fromisoformat(v.split('T')[0]).date()
        except ValueError:
            pass
    return v

class OnTableCheckingItemBase(BaseModel):
    piece_no: Optional[str] = None
    vpc_no: Optional[str] = None
    inv_pin: Optional[str] = None
    checking_pin: Optional[str] = None
    pc_type: Optional[str] = None
    meters: Optional[Decimal] = Decimal("0.0")
    defect_type: Optional[str] = None
    grade: Optional[str] = None
    remarks: Optional[str] = None

class OnTableCheckingItemCreate(OnTableCheckingItemBase):
    pass

class OnTableCheckingItemOut(OnTableCheckingItemBase):
    id: int
    checking_id: int

    class Config:
        from_attributes = True

class OnTableCheckingBase(BaseModel):
    ref_no: Optional[str] = None
    checking_date: Optional[date] = None
    table_no: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    party_name: Optional[str] = None
    lot_no: Optional[str] = None
    qc_name: Optional[str] = None
    total_meters: Optional[Decimal] = Decimal("0.0")
    total_pieces: Optional[int] = 0
    pass_meters: Optional[Decimal] = Decimal("0.0")
    reject_meters: Optional[Decimal] = Decimal("0.0")
    remarks: Optional[str] = None
    status: Optional[str] = "Checked"

    @field_validator('checking_date', mode='before')
    @classmethod
    def validate_dates(cls, v):
        return parse_date_safe(v)

class OnTableCheckingCreate(OnTableCheckingBase):
    items: List[OnTableCheckingItemCreate] = []

class OnTableCheckingUpdate(OnTableCheckingBase):
    items: Optional[List[OnTableCheckingItemCreate]] = None

class OnTableCheckingOut(OnTableCheckingBase):
    id: int
    items: List[OnTableCheckingItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[OnTableCheckingOut])
async def list_checking_entries(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(OnTableChecking).options(selectinload(OnTableChecking.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                OnTableChecking.ref_no.ilike(search_filter),
                OnTableChecking.table_no.ilike(search_filter),
                OnTableChecking.design_no.ilike(search_filter),
                OnTableChecking.party_name.ilike(search_filter),
            )
        )
    q = q.order_by(OnTableChecking.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=OnTableCheckingOut, status_code=201)
async def create_checking_entry(entry_data: OnTableCheckingCreate, db: AsyncSession = Depends(get_db)):
    if entry_data.ref_no:
        existing = await db.execute(
            select(OnTableChecking).where(OnTableChecking.ref_no == entry_data.ref_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="On-Table Checking reference number already exists")

    dump = entry_data.model_dump()
    items_data = dump.pop("items", [])
    
    db_checking = OnTableChecking(**dump)
    db.add(db_checking)
    await db.flush()

    for item in items_data:
        db_item = OnTableCheckingItem(checking_id=db_checking.id, **item)
        db.add(db_item)

    await db.commit()
    
    result = await db.execute(
        select(OnTableChecking)
        .options(selectinload(OnTableChecking.items))
        .where(OnTableChecking.id == db_checking.id)
    )
    return result.scalar_one()

@router.get("/{checking_id}", response_model=OnTableCheckingOut)
async def get_checking_entry(checking_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OnTableChecking)
        .options(selectinload(OnTableChecking.items))
        .where(OnTableChecking.id == checking_id)
    )
    db_checking = result.scalar_one_or_none()
    if not db_checking:
        raise HTTPException(status_code=404, detail="On-Table Checking record not found")
    return db_checking

@router.put("/{checking_id}", response_model=OnTableCheckingOut)
async def update_checking_entry(
    checking_id: int, 
    entry_data: OnTableCheckingUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnTableChecking)
        .options(selectinload(OnTableChecking.items))
        .where(OnTableChecking.id == checking_id)
    )
    db_checking = result.scalar_one_or_none()
    if not db_checking:
        raise HTTPException(status_code=404, detail="On-Table Checking record not found")

    dump = entry_data.model_dump(exclude_unset=True)
    items_data = dump.pop("items", None)

    for key, value in dump.items():
        setattr(db_checking, key, value)

    if items_data is not None:
        # Delete old items
        for item in list(db_checking.items):
            await db.delete(item)
        db_checking.items.clear()
        
        # Add new items
        for item in items_data:
            db_item = OnTableCheckingItem(checking_id=db_checking.id, **item)
            db_checking.items.append(db_item)

    await db.commit()
    
    result = await db.execute(
        select(OnTableChecking)
        .options(selectinload(OnTableChecking.items))
        .where(OnTableChecking.id == db_checking.id)
    )
    return result.scalar_one()

@router.delete("/{checking_id}", status_code=204)
async def delete_checking_entry(checking_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OnTableChecking).where(OnTableChecking.id == checking_id))
    db_checking = result.scalar_one_or_none()
    if not db_checking:
        raise HTTPException(status_code=404, detail="On-Table Checking record not found")

    await db.delete(db_checking)
    await db.commit()
    return None
