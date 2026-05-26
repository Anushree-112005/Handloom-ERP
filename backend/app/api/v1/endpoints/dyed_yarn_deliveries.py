from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.models.dyed_yarn import DyedYarnDelivery, DyedYarnDeliveryItem

router = APIRouter(prefix="/dyed-yarn-deliveries", tags=["Dyed Yarn Deliveries"])

class DyedYarnDeliveryItemBase(BaseModel):
    yarn_type: Optional[str] = None
    count: Optional[str] = None
    color: Optional[str] = None
    lot_no: Optional[str] = None
    stock: Optional[str] = None
    bags: Optional[int] = 0
    cones: Optional[int] = 0
    total_kgs: Optional[float] = 0
    rate: Optional[float] = 0
    amount: Optional[float] = 0

class DyedYarnDeliveryCreate(BaseModel):
    dc_no: Optional[str] = None
    dc_no_alt: Optional[str] = None
    dc_date: date
    add_date: Optional[date] = None
    delivery_type: Optional[str] = None
    delivery_mode: Optional[str] = None
    party_name: Optional[str] = None
    delivery_address: Optional[str] = None
    design_no: Optional[str] = None
    order_no: Optional[str] = None
    design_type: Optional[str] = None
    transport: Optional[str] = None
    certificate_type: Optional[str] = None
    driver_name: Optional[str] = None
    delivery_time: Optional[str] = None
    
    total_delv_kgs: Optional[float] = 0
    total_rin_kgs: Optional[float] = 0
    balance_kgs: Optional[float] = 0
    
    cost: Optional[float] = 0
    insurance: Optional[float] = 0
    other_charges: Optional[float] = 0
    gross_amount: Optional[float] = 0
    tax_value: Optional[float] = 0
    sgst: Optional[float] = 0
    igst: Optional[float] = 0
    total_gst: Optional[float] = 0
    round_off: Optional[float] = 0
    net_amount: Optional[float] = 0
    
    remarks: Optional[str] = None
    status: Optional[str] = "Delivered"
    items: List[DyedYarnDeliveryItemBase] = []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_dyed_yarn_delivery(data: DyedYarnDeliveryCreate, db: AsyncSession = Depends(get_db)):
    db_delivery = DyedYarnDelivery(**data.model_dump(exclude={"items"}))
    
    if not db_delivery.dc_no:
        q = select(DyedYarnDelivery).order_by(desc(DyedYarnDelivery.id))
        result = await db.execute(q)
        last_rec = result.scalars().first()
        new_id = (last_rec.id + 1) if last_rec else 1
        db_delivery.dc_no = f"DYD-{new_id:05d}"

    db.add(db_delivery)
    await db.commit()
    await db.refresh(db_delivery)

    for item_in in data.items:
        db_item = DyedYarnDeliveryItem(delivery_id=db_delivery.id, **item_in.model_dump())
        db.add(db_item)
    
    await db.commit()
    return {"id": db_delivery.id, "dc_no": db_delivery.dc_no, "message": "Dyed Yarn Delivery created successfully"}

@router.get("")
async def list_dyed_yarn_deliveries(db: AsyncSession = Depends(get_db)):
    try:
        q = select(DyedYarnDelivery).options(selectinload(DyedYarnDelivery.items)).order_by(desc(DyedYarnDelivery.id))
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
                "items": [{"color": i.color, "total_kgs": float(i.total_kgs) if i.total_kgs else 0.0} for i in r.items],
                "net_amount": float(r.net_amount) if r.net_amount else 0.0
            })
        return output
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{delivery_id}")
async def get_dyed_yarn_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnDelivery).options(selectinload(DyedYarnDelivery.items)).where(DyedYarnDelivery.id == delivery_id)
    result = await db.execute(q)
    db_delivery = result.scalar_one_or_none()
    
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Dyed Yarn Delivery not found")
    
    output = {c.name: getattr(db_delivery, c.name) for c in db_delivery.__table__.columns}
    output["items"] = []
    for item in db_delivery.items:
        output["items"].append({c.name: float(getattr(item, c.name)) if hasattr(getattr(item, c.name), 'normalize') else getattr(item, c.name) for c in item.__table__.columns})
        
    return output

@router.put("/{delivery_id}")
async def update_dyed_yarn_delivery(delivery_id: int, data: DyedYarnDeliveryCreate, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnDelivery).options(selectinload(DyedYarnDelivery.items)).where(DyedYarnDelivery.id == delivery_id)
    result = await db.execute(q)
    db_delivery = result.scalar_one_or_none()
    
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Dyed Yarn Delivery not found")

    update_data = data.model_dump(exclude_unset=True, exclude={"items"})
    for key, value in update_data.items():
        setattr(db_delivery, key, value)
        
    for item in db_delivery.items:
        await db.delete(item)
    
    for item_in in data.items:
        db_item = DyedYarnDeliveryItem(delivery_id=db_delivery.id, **item_in.model_dump())
        db.add(db_item)
        
    await db.commit()
    return {"message": "Dyed Yarn Delivery updated successfully"}

@router.delete("/{delivery_id}")
async def delete_dyed_yarn_delivery(delivery_id: int, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnDelivery).where(DyedYarnDelivery.id == delivery_id)
    result = await db.execute(q)
    db_delivery = result.scalar_one_or_none()
    
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Dyed Yarn Delivery not found")
        
    await db.delete(db_delivery)
    await db.commit()
    return {"message": "Dyed Yarn Delivery deleted successfully"}
