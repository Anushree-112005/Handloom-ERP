"""Stationary Module API Router."""
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from typing import Dict, Any, List
import os
import uuid

from app.core.database import get_db
from app.modules.stationary.models import (
    StationaryItem, MaterialCategory, UOMMaster, StationaryWarehouse, MaterialMaster,
    SwatchCard, FabricInspectionRoll, ReturnableDC
)
from app.modules.stationary.schemas import (
    CategoryCreate, CategoryResponse,
    UOMCreate, UOMResponse,
    MaterialCreate, MaterialResponse,
    SwatchCardCreate, SwatchCardResponse,
    FabricInspectionRollCreate, FabricInspectionRollResponse,
    ReturnableDCCreate, ReturnableDCResponse
)

router = APIRouter(prefix="/stationary", tags=["Stationary"])

# ─── MASTER DATA ENDPOINTS ───
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MaterialCategory))
    return result.scalars().all()

@router.post("/categories", response_model=CategoryResponse)
async def create_category(payload: CategoryCreate, db: AsyncSession = Depends(get_db)):
    db_obj = MaterialCategory(**payload.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: int, payload: CategoryCreate, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(MaterialCategory, category_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(MaterialCategory, category_id)
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
    return None

@router.get("/uoms", response_model=List[UOMResponse])
async def list_uoms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UOMMaster))
    return result.scalars().all()

@router.post("/uoms", response_model=UOMResponse)
async def create_uom(payload: UOMCreate, db: AsyncSession = Depends(get_db)):
    db_obj = UOMMaster(**payload.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.put("/uoms/{uom_id}", response_model=UOMResponse)
async def update_uom(uom_id: int, payload: UOMCreate, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(UOMMaster, uom_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.delete("/uoms/{uom_id}", status_code=204)
async def delete_uom(uom_id: int, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(UOMMaster, uom_id)
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
    return None

@router.get("/materials", response_model=List[MaterialResponse])
async def list_materials(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MaterialMaster))
    return result.scalars().all()

@router.post("/materials", response_model=MaterialResponse)
async def create_material(payload: MaterialCreate, db: AsyncSession = Depends(get_db)):
    db_obj = MaterialMaster(**payload.model_dump())
    db.add(db_obj)
    try:
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Failed to create material. Item code might already exist.")

@router.put("/materials/{material_id}", response_model=MaterialResponse)
async def update_material(material_id: int, payload: MaterialCreate, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(MaterialMaster, material_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items():
        setattr(db_obj, k, v)
    try:
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Failed to update material. Check for duplicate code.")

@router.delete("/materials/{material_id}")
async def delete_material(material_id: int, db: AsyncSession = Depends(get_db)):
    db_obj = await db.get(MaterialMaster, material_id)
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
    return {"message": "Deleted successfully"}

# ─── SWATCH CARD ENDPOINTS ───
@router.get("/swatches/all", response_model=List[SwatchCardResponse])
async def list_swatch_cards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SwatchCard).order_by(desc(SwatchCard.created_at)))
    return result.scalars().all()

@router.post("/swatches/create", response_model=SwatchCardResponse, status_code=201)
async def create_swatch_card(payload: SwatchCardCreate, db: AsyncSession = Depends(get_db)):
    db_card = SwatchCard(**payload.model_dump())
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)
    return db_card

@router.put("/swatches/{card_id}", response_model=SwatchCardResponse)
async def update_swatch_card(card_id: int, payload: SwatchCardCreate, db: AsyncSession = Depends(get_db)):
    db_card = await db.get(SwatchCard, card_id)
    if not db_card:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items():
        setattr(db_card, k, v)
    await db.commit()
    await db.refresh(db_card)
    return db_card

@router.delete("/swatches/{card_id}", status_code=204)
async def delete_swatch_card(card_id: int, db: AsyncSession = Depends(get_db)):
    db_card = await db.get(SwatchCard, card_id)
    if db_card:
        await db.delete(db_card)
        await db.commit()
    return None

@router.post("/swatches/upload-attachment")
async def upload_swatch_attachment(file: UploadFile = File(...)):
    return {"attachment_path": f"/uploads/swatches/{file.filename}"}

# ─── FABRIC INSPECTION PIECE-TO-PIECE ENDPOINTS ───
@router.get("/inspection-rolls/{fabric_inward_id}", response_model=List[FabricInspectionRollResponse])
async def list_inspection_rolls(fabric_inward_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FabricInspectionRoll).where(FabricInspectionRoll.fabric_inward_id == fabric_inward_id))
    return result.scalars().all()

@router.post("/inspection-rolls/save", response_model=FabricInspectionRollResponse, status_code=201)
async def save_inspection_roll(payload: FabricInspectionRollCreate, db: AsyncSession = Depends(get_db)):
    db_roll = FabricInspectionRoll(**payload.model_dump())
    db.add(db_roll)
    await db.commit()
    await db.refresh(db_roll)
    return db_roll

@router.delete("/inspection-rolls/{roll_id}", status_code=204)
async def delete_inspection_roll(roll_id: int, db: AsyncSession = Depends(get_db)):
    db_roll = await db.get(FabricInspectionRoll, roll_id)
    if db_roll:
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
    db_dc = ReturnableDC(**payload.model_dump())
    db.add(db_dc)
    await db.commit()
    await db.refresh(db_dc)
    return db_dc

@router.put("/returnable-dc/{dc_id}", response_model=ReturnableDCResponse)
async def update_returnable_dc(dc_id: int, payload: ReturnableDCCreate, db: AsyncSession = Depends(get_db)):
    db_dc = await db.get(ReturnableDC, dc_id)
    if not db_dc:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump().items():
        setattr(db_dc, k, v)
    await db.commit()
    await db.refresh(db_dc)
    return db_dc

@router.delete("/returnable-dc/{dc_id}", status_code=204)
async def delete_returnable_dc(dc_id: int, db: AsyncSession = Depends(get_db)):
    db_dc = await db.get(ReturnableDC, dc_id)
    if db_dc:
        await db.delete(db_dc)
        await db.commit()
    return None

@router.post("/po/upload-quotation")
async def upload_po_quotation(file: UploadFile = File(...)):
    return {"quotation_file_path": f"/uploads/quotations/{file.filename}"}

# ─── GENERIC CATEGORY ENDPOINTS (LEGACY MOCKDB SUPPORT) ───

@router.get("/{category}")
async def list_stationary_items(category: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationaryItem).where(StationaryItem.category == category).order_by(StationaryItem.id))
    items = result.scalars().all()
    return [{"id": item.id, "category": item.category, **item.data} for item in items]

