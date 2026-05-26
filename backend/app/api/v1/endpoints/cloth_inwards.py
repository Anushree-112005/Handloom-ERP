"""Cloth Inward CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.cloth import ClothInward, ClothInwardItem

router = APIRouter(prefix="/cloth-inwards", tags=["Cloth Inwards"])

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

class ClothInwardItemBase(BaseModel):
    piece_no: Optional[str] = None
    weight: Optional[Decimal] = Decimal("0.0")
    vloom: Optional[str] = None
    vpc_no: Optional[str] = None
    meters: Optional[Decimal] = Decimal("0.0")
    
    # Old fields for compatibility
    design_no: Optional[str] = None
    color: Optional[str] = None
    lot_no: Optional[str] = None
    pieces: Optional[int] = 0
    rate: Optional[Decimal] = Decimal("0.0")
    amount: Optional[Decimal] = Decimal("0.0")

class ClothInwardItemCreate(ClothInwardItemBase):
    pass

class ClothInwardItemOut(ClothInwardItemBase):
    id: int
    inward_id: int

    class Config:
        from_attributes = True

class ClothInwardBase(BaseModel):
    ref_no: Optional[str] = None
    inward_type: Optional[str] = None
    inw_date: Optional[date] = None
    vendor_order: Optional[str] = None
    party_name: Optional[str] = None
    dc_no: Optional[str] = None
    dc_date: Optional[date] = None
    vendor_order_mtr: Optional[Decimal] = Decimal("0.0")
    order_mtr_plus_10: Optional[Decimal] = Decimal("0.0")
    received_mtr: Optional[Decimal] = Decimal("0.0")
    balance_mtr: Optional[Decimal] = Decimal("0.0")
    ibpo: Optional[str] = None
    design_no: Optional[str] = None
    const_fabric_type: Optional[str] = None
    reed: Optional[str] = None
    pick: Optional[str] = None
    width: Optional[str] = None
    order_mtr: Optional[Decimal] = Decimal("0.0")
    warp_mtr: Optional[Decimal] = Decimal("0.0")
    inward_mtr: Optional[Decimal] = Decimal("0.0")
    shed_no: Optional[str] = None
    loom_no: Optional[str] = None
    attn_no: Optional[str] = None
    beam_no: Optional[str] = None
    szt_no: Optional[str] = None
    total_pieces: Optional[int] = 0
    total_meters: Optional[Decimal] = Decimal("0.0")
    inspection_type: Optional[str] = None
    inv_pin: Optional[str] = None
    remarks: Optional[str] = None
    process_type: Optional[str] = None
    process_remarks: Optional[str] = None
    
    # Old fields for compatibility
    inv_no: Optional[str] = None
    inv_date: Optional[date] = None
    received_type: Optional[str] = None
    order_no: Optional[str] = None
    gross_amount: Optional[Decimal] = Decimal("0.0")
    net_amount: Optional[Decimal] = Decimal("0.0")
    status: Optional[str] = "Received"

    @field_validator('inw_date', 'dc_date', 'inv_date', mode='before')
    @classmethod
    def validate_dates(cls, v):
        return parse_date_safe(v)

class ClothInwardCreate(ClothInwardBase):
    items: List[ClothInwardItemCreate] = []

class ClothInwardUpdate(ClothInwardBase):
    items: Optional[List[ClothInwardItemCreate]] = None

class ClothInwardOut(ClothInwardBase):
    id: int
    items: List[ClothInwardItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ClothInwardOut])
async def list_inwards(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(ClothInward).options(selectinload(ClothInward.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                ClothInward.ref_no.ilike(search_filter),
                ClothInward.party_name.ilike(search_filter),
                ClothInward.design_no.ilike(search_filter),
                ClothInward.dc_no.ilike(search_filter)
            )
        )
    q = q.order_by(ClothInward.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=ClothInwardOut, status_code=201)
async def create_inward(inward_data: ClothInwardCreate, db: AsyncSession = Depends(get_db)):
    if inward_data.ref_no:
        existing = await db.execute(
            select(ClothInward).where(ClothInward.ref_no == inward_data.ref_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Cloth Inward reference number already exists")

    dump = inward_data.model_dump()
    items_data = dump.pop("items", [])
    
    db_inward = ClothInward(**dump)
    db.add(db_inward)
    await db.flush()

    for item in items_data:
        db_item = ClothInwardItem(inward_id=db_inward.id, **item)
        db.add(db_item)

    await db.commit()
    
    result = await db.execute(
        select(ClothInward)
        .options(selectinload(ClothInward.items))
        .where(ClothInward.id == db_inward.id)
    )
    return result.scalar_one()

@router.get("/{inward_id}", response_model=ClothInwardOut)
async def get_inward(inward_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ClothInward)
        .options(selectinload(ClothInward.items))
        .where(ClothInward.id == inward_id)
    )
    db_inward = result.scalar_one_or_none()
    if not db_inward:
        raise HTTPException(status_code=404, detail="Cloth Inward record not found")
    return db_inward

@router.put("/{inward_id}", response_model=ClothInwardOut)
async def update_inward(
    inward_id: int, 
    inward_data: ClothInwardUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ClothInward)
        .options(selectinload(ClothInward.items))
        .where(ClothInward.id == inward_id)
    )
    db_inward = result.scalar_one_or_none()
    if not db_inward:
        raise HTTPException(status_code=404, detail="Cloth Inward record not found")

    dump = inward_data.model_dump(exclude_unset=True)
    items_data = dump.pop("items", None)

    for key, value in dump.items():
        setattr(db_inward, key, value)

    if items_data is not None:
        # Delete old items
        for item in list(db_inward.items):
            await db.delete(item)
        db_inward.items.clear()
        
        # Add new items
        for item in items_data:
            db_item = ClothInwardItem(inward_id=db_inward.id, **item)
            db_inward.items.append(db_item)

    await db.commit()
    
    result = await db.execute(
        select(ClothInward)
        .options(selectinload(ClothInward.items))
        .where(ClothInward.id == db_inward.id)
    )
    return result.scalar_one()

@router.delete("/{inward_id}", status_code=204)
async def delete_inward(inward_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClothInward).where(ClothInward.id == inward_id))
    db_inward = result.scalar_one_or_none()
    if not db_inward:
        raise HTTPException(status_code=404, detail="Cloth Inward record not found")

    await db.delete(db_inward)
    await db.commit()
    return None
