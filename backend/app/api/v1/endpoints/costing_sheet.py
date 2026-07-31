from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.costing_sheet import (
    CostingSheet, CostingConstruction, CostingYarnLine, CostingWarping, CostingWashing, CostingSummary
)
from app.schemas.costing_sheet import CostingSheetCreate, CostingSheetUpdate, CostingSheetOut

router = APIRouter()

@router.get("/", response_model=List[CostingSheetOut])
async def read_costing_sheets(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Retrieve all costing sheets."""
    result = await db.execute(
        select(CostingSheet)
        .options(
            selectinload(CostingSheet.construction_details),
            selectinload(CostingSheet.yarn_lines),
            selectinload(CostingSheet.warping_details),
            selectinload(CostingSheet.washing_details),
            selectinload(CostingSheet.summary)
        )
        .order_by(desc(CostingSheet.created_at))
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@router.post("/", response_model=CostingSheetOut, status_code=status.HTTP_201_CREATED)
async def create_costing_sheet(
    *,
    db: AsyncSession = Depends(get_db),
    costing_sheet_in: CostingSheetCreate
) -> Any:
    """Create new costing sheet with nested details."""
    if not costing_sheet_in.costing_no:
        last_sheet_q = await db.execute(select(CostingSheet).order_by(desc(CostingSheet.id)).limit(1))
        last_sheet = last_sheet_q.scalar_one_or_none()
        last_id = last_sheet.id if last_sheet else 0
        costing_sheet_in.costing_no = f"CS-{(last_id + 1):05d}"

    data = costing_sheet_in.model_dump(exclude_unset=True)
    
    construction_data = data.pop("construction_details", None)
    yarn_lines_data = data.pop("yarn_lines", [])
    warping_data = data.pop("warping_details", None)
    washing_data = data.pop("washing_details", None)
    summary_data = data.pop("summary", None)

    db_obj = CostingSheet(**data)
    
    if construction_data:
        db_obj.construction_details = CostingConstruction(**construction_data)
    if yarn_lines_data:
        db_obj.yarn_lines = [CostingYarnLine(**yl) for yl in yarn_lines_data]
    if warping_data:
        db_obj.warping_details = CostingWarping(**warping_data)
    if washing_data:
        db_obj.washing_details = CostingWashing(**washing_data)
    if summary_data:
        db_obj.summary = CostingSummary(**summary_data)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    # Reload with relationships
    result = await db.execute(
        select(CostingSheet)
        .options(
            selectinload(CostingSheet.construction_details),
            selectinload(CostingSheet.yarn_lines),
            selectinload(CostingSheet.warping_details),
            selectinload(CostingSheet.washing_details),
            selectinload(CostingSheet.summary)
        ).where(CostingSheet.id == db_obj.id)
    )
    return result.scalar_one()

@router.put("/{id}", response_model=CostingSheetOut)
async def update_costing_sheet(
    *,
    id: int,
    db: AsyncSession = Depends(get_db),
    costing_sheet_in: CostingSheetUpdate
) -> Any:
    """Update an existing costing sheet with nested details."""
    result = await db.execute(
        select(CostingSheet)
        .options(
            selectinload(CostingSheet.construction_details),
            selectinload(CostingSheet.yarn_lines),
            selectinload(CostingSheet.warping_details),
            selectinload(CostingSheet.washing_details),
            selectinload(CostingSheet.summary)
        )
        .where(CostingSheet.id == id)
    )
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Costing sheet not found")
    
    data = costing_sheet_in.model_dump(exclude_unset=True)
    
    construction_data = data.pop("construction_details", None)
    yarn_lines_data = data.pop("yarn_lines", None)
    warping_data = data.pop("warping_details", None)
    washing_data = data.pop("washing_details", None)
    summary_data = data.pop("summary", None)

    for field, value in data.items():
        setattr(db_obj, field, value)
        
    if construction_data is not None:
        if db_obj.construction_details:
            for k, v in construction_data.items():
                setattr(db_obj.construction_details, k, v)
        else:
            db_obj.construction_details = CostingConstruction(**construction_data)
            
    if yarn_lines_data is not None:
        # Simple replace for list elements
        for old_yl in db_obj.yarn_lines:
            await db.delete(old_yl)
        db_obj.yarn_lines = [CostingYarnLine(**yl) for yl in yarn_lines_data]

    if warping_data is not None:
        if db_obj.warping_details:
            for k, v in warping_data.items():
                setattr(db_obj.warping_details, k, v)
        else:
            db_obj.warping_details = CostingWarping(**warping_data)

    if washing_data is not None:
        if db_obj.washing_details:
            for k, v in washing_data.items():
                setattr(db_obj.washing_details, k, v)
        else:
            db_obj.washing_details = CostingWashing(**washing_data)

    if summary_data is not None:
        if db_obj.summary:
            for k, v in summary_data.items():
                setattr(db_obj.summary, k, v)
        else:
            db_obj.summary = CostingSummary(**summary_data)

    db.add(db_obj)
    await db.commit()
    
    # Reload with relationships
    result = await db.execute(
        select(CostingSheet)
        .options(
            selectinload(CostingSheet.construction_details),
            selectinload(CostingSheet.yarn_lines),
            selectinload(CostingSheet.warping_details),
            selectinload(CostingSheet.washing_details),
            selectinload(CostingSheet.summary)
        ).where(CostingSheet.id == db_obj.id)
    )
    return result.scalar_one()

@router.get("/{id}", response_model=CostingSheetOut)
async def read_costing_sheet(
    *,
    id: int,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get costing sheet by ID."""
    result = await db.execute(
        select(CostingSheet)
        .options(
            selectinload(CostingSheet.construction_details),
            selectinload(CostingSheet.yarn_lines),
            selectinload(CostingSheet.warping_details),
            selectinload(CostingSheet.washing_details),
            selectinload(CostingSheet.summary)
        )
        .where(CostingSheet.id == id)
    )
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Costing sheet not found")
    return db_obj

@router.delete("/{id}")
async def delete_costing_sheet(
    *,
    db: AsyncSession = Depends(get_db),
    id: int
) -> Any:
    """Delete a costing sheet."""
    result = await db.execute(select(CostingSheet).where(CostingSheet.id == id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Costing Sheet not found")
    
    await db.delete(db_obj)
    await db.commit()
    return {"message": "Costing Sheet deleted successfully"}
