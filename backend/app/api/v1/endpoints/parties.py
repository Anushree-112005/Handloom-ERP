"""Party Master CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.party_master import PartyMaster, PartyAddress
from finance_app.models.ledger import Ledger
from finance_app.models.ledger_group import LedgerGroup
from finance_app.models.inventory import Location
from app.models.log_report import LogReport

router = APIRouter(prefix="/parties", tags=["Party Master"])

class PartyAddressSchema(BaseModel):
    id: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    pin_code: Optional[str] = None
    country: Optional[str] = "India"
    sales_region: Optional[str] = None
    address_type: Optional[str] = "Bill"

    class Config:
        from_attributes = True

class PartyMasterBase(BaseModel):
    party_type: str
    company_name: str
    customer_grade: Optional[str] = None
    status: Optional[str] = "Active"
    party_group: Optional[str] = None
    address_type: Optional[str] = "Bill"
    address: Optional[str] = None
    state_code: Optional[str] = None
    pin_code: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
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
    gst_no: Optional[str] = None
    gst_type: Optional[str] = None
    pan_no: Optional[str] = None
    tds: Optional[str] = None
    tds_percent: Optional[float] = 0.0
    pc_id: Optional[str] = None
    merchandiser: Optional[str] = None
    manager: Optional[str] = None
    credit_days: Optional[int] = 0
    credit_limit: Optional[float] = 0.0
    account_incharge: Optional[str] = None
    deliver_party_name: Optional[str] = None
    payment_terms: Optional[str] = None
    transport_name: Optional[str] = None
    delivery_address: Optional[str] = None
    agent_name: Optional[str] = None
    buyer_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    addresses: Optional[List[PartyAddressSchema]] = []

class PartyMasterCreate(PartyMasterBase):
    pass

class PartyMasterUpdate(PartyMasterBase):
    pass

class PartyMasterOut(PartyMasterBase):
    id: int
    customer_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[PartyMasterOut])
async def list_parties(skip: int = 0, limit: int = 100, party_type: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(PartyMaster).options(selectinload(PartyMaster.addresses))
    if party_type:
        q = q.where(PartyMaster.party_type.like(f"%{party_type}%"))
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=PartyMasterOut, status_code=201)
async def create_party(party: PartyMasterCreate, db: AsyncSession = Depends(get_db)):
    # Auto-generate code prefix-wise based on party_type
    party_type_lower = party.party_type.lower()
    if "sales" in party_type_lower or "export" in party_type_lower:
        prefix = "CUST"
    elif "purchase" in party_type_lower or "vendor" in party_type_lower:
        prefix = "VEND"
    elif "logistics" in party_type_lower or "transport" in party_type_lower:
        prefix = "TRANS"
    elif "agent" in party_type_lower:
        prefix = "AGT"
    else:
        # Fallback to a 4-letter uppercase prefix from the party type
        cleaned = "".join([c for c in party.party_type if c.isalnum()]).upper()
        prefix = cleaned[:4] if len(cleaned) >= 3 else "PART"

    # Query existing codes starting with this prefix to find the max number
    q = select(PartyMaster.customer_code).where(PartyMaster.customer_code.like(f"{prefix}%"))
    res = await db.execute(q)
    codes = res.scalars().all()
    
    max_num = 0
    for code in codes:
        if code and code.startswith(prefix):
            digits = "".join([c for c in code[len(prefix):] if c.isdigit()])
            if digits:
                try:
                    num = int(digits)
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass

    next_num = max_num + 1
    customer_code = f"{prefix}{next_num:03d}"

    party_data = party.model_dump()
    addresses_data = party_data.pop("addresses", []) or []

    db_party = PartyMaster(**party_data, customer_code=customer_code)
    for addr in addresses_data:
        db_party.addresses.append(PartyAddress(**addr))

    db.add(db_party)
    await db.commit()
    await db.refresh(db_party)
    sqlite_db = None
    try:
        from finance_app.database import SessionLocal
        from finance_app.models.ledger import Ledger
        from finance_app.models.ledger_group import LedgerGroup
        from finance_app.models.inventory import Location

        sqlite_db = SessionLocal()
        
        DEFAULT_COMPANY_ID = 1

        # Determine Ledger Group
        ptype = db_party.party_type.lower() if db_party.party_type else ""
        pgroup = db_party.party_group.lower() if db_party.party_group else ""
        
        ledger_group_name = "Sundry Creditors"
        if "sales" in ptype or "buyer" in ptype or "debtor" in pgroup:
            ledger_group_name = "Sundry Debtors"

        # Find the LedgerGroup to get group_id (if exists)
        ledger_group_obj = sqlite_db.query(LedgerGroup).filter(LedgerGroup.name == ledger_group_name, LedgerGroup.company_id == DEFAULT_COMPANY_ID).first()
        group_id = ledger_group_obj.id if ledger_group_obj else None

        # Auto-create Ledger
        new_ledger = Ledger(
            name=db_party.company_name,
            group=ledger_group_name,
            group_id=group_id,
            party_type=db_party.party_type,
            gstin=db_party.gst_no,
            pan=db_party.pan_no,
            address=db_party.address,
            state_code=db_party.state_code,
            company_id=DEFAULT_COMPANY_ID
        )
        sqlite_db.add(new_ledger)

        # Auto-create Inventory Location
        new_location = Location(
            name=db_party.company_name,
            company_id=DEFAULT_COMPANY_ID
        )
        sqlite_db.add(new_location)

        # Auto-create Log Report
        new_log = LogReport(
            user_name="System",
            user_id="sys",
            mode="Save",
            module="Party Master",
            remarks=f"New Party Added: {db_party.company_name} ({db_party.party_type})"
        )
        db.add(new_log)

        await db.commit()
        sqlite_db.commit()
        sqlite_db.close()
    except Exception as e:
        import logging
        logging.getLogger("app").warning(f"Cross-module integration failed when creating party: {e}")
        if sqlite_db:
            try:
                sqlite_db.rollback()
                sqlite_db.close()
            except:
                pass
        try:
            await db.rollback()
        except:
            pass
    
    # Reload party with addresses
    result = await db.execute(
        select(PartyMaster).options(selectinload(PartyMaster.addresses)).where(PartyMaster.id == db_party.id)
    )
    return result.scalar_one()

@router.put("/{party_id}", response_model=PartyMasterOut)
async def update_party(party_id: int, party: PartyMasterUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PartyMaster).options(selectinload(PartyMaster.addresses)).where(PartyMaster.id == party_id)
    )
    db_party = result.scalar_one_or_none()
    if not db_party:
        raise HTTPException(status_code=404, detail="Party not found")

    party_data = party.model_dump(exclude_unset=True)
    addresses_data = party_data.pop("addresses", None)

    for key, value in party_data.items():
        setattr(db_party, key, value)

    if addresses_data is not None:
        # Delete existing addresses
        for addr in db_party.addresses:
            await db.delete(addr)
        db_party.addresses = []
        # Add new addresses
        for addr in addresses_data:
            addr.pop("id", None)
            db_party.addresses.append(PartyAddress(**addr))
        
    await db.commit()
    await db.refresh(db_party)
    
    # Reload party with addresses
    result = await db.execute(
        select(PartyMaster).options(selectinload(PartyMaster.addresses)).where(PartyMaster.id == party_id)
    )
    return result.scalar_one()

@router.get("/stats/summary")
async def party_summary(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(PartyMaster.id)))
    active = await db.execute(select(func.count(PartyMaster.id)).where(PartyMaster.status == "Active"))
    return {"total": total.scalar(), "active": active.scalar()}

@router.get("/{party_id}", response_model=PartyMasterOut)
async def get_party(party_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PartyMaster).options(selectinload(PartyMaster.addresses)).where(PartyMaster.id == party_id)
    )
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
