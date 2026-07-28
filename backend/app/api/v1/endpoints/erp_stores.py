from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.store import Store
from app.schemas.store import StoreCreate, Store as StoreSchema

router = APIRouter()

@router.get("/", response_model=List[StoreSchema])
async def get_stores(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Store))
    return result.scalars().all()

@router.post("/", response_model=StoreSchema)
async def create_store(store: StoreCreate, db: AsyncSession = Depends(get_db)):
    db_store = Store(**store.model_dump())
    db.add(db_store)
    await db.commit()
    await db.refresh(db_store)
    return db_store

from app.schemas.store import StoreTransferRequest
from app.models.stock import StockMovement, CurrentStock

@router.post("/transfer")
async def transfer_store_stock(request: StoreTransferRequest, db: AsyncSession = Depends(get_db)):
    # Verify stores exist
    from_store = await db.execute(select(Store).where(Store.id == request.from_store_id))
    to_store = await db.execute(select(Store).where(Store.id == request.to_store_id))
    
    if not from_store.scalars().first() or not to_store.scalars().first():
        raise HTTPException(status_code=404, detail="Store not found")
        
    # Find current stock in from_store
    stmt = select(CurrentStock).where(
        CurrentStock.item_id == request.item_id,
        CurrentStock.location_id == request.from_store_id,
        CurrentStock.location_type == "STORE"
    )
    result = await db.execute(stmt)
    current_stock = result.scalars().first()
    
    if not current_stock or current_stock.quantity < request.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in source store")
        
    # Deduct from source
    current_stock.quantity -= request.quantity
    
    # Add to destination
    dest_stmt = select(CurrentStock).where(
        CurrentStock.item_id == request.item_id,
        CurrentStock.location_id == request.to_store_id,
        CurrentStock.location_type == "STORE"
    )
    dest_result = await db.execute(dest_stmt)
    dest_stock = dest_result.scalars().first()
    
    if dest_stock:
        dest_stock.quantity += request.quantity
    else:
        new_stock = CurrentStock(
            item_id=request.item_id,
            location_id=request.to_store_id,
            location_type="STORE",
            quantity=request.quantity,
            status="AVAILABLE"
        )
        db.add(new_stock)
        
    # Log movements
    issue_movement = StockMovement(
        item_id=request.item_id,
        source_location_id=request.from_store_id,
        location_type="STORE",
        transaction_type="ISSUE",
        quantity=-request.quantity,
        user_id=request.user_id
    )
    receipt_movement = StockMovement(
        item_id=request.item_id,
        dest_location_id=request.to_store_id,
        location_type="STORE",
        transaction_type="RECEIPT",
        quantity=request.quantity,
        user_id=request.user_id
    )
    db.add_all([issue_movement, receipt_movement])
    
    await db.commit()
    return {"status": "success", "message": "Stock transferred successfully"}

@router.get("/dashboard-metrics")
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    # Mocking some aggregated data for now
    # In a real app, you would query CurrentStock, PurchaseRequests, etc.
    return {
        "pending_requests": 14,
        "items_below_reorder": 23,
        "total_store_value": "1,24,500"
    }
