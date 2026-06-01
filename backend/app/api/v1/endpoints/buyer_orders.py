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

class ScheduleCreate(BaseModel):
    order_id_ref: Optional[str] = None
    buyer_ref: Optional[str] = None
    shipment_date: Optional[date] = None
    delivery_place: Optional[str] = None
    delivery_terms: Optional[str] = None
    qty: Optional[str] = None
    fabric_type: Optional[str] = None
    shade: Optional[str] = None
    lot_no: Optional[str] = None
    packing_type: Optional[str] = None
    transporter_name: Optional[str] = None
    transport_mode: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = "Scheduled"

class ScheduleOut(ScheduleCreate):
    id: int
    schedule_id: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

from app.models.buyer_order import BuyerOrderSchedule

@router.get("/schedules/", response_model=List[ScheduleOut])
async def list_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderSchedule).order_by(BuyerOrderSchedule.id.desc()))
    return result.scalars().all()

@router.post("/schedules/", response_model=ScheduleOut, status_code=201)
async def create_schedule(data: ScheduleCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrderSchedule.id)))
    max_id = max_id_q.scalar() or 0
    sch_id = f"SCH-{max_id + 1:03d}"
    
    sch_dict = data.model_dump()
    schedule = BuyerOrderSchedule(**sch_dict, schedule_id=sch_id)
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule

@router.delete("/schedules/{sch_id}", status_code=204)
async def delete_schedule(sch_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderSchedule).where(BuyerOrderSchedule.id == sch_id))
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    await db.delete(schedule)
    await db.commit()
    return None

class SequenceCreate(BaseModel):
    prefix: Optional[str] = "IBPO"
    fin_year: Optional[str] = "2026-27"
    running_no: Optional[int] = 1
    buyer_name: Optional[str] = None
    party_name: Optional[str] = None
    order_type: Optional[str] = None
    category: Optional[str] = None
    buyer_ref: Optional[str] = None
    generated_order_no: Optional[str] = None
    created_by: Optional[str] = "Administrator"

class SequenceOut(SequenceCreate):
    id: int
    sequence_id: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

from app.models.buyer_order import BuyerOrderSequence

@router.get("/sequences/", response_model=List[SequenceOut])
async def list_sequences(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderSequence).order_by(BuyerOrderSequence.id.desc()))
    return result.scalars().all()

@router.post("/sequences/", response_model=SequenceOut, status_code=201)
async def create_sequence(data: SequenceCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrderSequence.id)))
    max_id = max_id_q.scalar() or 0
    seq_id = f"SEQ-{max_id + 1:04d}"
    
    seq_dict = data.model_dump()
    sequence = BuyerOrderSequence(**seq_dict, sequence_id=seq_id)
    db.add(sequence)
    await db.commit()
    await db.refresh(sequence)
    return sequence

@router.delete("/sequences/{seq_id}", status_code=204)
async def delete_sequence(seq_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderSequence).where(BuyerOrderSequence.id == seq_id))
    sequence = result.scalar_one_or_none()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    await db.delete(sequence)
    await db.commit()
    return None

class AmendmentCreate(BaseModel):
    order_id_ref: Optional[str] = None
    amd_date: Optional[date] = None
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    remarks: Optional[str] = None
    approved_by: Optional[str] = None
    effective_date: Optional[date] = None
    buyer_ref: Optional[str] = None
    fabric_details: Optional[str] = None
    shade: Optional[str] = None

class AmendmentOut(AmendmentCreate):
    id: int
    amendment_id: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

from app.models.buyer_order import BuyerOrderAmendment

@router.get("/amendments/", response_model=List[AmendmentOut])
async def list_amendments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderAmendment).order_by(BuyerOrderAmendment.id.desc()))
    return result.scalars().all()

@router.post("/amendments/", response_model=AmendmentOut, status_code=201)
async def create_amendment(data: AmendmentCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrderAmendment.id)))
    max_id = max_id_q.scalar() or 0
    amd_id = f"AMD-{max_id + 1:04d}"
    
    amd_dict = data.model_dump()
    amendment = BuyerOrderAmendment(**amd_dict, amendment_id=amd_id)
    db.add(amendment)
    await db.commit()
    await db.refresh(amendment)
    return amendment

@router.delete("/amendments/{amd_id}", status_code=204)
async def delete_amendment(amd_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderAmendment).where(BuyerOrderAmendment.id == amd_id))
    amd = result.scalar_one_or_none()
    if not amd:
        raise HTTPException(status_code=404, detail="Amendment not found")
    await db.delete(amd)
    await db.commit()
    return None

