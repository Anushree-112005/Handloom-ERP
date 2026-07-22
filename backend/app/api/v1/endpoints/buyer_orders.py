"""Buyer Order CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import os
import uuid

from app.core.database import get_db
from app.models.buyer_order import BuyerOrder, BuyerOrderItem
from app.api.v1.endpoints.auth import get_current_user
from app.core.authorization import require_permission
from app.models.employee import Employee
from app.models.production_status import ProductionStatus, ProductionStatusHistory

router = APIRouter(prefix="/buyer-orders", tags=["Buyer Orders"])


@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..", "uploads", "buyer_orders")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename_str = file.filename or "file.png"
    ext = os.path.splitext(filename_str)[1] or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"file_path": f"/uploads/buyer_orders/{filename}"}



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
    merchandiser: Optional[str] = None
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


class SequenceCreate(BaseModel):
    order_id_ref: Optional[str] = None
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
    seq_id = f"SEQ-{max_id + 1:05d}"
    
    seq_dict = data.model_dump()
    sequence = BuyerOrderSequence(**seq_dict, sequence_id=seq_id)
    db.add(sequence)
    await db.commit()
    await db.refresh(sequence)
    return sequence

@router.put("/sequences/{seq_id}", response_model=SequenceOut)
async def update_sequence(seq_id: int, data: SequenceCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderSequence).where(BuyerOrderSequence.id == seq_id))
    sequence = result.scalar_one_or_none()
    if not sequence:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    seq_dict = data.model_dump()
    for key, value in seq_dict.items():
        setattr(sequence, key, value)
        
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


from decimal import Decimal
from app.models.buyer_order import BuyerOrderDispatch

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



@router.get("/dispatches/", response_model=List[DispatchOut])
async def list_dispatches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderDispatch).order_by(BuyerOrderDispatch.id.desc()))
    return result.scalars().all()

@router.post("/dispatches/", response_model=DispatchOut, status_code=201)
async def create_dispatch(data: DispatchCreate, db: AsyncSession = Depends(get_db)):
    max_id_q = await db.execute(select(func.max(BuyerOrderDispatch.id)))
    max_id = max_id_q.scalar() or 0
    indent_id = f"IND-{max_id + 1:05d}"
    
    dispatch = BuyerOrderDispatch(**data.model_dump(), indent_id=indent_id)
    db.add(dispatch)
    await db.commit()
    await db.refresh(dispatch)
    return dispatch

@router.put("/dispatches/{dispatch_id}", response_model=DispatchOut)
async def update_dispatch(dispatch_id: int, data: DispatchCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderDispatch).where(BuyerOrderDispatch.id == dispatch_id))
    dispatch = result.scalar_one_or_none()
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    
    for key, value in data.model_dump().items():
        setattr(dispatch, key, value)
        
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


@router.get("/", response_model=List[OrderOut])
async def list_orders(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    q = select(BuyerOrder).options(selectinload(BuyerOrder.items)).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/status-update/orders", response_model=List[OrderOut])
async def list_status_update_orders(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_permission("status_update", "View"))
):
    q = (
        select(BuyerOrder)
        .options(selectinload(BuyerOrder.items))
        .order_by(BuyerOrder.id.desc())
    )
    
    if current_user.user_type not in ["Super Admin", "Admin", "Module Manager"]:
        q = q.where(BuyerOrder.merchandiser == current_user.name)
        
    q = q.offset(skip).limit(limit)
    
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(data: OrderCreate, db: AsyncSession = Depends(get_db)):
    # Fetch all existing ibpo_numbers to calculate the next sequential number
    res = await db.execute(select(BuyerOrder.ibpo_number))
    ibpo_list = res.scalars().all()
    max_num = 0
    for val in ibpo_list:
        if val and val.startswith("IBPO-"):
            try:
                num = int(val.split("-")[1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                pass
    ibpo = f"IBPO-{max_num + 1:05d}"

    items_data = data.items or []
    order_dict = data.model_dump(exclude={"items"})
    order = BuyerOrder(**order_dict, ibpo_number=ibpo)

    for item_data in items_data:
        order.items.append(BuyerOrderItem(**item_data.model_dump()))

    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    # Notification logic
    from app.models.notification import Notification
    if order.order_type == "Domestic":
        notif = Notification(user_role="Design Team", message=f"New Order Domestic — Design Required for {ibpo}", related_ibpo=ibpo)
        db.add(notif)
    elif order.order_type == "Export":
        notif1 = Notification(user_role="Design Team", message=f"New Order Export — Design Required for {ibpo}", related_ibpo=ibpo)
        notif2 = Notification(user_role="Export Documentation Staff", message=f"New Export Order received for {ibpo}", related_ibpo=ibpo)
        db.add_all([notif1, notif2])
    
    await db.commit()

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


class ProductionStatusUpdate(BaseModel):
    stage_name: str
    status: str
    completed_qty: int = 0
    remarks: Optional[str] = None
    attachment: Optional[str] = None


@router.get("/{order_id}/status")
async def get_order_status(
    order_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_permission("status_update", "View"))
):
    result = await db.execute(
        select(ProductionStatus).where(ProductionStatus.buyer_order_id == order_id)
    )
    statuses = result.scalars().all()
    
    history_result = await db.execute(
        select(ProductionStatusHistory)
        .where(ProductionStatusHistory.buyer_order_id == order_id)
        .order_by(ProductionStatusHistory.id.desc())
    )
    history = history_result.scalars().all()
    
    return {
        "statuses": [
            {
                "id": s.id,
                "stage_name": s.stage_name,
                "status": s.status,
                "completed_qty": s.completed_qty,
                "pending_qty": s.pending_qty,
                "remarks": s.remarks,
                "attachment": s.attachment,
                "updated_by": s.updated_by,
                "updated_at": s.updated_at
            } for s in statuses
        ],
        "history": [
            {
                "id": h.id,
                "stage_name": h.stage_name,
                "prev_status": h.prev_status,
                "new_status": h.new_status,
                "remarks": h.remarks,
                "updated_by": h.updated_by,
                "updated_at": h.updated_at
            } for h in history
        ]
    }


@router.post("/{order_id}/status")
async def update_order_status(
    order_id: int, 
    data: ProductionStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_permission("status_update", "Edit"))
):
    # 1. Access Control Check
    result = await db.execute(select(BuyerOrder).options(selectinload(BuyerOrder.items)).where(BuyerOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if current_user.user_type not in ["Super Admin", "Admin", "Module Manager"]:
        if order.merchandiser != current_user.name:
            raise HTTPException(status_code=403, detail="Forbidden: You are not authorized to update this order's status.")
            
    # 2. Update logic
    status_res = await db.execute(
        select(ProductionStatus).where(
            ProductionStatus.buyer_order_id == order_id, 
            ProductionStatus.stage_name == data.stage_name
        )
    )
    st = status_res.scalar_one_or_none()
    
    prev_status = st.status if st else "Not Started"
    
    total_qty = sum(item.order_mtrs or 0 for item in order.items)
    pending = total_qty - data.completed_qty
    if pending < 0: pending = 0
    
    if not st:
        st = ProductionStatus(
            buyer_order_id=order_id,
            stage_name=data.stage_name,
            status=data.status,
            completed_qty=data.completed_qty,
            pending_qty=pending,
            remarks=data.remarks,
            attachment=data.attachment,
            updated_by=current_user.name
        )
        db.add(st)
    else:
        st.status = data.status
        st.completed_qty = data.completed_qty
        st.pending_qty = pending
        st.remarks = data.remarks
        st.attachment = data.attachment
        st.updated_by = current_user.name
        
    # 3. Add History log
    hist = ProductionStatusHistory(
        buyer_order_id=order_id,
        stage_name=data.stage_name,
        prev_status=prev_status,
        new_status=data.status,
        remarks=data.remarks,
        updated_by=current_user.name
    )
    db.add(hist)
    
    await db.commit()
    
    return {"message": "Stage updated successfully"}
