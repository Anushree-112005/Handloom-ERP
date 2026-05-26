"""Finished Fabric Inward CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.finished_fabric import FinishedFabricInward, FinishedFabricItem

router = APIRouter(prefix="/finished-fabrics", tags=["Finished Fabrics"])

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

class FinishedFabricItemBase(BaseModel):
    design_no: Optional[str] = None
    color: Optional[str] = None
    lot_no: Optional[str] = None
    meters: Optional[Decimal] = Decimal("0.0")
    pieces: Optional[int] = 0
    width: Optional[Decimal] = Decimal("0.0")
    weight: Optional[Decimal] = Decimal("0.0")
    grade: Optional[str] = None
    v_loom: Optional[str] = None
    v_pc_no: Optional[str] = None
    piece_no: Optional[str] = None

class FinishedFabricItemCreate(FinishedFabricItemBase):
    pass

class FinishedFabricItemOut(FinishedFabricItemBase):
    id: int
    inward_id: int

    class Config:
        from_attributes = True

class FinishedFabricInwardBase(BaseModel):
    ref_no: Optional[str] = None
    inv_no: Optional[str] = None
    inv_date: Optional[date] = None
    received_type: Optional[str] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    dc_no: Optional[str] = None
    dc_date: Optional[date] = None
    process_type: Optional[str] = None
    total_meters: Optional[Decimal] = Decimal("0.0")
    total_pieces: Optional[int] = 0
    remarks: Optional[str] = None
    status: Optional[str] = "Received"

    @field_validator('inv_date', 'dc_date', mode='before')
    @classmethod
    def validate_dates(cls, v):
        return parse_date_safe(v)

class FinishedFabricInwardCreate(FinishedFabricInwardBase):
    items: List[FinishedFabricItemCreate] = []

class FinishedFabricInwardUpdate(FinishedFabricInwardBase):
    items: Optional[List[FinishedFabricItemCreate]] = None

class FinishedFabricInwardOut(FinishedFabricInwardBase):
    id: int
    items: List[FinishedFabricItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[FinishedFabricInwardOut])
async def list_inwards(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(FinishedFabricInward).options(selectinload(FinishedFabricInward.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                FinishedFabricInward.ref_no.ilike(search_filter),
                FinishedFabricInward.party_name.ilike(search_filter),
                FinishedFabricInward.design_no.ilike(search_filter),
            )
        )
    q = q.order_by(FinishedFabricInward.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=FinishedFabricInwardOut, status_code=201)
async def create_inward(inward_data: FinishedFabricInwardCreate, db: AsyncSession = Depends(get_db)):
    if inward_data.ref_no:
        existing = await db.execute(
            select(FinishedFabricInward).where(FinishedFabricInward.ref_no == inward_data.ref_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Fabric Inward reference number already exists")

    dump = inward_data.model_dump()
    items_data = dump.pop("items", [])
    
    db_inward = FinishedFabricInward(**dump)
    db.add(db_inward)
    await db.flush()

    for item in items_data:
        db_item = FinishedFabricItem(inward_id=db_inward.id, **item)
        db.add(db_item)

    await db.commit()
    
    result = await db.execute(
        select(FinishedFabricInward)
        .options(selectinload(FinishedFabricInward.items))
        .where(FinishedFabricInward.id == db_inward.id)
    )
    return result.scalar_one()

@router.get("/{inward_id}", response_model=FinishedFabricInwardOut)
async def get_inward(inward_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FinishedFabricInward)
        .options(selectinload(FinishedFabricInward.items))
        .where(FinishedFabricInward.id == inward_id)
    )
    db_inward = result.scalar_one_or_none()
    if not db_inward:
        raise HTTPException(status_code=404, detail="Fabric Inward record not found")
    return db_inward

@router.put("/{inward_id}", response_model=FinishedFabricInwardOut)
async def update_inward(
    inward_id: int, 
    inward_data: FinishedFabricInwardUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(FinishedFabricInward)
        .options(selectinload(FinishedFabricInward.items))
        .where(FinishedFabricInward.id == inward_id)
    )
    db_inward = result.scalar_one_or_none()
    if not db_inward:
        raise HTTPException(status_code=404, detail="Fabric Inward record not found")

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
            db_item = FinishedFabricItem(inward_id=db_inward.id, **item)
            db_inward.items.append(db_item)

    await db.commit()
    
    result = await db.execute(
        select(FinishedFabricInward)
        .options(selectinload(FinishedFabricInward.items))
        .where(FinishedFabricInward.id == db_inward.id)
    )
    return result.scalar_one()

@router.delete("/{inward_id}", status_code=204)
async def delete_inward(inward_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FinishedFabricInward).where(FinishedFabricInward.id == inward_id))
    db_inward = result.scalar_one_or_none()
    if not db_inward:
        raise HTTPException(status_code=404, detail="Fabric Inward record not found")

    await db.delete(db_inward)
    await db.commit()
    return None
