from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import os
import shutil
import uuid
import hashlib

from app.core.database import AsyncSessionLocal
from app.models.warehouse_stock import WarehouseStock, WarehouseStockImage

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

UPLOAD_DIR = "uploads/warehouse"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/")
async def get_warehouse_stock(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseStock).options(selectinload(WarehouseStock.images)))
    items = result.scalars().all()
    return items

@router.post("/")
async def create_warehouse_stock(data: dict, db: AsyncSession = Depends(get_db)):
    new_item = WarehouseStock(
        material_name=data.get("material_name"),
        category=data.get("category"),
        quantity=data.get("quantity", 0.0),
        uom=data.get("uom", "Kgs"),
        location=data.get("location"),
        status=data.get("status", "Pending"),
        notes=data.get("notes")
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return {"status": "success", "data": new_item}

@router.post("/{item_id}/images")
async def upload_warehouse_image(item_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseStock).where(WarehouseStock.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/static/warehouse/{filename}"
    new_image = WarehouseStockImage(material_id=item_id, image_url=image_url)
    db.add(new_image)
    await db.commit()
    await db.refresh(new_image)
    return {"status": "success", "data": new_image}

@router.delete("/{item_id}")
async def delete_warehouse_stock(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseStock).where(WarehouseStock.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
    return {"status": "success"}

@router.post("/search-by-image")
async def search_by_image(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    content = await file.read()
    uploaded_hash = hashlib.sha256(content).hexdigest()
    
    # Iterate through all files in UPLOAD_DIR
    matched_filename = None
    if os.path.exists(UPLOAD_DIR):
        for filename in os.listdir(UPLOAD_DIR):
            filepath = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(filepath):
                with open(filepath, "rb") as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()
                    if file_hash == uploaded_hash:
                        matched_filename = filename
                        break
                        
    if matched_filename:
        image_url = f"/static/warehouse/{matched_filename}"
        result = await db.execute(
            select(WarehouseStock)
            .join(WarehouseStock.images)
            .where(WarehouseStockImage.image_url == image_url)
            .options(selectinload(WarehouseStock.images))
        )
        item = result.scalar_one_or_none()
        if item:
            return {"status": "success", "data": item}
            
    return {"status": "not_found", "message": "No matching image found in the database."}
