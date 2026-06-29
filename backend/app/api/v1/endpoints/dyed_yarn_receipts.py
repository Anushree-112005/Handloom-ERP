from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime
from app.core.database import get_db
from app.models.dyed_yarn import DyedYarnReceived, DyedYarnReceivedItem

router = APIRouter(prefix="/dyed-yarn-receipts", tags=["Dyed Yarn Receipts"])

class DyedYarnReceivedItemBase(BaseModel):
    cone_type: Optional[str] = None
    yarn_count: Optional[str] = None
    shade_no: Optional[str] = None
    our_lot_no: Optional[str] = None
    color: Optional[str] = None
    taken_kgs: Optional[float] = 0
    dyed_lot_no: Optional[str] = None
    bags: Optional[float] = 0
    cones: Optional[float] = 0
    rcvd_kgs: Optional[float] = 0
    short_kgs: Optional[float] = 0
    short_pct: Optional[float] = 0
    remarks: Optional[str] = None
    yarn_type: Optional[str] = None
    ply: Optional[str] = None
    batch_no: Optional[str] = None
    gross_weight: Optional[float] = 0
    tare_weight: Optional[float] = 0
    net_weight: Optional[float] = 0
    excess_qty: Optional[float] = 0
    accepted_qty: Optional[float] = 0
    rejected_qty: Optional[float] = 0
    qc_remarks: Optional[str] = None

class DyedYarnReceivedCreate(BaseModel):
    inv_no: Optional[str] = None
    inv_date: Optional[date] = None
    received_type: Optional[str] = None
    receive_mode: Optional[str] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    design_count: Optional[str] = None
    order_no: Optional[str] = None
    our_dc_no: Optional[str] = None
    party_dc_no: Optional[str] = None
    dc_date: Optional[date] = None
    vehicle_no: Optional[str] = None
    transport: Optional[str] = None
    driver_name: Optional[str] = None
    lr_no: Optional[str] = None
    received_by: Optional[str] = None
    received_time: Optional[str] = None
    godown: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = "Received"
    receipt_no: Optional[str] = None
    receipt_date: Optional[date] = None
    yarn_dyeing_po_no: Optional[str] = None
    yarn_dyeing_delivery_no: Optional[str] = None
    processor_name: Optional[str] = None
    buyer_name: Optional[str] = None
    party_invoice_no: Optional[str] = None
    driver_mobile: Optional[str] = None
    checked_by: Optional[str] = None
    qc_status: Optional[str] = "Pending"
    receipt_status: Optional[str] = "Pending"
    total_taken_qty: Optional[float] = 0
    total_received_qty: Optional[float] = 0
    total_short_qty: Optional[float] = 0
    total_excess_qty: Optional[float] = 0
    total_bags: Optional[float] = 0
    total_cones: Optional[float] = 0
    total_gross_weight: Optional[float] = 0
    total_net_weight: Optional[float] = 0
    items: List[DyedYarnReceivedItemBase] = []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_dyed_yarn_receipt(receipt_in: DyedYarnReceivedCreate, db: AsyncSession = Depends(get_db)):
    db_receipt = DyedYarnReceived(
        inv_no=receipt_in.inv_no,
        inv_date=receipt_in.inv_date,
        received_type=receipt_in.received_type,
        receive_mode=receipt_in.receive_mode,
        party_name=receipt_in.party_name,
        design_no=receipt_in.design_no,
        design_count=receipt_in.design_count,
        order_no=receipt_in.order_no,
        our_dc_no=receipt_in.our_dc_no,
        party_dc_no=receipt_in.party_dc_no,
        dc_date=receipt_in.dc_date,
        vehicle_no=receipt_in.vehicle_no,
        transport=receipt_in.transport,
        driver_name=receipt_in.driver_name,
        lr_no=receipt_in.lr_no,
        received_by=receipt_in.received_by,
        received_time=receipt_in.received_time,
        godown=receipt_in.godown,
        remarks=receipt_in.remarks,
        status=receipt_in.status,
        receipt_no=receipt_in.receipt_no,
        receipt_date=receipt_in.receipt_date,
        yarn_dyeing_po_no=receipt_in.yarn_dyeing_po_no,
        yarn_dyeing_delivery_no=receipt_in.yarn_dyeing_delivery_no,
        processor_name=receipt_in.processor_name,
        buyer_name=receipt_in.buyer_name,
        party_invoice_no=receipt_in.party_invoice_no,
        driver_mobile=receipt_in.driver_mobile,
        checked_by=receipt_in.checked_by,
        qc_status=receipt_in.qc_status,
        receipt_status=receipt_in.receipt_status,
        total_taken_qty=receipt_in.total_taken_qty,
        total_received_qty=receipt_in.total_received_qty,
        total_short_qty=receipt_in.total_short_qty,
        total_excess_qty=receipt_in.total_excess_qty,
        total_bags=receipt_in.total_bags,
        total_cones=receipt_in.total_cones,
        total_gross_weight=receipt_in.total_gross_weight,
        total_net_weight=receipt_in.total_net_weight
    )
    
    if not db_receipt.receipt_no:
        q = select(DyedYarnReceived).order_by(desc(DyedYarnReceived.id))
        result = await db.execute(q)
        last_receipt = result.scalars().first()
        new_id = (last_receipt.id + 1) if last_receipt else 1
        db_receipt.receipt_no = f"DYR-{new_id:05d}"
        if not db_receipt.inv_no:
            db_receipt.inv_no = db_receipt.receipt_no

    db.add(db_receipt)
    await db.commit()
    await db.refresh(db_receipt)

    for item_in in receipt_in.items:
        db_item = DyedYarnReceivedItem(
            receipt_id=db_receipt.id,
            **item_in.dict()
        )
        db.add(db_item)
    
    await db.commit()
    return {"id": db_receipt.id, "message": "Dyed Yarn Receipt created successfully"}

