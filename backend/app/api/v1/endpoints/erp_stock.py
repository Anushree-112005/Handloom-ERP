from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.stock import StockMovement, CurrentStock
from app.schemas.stock import StockMovementCreate, StockMovement as StockMovementSchema, CurrentStock as CurrentStockSchema

router = APIRouter()

@router.get("/movements", response_model=List[StockMovementSchema])
async def get_stock_movements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StockMovement).order_by(StockMovement.timestamp.desc()).limit(100))
    return result.scalars().all()

from typing import List, Optional

@router.get("/current", response_model=List[CurrentStockSchema])
async def get_current_stock(
    category: Optional[str] = None,
    location_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CurrentStock)
    
    if category:
        cat_lower = category.lower()
        if cat_lower == 'yarn':
            from sqlalchemy import or_
            stmt = stmt.where(
                or_(
                    CurrentStock.item_id.startswith('YRN'),
                    CurrentStock.item_id.ilike('%ctn%'),
                    CurrentStock.item_id.ilike('%yarn%'),
                    CurrentStock.item_id.ilike('%cotton%'),
                    CurrentStock.item_id.ilike('%s %'),
                    CurrentStock.item_id.ilike('%s%')
                )
            )
        elif cat_lower == 'fabric':
            stmt = stmt.where(CurrentStock.item_id.startswith('FAB'))
        elif cat_lower == 'consumables':
            stmt = stmt.where(CurrentStock.item_id.startswith('CON'))
            
    if location_type:
        stmt = stmt.where(CurrentStock.location_type == location_type)
        
    if status:
        stmt = stmt.where(CurrentStock.status == status)
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/movement", response_model=StockMovementSchema)
async def create_stock_movement(movement: StockMovementCreate, db: AsyncSession = Depends(get_db)):
    db_movement = StockMovement(**movement.model_dump())
    db.add(db_movement)
    
    # Simple logic to update CurrentStock
    stmt = select(CurrentStock).where(
        CurrentStock.item_id == movement.item_id,
        CurrentStock.location_id == movement.dest_location_id,
        CurrentStock.location_type == movement.location_type
    )
    result = await db.execute(stmt)
    current_stock = result.scalars().first()
    
    if current_stock:
        current_stock.quantity += movement.quantity
    else:
        new_stock = CurrentStock(
            item_id=movement.item_id,
            location_id=movement.dest_location_id,
            location_type=movement.location_type,
            quantity=movement.quantity,
            status=movement.status or "AVAILABLE"
        )
        db.add(new_stock)

    await db.commit()
    await db.refresh(db_movement)
    return db_movement

from app.schemas.stock import QCApproveRequest

