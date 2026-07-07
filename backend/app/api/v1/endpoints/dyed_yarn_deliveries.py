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
    sp_no: Optional[str] = None
    design_no: Optional[str] = None
    yarn_type: Optional[str] = None
    yarn_count: Optional[str] = None
    ply: Optional[str] = None
    colour: Optional[str] = None
    shade_no: Optional[str] = None
    lot_no: Optional[str] = None
    batch_no: Optional[str] = None
    unit: Optional[str] = "KGS"
    
    ordered_qty: Optional[float] = 0
    prev_delivered_qty: Optional[float] = 0
    balance_qty: Optional[float] = 0
    current_delivery_qty: Optional[float] = 0
    
    no_of_bags: Optional[int] = 0
    no_of_cones: Optional[int] = 0
    gross_weight: Optional[float] = 0
    tare_weight: Optional[float] = 0
    net_weight: Optional[float] = 0
    
    rate: Optional[float] = 0
    amount: Optional[float] = 0
    remarks: Optional[str] = None

    # Matching fields from GreyYarnDeliveryItem
    cone_type: Optional[str] = None
    count: Optional[str] = None
    our_lot_no: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[float] = 0.0
    bags: Optional[int] = 0
    cones: Optional[int] = 0
    total_kgs: Optional[float] = 0.0

class DyedYarnDeliveryCreate(BaseModel):
    delivery_no: Optional[str] = None
    dc_no: Optional[str] = None
    dc_date: Optional[date] = None
    delivery_date: Optional[date] = None
    delivery_type: Optional[str] = None
    delivery_mode: Optional[str] = None
    yarn_dyeing_po_no: Optional[str] = None
    processor_name: Optional[str] = None
    party_name: Optional[str] = None
    order_no: Optional[str] = None
    ref_no: Optional[str] = None
    design_no: Optional[str] = None
    merchandiser: Optional[str] = None
    
    vehicle_no: Optional[str] = None
    driver_name: Optional[str] = None
    driver_mobile: Optional[str] = None
    transport_name: Optional[str] = None
    lr_no: Optional[str] = None
    gate_pass_no: Optional[str] = None
    eway_bill_no: Optional[str] = None
    dispatch_from_godown: Optional[str] = None
    remarks: Optional[str] = None

    # Matching fields from GreyYarnDelivery
    ref_date: Optional[date] = None
    stock_godown: Optional[str] = None
    delivery_address: Optional[str] = None
    transport: Optional[str] = None
    delivery_name: Optional[str] = None
    delivery_time: Optional[str] = None
    certificate_type: Optional[str] = None
    design_count: Optional[str] = None
    order_kgs: Optional[float] = 0.0
    total_dely_kgs: Optional[float] = 0.0
    total_rtn_kgs: Optional[float] = 0.0
    balance_kgs: Optional[float] = 0.0
    status: Optional[str] = "Delivered"

    # Quantity Summary
    total_ordered_qty: Optional[float] = 0
    total_prev_delivered_qty: Optional[float] = 0
    total_current_delivery_qty: Optional[float] = 0
    total_balance_qty: Optional[float] = 0
    total_bags: Optional[int] = 0
    total_cones: Optional[int] = 0
    total_gross_weight: Optional[float] = 0
    total_net_weight: Optional[float] = 0

    # Financial / Logistics Details
    freight_charges: Optional[float] = 0
    loading_charges: Optional[float] = 0
    unloading_charges: Optional[float] = 0
    insurance_charges: Optional[float] = 0
    other_charges: Optional[float] = 0
    transport_remarks: Optional[str] = None

    # Tax Details
    taxable_amount: Optional[float] = 0
    sgst_pct: Optional[float] = 0
    sgst_amount: Optional[float] = 0
    cgst_pct: Optional[float] = 0
    cgst_amount: Optional[float] = 0
    igst_pct: Optional[float] = 0
    igst_amount: Optional[float] = 0
    total_gst: Optional[float] = 0

    # Summary
    gross_amount: Optional[float] = 0
    discount: Optional[float] = 0
    round_off: Optional[float] = 0
    grand_total: Optional[float] = 0
    advance: Optional[float] = 0
    balance: Optional[float] = 0

    delivery_status: Optional[str] = "Pending"
    terms_conditions: Optional[List[str]] = []
    items: List[DyedYarnDeliveryItemBase] = []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_dyed_yarn_delivery(data: DyedYarnDeliveryCreate, db: AsyncSession = Depends(get_db)):
    db_delivery = DyedYarnDelivery(**data.model_dump(exclude={"items"}))
    
    if not db_delivery.delivery_no:
        q = select(DyedYarnDelivery).order_by(desc(DyedYarnDelivery.id))
        result = await db.execute(q)
        last_rec = result.scalars().first()
        new_id = (last_rec.id + 1) if last_rec else 1
        db_delivery.delivery_no = f"DYD-{new_id:05d}"

    if not db_delivery.dc_no:
        q = select(DyedYarnDelivery).order_by(desc(DyedYarnDelivery.id))
        result = await db.execute(q)
        last_rec = result.scalars().first()
        new_id = (last_rec.id + 1) if last_rec else 1
        db_delivery.dc_no = f"YDD-{new_id:05d}"

    db.add(db_delivery)
    await db.commit()
    await db.refresh(db_delivery)

    for item_in in data.items:
        db_item = DyedYarnDeliveryItem(delivery_id=db_delivery.id, **item_in.model_dump())
        db.add(db_item)
    
    await db.commit()
    return {"id": db_delivery.id, "delivery_no": db_delivery.delivery_no, "message": "Dyed Yarn Delivery created successfully"}

@router.get("")
async def list_dyed_yarn_deliveries(db: AsyncSession = Depends(get_db)):
    try:
        q = select(DyedYarnDelivery).options(selectinload(DyedYarnDelivery.items)).order_by(desc(DyedYarnDelivery.id))
        result = await db.execute(q)
        deliveries = result.scalars().all()
        
        output = []
        for r in deliveries:
            del_dict = {c.name: getattr(r, c.name) for c in r.__table__.columns}
            del_dict["items"] = []
            for item in r.items:
                del_dict["items"].append({c.name: float(getattr(item, c.name)) if hasattr(getattr(item, c.name), 'normalize') else getattr(item, c.name) for c in item.__table__.columns})
            output.append(del_dict)
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
