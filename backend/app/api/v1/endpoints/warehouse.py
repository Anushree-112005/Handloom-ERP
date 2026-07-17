import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.core.database import get_db
from app.models.warehouse_material import WarehouseMaterial, WarehouseMaterialImage
from app.schemas.warehouse_material import WarehouseMaterialCreate, WarehouseMaterialResponse, WarehouseMaterialImageResponse

router = APIRouter()

UPLOAD_DIR = "uploads/warehouse_materials"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/materials", response_model=WarehouseMaterialResponse)
async def create_material(
    material_in: WarehouseMaterialCreate,
    db: AsyncSession = Depends(get_db)
):
    new_record = WarehouseMaterial(
        material_code=material_in.material_code,
        material_name=material_in.material_name,
        warehouse_location=material_in.warehouse_location,
        quantity=material_in.quantity,
        remarks=material_in.remarks
    )
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    
    # Reload with relationships
    stmt = select(WarehouseMaterial).where(WarehouseMaterial.id == new_record.id).options(selectinload(WarehouseMaterial.images))
    result = await db.execute(stmt)
    return result.scalars().first()

@router.post("/materials/{material_id}/images", response_model=List[WarehouseMaterialImageResponse])
async def upload_material_images(
    material_id: int,
    images: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Check if material exists
    result = await db.execute(select(WarehouseMaterial).where(WarehouseMaterial.id == material_id))
    material = result.scalars().first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    saved_images = []
    
    for image in images:
        # Create a directory per material
        material_dir = os.path.join(UPLOAD_DIR, f"mat_{material_id}")
        os.makedirs(material_dir, exist_ok=True)
        
        file_location = os.path.join(material_dir, image.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        image_url = f"/uploads/warehouse_materials/mat_{material_id}/{image.filename}"
        
        new_img = WarehouseMaterialImage(
            material_id=material_id,
            image_url=image_url,
            uploaded_by="System" # In a real app, extract from token
        )
        db.add(new_img)
        saved_images.append(new_img)

    await db.commit()
    for img in saved_images:
        await db.refresh(img)
        
    return saved_images

@router.get("/materials", response_model=List[WarehouseMaterialResponse])
async def list_materials(db: AsyncSession = Depends(get_db)):
    stmt = select(WarehouseMaterial).options(selectinload(WarehouseMaterial.images)).order_by(WarehouseMaterial.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
