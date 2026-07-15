from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.costing_sheet import CostingSheet
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any as AnyType
from datetime import date

router = APIRouter()

# --- Schemas ---
class CostingSheetBase(BaseModel):
    costing_no: Optional[str] = None
    buyer: Optional[str] = None
    buyer_order: Optional[str] = None
    sales_order: Optional[str] = None
    product: Optional[str] = None
    style_no: Optional[str] = None
    fabric_type: Optional[str] = None
    fabric_construction: Optional[str] = None
    gsm: Optional[str] = None
    width: Optional[str] = None
    color: Optional[str] = None
    quantity: Optional[float] = 0.0
    unit: Optional[str] = "Kg"
    delivery_date: Optional[date] = None
    currency: Optional[str] = "INR"
    exchange_rate: Optional[float] = 1.0
    remarks: Optional[str] = None

    status: Optional[str] = "Draft"
    prepared_by: Optional[str] = None
    reviewed_by: Optional[str] = None
    approved_by: Optional[str] = None
    approval_date: Optional[date] = None
    comments: Optional[str] = None
    approval_history: Optional[List[Dict[str, AnyType]]] = []

    bom_items: Optional[List[Dict[str, AnyType]]] = []
    process_costs: Optional[List[Dict[str, AnyType]]] = []
    labour_costs: Optional[List[Dict[str, AnyType]]] = []
    machine_costs: Optional[List[Dict[str, AnyType]]] = []
    overhead_costs: Optional[List[Dict[str, AnyType]]] = []
    logistics_packing: Optional[Dict[str, AnyType]] = {}
    testing_costs: Optional[List[Dict[str, AnyType]]] = []
    wastage: Optional[List[Dict[str, AnyType]]] = []

    estimated_cost: Optional[float] = 0.0
    actual_cost: Optional[float] = 0.0
    selling_price: Optional[float] = 0.0
    profit_margin_pct: Optional[float] = 0.0

class CostingSheetCreate(CostingSheetBase):
    pass

class CostingSheetUpdate(CostingSheetBase):
    pass

class CostingSheetInDBBase(CostingSheetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class CostingSheetResponse(CostingSheetInDBBase):
    pass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# --- Endpoints ---

@router.get("/", response_model=List[CostingSheetResponse])
async def read_costing_sheets(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Retrieve all costing sheets."""
    result = await db.execute(select(CostingSheet).order_by(desc(CostingSheet.created_at)).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/", response_model=CostingSheetResponse, status_code=status.HTTP_201_CREATED)
async def create_costing_sheet(
    *,
    db: AsyncSession = Depends(get_db),
    costing_sheet_in: CostingSheetCreate
) -> Any:
    """Create new costing sheet."""
    # Generate auto costing no if not provided
    if not costing_sheet_in.costing_no:
        last_sheet_q = await db.execute(select(CostingSheet).order_by(desc(CostingSheet.id)).limit(1))
        last_sheet = last_sheet_q.scalar_one_or_none()
        last_id = last_sheet.id if last_sheet else 0
        costing_sheet_in.costing_no = f"CS-{str(last_id + 1).zfill(5)}"

    db_obj = CostingSheet(**costing_sheet_in.model_dump(exclude_unset=True))
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=CostingSheetResponse)
async def update_costing_sheet(
    *,
    id: int,
    db: AsyncSession = Depends(get_db),
    costing_sheet_in: CostingSheetUpdate
) -> Any:
    """Update an existing costing sheet."""
    result = await db.execute(select(CostingSheet).where(CostingSheet.id == id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Costing sheet not found")
    
    update_data = costing_sheet_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=CostingSheetResponse)
async def read_costing_sheet(
    *,
    id: int,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get costing sheet by ID."""
    result = await db.execute(select(CostingSheet).where(CostingSheet.id == id))
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
