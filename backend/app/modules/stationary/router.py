"""Stationary Module API Router."""
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from typing import Dict, Any, List
import os
import uuid

from app.core.database import get_db
from app.modules.stationary.models import StationaryItem, SwatchCard, FabricInspectionRoll, ReturnableDC
from app.modules.stationary.schemas import (
    SwatchCardCreate, SwatchCardResponse,
    FabricInspectionRollCreate, FabricInspectionRollResponse,
    ReturnableDCCreate, ReturnableDCResponse
)

router = APIRouter(prefix="/stationary", tags=["Stationary"])

# ─── SWATCH CARD ENDPOINTS ───

@router.get("/swatches/all", response_model=List[SwatchCardResponse])
async def list_swatch_cards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SwatchCard).order_by(desc(SwatchCard.created_at)))
    return result.scalars().all()

@router.post("/swatches/create", response_model=SwatchCardResponse, status_code=201)
async def create_swatch_card(payload: SwatchCardCreate, db: AsyncSession = Depends(get_db)):
    # Check if digital_id already exists
    existing = await db.execute(select(SwatchCard).where(SwatchCard.digital_id == payload.digital_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Swatch Card with digital ID '{payload.digital_id}' already exists.")
        
    db_card = SwatchCard(**payload.model_dump())
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)
    return db_card

@router.put("/swatches/{card_id}", response_model=SwatchCardResponse)
async def update_swatch_card(card_id: int, payload: SwatchCardCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SwatchCard).where(SwatchCard.id == card_id))
    db_card = result.scalar_one_or_none()
    if not db_card:
        raise HTTPException(status_code=404, detail="Swatch Card not found")
        
    for key, value in payload.model_dump().items():
        setattr(db_card, key, value)
        
    await db.commit()
    await db.refresh(db_card)
    return db_card

@router.delete("/swatches/{card_id}", status_code=204)
async def delete_swatch_card(card_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SwatchCard).where(SwatchCard.id == card_id))
    db_card = result.scalar_one_or_none()
    if not db_card:
        raise HTTPException(status_code=404, detail="Swatch Card not found")
    await db.delete(db_card)
    await db.commit()
    return None

@router.post("/swatches/upload-attachment")
async def upload_swatch_attachment(file: UploadFile = File(...)):
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "uploads", "swatches")
    os.makedirs(uploads_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".png"
    filename = f"swatch_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(uploads_dir, filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
        
    return {"attachment_path": f"/uploads/swatches/{filename}"}


# ─── FABRIC INSPECTION PIECE-TO-PIECE ENDPOINTS ───

@router.get("/inspection-rolls/{fabric_inward_id}", response_model=List[FabricInspectionRollResponse])
async def list_inspection_rolls(fabric_inward_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FabricInspectionRoll).where(FabricInspectionRoll.fabric_inward_id == fabric_inward_id))
    return result.scalars().all()

@router.post("/inspection-rolls/save", response_model=FabricInspectionRollResponse, status_code=201)
async def save_inspection_roll(payload: FabricInspectionRollCreate, db: AsyncSession = Depends(get_db)):
    # If roll already exists for this inward, update it. Otherwise create it.
    result = await db.execute(
        select(FabricInspectionRoll)
        .where(FabricInspectionRoll.fabric_inward_id == payload.fabric_inward_id)
        .where(FabricInspectionRoll.roll_no == payload.roll_no)
    )
    db_roll = result.scalar_one_or_none()
    
    if db_roll:
        for key, value in payload.model_dump().items():
            setattr(db_roll, key, value)
    else:
        db_roll = FabricInspectionRoll(**payload.model_dump())
        db.add(db_roll)
        
    await db.commit()
    await db.refresh(db_roll)
    return db_roll

@router.delete("/inspection-rolls/{roll_id}", status_code=204)
async def delete_inspection_roll(roll_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FabricInspectionRoll).where(FabricInspectionRoll.id == roll_id))
    db_roll = result.scalar_one_or_none()
    if not db_roll:
        raise HTTPException(status_code=404, detail="Roll record not found")
    await db.delete(db_roll)
    await db.commit()
    return None


# ─── RETURNABLE DC ENDPOINTS ───

@router.get("/returnable-dc/all", response_model=List[ReturnableDCResponse])
async def list_returnable_dcs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReturnableDC).order_by(desc(ReturnableDC.date)))
    return result.scalars().all()

@router.post("/returnable-dc/create", response_model=ReturnableDCResponse, status_code=201)
async def create_returnable_dc(payload: ReturnableDCCreate, db: AsyncSession = Depends(get_db)):
    # Check if dc_no already exists
    existing = await db.execute(select(ReturnableDC).where(ReturnableDC.dc_no == payload.dc_no))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"DC with number '{payload.dc_no}' already exists.")
        
    db_dc = ReturnableDC(**payload.model_dump())
    db.add(db_dc)
    await db.commit()
    await db.refresh(db_dc)
    return db_dc

@router.put("/returnable-dc/{dc_id}", response_model=ReturnableDCResponse)
async def update_returnable_dc(dc_id: int, payload: ReturnableDCCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReturnableDC).where(ReturnableDC.id == dc_id))
    db_dc = result.scalar_one_or_none()
    if not db_dc:
        raise HTTPException(status_code=404, detail="DC not found")
        
    for key, value in payload.model_dump().items():
        setattr(db_dc, key, value)
        
    await db.commit()
    await db.refresh(db_dc)
    return db_dc

@router.delete("/returnable-dc/{dc_id}", status_code=204)
async def delete_returnable_dc(dc_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReturnableDC).where(ReturnableDC.id == dc_id))
    db_dc = result.scalar_one_or_none()
    if not db_dc:
        raise HTTPException(status_code=404, detail="DC not found")
    await db.delete(db_dc)
    await db.commit()
    return None

@router.post("/po/upload-quotation")
async def upload_po_quotation(file: UploadFile = File(...)):
    uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "uploads", "quotations")
    os.makedirs(uploads_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".pdf"
    filename = f"quotation_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(uploads_dir, filename)
    
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
        
    return {"quotation_file_path": f"/uploads/quotations/{filename}"}


# ─── GENERIC CATEGORY ENDPOINTS (Moved to bottom to prevent collision) ───

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

