from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import shutil

from app.core.database import get_db
from app.models.rack import Rack

router = APIRouter(prefix="/racks", tags=["Racks"])

class RackOut(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    specific_data: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[RackOut])
async def list_racks(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rack).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{rack_id}", response_model=RackOut)
async def get_rack(rack_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rack).where(Rack.id == rack_id))
    rack = result.scalar_one_or_none()
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")
    return rack

@router.post("/", response_model=RackOut)
async def create_rack(
    name: str = Form(...),
    category: Optional[str] = Form(None),
    specific_data: Optional[str] = Form(None),
    is_active: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    image_url = None
    if file:
        os.makedirs("uploads/racks", exist_ok=True)
        file_path = f"uploads/racks/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        image_url = f"/static/racks/{file.filename}"

    rack = Rack(
        name=name,
        category=category,
        specific_data=specific_data,
        image_url=image_url,
        is_active=is_active
    )
    db.add(rack)
    try:
        await db.commit()
        await db.refresh(rack)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Rack name might already exist")
    return rack

@router.put("/{rack_id}", response_model=RackOut)
async def update_rack(
    rack_id: int,
    name: str = Form(...),
    category: Optional[str] = Form(None),
    specific_data: Optional[str] = Form(None),
    is_active: bool = Form(True),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Rack).where(Rack.id == rack_id))
    rack = result.scalar_one_or_none()
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")

    rack.name = name
    rack.category = category
    rack.specific_data = specific_data
    rack.is_active = is_active

    if file:
        os.makedirs("uploads/racks", exist_ok=True)
        file_path = f"uploads/racks/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        rack.image_url = f"/static/racks/{file.filename}"

    try:
        await db.commit()
        await db.refresh(rack)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error updating rack")
    return rack

@router.delete("/{rack_id}", status_code=204)
async def delete_rack(rack_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rack).where(Rack.id == rack_id))
    rack = result.scalar_one_or_none()
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")
        
    await db.delete(rack)
    await db.commit()
    return None
