"""Goods Release Advice (GRA) CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.goods_release import GoodsRelease, GoodsReleaseItem

router = APIRouter(prefix="/goods-releases", tags=["Goods Releases"])

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
        # Try DD-MMM-YYYY (e.g. 20-May-2026)
        try:
            return datetime.strptime(v, "%d-%b-%Y").date()
        except ValueError:
            pass
        # Try YYYY-MM-DDTHH:MM:SS...
        try:
            return datetime.fromisoformat(v.split('T')[0]).date()
        except ValueError:
            pass
    return v

class GoodsReleaseItemBase(BaseModel):
    packing_slip_no: Optional[str] = None
    bale_no: Optional[str] = None
    design_no: Optional[str] = None
    color: Optional[str] = None
    meters: Optional[Decimal] = Decimal("0.0")
    pieces: Optional[int] = 0
    weight: Optional[Decimal] = Decimal("0.0")
    rate: Optional[Decimal] = Decimal("0.0")
    amount: Optional[Decimal] = Decimal("0.0")

class GoodsReleaseItemCreate(GoodsReleaseItemBase):
    pass

class GoodsReleaseItemOut(GoodsReleaseItemBase):
    id: int
    release_id: int

    class Config:
        from_attributes = True

class GoodsReleaseBase(BaseModel):
    gra_no: Optional[str] = None
    gra_date: Optional[date] = None
    party_name: Optional[str] = None
    ibpo: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    transport_mode: Optional[str] = None
    transport_name: Optional[str] = None
    vehicle_no: Optional[str] = None
    lr_no: Optional[str] = None
    lr_date: Optional[date] = None
    delivery_address: Optional[str] = None
    total_meters: Optional[Decimal] = Decimal("0.0")
    total_bales: Optional[int] = 0
    gross_weight: Optional[Decimal] = Decimal("0.0")
    net_weight: Optional[Decimal] = Decimal("0.0")
    approval_status: Optional[str] = "Pending"
    approved_by: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = "Draft"

    @field_validator('gra_date', 'lr_date', mode='before')
    @classmethod
    def validate_dates(cls, v):
        return parse_date_safe(v)

class GoodsReleaseCreate(GoodsReleaseBase):
    items: List[GoodsReleaseItemCreate] = []

class GoodsReleaseUpdate(GoodsReleaseBase):
    items: Optional[List[GoodsReleaseItemCreate]] = None

class GoodsReleaseOut(GoodsReleaseBase):
    id: int
    items: List[GoodsReleaseItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[GoodsReleaseOut])
async def list_releases(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(GoodsRelease).options(selectinload(GoodsRelease.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                GoodsRelease.gra_no.ilike(search_filter),
                GoodsRelease.party_name.ilike(search_filter),
            )
        )
    q = q.order_by(GoodsRelease.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=GoodsReleaseOut, status_code=201)
async def create_release(release_data: GoodsReleaseCreate, db: AsyncSession = Depends(get_db)):
    if release_data.gra_no:
        existing = await db.execute(
            select(GoodsRelease).where(GoodsRelease.gra_no == release_data.gra_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="GRA number already exists")

    dump = release_data.model_dump()
    items_data = dump.pop("items", [])
    
    db_release = GoodsRelease(**dump)
    db.add(db_release)
    await db.flush()

    for item in items_data:
        db_item = GoodsReleaseItem(release_id=db_release.id, **item)
        db.add(db_item)

    await db.commit()
    
    result = await db.execute(
        select(GoodsRelease)
        .options(selectinload(GoodsRelease.items))
        .where(GoodsRelease.id == db_release.id)
    )
    return result.scalar_one()

@router.get("/{release_id}", response_model=GoodsReleaseOut)
async def get_release(release_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GoodsRelease)
        .options(selectinload(GoodsRelease.items))
        .where(GoodsRelease.id == release_id)
    )
    db_release = result.scalar_one_or_none()
    if not db_release:
        raise HTTPException(status_code=404, detail="Goods Release record not found")
    return db_release

@router.put("/{release_id}", response_model=GoodsReleaseOut)
async def update_release(
    release_id: int, 
    release_data: GoodsReleaseUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(GoodsRelease)
        .options(selectinload(GoodsRelease.items))
        .where(GoodsRelease.id == release_id)
    )
    db_release = result.scalar_one_or_none()
    if not db_release:
        raise HTTPException(status_code=404, detail="Goods Release record not found")

    dump = release_data.model_dump(exclude_unset=True)
    items_data = dump.pop("items", None)

    for key, value in dump.items():
        setattr(db_release, key, value)

    if items_data is not None:
        # Delete old items
        for item in list(db_release.items):
            await db.delete(item)
        db_release.items.clear()
        
        # Add new items
        for item in items_data:
            db_item = GoodsReleaseItem(release_id=db_release.id, **item)
            db_release.items.append(db_item)

    await db.commit()
    
    result = await db.execute(
        select(GoodsRelease)
        .options(selectinload(GoodsRelease.items))
        .where(GoodsRelease.id == db_release.id)
    )
    return result.scalar_one()

@router.delete("/{release_id}", status_code=204)
async def delete_release(release_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GoodsRelease).where(GoodsRelease.id == release_id))
    db_release = result.scalar_one_or_none()
    if not db_release:
        raise HTTPException(status_code=404, detail="Goods Release record not found")

    await db.delete(db_release)
    await db.commit()
    return None
