from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError, OperationalError

from app.core.database import get_db, engine, Base
from app.models.ppc import LoomMaster, LoomAllocation, ProductionLog
from app.schemas.ppc import (
    LoomMasterCreate, LoomMasterResponse,
    LoomAllocationCreate, LoomAllocationResponse,
    ProductionLogCreate, ProductionLogResponse,
    OperatorMasterCreate, OperatorMasterResponse
)
from app.models.ppc import OperatorMaster

router = APIRouter()

@router.get("/seed-looms")
async def seed_looms(db: AsyncSession = Depends(get_db)):
    # Check current count
    result = await db.execute(select(LoomMaster))
    looms = result.scalars().all()
    if len(looms) >= 20:
        return {"msg": f"Already have {len(looms)} looms in DB"}
    
    start_index = len(looms) + 1
    for i in range(start_index, start_index + 20):
        loom = LoomMaster(
            loom_name=f"LM-{i:03d}",
            loom_type="Air Jet" if i % 2 == 0 else "Rapier",
            manufacturer="Tsudakoma" if i % 2 == 0 else "Picanol",
            model_number="ZA103" if i % 2 == 0 else "OMNIplus",
            installation_date=datetime(2020, 1, 1),
            capacity_per_day=300.0,
            running_speed_per_hr=800.0 if i % 2 == 0 else 600.0,
            efficiency_pct=85.0 + (i % 10),
            reed_width=190.0,
            total_ends=10000 + (i * 100),
            status="Running" if i % 3 != 0 else "Idle",
            location="Shed A" if i <= 10 else "Shed B",
            remarks="Seeded loom"
        )
        db.add(loom)
    
    await db.commit()
    return {"msg": "Successfully seeded 20 looms!"}

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
    try:
        result = await db.execute(select(LoomMaster))
        return result.scalars().all()
    except Exception:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        result = await db.execute(select(LoomMaster))
        return result.scalars().all()

@router.post("/looms", response_model=LoomMasterResponse)
async def create_loom(loom: LoomMasterCreate, db: AsyncSession = Depends(get_db)):
    try:
        data = loom.model_dump()
        for k, v in data.items():
            if isinstance(v, datetime) and v.tzinfo is not None:
                data[k] = v.replace(tzinfo=None)
                
        new_loom = LoomMaster(**data)
        db.add(new_loom)
        await db.commit()
        await db.refresh(new_loom)
        return new_loom
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Loom with this name already exists")
    except Exception as e:
        await db.rollback()
        # Fallback for ProgrammingError (missing table in Postgres)
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            data = loom.model_dump()
            for k, v in data.items():
                if isinstance(v, datetime) and v.tzinfo is not None:
                    data[k] = v.replace(tzinfo=None)
            new_loom = LoomMaster(**data)
            db.add(new_loom)
            await db.commit()
            await db.refresh(new_loom)
            return new_loom
        except Exception as inner_e:
            await db.rollback()
            print(f"Error creating loom: {inner_e}")
            raise HTTPException(status_code=500, detail=str(inner_e))

@router.put("/looms/{loom_id}/status", response_model=LoomMasterResponse)
async def update_loom_status(loom_id: int, status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoomMaster).where(LoomMaster.id == loom_id))
    loom = result.scalar_one_or_none()
    if not loom:
        raise HTTPException(status_code=404, detail="Loom not found")
        
    loom.status = status
    await db.commit()
    await db.refresh(loom)
    return loom

@router.get("/allocations", response_model=List[LoomAllocationResponse])
async def get_allocations(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    try:
        result = await db.execute(select(LoomAllocation).options(selectinload(LoomAllocation.loom)))
        allocations = result.scalars().all()
        for a in allocations:
            a.loom_name = a.loom.loom_name if a.loom else None
        return allocations
    except Exception as e:
        await db.rollback()
        from app.core.database import engine
        from app.models.ppc import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        result = await db.execute(select(LoomAllocation).options(selectinload(LoomAllocation.loom)))
        allocations = result.scalars().all()
        for a in allocations:
            a.loom_name = a.loom.loom_name if a.loom else None
        return allocations

@router.post("/allocations", response_model=LoomAllocationResponse)
async def create_allocation(alloc: LoomAllocationCreate, db: AsyncSession = Depends(get_db)):
    try:
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
        
        # Attach loom_name manually so response validation passes
        new_alloc.loom_name = loom.loom_name
        return new_alloc
    except Exception as e:
        await db.rollback()
        from app.core.database import engine
        from app.models.ppc import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
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
        
        new_alloc.loom_name = loom.loom_name
        return new_alloc

@router.put("/allocations/{alloc_id}", response_model=LoomAllocationResponse)
async def update_allocation(alloc_id: int, alloc: LoomAllocationCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoomAllocation).where(LoomAllocation.id == alloc_id))
    existing_alloc = result.scalar_one_or_none()
    if not existing_alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
        
    loom_res = await db.execute(select(LoomMaster).where(LoomMaster.id == alloc.loom_id))
    loom = loom_res.scalar_one_or_none()
    if not loom:
        raise HTTPException(status_code=404, detail="Loom not found")
        
    data = alloc.model_dump()
    for k, v in data.items():
        if isinstance(v, datetime) and v.tzinfo is not None:
            data[k] = v.replace(tzinfo=None)
            
    for key, value in data.items():
        setattr(existing_alloc, key, value)
        
    existing_alloc.expected_finish_time = calculate_eta(
        existing_alloc.assigned_meters, 
        existing_alloc.completed_meters,
        loom.capacity_per_day,
        loom.efficiency_pct
    )
    
    await db.commit()
    await db.refresh(existing_alloc)
    existing_alloc.loom_name = loom.loom_name
    return existing_alloc

@router.delete("/allocations/{alloc_id}", status_code=204)
async def delete_allocation(alloc_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LoomAllocation).where(LoomAllocation.id == alloc_id))
    alloc = result.scalar_one_or_none()
    if not alloc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    await db.delete(alloc)
    await db.commit()
    return None

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
