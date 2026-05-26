"""Packing Slip / Bale Entry CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.packing_slip import PackingSlip, PackingSlipItem

router = APIRouter(prefix="/packing-slips", tags=["Packing Slips"])

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

class PackingSlipItemBase(BaseModel):
    bale_no: Optional[str] = None
    piece_no: Optional[str] = None
    design_no: Optional[str] = None
    color: Optional[str] = None
    meters: Optional[Decimal] = Decimal("0.0")
    weight: Optional[Decimal] = Decimal("0.0")
    grade: Optional[str] = None
    lot_no: Optional[str] = None
    loom_no: Optional[str] = None
    pass_mtr: Optional[Decimal] = Decimal("0.0")

class PackingSlipItemCreate(PackingSlipItemBase):
    pass

class PackingSlipItemOut(PackingSlipItemBase):
    id: int
    slip_id: int

    class Config:
        from_attributes = True

class PackingSlipBase(BaseModel):
    slip_no: Optional[str] = None
    slip_date: Optional[date] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    ibpo: Optional[str] = None
    godown: Optional[str] = None
    total_meters: Optional[Decimal] = Decimal("0.0")
    total_pieces: Optional[int] = 0
    total_bales: Optional[int] = 0
    gross_weight: Optional[Decimal] = Decimal("0.0")
    net_weight: Optional[Decimal] = Decimal("0.0")
    remarks: Optional[str] = None
    status: Optional[str] = "Packed"

    @field_validator('slip_date', mode='before')
    @classmethod
    def validate_dates(cls, v):
        return parse_date_safe(v)

class PackingSlipCreate(PackingSlipBase):
    items: List[PackingSlipItemCreate] = []

class PackingSlipUpdate(PackingSlipBase):
    items: Optional[List[PackingSlipItemCreate]] = None

class PackingSlipOut(PackingSlipBase):
    id: int
    items: List[PackingSlipItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PackingSlipOut])
async def list_slips(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(PackingSlip).options(selectinload(PackingSlip.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                PackingSlip.slip_no.ilike(search_filter),
                PackingSlip.party_name.ilike(search_filter),
            )
        )
    q = q.order_by(PackingSlip.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=PackingSlipOut, status_code=201)
async def create_slip(slip_data: PackingSlipCreate, db: AsyncSession = Depends(get_db)):
    if slip_data.slip_no:
        existing = await db.execute(
            select(PackingSlip).where(PackingSlip.slip_no == slip_data.slip_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Packing slip number already exists")

    dump = slip_data.model_dump()
    items_data = dump.pop("items", [])
    
    db_slip = PackingSlip(**dump)
    db.add(db_slip)
    await db.flush()

    for item in items_data:
        db_item = PackingSlipItem(slip_id=db_slip.id, **item)
        db.add(db_item)

    await db.commit()
    
    result = await db.execute(
        select(PackingSlip)
        .options(selectinload(PackingSlip.items))
        .where(PackingSlip.id == db_slip.id)
    )
    return result.scalar_one()

@router.get("/{slip_id}", response_model=PackingSlipOut)
async def get_slip(slip_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PackingSlip)
        .options(selectinload(PackingSlip.items))
        .where(PackingSlip.id == slip_id)
    )
    db_slip = result.scalar_one_or_none()
    if not db_slip:
        raise HTTPException(status_code=404, detail="Packing Slip record not found")
    return db_slip

@router.put("/{slip_id}", response_model=PackingSlipOut)
async def update_slip(
    slip_id: int, 
    slip_data: PackingSlipUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PackingSlip)
        .options(selectinload(PackingSlip.items))
        .where(PackingSlip.id == slip_id)
    )
    db_slip = result.scalar_one_or_none()
    if not db_slip:
        raise HTTPException(status_code=404, detail="Packing Slip record not found")

    dump = slip_data.model_dump(exclude_unset=True)
    items_data = dump.pop("items", None)

    for key, value in dump.items():
        setattr(db_slip, key, value)

    if items_data is not None:
        # Delete old items
        for item in list(db_slip.items):
            await db.delete(item)
        db_slip.items.clear()
        
        # Add new items
        for item in items_data:
            db_item = PackingSlipItem(slip_id=db_slip.id, **item)
            db_slip.items.append(db_item)

    await db.commit()
    
    result = await db.execute(
        select(PackingSlip)
        .options(selectinload(PackingSlip.items))
        .where(PackingSlip.id == db_slip.id)
    )
    return result.scalar_one()

@router.delete("/{slip_id}", status_code=204)
async def delete_slip(slip_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PackingSlip).where(PackingSlip.id == slip_id))
    db_slip = result.scalar_one_or_none()
    if not db_slip:
        raise HTTPException(status_code=404, detail="Packing Slip record not found")

    await db.delete(db_slip)
    await db.commit()
    return None
