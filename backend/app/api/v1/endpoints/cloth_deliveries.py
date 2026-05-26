"""Cloth Delivery CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.cloth import ClothDelivery, ClothDeliveryItem

router = APIRouter(prefix="/cloth-deliveries", tags=["Cloth Deliveries"])

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

class ClothDeliveryItemBase(BaseModel):
    design_no: Optional[str] = None
    color: Optional[str] = None
    lot_no: Optional[str] = None
    meters: Optional[Decimal] = Decimal("0.0")
    pieces: Optional[int] = 0
    rate: Optional[Decimal] = Decimal("0.0")
    amount: Optional[Decimal] = Decimal("0.0")
    
    # Newly added fields
    piece_no: Optional[str] = None
    ok_mtr: Optional[Decimal] = Decimal("0.0")
    fold_mtr: Optional[Decimal] = Decimal("0.0")

class ClothDeliveryItemCreate(ClothDeliveryItemBase):
    pass

class ClothDeliveryItemOut(ClothDeliveryItemBase):
    id: int
    delivery_id: int

    class Config:
        from_attributes = True

class ClothDeliveryBase(BaseModel):
    dc_no: Optional[str] = None
    dc_date: Optional[date] = None
    delivery_type: Optional[str] = None
    delivery_mode: Optional[str] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    transport: Optional[str] = None
    total_meters: Optional[Decimal] = Decimal("0.0")
    total_pieces: Optional[int] = 0
    gross_amount: Optional[Decimal] = Decimal("0.0")
    sgst: Optional[Decimal] = Decimal("0.0")
    igst: Optional[Decimal] = Decimal("0.0")
    net_amount: Optional[Decimal] = Decimal("0.0")
    remarks: Optional[str] = None
    status: Optional[str] = "Delivered"

    # Newly added fields
    po_no: Optional[str] = None
    process_type: Optional[str] = None
    ibpo: Optional[str] = None
    fabric_detail: Optional[str] = None
    pc_type: Optional[str] = None
    ibpo_order_mtr: Optional[Decimal] = Decimal("0.0")
    delivery_mtr: Optional[Decimal] = Decimal("0.0")
    balance: Optional[Decimal] = Decimal("0.0")
    fresh_width: Optional[Decimal] = Decimal("0.0")
    finish_fold: Optional[str] = None
    process_comm: Optional[str] = None
    bpo_no: Optional[str] = None
    design_no_bottom: Optional[str] = None
    buyer_name: Optional[str] = None
    lot_no: Optional[str] = None
    griege_rate: Optional[Decimal] = Decimal("0.0")
    return_type: Optional[str] = None
    oba: Optional[str] = None
    finish_pick: Optional[Decimal] = Decimal("0.0")
    glm: Optional[Decimal] = Decimal("0.0")

    # Voucher Entry
    voucher_no: Optional[str] = None
    voucher_date: Optional[date] = None
    rate_mtr: Optional[Decimal] = Decimal("0.0")
    debited_amount: Optional[Decimal] = Decimal("0.0")
    detailed_remarks: Optional[str] = None

    # Gate Pass
    transport_name: Optional[str] = None
    vehicle_no: Optional[str] = None
    driver_name: Optional[str] = None
    mobile_no: Optional[str] = None

    @field_validator('dc_date', mode='before')
    @classmethod
    def validate_dc_date(cls, v):
        return parse_date_safe(v)

    @field_validator('voucher_date', mode='before')
    @classmethod
    def validate_voucher_date(cls, v):
        return parse_date_safe(v)

class ClothDeliveryCreate(ClothDeliveryBase):
    items: List[ClothDeliveryItemCreate] = []

class ClothDeliveryUpdate(ClothDeliveryBase):
    items: Optional[List[ClothDeliveryItemCreate]] = None

class ClothDeliveryOut(ClothDeliveryBase):
    id: int
    items: List[ClothDeliveryItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ClothDeliveryOut])
async def list_deliveries(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(ClothDelivery).options(selectinload(ClothDelivery.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                ClothDelivery.dc_no.ilike(search_filter),
                ClothDelivery.party_name.ilike(search_filter),
            )
        )
    q = q.order_by(ClothDelivery.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=ClothDeliveryOut, status_code=201)
async def create_delivery(delivery_data: ClothDeliveryCreate, db: AsyncSession = Depends(get_db)):
    if delivery_data.dc_no:
        existing = await db.execute(
            select(ClothDelivery).where(ClothDelivery.dc_no == delivery_data.dc_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="DC number already exists")
    else:
        # Auto-generate DC No if empty
        count_q = await db.execute(select(func.count(ClothDelivery.id)))
        count = count_q.scalar() or 0
        delivery_data.dc_no = f"CD-{(count + 1) + 5000}"

    dump = delivery_data.model_dump()
    items_data = dump.pop("items", [])

    db_delivery = ClothDelivery(**dump)
    db.add(db_delivery)
    await db.flush()

    for item in items_data:
        db_item = ClothDeliveryItem(delivery_id=db_delivery.id, **item)
        db.add(db_item)

    await db.commit()

    # Reload
    result = await db.execute(
        select(ClothDelivery)
        .options(selectinload(ClothDelivery.items))
        .where(ClothDelivery.id == db_delivery.id)
    )
    return result.scalar_one()

@router.get("/{delivery_id}", response_model=ClothDeliveryOut)
async def get_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ClothDelivery)
        .options(selectinload(ClothDelivery.items))
        .where(ClothDelivery.id == delivery_id)
    )
    db_delivery = result.scalar_one_or_none()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Cloth delivery not found")
    return db_delivery

@router.put("/{delivery_id}", response_model=ClothDeliveryOut)
async def update_delivery(
    delivery_id: int,
    delivery_data: ClothDeliveryUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ClothDelivery)
        .options(selectinload(ClothDelivery.items))
        .where(ClothDelivery.id == delivery_id)
    )
    db_delivery = result.scalar_one_or_none()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Cloth delivery not found")

    dump = delivery_data.model_dump(exclude_unset=True)
    items_data = dump.pop("items", None)

    for key, value in dump.items():
        setattr(db_delivery, key, value)

    if items_data is not None:
        # Delete old items
        for item in db_delivery.items:
            await db.delete(item)
        
        # Add new items
        for item in items_data:
            db_item = ClothDeliveryItem(delivery_id=db_delivery.id, **item)
            db.add(db_item)

    await db.commit()

    # Reload
    result = await db.execute(
        select(ClothDelivery)
        .options(selectinload(ClothDelivery.items))
        .where(ClothDelivery.id == db_delivery.id)
    )
    return result.scalar_one()

@router.delete("/{delivery_id}", status_code=204)
async def delete_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ClothDelivery).where(ClothDelivery.id == delivery_id))
    db_delivery = result.scalar_one_or_none()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Cloth delivery not found")

    await db.delete(db_delivery)
    await db.commit()
    return None
