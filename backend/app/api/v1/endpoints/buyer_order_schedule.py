from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.buyer_order_schedule import BuyerOrderSchedule, BuyerOrderScheduleEntry
from app.schemas.buyer_order_schedule import BuyerOrderScheduleCreate, BuyerOrderScheduleResponse, BuyerOrderScheduleUpdate

router = APIRouter(prefix="/buyer-order-schedules", tags=["Buyer Order Schedules"])

@router.post("/", response_model=BuyerOrderScheduleResponse)
async def create_schedule(schedule: BuyerOrderScheduleCreate, db: AsyncSession = Depends(get_db)):
    db_schedule = BuyerOrderSchedule(
        schedule_no=schedule.schedule_no,
        schedule_date=schedule.schedule_date,
        schedule_order=schedule.schedule_order,
        ibpo_ref_no=schedule.ibpo_ref_no,
        po_date=schedule.po_date,
        party_name=schedule.party_name,
        design_no=schedule.design_no,
        quality=schedule.quality,
        order_mtr=schedule.order_mtr,
        min_mtr=schedule.min_mtr,
        max_mtr=schedule.max_mtr,
        tolerance_pct=schedule.tolerance_pct,
        delivery_starting=schedule.delivery_starting,
        party_completion_date=schedule.party_completion_date,
        company_completion_date=schedule.company_completion_date,
        production_start_date=schedule.production_start_date
    )
    db.add(db_schedule)
    await db.flush()

    for entry in schedule.entries:
        db_entry = BuyerOrderScheduleEntry(
            schedule_id=db_schedule.id,
            approval=entry.approval,
            schedule_date=entry.schedule_date,
            schedule_mtr=entry.schedule_mtr
        )
        db.add(db_entry)
    
    await db.commit()
    await db.refresh(db_schedule, ['entries'])
    return db_schedule

@router.get("/", response_model=List[BuyerOrderScheduleResponse])
async def list_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderSchedule).options(selectinload(BuyerOrderSchedule.entries)).order_by(BuyerOrderSchedule.id.desc()))
    return result.scalars().all()

@router.get("/{schedule_id}", response_model=BuyerOrderScheduleResponse)
async def get_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrderSchedule)
        .options(selectinload(BuyerOrderSchedule.entries))
        .where(BuyerOrderSchedule.id == schedule_id)
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule

@router.put("/{schedule_id}", response_model=BuyerOrderScheduleResponse)
async def update_schedule(schedule_id: int, schedule_update: BuyerOrderScheduleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrderSchedule)
        .options(selectinload(BuyerOrderSchedule.entries))
        .where(BuyerOrderSchedule.id == schedule_id)
    )
    db_schedule = result.scalar_one_or_none()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    update_data = schedule_update.dict(exclude_unset=True, exclude={'entries'})
    for key, value in update_data.items():
        setattr(db_schedule, key, value)
    
    if schedule_update.entries is not None:
        # Delete existing entries
        for entry in db_schedule.entries:
            await db.delete(entry)
        await db.flush()
        
        # Add new entries
        for entry in schedule_update.entries:
            db_entry = BuyerOrderScheduleEntry(
                schedule_id=db_schedule.id,
                **entry.dict()
            )
            db.add(db_entry)
            
    await db.commit()
    await db.refresh(db_schedule, ['entries'])
    return db_schedule

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderSchedule).where(BuyerOrderSchedule.id == schedule_id))
    db_schedule = result.scalar_one_or_none()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    await db.delete(db_schedule)
    await db.commit()
    return {"message": "Schedule deleted successfully"}
