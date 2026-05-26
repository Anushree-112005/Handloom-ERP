"""Party Master CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.party_master import PartyMaster

router = APIRouter(prefix="/parties", tags=["Party Master"])


class PartyCreate(BaseModel):
    party_type: str
    company_name: str
    customer_grade: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    pin_code: Optional[str] = None
    country: Optional[str] = "India"
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    gst_no: Optional[str] = None
    pan_no: Optional[str] = None
    contact_person: Optional[str] = None
    credit_days: Optional[int] = 0
    credit_limit: Optional[int] = 0


class PartyOut(PartyCreate):
    id: int
    customer_code: Optional[str] = None
    status: str = "Active"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PartyOut])
async def list_parties(skip: int = 0, limit: int = 100, party_type: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(PartyMaster)
    if party_type:
        q = q.where(PartyMaster.party_type == party_type)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=PartyOut, status_code=201)
async def create_party(data: PartyCreate, db: AsyncSession = Depends(get_db)):
    count_result = await db.execute(select(func.count(PartyMaster.id)))
    count = count_result.scalar() or 0
    code = f"DT-{count + 1:05d}"
    party = PartyMaster(**data.model_dump(), customer_code=code)
    db.add(party)
    await db.commit()
    await db.refresh(party)
    return party


@router.get("/{party_id}", response_model=PartyOut)
async def get_party(party_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PartyMaster).where(PartyMaster.id == party_id))
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@router.put("/{party_id}", response_model=PartyOut)
async def update_party(party_id: int, data: PartyCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PartyMaster).where(PartyMaster.id == party_id))
    party = result.scalar_one_or_none()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(party, key, val)
    await db.commit()
    await db.refresh(party)
    return party


@router.get("/stats/summary")
async def party_summary(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(PartyMaster.id)))
    active = await db.execute(select(func.count(PartyMaster.id)).where(PartyMaster.status == "Active"))
    return {"total": total.scalar(), "active": active.scalar()}
