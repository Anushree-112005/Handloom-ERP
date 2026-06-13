from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.ppc import LoomMaster, LoomAllocation, ProductionLog
from app.schemas.ppc import (
    LoomMasterCreate, LoomMasterResponse,
    LoomAllocationCreate, LoomAllocationResponse,
    ProductionLogCreate, ProductionLogResponse,
    OperatorMasterCreate, OperatorMasterResponse
)
from app.models.ppc import OperatorMaster

router = APIRouter()

def calculate_eta(assigned: float, completed: float, capacity_per_day: float, efficiency: float, current_time: datetime = None) -> datetime:
    if current_time is None:
        current_time = datetime.utcnow()
    
    remaining_meters = assigned - completed
    actual_daily_production = capacity_per_day * (efficiency / 100.0)
    
    if actual_daily_production <= 0 or remaining_meters <= 0:
        return current_time
    
    remaining_days = remaining_meters / actual_daily_production
    remaining_hours = remaining_days * 24
    
    if completed == 0:
        remaining_hours += 4 # Setup time
        
    return current_time + timedelta(hours=remaining_hours)

@router.get("/looms", response_model=List[LoomMasterResponse])
async def get_looms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoomMaster))
    return result.scalars().all()

@router.post("/looms", response_model=LoomMasterResponse)
async def create_loom(loom: LoomMasterCreate, db: AsyncSession = Depends(get_db)):
    new_loom = LoomMaster(**loom.model_dump())
    db.add(new_loom)
    await db.commit()
    await db.refresh(new_loom)
    return new_loom

@router.get("/allocations", response_model=List[LoomAllocationResponse])
async def get_allocations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoomAllocation).join(LoomMaster))
    allocations = result.scalars().all()
    # Attach loom_name for frontend convenience
    for a in allocations:
        a.loom_name = a.loom.loom_name
    return allocations

@router.post("/allocations", response_model=LoomAllocationResponse)
async def create_allocation(alloc: LoomAllocationCreate, db: AsyncSession = Depends(get_db)):
    loom_res = await db.execute(select(LoomMaster).where(LoomMaster.id == alloc.loom_id))
    loom = loom_res.scalar_one_or_none()
    if not loom:
        raise HTTPException(status_code=404, detail="Loom not found")
        
    new_alloc = LoomAllocation(**alloc.model_dump())
    new_alloc.expected_finish_time = calculate_eta(
        new_alloc.assigned_meters, 
        new_alloc.completed_meters,
        loom.capacity_per_day,
        loom.efficiency_pct
    )
    
    loom.status = "Setup"
    loom.current_warp = f"Ends: {new_alloc.warp_ends}"
    loom.current_weft = f"Picks: {new_alloc.weft_density}"
    
    db.add(new_alloc)
    await db.commit()
    await db.refresh(new_alloc)
    return new_alloc

@router.post("/logs", response_model=ProductionLogResponse)
async def create_production_log(log: ProductionLogCreate, db: AsyncSession = Depends(get_db)):
    alloc_res = await db.execute(select(LoomAllocation).where(LoomAllocation.id == log.allocation_id))
    alloc = alloc_res.scalar_one_or_none()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
        
    loom_res = await db.execute(select(LoomMaster).where(LoomMaster.id == alloc.loom_id))
    loom = loom_res.scalar_one_or_none()
    
    new_log = ProductionLog(**log.model_dump())
    db.add(new_log)
    
    # Update allocation meters
    alloc.completed_meters += log.meters_produced
    if alloc.completed_meters >= alloc.assigned_meters:
        alloc.allocation_status = "Completed"
        loom.status = "Idle"
        loom.current_warp = None
        loom.current_weft = None
    else:
        alloc.allocation_status = "Active"
        loom.status = "Running"
        
    alloc.expected_finish_time = calculate_eta(
        alloc.assigned_meters,
        alloc.completed_meters,
        loom.capacity_per_day,
        loom.efficiency_pct
    )
    
    await db.commit()
    await db.refresh(new_log)
    return new_log

@router.get("/operators", response_model=List[OperatorMasterResponse])
async def get_operators(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OperatorMaster))
    return result.scalars().all()

@router.post("/operators", response_model=OperatorMasterResponse)
async def create_operator(operator: OperatorMasterCreate, db: AsyncSession = Depends(get_db)):
    new_operator = OperatorMaster(**operator.model_dump())
    db.add(new_operator)
    await db.commit()
    await db.refresh(new_operator)
    return new_operator

@router.put("/operators/{id}", response_model=OperatorMasterResponse)
async def update_operator(id: int, operator: OperatorMasterCreate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(OperatorMaster).where(OperatorMaster.id == id))
    existing = res.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    for k, v in operator.model_dump().items():
        setattr(existing, k, v)
        
    await db.commit()
    await db.refresh(existing)
    return existing

@router.delete("/operators/{id}")
async def delete_operator(id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(OperatorMaster).where(OperatorMaster.id == id))
    existing = res.scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Operator not found")
        
    await db.delete(existing)
    await db.commit()
    return {"status": "success"}