class CompletionCreate(BaseModel):
    order_id_ref: Optional[str] = None
    completion_date: Optional[date] = None
    status: Optional[str] = "Closed"
    final_dispatch_qty: Optional[str] = None
    balance_qty: Optional[str] = None
    fabric_type: Optional[str] = None
    shade: Optional[str] = None
    lot_no: Optional[str] = None
    packing_type: Optional[str] = None
    delivery_place: Optional[str] = None
    transporter_name: Optional[str] = None
    buyer_ref: Optional[str] = None
    remarks: Optional[str] = None

class CompletionOut(CompletionCreate):
    id: int
    cmp_id: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

from app.models.buyer_order import BuyerOrderCompletion

@router.get("/completions/", response_model=List[CompletionOut])
async def list_completions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderCompletion).order_by(BuyerOrderCompletion.id.desc()))
    return result.scalars().all()

@router.post("/completions/", response_model=CompletionOut, status_code=201)
async def create_completion(data: CompletionCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrderCompletion.id)))
    max_id = max_id_q.scalar() or 0
    cmp_id = f"CMP-{max_id + 1:03d}"
    
    cmp_dict = data.model_dump()
    completion = BuyerOrderCompletion(**cmp_dict, cmp_id=cmp_id)
    db.add(completion)
    await db.commit()
    await db.refresh(completion)
    return completion

@router.delete("/completions/{cmp_id}", status_code=204)
async def delete_completion(cmp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderCompletion).where(BuyerOrderCompletion.id == cmp_id))
    completion = result.scalar_one_or_none()
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    await db.delete(completion)
    await db.commit()
    return None

from decimal import Decimal
from app.models.buyer_order import BuyerOrderDispatch, BuyerOrderExpense

class DispatchCreate(BaseModel):
    order_id_ref: Optional[str] = None
    transporter_name: Optional[str] = None
    lr_no: Optional[str] = None
    vehicle_no: Optional[str] = None
    delivery_place: Optional[str] = None
    packing_type: Optional[str] = None
    dispatch_date: Optional[date] = None
    shade: Optional[str] = None
    lot_no: Optional[str] = None
    quantity: Optional[str] = None
    remarks: Optional[str] = None

class DispatchOut(DispatchCreate):
    id: int
    indent_id: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    order_id_ref: Optional[str] = None
    expense_type: Optional[str] = None
    amount: Optional[Decimal] = None
    currency: Optional[str] = "INR"
    payment_mode: Optional[str] = None
    vendor_name: Optional[str] = None
    invoice_ref: Optional[str] = None
    remarks: Optional[str] = None

class ExpenseOut(ExpenseCreate):
    id: int
    expense_id: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

@router.get("/dispatches/", response_model=List[DispatchOut])
async def list_dispatches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderDispatch).order_by(BuyerOrderDispatch.id.desc()))
    return result.scalars().all()

@router.post("/dispatches/", response_model=DispatchOut, status_code=201)
async def create_dispatch(data: DispatchCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrderDispatch.id)))
    max_id = max_id_q.scalar() or 0
    indent_id = f"IND-{max_id + 1:04d}"
    
    dispatch = BuyerOrderDispatch(**data.model_dump(), indent_id=indent_id)
    db.add(dispatch)
    await db.commit()
    await db.refresh(dispatch)
    return dispatch

@router.delete("/dispatches/{dispatch_id}", status_code=204)
async def delete_dispatch(dispatch_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderDispatch).where(BuyerOrderDispatch.id == dispatch_id))
    dispatch = result.scalar_one_or_none()
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    await db.delete(dispatch)
    await db.commit()
    return None


@router.get("/expenses/", response_model=List[ExpenseOut])
async def list_expenses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderExpense).order_by(BuyerOrderExpense.id.desc()))
    return result.scalars().all()

@router.post("/expenses/", response_model=ExpenseOut, status_code=201)
async def create_expense(data: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrderExpense.id)))
    max_id = max_id_q.scalar() or 0
    expense_id = f"EXP-{max_id + 1:04d}"
    
    expense = BuyerOrderExpense(**data.model_dump(), expense_id=expense_id)
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense

@router.delete("/expenses/{expense_id}", status_code=204)
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderExpense).where(BuyerOrderExpense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
    await db.commit()
    return None

@router.get("/", response_model=List[OrderOut])
async def list_orders(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(BuyerOrder).options(selectinload(BuyerOrder.items)).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrder.id)))
    max_id = max_id_q.scalar() or 0
    ibpo = f"IBPO-{max_id + 1:05d}"

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
