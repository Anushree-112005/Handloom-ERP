from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.warehouse import Warehouse, WarehouseZone, WarehouseRack, WarehouseBin
from app.schemas.warehouse import WarehouseCreate, Warehouse as WarehouseSchema, WarehouseZoneCreate, WarehouseZone as WarehouseZoneSchema, WarehouseRackCreate, WarehouseRack as WarehouseRackSchema, WarehouseBinCreate, WarehouseBin as WarehouseBinSchema

router = APIRouter()

@router.get("/", response_model=List[WarehouseSchema])
async def get_warehouses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse))
    return result.scalars().all()

@router.post("/", response_model=WarehouseSchema)
async def create_warehouse(warehouse: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    db_warehouse = Warehouse(**warehouse.model_dump())
    db.add(db_warehouse)
    await db.commit()
    await db.refresh(db_warehouse)
    return db_warehouse

@router.get("/{warehouse_id}/zones", response_model=List[WarehouseZoneSchema])
async def get_warehouse_zones(warehouse_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseZone).where(WarehouseZone.warehouse_id == warehouse_id))
    return result.scalars().all()

@router.post("/{warehouse_id}/zones", response_model=WarehouseZoneSchema)
async def create_warehouse_zone(warehouse_id: int, zone: WarehouseZoneCreate, db: AsyncSession = Depends(get_db)):
    db_zone = WarehouseZone(**zone.model_dump(), warehouse_id=warehouse_id)
    db.add(db_zone)
    await db.commit()
    await db.refresh(db_zone)
    return db_zone
