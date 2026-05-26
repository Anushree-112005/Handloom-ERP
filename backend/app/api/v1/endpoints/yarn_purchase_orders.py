"""Yarn Purchase Order CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.core.database import get_db
from app.models.yarn_purchase import YarnPurchaseOrder, YarnPurchaseItem

router = APIRouter(prefix="/yarn-purchase-orders", tags=["Yarn Purchase Orders"])

class YarnPurchaseItemIn(BaseModel):
    yarn_type: Optional[str] = None
    count: Optional[str] = None
    color: Optional[str] = None
    lot_no: Optional[str] = None
    bags: Optional[int] = 0
    cones: Optional[int] = 0
    total_kgs: Optional[float] = 0
    rate: Optional[float] = 0
    amount: Optional[float] = 0

class YarnPurchaseOrderCreate(BaseModel):
    po_date: date
    party_name: Optional[str] = None
    party_id: Optional[int] = None
    order_type: Optional[str] = None
    design_no: Optional[str] = None
    delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    remarks: Optional[str] = None
    total_amount: Optional[float] = 0
    sgst: Optional[float] = 0
    cgst: Optional[float] = 0
    igst: Optional[float] = 0
    net_amount: Optional[float] = 0
    items: Optional[List[YarnPurchaseItemIn]] = []

class YarnPurchaseItemOut(YarnPurchaseItemIn):
    id: int
    class Config:
        from_attributes = True

class YarnPurchaseOrderOut(BaseModel):
    id: int
    po_number: str
    po_date: date
    party_name: Optional[str] = None
    order_type: Optional[str] = None
    status: str
    net_amount: float
    items: List[YarnPurchaseItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[YarnPurchaseOrderOut])
async def list_orders(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(YarnPurchaseOrder).options(selectinload(YarnPurchaseOrder.items)).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=YarnPurchaseOrderOut, status_code=201)
async def create_order(data: YarnPurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    count_r = await db.execute(select(func.count(YarnPurchaseOrder.id)))
    count = count_r.scalar() or 0
    po_no = f"YPO-{count + 1:05d}"

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    order = YarnPurchaseOrder(**order_dict, po_number=po_no)

    for item_data in items_data:
        order.items.append(YarnPurchaseItem(**item_data.model_dump()))

    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    result = await db.execute(
        select(YarnPurchaseOrder).options(selectinload(YarnPurchaseOrder.items)).where(YarnPurchaseOrder.id == order.id)
    )
    return result.scalar_one()

@router.get("/{order_id}", response_model=YarnPurchaseOrderOut)
async def get_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnPurchaseOrder).options(selectinload(YarnPurchaseOrder.items)).where(YarnPurchaseOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
