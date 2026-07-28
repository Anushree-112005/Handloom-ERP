from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.core.database import Base
from datetime import datetime

class StockMovement(Base):
    __tablename__ = "erp_stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(String(100), index=True) # Assuming string ID for item due to diverse item types
    source_location_id = Column(Integer, nullable=True) # Can be NULL for vendor receipt
    dest_location_id = Column(Integer, nullable=True) # Can be NULL for sales dispatch
    location_type = Column(String(50)) # WAREHOUSE, STORE
    transaction_type = Column(String(50)) # RECEIPT, DISPATCH, TRANSFER, ISSUE, RETURN, ADJUSTMENT
    quantity = Column(Float, default=0.0)
    tracking_id = Column(String(100), index=True, nullable=True) # Batch/Lot/Roll/Beam
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, nullable=True)
    status = Column(String(50), default="AVAILABLE") # e.g., IN_INSPECTION, AVAILABLE, REJECTED

class CurrentStock(Base):
    __tablename__ = "erp_current_stock"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(String(100), index=True)
    location_id = Column(Integer, index=True)
    location_type = Column(String(50), index=True) # WAREHOUSE, STORE
    quantity = Column(Float, default=0.0)
    reserved_quantity = Column(Float, default=0.0)
    batch_id = Column(String(100), index=True, nullable=True)
    lot_id = Column(String(100), index=True, nullable=True)
    status = Column(String(50), default="AVAILABLE", index=True) # e.g., IN_INSPECTION, AVAILABLE, REJECTED
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PhysicalAudit(Base):
    __tablename__ = "erp_physical_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    location_type = Column(String(50))
    location_id = Column(Integer, nullable=True)
    audit_date = Column(DateTime, default=datetime.utcnow)
    audited_by = Column(Integer) # user_id
    status = Column(String(20), default="COMPLETED") # DRAFT, COMPLETED
    notes = Column(String(500), nullable=True)

class PhysicalAuditItem(Base):
    __tablename__ = "erp_physical_audit_items"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("erp_physical_audits.id"))
    item_id = Column(String(100))
    batch_id = Column(String(100), nullable=True)
    lot_id = Column(String(100), nullable=True)
    system_qty = Column(Float, default=0.0)
    physical_qty = Column(Float, default=0.0)
    variance = Column(Float, default=0.0) # physical - system
    adjustment_movement_id = Column(Integer, nullable=True) # Link to StockMovement if adjusted
