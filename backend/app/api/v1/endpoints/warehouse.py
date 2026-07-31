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

# GODOWN ENDPOINTS

from sqlalchemy import text
from sqlalchemy.orm import selectinload
from app.models.warehouse import Warehouse, WarehouseZone, WarehouseRack, WarehouseBin
from app.schemas.warehouse import WarehouseCreate, GodownSummary

@router.get("/godowns", response_model=List[GodownSummary])
async def list_godowns(db: AsyncSession = Depends(get_db)):
    # Auto-migration for location column
    try:
        await db.execute(text("ALTER TABLE erp_warehouses ADD COLUMN location VARCHAR(100)"))
        await db.commit()
    except Exception:
        await db.rollback()
        
    stmt = select(Warehouse).options(
        selectinload(Warehouse.zones).selectinload(WarehouseZone.racks).selectinload(WarehouseRack.bins)
    ).order_by(Warehouse.id.asc())
    result = await db.execute(stmt)
    warehouses = result.scalars().all()
    
    summaries = []
    for w in warehouses:
        total_racks = sum(len(z.racks) for z in w.zones)
        total_bins = sum(len(r.bins) for z in w.zones for r in z.racks)
        summaries.append({
            "id": w.id,
            "name": w.name,
            "location": getattr(w, "location", ""),
            "type": w.type,
            "is_active": w.is_active,
            "racks": total_racks,
            "bins": total_bins
        })
    return summaries

@router.post("/godowns", response_model=GodownSummary)
async def create_godown(godown: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    new_w = Warehouse(
        name=godown.name,
        location=godown.location,
        type=godown.type,
        is_active=godown.is_active
    )
    db.add(new_w)
    await db.commit()
    await db.refresh(new_w)
    return {
        "id": new_w.id,
        "name": new_w.name,
        "location": new_w.location,
        "type": new_w.type,
        "is_active": new_w.is_active,
        "racks": 0,
        "bins": 0
    }

@router.put("/godowns/{godown_id}", response_model=GodownSummary)
async def update_godown(godown_id: int, godown: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse).options(
        selectinload(Warehouse.zones).selectinload(WarehouseZone.racks).selectinload(WarehouseRack.bins)
    ).where(Warehouse.id == godown_id))
    w = result.scalars().first()
    
    if not w:
        raise HTTPException(status_code=404, detail="Godown not found")
        
    w.name = godown.name
    w.location = godown.location
    w.type = godown.type
    w.is_active = godown.is_active
    
    await db.commit()
    await db.refresh(w)
    
    total_racks = sum(len(z.racks) for z in w.zones)
    total_bins = sum(len(r.bins) for z in w.zones for r in z.racks)
    
    return {
        "id": w.id,
        "name": w.name,
        "location": w.location,
        "type": w.type,
        "is_active": w.is_active,
        "racks": total_racks,
        "bins": total_bins
    }

# WAREHOUSE INWARD / OUTWARD ENDPOINTS
from app.models.warehouse import WarehouseStaging, WarehousePutAway, WarehousePickList
from app.schemas.warehouse import WarehouseStagingCreate, WarehouseStaging as WarehouseStagingSchema
from app.schemas.warehouse import WarehousePutAwayCreate, WarehousePutAway as WarehousePutAwaySchema
from app.schemas.warehouse import WarehousePickListCreate, WarehousePickList as WarehousePickListSchema

@router.get("/staging", response_model=List[WarehouseStagingSchema])
async def list_staging(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehouseStaging).order_by(WarehouseStaging.id.desc()))
    return result.scalars().all()

@router.post("/staging", response_model=WarehouseStagingSchema)
async def create_staging(staging: WarehouseStagingCreate, db: AsyncSession = Depends(get_db)):
    new_staging = WarehouseStaging(**staging.model_dump())
    db.add(new_staging)
    await db.commit()
    await db.refresh(new_staging)
    return new_staging

@router.get("/put-away", response_model=List[WarehousePutAwaySchema])
async def list_putaway(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehousePutAway).order_by(WarehousePutAway.id.desc()))
    return result.scalars().all()

@router.post("/put-away", response_model=WarehousePutAwaySchema)
async def create_putaway(putaway: WarehousePutAwayCreate, db: AsyncSession = Depends(get_db)):
    new_putaway = WarehousePutAway(**putaway.model_dump())
    db.add(new_putaway)
    await db.commit()
    await db.refresh(new_putaway)
    return new_putaway

@router.get("/pick-list", response_model=List[WarehousePickListSchema])
async def list_picklist(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarehousePickList).order_by(WarehousePickList.id.desc()))
    return result.scalars().all()

@router.post("/pick-list", response_model=WarehousePickListSchema)
async def create_picklist(picklist: WarehousePickListCreate, db: AsyncSession = Depends(get_db)):
    new_picklist = WarehousePickList(**picklist.model_dump())
    db.add(new_picklist)
    await db.commit()
    await db.refresh(new_picklist)
    return new_picklist
