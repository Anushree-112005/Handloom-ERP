"""Vehicle Management Module API Router."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List

from app.core.database import get_db
from app.modules.vehicle_management.models import FleetItem

router = APIRouter(prefix="/fleet", tags=["Vehicle Management"])

@router.get("/stats")
async def get_fleet_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FleetItem))
    all_items = result.scalars().all()
    
    vehicles = [item for item in all_items if item.category == "vehicles"]
    trips = [item for item in all_items if item.category == "trips"]
    drivers = [item for item in all_items if item.category == "drivers"]
    breakdowns = [item for item in all_items if item.category == "breakdowns"]
    
    total_vehicles = len(vehicles)
    total_drivers = len(drivers)
    breakdown_vehicles = len(breakdowns)
    
    active_trips = sum(1 for t in trips if t.data.get("status") in ["ACTIVE", "RUNNING", "EN_ROUTE"])
    completed_trips_today = sum(1 for t in trips if t.data.get("status") == "COMPLETED")
    
    idle_vehicles = sum(1 for v in vehicles if v.data.get("status") == "IDLE")
    stopped_vehicles = sum(1 for v in vehicles if v.data.get("status") in ["STOPPED", "INACTIVE"])
    
    return {
        "total_vehicles": total_vehicles,
        "active_trips": active_trips,
        "fuel_cost_today": 0,
        "breakdown_vehicles": breakdown_vehicles,
        "expiring_documents": 0,
        "total_drivers": total_drivers,
        "completed_trips_today": completed_trips_today,
        "total_revenue": 0,
        "idle_vehicles": idle_vehicles,
        "stopped_vehicles": stopped_vehicles,
        "recent_activities": []
    }

@router.get("/expiry-alerts")
async def get_expiry_alerts(db: AsyncSession = Depends(get_db)):
    return []

@router.get("/driver-performance-report")
async def get_driver_performance_report(db: AsyncSession = Depends(get_db)):
    return []

@router.get("/profitability-report")
async def get_profitability_report(db: AsyncSession = Depends(get_db)):
    return []

@router.get("/diesel-km-report")
async def get_diesel_km_report(db: AsyncSession = Depends(get_db)):
    return []

@router.post("/vehicles/bulk-import")
async def bulk_import_vehicles(payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    vehicles = payload.get("vehicles") or []
    imported_items = []
    for v in vehicles:
        db_item = FleetItem(category="vehicles", data=v)
        db.add(db_item)
        imported_items.append(db_item)
    await db.commit()
    return {"message": f"Successfully imported {len(imported_items)} vehicles"}

@router.get("/{category}")
async def list_fleet_items(category: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FleetItem).where(FleetItem.category == category))
    items = result.scalars().all()
    return [{"id": item.id, "category": item.category, **item.data} for item in items]

@router.get("/{category}/{item_id}")
async def get_fleet_item(category: str, item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FleetItem).where(FleetItem.category == category, FleetItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"id": item.id, "category": item.category, **item.data}

@router.post("/{category}", status_code=201)
async def create_fleet_item(category: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    db_item = FleetItem(
        category=category,
        data=payload
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return {"id": db_item.id, "category": db_item.category, **db_item.data}

@router.put("/{category}/{item_id}")
async def update_fleet_item(category: str, item_id: int, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FleetItem).where(FleetItem.category == category, FleetItem.id == item_id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    merged_data = {**db_item.data, **payload}
    db_item.data = merged_data
    
    await db.commit()
    await db.refresh(db_item)
    return {"id": db_item.id, "category": db_item.category, **db_item.data}

@router.delete("/{category}/{item_id}", status_code=204)
async def delete_fleet_item(category: str, item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FleetItem).where(FleetItem.category == category, FleetItem.id == item_id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(db_item)
    await db.commit()
    return None
