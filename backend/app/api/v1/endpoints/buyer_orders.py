"""Buyer Order CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.core.database import get_db
from app.models.buyer_order import BuyerOrder, BuyerOrderItem

router = APIRouter(prefix="/buyer-orders", tags=["Buyer Orders"])


class OrderItemIn(BaseModel):
    party_po_no: Optional[str] = None
    po_date: Optional[date] = None
    design_no: Optional[str] = None
    fabric_type: Optional[str] = None
    color: Optional[str] = None
    order_mtrs: Optional[float] = 0
    tolerance_pct: Optional[float] = 0
    uom: Optional[str] = "MTR"
    hsn_code: Optional[str] = None
    rate: Optional[float] = 0
    amount: Optional[float] = 0
    buyer_style: Optional[str] = None


class OrderCreate(BaseModel):
    order_date: date
    party_name: Optional[str] = None
    party_id: Optional[int] = None
    agent_name: Optional[str] = None
    order_type: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    gst_no: Optional[str] = None
    payment_terms: Optional[str] = None
    transport_mode: Optional[str] = None
    transport_name: Optional[str] = None
    delivery_place: Optional[str] = None
    remarks: Optional[str] = None
    items: Optional[List[OrderItemIn]] = []


class OrderItemOut(OrderItemIn):
    id: int
    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    ibpo_number: str
    order_date: date
    party_name: Optional[str] = None
    order_type: Optional[str] = None
    status: str
    items: List[OrderItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[OrderOut])
async def list_orders(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(BuyerOrder).options(selectinload(BuyerOrder.items)).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    count_r = await db.execute(select(func.count(BuyerOrder.id)))
    count = count_r.scalar() or 0
    ibpo = f"IBPO-{count + 1:05d}"

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    order = BuyerOrder(**order_dict, ibpo_number=ibpo)

    for item_data in items_data:
        order.items.append(BuyerOrderItem(**item_data.model_dump()))

    db.add(order)
    await db.commit()
    await db.refresh(order)
    # Reload with items
    result = await db.execute(
        select(BuyerOrder).options(selectinload(BuyerOrder.items)).where(BuyerOrder.id == order.id)
    )
    return result.scalar_one()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrder).options(selectinload(BuyerOrder.items)).where(BuyerOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
