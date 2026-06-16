"""Stationary Module API Router."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Dict, Any, List

from app.core.database import get_db
from app.modules.stationary.models import StationaryItem

router = APIRouter(prefix="/stationary", tags=["Stationary"])

@router.get("/{category}")
async def list_stationary_items(category: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationaryItem).where(StationaryItem.category == category))
    items = result.scalars().all()
    return [{"id": item.id, "category": item.category, **item.data} for item in items]

@router.post("/{category}", status_code=201)
async def create_stationary_item(category: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    db_item = StationaryItem(
        category=category,
        data=payload
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return {"id": db_item.id, "category": db_item.category, **db_item.data}

@router.post("/{category}/bulk", status_code=201)
async def bulk_save_stationary_items(category: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(StationaryItem).where(StationaryItem.category == category))
    
    items = payload.get("items") or []
    inserted = []
    for item in items:
        db_item = StationaryItem(
            category=category,
            data=item
        )
        db.add(db_item)
        inserted.append(db_item)
    await db.commit()
    return {"message": f"Successfully bulk-saved {len(inserted)} items for {category}"}

@router.put("/{category}/{item_id}")
async def update_stationary_item(category: str, item_id: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    db_item = None
    result = await db.execute(select(StationaryItem).where(StationaryItem.category == category))
    all_items = result.scalars().all()
    for it in all_items:
        if str(it.data.get("id")) == str(item_id) or str(it.id) == str(item_id):
            db_item = it
            break
            
    if not db_item:
        db_item = StationaryItem(category=category, data=payload)
        db.add(db_item)
    else:
        merged_data = {**db_item.data, **payload}
        db_item.data = merged_data
        
    await db.commit()
    await db.refresh(db_item)
    return {"id": db_item.id, "category": db_item.category, **db_item.data}

@router.delete("/{category}/{item_id}", status_code=204)
async def delete_stationary_item(category: str, item_id: str, db: AsyncSession = Depends(get_db)):
    db_item = None
    result = await db.execute(select(StationaryItem).where(StationaryItem.category == category))
    all_items = result.scalars().all()
    for it in all_items:
        if str(it.data.get("id")) == str(item_id) or str(it.id) == str(item_id):
            db_item = it
            break
            
    if db_item:
        await db.delete(db_item)
        await db.commit()
    return None
