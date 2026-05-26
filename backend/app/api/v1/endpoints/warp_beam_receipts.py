from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.models.warp import WarpBeamReceipt, WarpBeamDetail

router = APIRouter(prefix="/warp-beam-receipts", tags=["Warp Beam Receipts"])

class WarpBeamDetailBase(BaseModel):
    beam_no: Optional[str] = None
    warp_mtrs: Optional[float] = 0
    beam_type: Optional[str] = None
    delivery_to_weaver: Optional[str] = None
    order_no: Optional[str] = None
    dc_no: Optional[str] = None
    dc_date: Optional[date] = None
    loom_no: Optional[str] = None
    loading_date: Optional[date] = None
    total_meters: Optional[float] = 0

class WarpBeamReceiptCreate(BaseModel):
    ref_no: Optional[str] = None
    rcvd_date: Optional[date] = None
    rcvd_type: Optional[str] = None
    beam_type: Optional[str] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    color: Optional[str] = None
    warp_count: Optional[str] = None
    warp_ends: Optional[int] = 0
    warp_meters: Optional[float] = 0
    set_no: Optional[str] = None
    siz_dc_no: Optional[str] = None
    siz_dc_date: Optional[date] = None
    status: Optional[str] = "Received"
    beams: List[WarpBeamDetailBase] = []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_warp_beam_receipt(data: WarpBeamReceiptCreate, db: AsyncSession = Depends(get_db)):
    db_receipt = WarpBeamReceipt(**data.model_dump(exclude={"beams"}))
    
    if not db_receipt.ref_no:
        q = select(WarpBeamReceipt).order_by(desc(WarpBeamReceipt.id))
        result = await db.execute(q)
        last_rec = result.scalars().first()
        new_id = (last_rec.id + 1) if last_rec else 1
        db_receipt.ref_no = f"WBR-{new_id:05d}"

    db.add(db_receipt)
    await db.commit()
    await db.refresh(db_receipt)

    for item_in in data.beams:
        db_item = WarpBeamDetail(receipt_id=db_receipt.id, **item_in.model_dump())
        db.add(db_item)
    
    await db.commit()
    return {"id": db_receipt.id, "ref_no": db_receipt.ref_no, "message": "Warp Beam Receipt created successfully"}

@router.get("")
async def list_warp_beam_receipts(db: AsyncSession = Depends(get_db)):
    try:
        q = select(WarpBeamReceipt).options(selectinload(WarpBeamReceipt.beams)).order_by(desc(WarpBeamReceipt.id))
        result = await db.execute(q)
        receipts = result.scalars().all()
        
        output = []
        for r in receipts:
            output.append({
                "id": r.id,
                "ref_no": r.ref_no,
                "rcvd_date": r.rcvd_date,
                "party_name": r.party_name,
                "rcvd_type": r.rcvd_type,
                "status": r.status,
                "beams": [{"beam_no": i.beam_no, "total_meters": float(i.total_meters) if i.total_meters else 0.0} for i in r.beams],
                "warp_meters": float(r.warp_meters) if r.warp_meters else 0.0
            })
        return output
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{receipt_id}")
async def get_warp_beam_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    q = select(WarpBeamReceipt).options(selectinload(WarpBeamReceipt.beams)).where(WarpBeamReceipt.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Warp Beam Receipt not found")
    
    output = {c.name: getattr(db_receipt, c.name) for c in db_receipt.__table__.columns}
    output["beams"] = []
    for item in db_receipt.beams:
        output["beams"].append({c.name: float(getattr(item, c.name)) if hasattr(getattr(item, c.name), 'normalize') else getattr(item, c.name) for c in item.__table__.columns})
        
    return output

@router.put("/{receipt_id}")
async def update_warp_beam_receipt(receipt_id: int, data: WarpBeamReceiptCreate, db: AsyncSession = Depends(get_db)):
    q = select(WarpBeamReceipt).options(selectinload(WarpBeamReceipt.beams)).where(WarpBeamReceipt.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Warp Beam Receipt not found")

    update_data = data.model_dump(exclude_unset=True, exclude={"beams"})
    for key, value in update_data.items():
        setattr(db_receipt, key, value)
        
    for item in db_receipt.beams:
        await db.delete(item)
    
    for item_in in data.beams:
        db_item = WarpBeamDetail(receipt_id=db_receipt.id, **item_in.model_dump())
        db.add(db_item)
        
    await db.commit()
    return {"message": "Warp Beam Receipt updated successfully"}

@router.delete("/{receipt_id}")
async def delete_warp_beam_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    q = select(WarpBeamReceipt).where(WarpBeamReceipt.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Warp Beam Receipt not found")
        
    await db.delete(db_receipt)
    await db.commit()
    return {"message": "Warp Beam Receipt deleted successfully"}
