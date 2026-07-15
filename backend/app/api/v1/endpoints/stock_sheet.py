from typing import Any, List, Optional, Dict, Any as AnyType
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

from app.core.database import get_db
from app.models.stock_sheet import StockSheetItem

router = APIRouter()

# --- Schemas ---
class StockSheetBase(BaseModel):
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category: Optional[str] = None
    material_type: Optional[str] = None
    warehouse: Optional[str] = None
    batch_no: Optional[str] = None
    unit: Optional[str] = "Kg"
    
    opening_stock: Optional[float] = 0.0
    stock_in: Optional[float] = 0.0
    stock_out: Optional[float] = 0.0
    current_stock: Optional[float] = 0.0
    reserved_stock: Optional[float] = 0.0
    available_stock: Optional[float] = 0.0
    reorder_level: Optional[float] = 0.0
    
    unit_cost: Optional[float] = 0.0
    stock_value: Optional[float] = 0.0
    last_transaction_date: Optional[date] = None
    
    status: Optional[str] = "In Stock"
    
    stock_summary: Optional[Dict[str, AnyType]] = {}
    movements: Optional[List[Dict[str, AnyType]]] = []
    batches: Optional[List[Dict[str, AnyType]]] = []
    valuation: Optional[Dict[str, AnyType]] = {}

class StockSheetCreate(StockSheetBase):
    pass

class StockSheetUpdate(StockSheetBase):
    pass

class StockSheetInDBBase(StockSheetBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class StockSheetResponse(StockSheetInDBBase):
    pass

# --- Endpoints ---

@router.get("/", response_model=List[StockSheetResponse])
async def read_stock_sheets(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Retrieve all stock sheet items."""
    result = await db.execute(select(StockSheetItem).order_by(desc(StockSheetItem.created_at)).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/", response_model=StockSheetResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_sheet_item(
    *,
    db: AsyncSession = Depends(get_db),
    item_in: StockSheetCreate
) -> Any:
    """Create new stock sheet item (For integration/testing purposes)."""
    db_obj = StockSheetItem(**item_in.model_dump(exclude_unset=True))
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=StockSheetResponse)
async def read_stock_sheet_item(
    *,
    id: int,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get stock sheet item by ID."""
    result = await db.execute(select(StockSheetItem).where(StockSheetItem.id == id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Stock Sheet item not found")
    return db_obj

@router.put("/{id}", response_model=StockSheetResponse)
async def update_stock_sheet_item(
    *,
    id: int,
    db: AsyncSession = Depends(get_db),
    item_in: StockSheetUpdate
) -> Any:
    """Update stock sheet item."""
    result = await db.execute(select(StockSheetItem).where(StockSheetItem.id == id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Stock Sheet item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

@router.delete("/{id}")
async def delete_stock_sheet_item(
    *,
    id: int,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Delete a stock sheet item."""
    result = await db.execute(select(StockSheetItem).where(StockSheetItem.id == id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Stock Sheet item not found")
    
    await db.delete(db_obj)
    await db.commit()
    return {"message": "Stock Sheet item deleted successfully"}