@router.post("/qc-approve", response_model=CurrentStockSchema)
async def qc_approve_stock(request: QCApproveRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(CurrentStock).where(CurrentStock.id == request.stock_id)
    result = await db.execute(stmt)
    current_stock = result.scalars().first()
    
    if not current_stock:
        raise HTTPException(status_code=404, detail="Stock not found")
        
    if current_stock.status != "IN_INSPECTION":
        raise HTTPException(status_code=400, detail=f"Stock is currently {current_stock.status}, cannot approve.")
        
    current_stock.status = request.new_status
    
    # Log movement
    qc_movement = StockMovement(
        item_id=current_stock.item_id,
        location_type=current_stock.location_type,
        dest_location_id=current_stock.location_id,
        transaction_type="QC_UPDATE",
        quantity=current_stock.quantity,
        status=request.new_status,
        user_id=request.user_id,
        tracking_id=current_stock.batch_id or current_stock.lot_id
    )
    db.add(qc_movement)
    
    await db.commit()
    await db.refresh(current_stock)
    return current_stock

from app.schemas.stock import StockStatusChangeRequest

@router.post("/change-status", response_model=CurrentStockSchema)
async def change_stock_status(request: StockStatusChangeRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch the source stock
    stmt = select(CurrentStock).where(CurrentStock.id == request.stock_id)
    result = await db.execute(stmt)
    source_stock = result.scalars().first()
    
    if not source_stock:
        raise HTTPException(status_code=404, detail="Stock not found")
        
    if source_stock.quantity < request.quantity_to_change:
        raise HTTPException(status_code=400, detail="Insufficient quantity to change status")
        
    if source_stock.status == request.new_status:
        raise HTTPException(status_code=400, detail="Stock is already in this status")
        
    # 2. Deduct from source stock
    source_stock.quantity -= request.quantity_to_change
    
    # 3. Add to new status stock (same location, same item, but new status)
    dest_stmt = select(CurrentStock).where(
        CurrentStock.item_id == source_stock.item_id,
        CurrentStock.location_id == source_stock.location_id,
        CurrentStock.location_type == source_stock.location_type,
        CurrentStock.batch_id == source_stock.batch_id,
        CurrentStock.status == request.new_status
    )
    dest_result = await db.execute(dest_stmt)
    dest_stock = dest_result.scalars().first()
    
    if dest_stock:
        dest_stock.quantity += request.quantity_to_change
    else:
        dest_stock = CurrentStock(
            item_id=source_stock.item_id,
            location_id=source_stock.location_id,
            location_type=source_stock.location_type,
            quantity=request.quantity_to_change,
            batch_id=source_stock.batch_id,
            lot_id=source_stock.lot_id,
            status=request.new_status
        )
        db.add(dest_stock)
        
    # 4. Log Movement (Status Change)
    movement = StockMovement(
        item_id=source_stock.item_id,
        source_location_id=source_stock.location_id,
        dest_location_id=source_stock.location_id,
        location_type=source_stock.location_type,
        transaction_type="STATUS_CHANGE",
        quantity=request.quantity_to_change,
        status=request.new_status,
        user_id=request.user_id,
        tracking_id=request.reference_id or source_stock.batch_id
    )
    db.add(movement)
    
    await db.commit()
    await db.refresh(dest_stock)
    
    return dest_stock
from app.models.stock import PhysicalAudit, PhysicalAuditItem
from app.schemas.stock import PhysicalAuditCreate, PhysicalAuditSchema

@router.post("/audit", response_model=PhysicalAuditSchema)
async def create_physical_audit(audit: PhysicalAuditCreate, db: AsyncSession = Depends(get_db)):
    # 1. Create Audit header
    db_audit = PhysicalAudit(
        location_type=audit.location_type,
        location_id=audit.location_id,
        audited_by=audit.audited_by,
        notes=audit.notes,
        status="COMPLETED"
    )
    db.add(db_audit)
    await db.flush() # To get audit ID
    
    # 2. Process items
    for item in audit.items:
        db_item = PhysicalAuditItem(
            audit_id=db_audit.id,
            item_id=item.item_id,
            batch_id=item.batch_id,
            lot_id=item.lot_id,
            system_qty=item.system_qty,
            physical_qty=item.physical_qty,
            variance=item.variance
        )
        
        # If variance exists, create adjustment StockMovement and update CurrentStock
        if item.variance != 0:
            # Find the current stock
            stmt = select(CurrentStock).where(
                CurrentStock.item_id == item.item_id,
                CurrentStock.location_type == audit.location_type,
                CurrentStock.location_id == audit.location_id,
                CurrentStock.batch_id == item.batch_id,
                CurrentStock.lot_id == item.lot_id,
                CurrentStock.status == "AVAILABLE"
            )
            result = await db.execute(stmt)
            current_stock = result.scalars().first()
            
            if current_stock:
                current_stock.quantity += item.variance
            else:
                # If physical quantity is found but no system stock existed
                current_stock = CurrentStock(
                    item_id=item.item_id,
                    location_type=audit.location_type,
                    location_id=audit.location_id,
                    quantity=item.physical_qty,
                    batch_id=item.batch_id,
                    lot_id=item.lot_id,
                    status="AVAILABLE"
                )
                db.add(current_stock)
                
            # Log movement
            movement = StockMovement(
                item_id=item.item_id,
                source_location_id=audit.location_id,
                dest_location_id=audit.location_id,
                location_type=audit.location_type,
                transaction_type="ADJUSTMENT",
                quantity=item.variance,
                user_id=audit.audited_by,
                tracking_id=item.batch_id or item.lot_id
            )
            db.add(movement)
            await db.flush()
            db_item.adjustment_movement_id = movement.id
            
        db.add(db_item)
        
    await db.commit()
    await db.refresh(db_audit)
    
    # Eagerly load items manually or return audit
    # For now, just return db_audit without eager items, or we can fetch them
    stmt_items = select(PhysicalAuditItem).where(PhysicalAuditItem.audit_id == db_audit.id)
    items_result = await db.execute(stmt_items)
    db_audit.items = items_result.scalars().all()
    
    return db_audit
from app.modules.stores_consumables.models import StoresItem
from app.modules.stationary.models import MaterialMaster

@router.get("/alerts", response_model=List[CurrentStockSchema])
async def get_low_stock_alerts(db: AsyncSession = Depends(get_db)):
    # 1. Get all current stock
    result = await db.execute(select(CurrentStock))
    all_stock = result.scalars().all()
    
    # 2. Get reorder levels from Masters
    stores_result = await db.execute(select(StoresItem.item_code, StoresItem.reorder_level))
    material_result = await db.execute(select(MaterialMaster.item_code, MaterialMaster.reorder_level))
    
    reorder_map = {}
    for row in stores_result:
        reorder_map[row.item_code] = row.reorder_level
    for row in material_result:
        reorder_map[row.item_code] = row.reorder_level
        
    # 3. Filter alerts
    alerts = []
    for stock in all_stock:
        # If item exists in master, use its reorder level, else use a default of 10 for demo purposes
        reorder_level = reorder_map.get(stock.item_id, 10.0) 
        if stock.quantity <= reorder_level:
            alerts.append(stock)
            
    return alerts
