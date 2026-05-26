from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.party_master import PartyMaster

router = APIRouter(prefix="/parties", tags=["Party Master"])

class PartyMasterBase(BaseModel):
    party_type: str
    customer_grade: Optional[str] = None
    status: Optional[str] = "Active"
    business_name: str
    party_group: Optional[str] = None
    address: Optional[str] = None
    state_code: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    sales_region: Optional[str] = None
    country: Optional[str] = "India"
    currency: Optional[str] = "INR"
    contact_person: Optional[str] = None
    email: Optional[str] = None
    tally_no: Optional[str] = None
    address_sno: Optional[str] = None
    tcs_applicable: Optional[str] = None
    tin_no: Optional[str] = None
    cst_no: Optional[str] = None
    gstin: Optional[str] = None
    gst_type: Optional[str] = None
    pan_no: Optional[str] = None
    tds: Optional[str] = None
    tds_percent: Optional[float] = 0.0
    pc_id: Optional[str] = None
    merchandiser: Optional[str] = None
    manager: Optional[str] = None
    bill_credit_days: Optional[int] = 0
    credit_limit: Optional[float] = 0.0
    account_incharge: Optional[str] = None
    deliver_party_name: Optional[str] = None
    payment_terms: Optional[str] = None
    transport_name: Optional[str] = None
    delivery_address: Optional[str] = None
    agent_name: Optional[str] = None

class PartyMasterCreate(PartyMasterBase):
    pass

class PartyMasterUpdate(PartyMasterBase):
    pass

class PartyMasterOut(PartyMasterBase):
    id: int
    customer_code: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PartyMasterOut])
async def list_parties(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(PartyMaster).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=PartyMasterOut, status_code=201)
async def create_party(party: PartyMasterCreate, db: AsyncSession = Depends(get_db)):
    # Auto-generate customer code
    count_q = await db.execute(select(func.count(PartyMaster.id)))
    count = count_q.scalar() or 0
    customer_code = f"{(count + 1) + 2400}"

    db_party = PartyMaster(**party.model_dump(), customer_code=customer_code)
    db.add(db_party)
    await db.commit()
    await db.refresh(db_party)
    return db_party

@router.put("/{party_id}", response_model=PartyMasterOut)
async def update_party(party_id: int, party: PartyMasterUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PartyMaster).where(PartyMaster.id == party_id))
    db_party = result.scalar_one_or_none()
    if not db_party:
        raise HTTPException(status_code=404, detail="Party not found")

    for key, value in party.model_dump().items():
        setattr(db_party, key, value)
        
    await db.commit()
    await db.refresh(db_party)
    return db_party

@router.get("/{party_id}", response_model=PartyMasterOut)
async def get_party(party_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PartyMaster).where(PartyMaster.id == party_id))
    db_party = result.scalar_one_or_none()
    if not db_party:
        raise HTTPException(status_code=404, detail="Party not found")
    return db_party

@router.delete("/{party_id}", status_code=204)
async def delete_party(party_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PartyMaster).where(PartyMaster.id == party_id))
    db_party = result.scalar_one_or_none()
    if not db_party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    await db.delete(db_party)
    await db.commit()
    return None
