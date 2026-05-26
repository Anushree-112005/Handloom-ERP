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
    point_of_contact: Optional[str] = None
    order_mtrs: Optional[float] = 0
    uom: Optional[str] = "MTR"
    tolerance_pct: Optional[float] = 0
    total_mtr_yard: Optional[float] = 0
    hsn_code: Optional[str] = None
    sample_mtr: Optional[float] = 0
    buyer_style: Optional[str] = None
    short_no: Optional[str] = None
    design_no: Optional[str] = None
    gry_construction: Optional[str] = None
    fabric_type: Optional[str] = None
    color: Optional[str] = None
    construction: Optional[str] = None
    weaving_type: Optional[str] = None
    pick_on_table: Optional[int] = 0
    print_name: Optional[str] = None
    finish_reed: Optional[int] = 0
    finish_pick: Optional[int] = 0
    finish_width: Optional[float] = 0
    cuttable_width: Optional[float] = 0
    pattern: Optional[str] = None
    packing_type: Optional[str] = None
    loom_type: Optional[str] = None
    insurance: Optional[str] = None
    packing_charge: Optional[float] = 0
    end_use: Optional[str] = None
    season: Optional[str] = None
    party_comment: Optional[str] = None
    fabric_content: Optional[str] = None
    development_id: Optional[str] = None
    country: Optional[str] = None
    combo: Optional[str] = None
    currency: Optional[str] = None
    pc_type: Optional[str] = None
    gsm: Optional[float] = 0
    price: Optional[float] = 0
    gst_pct: Optional[float] = 0
    gst_rate: Optional[float] = 0
    rate: Optional[float] = 0
    amount: Optional[float] = 0
    image_design_path: Optional[str] = None
    party_terms: Optional[str] = None

class OrderCreate(BaseModel):
    order_date: date
    party_name: Optional[str] = None
    party_id: Optional[int] = None
    agent_name: Optional[str] = None
    order_type: Optional[str] = None
    certified_type: Optional[str] = None
    buyer_name: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    gst_no: Optional[str] = None
    pan_no: Optional[str] = None
    commission_type: Optional[str] = None
    commission_pct: Optional[float] = 0
    order_taken_by: Optional[str] = None
    nomination_type: Optional[str] = None
    regular_special: Optional[str] = None
    
    # Payment Details
    outstanding: Optional[float] = 0
    overdue: Optional[float] = 0
    due_30_days: Optional[float] = 0
    status: Optional[str] = "Active"
    status_remark: Optional[str] = None
    max_crd_days: Optional[int] = 0
    po_credit: Optional[int] = 0
    po_max_crd: Optional[int] = 0
    bill_credit: Optional[int] = 0
    payment_detail: Optional[str] = None
    payment_terms: Optional[str] = None
    payment_file_path: Optional[str] = None

    # Transport & Delivery
    transport_mode: Optional[str] = None
    transport_name: Optional[str] = None
    party_terms: Optional[str] = None
    lr_type: Optional[str] = None
    lr_terms: Optional[str] = None
    party_comp_date: Optional[date] = None
    exfactory_date: Optional[date] = None
    delivery_starting: Optional[date] = None
    delivery_at: Optional[str] = None
    desp_mtr_min: Optional[float] = 0
    desp_mtr_max: Optional[float] = 0
    delivery_place: Optional[str] = None

    # Process Follow & Instructions
    process_sequence: Optional[str] = None
    process_instruction: Optional[str] = None
    email_to: Optional[str] = None
    email_cc: Optional[str] = None
    yarn_instruction: Optional[str] = None
    prod_instruction: Optional[str] = None
    delivery_instruction: Optional[str] = None
    remarks: Optional[str] = None
    
    items: Optional[List[OrderItemIn]] = []


class OrderItemOut(OrderItemIn):
    id: int
    class Config:
        from_attributes = True


class OrderOut(OrderCreate):
    id: int
    ibpo_number: str
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


@router.put("/{order_id}", response_model=OrderOut)
async def update_order(order_id: int, data: OrderCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrder).options(selectinload(BuyerOrder.items)).where(BuyerOrder.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    
    for key, value in order_dict.items():
        setattr(order, key, value)
        
    # Naive nested update: delete existing items and add new ones
    # In a production system, you might want to update items selectively by ID
    for item in order.items:
        await db.delete(item)
    order.items = []
    
    for item_data in items_data:
        order.items.append(BuyerOrderItem(**item_data.model_dump()))

    await db.commit()
    await db.refresh(order)
    
    result = await db.execute(
        select(BuyerOrder).options(selectinload(BuyerOrder.items)).where(BuyerOrder.id == order_id)
    )
    return result.scalar_one()


@router.delete("/{order_id}", status_code=204)
async def delete_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrder).where(BuyerOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.delete(order)
    await db.commit()
    return None
