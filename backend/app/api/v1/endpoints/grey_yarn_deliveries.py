"""Grey Yarn Delivery CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.core.database import get_db
from app.models.grey_yarn_delivery import GreyYarnDelivery, GreyYarnDeliveryItem

router = APIRouter(prefix="/grey-yarn-deliveries", tags=["Grey Yarn Deliveries"])

class GreyYarnDeliveryItemIn(BaseModel):
    cone_type: Optional[str] = None
    count: Optional[str] = None
    our_lot_no: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[float] = 0.0
    bags: Optional[int] = 0
    cones: Optional[int] = 0
    total_kgs: Optional[float] = 0.0
    rate: Optional[float] = 0.0
    amount: Optional[float] = 0.0

class GreyYarnDeliveryCreate(BaseModel):
    dc_date: date
    ref_date: Optional[date] = None
    stock_godown: Optional[str] = None
    delivery_type: Optional[str] = None
    party_name: Optional[str] = None
    delivery_mode: Optional[str] = None
    delivery_address: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    transport: Optional[str] = None
    vehicle_no: Optional[str] = None
    delivery_name: Optional[str] = None
    delivery_time: Optional[str] = None
    certificate_type: Optional[str] = None
    design_count: Optional[str] = None
    
    order_kgs: Optional[float] = 0.0
    total_dely_kgs: Optional[float] = 0.0
    total_rtn_kgs: Optional[float] = 0.0
    balance_kgs: Optional[float] = 0.0
    
    status: Optional[str] = "Delivered"
    items: Optional[List[GreyYarnDeliveryItemIn]] = []

class GreyYarnDeliveryItemOut(GreyYarnDeliveryItemIn):
    id: int
    class Config:
        from_attributes = True

class GreyYarnDeliveryOut(GreyYarnDeliveryCreate):
    id: int
    dc_no: str
    items: List[GreyYarnDeliveryItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[GreyYarnDeliveryOut])
async def list_deliveries(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(GreyYarnDelivery).options(selectinload(GreyYarnDelivery.items)).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=GreyYarnDeliveryOut, status_code=201)
async def create_delivery(data: GreyYarnDeliveryCreate, db: AsyncSession = Depends(get_db)):
    count_r = await db.execute(select(func.count(GreyYarnDelivery.id)))
    count = count_r.scalar() or 0
    dc_no = f"GYD-{count + 1:05d}"

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    order = GreyYarnDelivery(**order_dict, dc_no=dc_no)

    for item in items_data:
        order.items.append(GreyYarnDeliveryItem(**item.model_dump()))

    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    result = await db.execute(
        select(GreyYarnDelivery).options(selectinload(GreyYarnDelivery.items)).where(GreyYarnDelivery.id == order.id)
    )
    return result.scalar_one()


@router.get("/{delivery_id}", response_model=GreyYarnDeliveryOut)
async def get_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GreyYarnDelivery).options(selectinload(GreyYarnDelivery.items)).where(GreyYarnDelivery.id == delivery_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return order


@router.put("/{delivery_id}", response_model=GreyYarnDeliveryOut)
async def update_delivery(delivery_id: int, data: GreyYarnDeliveryCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GreyYarnDelivery).options(selectinload(GreyYarnDelivery.items)).where(GreyYarnDelivery.id == delivery_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Delivery not found")

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    
    for key, value in order_dict.items():
        setattr(order, key, value)
        
    for item in order.items:
        await db.delete(item)
    order.items = []
    
    for item in items_data:
        order.items.append(GreyYarnDeliveryItem(**item.model_dump()))

    await db.commit()
    await db.refresh(order)
    
    result = await db.execute(
        select(GreyYarnDelivery).options(selectinload(GreyYarnDelivery.items)).where(GreyYarnDelivery.id == delivery_id)
    )
    return result.scalar_one()


@router.delete("/{delivery_id}", status_code=204)
async def delete_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GreyYarnDelivery).where(GreyYarnDelivery.id == delivery_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Delivery not found")
        
    await db.delete(order)
    await db.commit()
    return None
