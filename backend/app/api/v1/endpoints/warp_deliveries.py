from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.models.warp import WarpDelivery, WarpDeliveryItem

router = APIRouter(prefix="/warp-deliveries", tags=["Warp Deliveries"])

class WarpDeliveryItemBase(BaseModel):
    beam_no: Optional[str] = None
    warp_mtrs: Optional[float] = 0
    beam_type: Optional[str] = None
    loom_no: Optional[str] = None

class WarpDeliveryCreate(BaseModel):
    dc_no: Optional[str] = None
    ref_no: Optional[str] = None
    dc_date: Optional[date] = None
    delivery_type: Optional[str] = None
    sizing_name: Optional[str] = None
    party_name: Optional[str] = None
    entry_type: Optional[str] = None
    bpo_no: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    address: Optional[str] = None
    set_id: Optional[str] = None
    warp_ends: Optional[int] = 0
    yarn_count: Optional[str] = None
    vendor_po_no: Optional[str] = None
    po_date: Optional[date] = None
    order_mtrs: Optional[float] = 0
    with_crimp: Optional[str] = None
    delivered_mtrs: Optional[float] = 0
    transport: Optional[str] = None
    vehicle_no: Optional[str] = None
    
    total_beams: Optional[int] = 0
    total_meters: Optional[float] = 0
    total_exptd_mtrs: Optional[float] = 0
    balance_meters: Optional[float] = 0
    
    remarks: Optional[str] = None
    status: Optional[str] = "Delivered"
    items: List[WarpDeliveryItemBase] = []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_warp_delivery(data: WarpDeliveryCreate, db: AsyncSession = Depends(get_db)):
    db_delivery = WarpDelivery(**data.model_dump(exclude={"items"}))
    
    if not db_delivery.dc_no:
        q = select(WarpDelivery).order_by(desc(WarpDelivery.id))
        result = await db.execute(q)
        last_rec = result.scalars().first()
        new_id = (last_rec.id + 1) if last_rec else 1
        db_delivery.dc_no = f"WD-{new_id:05d}"

    db.add(db_delivery)
    await db.commit()
    await db.refresh(db_delivery)

    for item_in in data.items:
        db_item = WarpDeliveryItem(delivery_id=db_delivery.id, **item_in.model_dump())
        db.add(db_item)
    
    await db.commit()
    return {"id": db_delivery.id, "dc_no": db_delivery.dc_no, "message": "Warp Delivery created successfully"}

@router.get("")
async def list_warp_deliveries(db: AsyncSession = Depends(get_db)):
    try:
        q = select(WarpDelivery).options(selectinload(WarpDelivery.items)).order_by(desc(WarpDelivery.id))
        result = await db.execute(q)
        deliveries = result.scalars().all()
        
        output = []
        for r in deliveries:
            output.append({
                "id": r.id,
                "dc_no": r.dc_no,
                "dc_date": r.dc_date,
                "party_name": r.party_name,
                "delivery_type": r.delivery_type,
                "status": r.status,
                "items": [{"beam_no": i.beam_no, "warp_mtrs": float(i.warp_mtrs) if i.warp_mtrs else 0.0} for i in r.items],
                "total_meters": float(r.total_meters) if r.total_meters else 0.0
            })
        return output
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{delivery_id}")
async def get_warp_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    q = select(WarpDelivery).options(selectinload(WarpDelivery.items)).where(WarpDelivery.id == delivery_id)
    result = await db.execute(q)
    db_delivery = result.scalar_one_or_none()
    
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Warp Delivery not found")
    
    output = {c.name: getattr(db_delivery, c.name) for c in db_delivery.__table__.columns}
    output["items"] = []
    for item in db_delivery.items:
        output["items"].append({c.name: float(getattr(item, c.name)) if hasattr(getattr(item, c.name), 'normalize') else getattr(item, c.name) for c in item.__table__.columns})
        
    return output

@router.put("/{delivery_id}")
async def update_warp_delivery(delivery_id: int, data: WarpDeliveryCreate, db: AsyncSession = Depends(get_db)):
    q = select(WarpDelivery).options(selectinload(WarpDelivery.items)).where(WarpDelivery.id == delivery_id)
    result = await db.execute(q)
    db_delivery = result.scalar_one_or_none()
    
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Warp Delivery not found")

    update_data = data.model_dump(exclude_unset=True, exclude={"items"})
    for key, value in update_data.items():
        setattr(db_delivery, key, value)
        
    for item in db_delivery.items:
        await db.delete(item)
    
    for item_in in data.items:
        db_item = WarpDeliveryItem(delivery_id=db_delivery.id, **item_in.model_dump())
        db.add(db_item)
        
    await db.commit()
    return {"message": "Warp Delivery updated successfully"}

@router.delete("/{delivery_id}")
async def delete_warp_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    q = select(WarpDelivery).where(WarpDelivery.id == delivery_id)
    result = await db.execute(q)
    db_delivery = result.scalar_one_or_none()
    
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Warp Delivery not found")
        
    await db.delete(db_delivery)
    await db.commit()
    return {"message": "Warp Delivery deleted successfully"}