@router.get("")
async def list_dyed_yarn_receipts(db: AsyncSession = Depends(get_db)):
    try:
        q = select(DyedYarnReceived).options(selectinload(DyedYarnReceived.items)).order_by(desc(DyedYarnReceived.id))
        result = await db.execute(q)
        receipts = result.scalars().all()
        
        output = []
        for r in receipts:
            output.append({
                "id": r.id,
                "inv_no": r.inv_no,
                "inv_date": r.inv_date,
                "party_name": r.party_name,
                "received_type": r.received_type,
                "status": r.status,
                "items": [{"color": i.color, "rcvd_kgs": float(i.rcvd_kgs) if i.rcvd_kgs else 0.0} for i in r.items]
            })
        return output
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{receipt_id}")
async def get_dyed_yarn_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnReceived).options(selectinload(DyedYarnReceived.items)).where(DyedYarnReceived.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Dyed Yarn Receipt not found")
    
    output = {c.name: getattr(db_receipt, c.name) for c in db_receipt.__table__.columns}
    output["items"] = []
    for item in db_receipt.items:
        output["items"].append({c.name: float(getattr(item, c.name)) if hasattr(getattr(item, c.name), 'normalize') else getattr(item, c.name) for c in item.__table__.columns})
        
    return output

@router.put("/{receipt_id}")
async def update_dyed_yarn_receipt(receipt_id: int, receipt_in: DyedYarnReceivedCreate, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnReceived).options(selectinload(DyedYarnReceived.items)).where(DyedYarnReceived.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Dyed Yarn Receipt not found")

    update_data = receipt_in.dict(exclude_unset=True, exclude={"items"})
    for key, value in update_data.items():
        setattr(db_receipt, key, value)
        
    for item in db_receipt.items:
        await db.delete(item)
    
    for item_in in receipt_in.items:
        db_item = DyedYarnReceivedItem(
            receipt_id=db_receipt.id,
            **item_in.dict()
        )
        db.add(db_item)
        
    await db.commit()
    return {"message": "Dyed Yarn Receipt updated successfully"}

@router.delete("/{receipt_id}")
async def delete_dyed_yarn_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnReceived).where(DyedYarnReceived.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Dyed Yarn Receipt not found")
        
    await db.delete(db_receipt)
    await db.commit()
    return {"message": "Dyed Yarn Receipt deleted successfully"}
