from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.models.costing_masters import YarnRateMaster, WashTypeMaster, ConstructionMaster, WastageMaster
from app.schemas.costing_masters import (
    YarnRateMasterCreate, YarnRateMasterUpdate, YarnRateMasterOut,
    WashTypeMasterCreate, WashTypeMasterUpdate, WashTypeMasterOut,
    ConstructionMasterCreate, ConstructionMasterUpdate, ConstructionMasterOut,
    WastageMasterCreate, WastageMasterUpdate, WastageMasterOut
)

router = APIRouter()

# --- Yarn Rate Master ---
@router.get("/yarn-rates", response_model=List[YarnRateMasterOut])
async def read_yarn_rates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(YarnRateMaster).order_by(desc(YarnRateMaster.created_at)))
    return result.scalars().all()

@router.post("/yarn-rates", response_model=YarnRateMasterOut)
async def create_yarn_rate(item: YarnRateMasterCreate, db: AsyncSession = Depends(get_db)):
    db_obj = YarnRateMaster(**item.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

# --- Wash Type Master ---
@router.get("/wash-types", response_model=List[WashTypeMasterOut])
async def read_wash_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WashTypeMaster).order_by(desc(WashTypeMaster.created_at)))
    return result.scalars().all()

@router.post("/wash-types", response_model=WashTypeMasterOut)
async def create_wash_type(item: WashTypeMasterCreate, db: AsyncSession = Depends(get_db)):
    db_obj = WashTypeMaster(**item.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

# --- Construction Master ---
@router.get("/constructions", response_model=List[ConstructionMasterOut])
async def read_constructions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ConstructionMaster).order_by(desc(ConstructionMaster.created_at)))
    return result.scalars().all()

@router.post("/constructions", response_model=ConstructionMasterOut)
async def create_construction(item: ConstructionMasterCreate, db: AsyncSession = Depends(get_db)):
    db_obj = ConstructionMaster(**item.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

# --- Wastage Master ---
@router.get("/wastages", response_model=List[WastageMasterOut])
async def read_wastages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WastageMaster).order_by(desc(WastageMaster.created_at)))
    return result.scalars().all()

@router.post("/wastages", response_model=WastageMasterOut)
async def create_wastage(item: WastageMasterCreate, db: AsyncSession = Depends(get_db)):
    db_obj = WastageMaster(**item.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
