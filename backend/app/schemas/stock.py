from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StockMovementBase(BaseModel):
    item_id: str
    source_location_id: Optional[int] = None
    dest_location_id: Optional[int] = None
    location_type: str
    transaction_type: str
    quantity: float
    tracking_id: Optional[str] = None
    user_id: Optional[int] = None
    status: Optional[str] = "AVAILABLE"

class StockMovementCreate(StockMovementBase):
    pass

class StockMovement(StockMovementBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class CurrentStockBase(BaseModel):
    item_id: str
    location_id: int
    location_type: str
    quantity: float
    reserved_quantity: float = 0.0
    batch_id: Optional[str] = None
    lot_id: Optional[str] = None
    status: Optional[str] = "AVAILABLE"

class QCApproveRequest(BaseModel):
    stock_id: int
    new_status: str # AVAILABLE or REJECTED
    user_id: Optional[int] = None

class StockStatusChangeRequest(BaseModel):
    stock_id: int
    new_status: str
    quantity_to_change: float
    user_id: Optional[int] = None
    reference_id: Optional[str] = None # e.g., Sales Order ID if reserving, or Gate Pass ID if transiting

class PhysicalAuditItemBase(BaseModel):
    item_id: str
    batch_id: Optional[str] = None
    lot_id: Optional[str] = None
    system_qty: float
    physical_qty: float
    variance: float

class PhysicalAuditCreate(BaseModel):
    location_type: str
    location_id: Optional[int] = None
    audited_by: int
    notes: Optional[str] = None
    items: list[PhysicalAuditItemBase]

class PhysicalAuditItemSchema(PhysicalAuditItemBase):
    id: int
    audit_id: int
    adjustment_movement_id: Optional[int] = None

    class Config:
        from_attributes = True

class PhysicalAuditSchema(BaseModel):
    id: int
    location_type: str
    location_id: Optional[int] = None
    audit_date: datetime
    audited_by: int
    status: str
    notes: Optional[str] = None
    items: list[PhysicalAuditItemSchema] = []

    class Config:
        from_attributes = True

class CurrentStockCreate(CurrentStockBase):
    pass

class CurrentStock(CurrentStockBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True
