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
    delivery_count: Optional[float] = 0
    received_count: Optional[float] = 0
    our_lot_no: Optional[str] = None
    color: Optional[str] = None
    taken_kgs: Optional[float] = 0
    dyed_lot_no: Optional[str] = None
    bags: Optional[float] = 0
    cones: Optional[float] = 0
    rcvd_kgs: Optional[float] = 0
    short_kgs: Optional[float] = 0
    short_pct: Optional[float] = 0

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
    remarks: Optional[str] = None
    status: Optional[str] = "Received"
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
        remarks=receipt_in.remarks,
        status=receipt_in.status
    )
    
    if not db_receipt.inv_no:
        q = select(DyedYarnReceived).order_by(desc(DyedYarnReceived.id))
        result = await db.execute(q)
        last_receipt = result.scalars().first()
        new_id = (last_receipt.id + 1) if last_receipt else 1
        db_receipt.inv_no = f"DYR-{new_id:05d}"

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