@router.post("/{category}", status_code=201)
async def create_stationary_item(category: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    item_id = payload.get("id") or payload.get("itemId")
    if item_id:
        result = await db.execute(select(StationaryItem).where(StationaryItem.category == category))
        for it in result.scalars().all():
            if str(it.data.get("id")) == str(item_id) or str(it.data.get("itemId")) == str(item_id) or str(it.id) == str(item_id):
                it.data = {**it.data, **payload}
                await db.commit()
                await db.refresh(it)
                return {"id": it.id, "category": it.category, **it.data}

    db_item = StationaryItem(category=category, data=payload)
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return {"id": db_item.id, "category": db_item.category, **db_item.data}

@router.post("/{category}/bulk", status_code=201)
async def bulk_save_stationary_items(category: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(StationaryItem).where(StationaryItem.category == category))
    items = payload.get("items") or []
    for item in items:
        db_item = StationaryItem(category=category, data=item)
        db.add(db_item)
    await db.commit()
    return {"message": f"Successfully bulk-saved items for {category}"}

@router.put("/{category}/{item_id}")
async def update_stationary_item(category: str, item_id: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationaryItem).where(StationaryItem.category == category))
    for it in result.scalars().all():
        if str(it.data.get("id")) == str(item_id) or str(it.id) == str(item_id):
            it.data = {**it.data, **payload}
            await db.commit()
            return {"id": it.id, "category": it.category, **it.data}
    raise HTTPException(status_code=404)

@router.delete("/{category}/{item_id}", status_code=204)
async def delete_stationary_item(category: str, item_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationaryItem).where(StationaryItem.category == category))
    for it in result.scalars().all():
        if str(it.data.get("id")) == str(item_id) or str(it.id) == str(item_id):
            await db.delete(it)
            await db.commit()
            return None
    raise HTTPException(status_code=404)
