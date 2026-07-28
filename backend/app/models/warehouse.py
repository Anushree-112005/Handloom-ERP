from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Warehouse(Base):
    __tablename__ = "erp_warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    location = Column(String(100), nullable=True)
    type = Column(String(50)) # e.g., RAW, YARN, FINISHED
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    zones = relationship("WarehouseZone", back_populates="warehouse", cascade="all, delete-orphan")

class WarehouseZone(Base):
    __tablename__ = "erp_warehouse_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("erp_warehouses.id"))
    name = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    
    warehouse = relationship("Warehouse", back_populates="zones")
    racks = relationship("WarehouseRack", back_populates="zone", cascade="all, delete-orphan")

class WarehouseRack(Base):
    __tablename__ = "erp_warehouse_racks"
    
    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("erp_warehouse_zones.id"))
    name = Column(String(100), index=True)
    
    zone = relationship("WarehouseZone", back_populates="racks")
    bins = relationship("WarehouseBin", back_populates="rack", cascade="all, delete-orphan")

class WarehouseBin(Base):
    __tablename__ = "erp_warehouse_bins"
    
    id = Column(Integer, primary_key=True, index=True)
    rack_id = Column(Integer, ForeignKey("erp_warehouse_racks.id"))
    name = Column(String(100), index=True)
    capacity = Column(Integer, default=0)
    
    rack = relationship("WarehouseRack", back_populates="bins")

class WarehouseStaging(Base):
    __tablename__ = "erp_warehouse_staging"
    
    id = Column(Integer, primary_key=True, index=True)
    grn_number = Column(String(50), index=True)
    vendor = Column(String(100))
    item_description = Column(String(200))
    received_qty = Column(String(50))
    arrival_time = Column(String(50))
    status = Column(String(50), default="Awaiting QC") # Awaiting QC, Ready for Put-Away, Completed
    created_at = Column(DateTime, default=datetime.utcnow)

class WarehousePutAway(Base):
    __tablename__ = "erp_warehouse_putaway"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(50), unique=True, index=True) # e.g., PA-001
    source_grn = Column(String(50))
    item_details = Column(String(200))
    quantity = Column(String(50))
    suggested_location = Column(String(200))
    actual_location = Column(String(200), nullable=True)
    status = Column(String(50), default="Pending") # Pending, Completed
    created_at = Column(DateTime, default=datetime.utcnow)

class WarehousePickList(Base):
    __tablename__ = "erp_warehouse_picklist"
    
    id = Column(Integer, primary_key=True, index=True)
    pick_list_id = Column(String(50), unique=True, index=True) # e.g., PL-2024-101
    reference_doc = Column(String(100)) # e.g., Sales Invoice SI-1002
    item_to_pick = Column(String(200))
    quantity = Column(String(50))
    source_location = Column(String(200))
    status = Column(String(50), default="Pending") # Pending, Picking in Progress, Completed
    created_at = Column(DateTime, default=datetime.utcnow)
