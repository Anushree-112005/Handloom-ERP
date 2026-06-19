from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class LoomMaster(Base):
    __tablename__ = "loom_master"

    id = Column(Integer, primary_key=True, index=True)
    loom_name = Column(String, index=True, unique=True, nullable=False)
    loom_type = Column(String, nullable=True) # Rapier / Air Jet / Water Jet / Shuttle
    manufacturer = Column(String, nullable=True)
    model_number = Column(String, nullable=True)
    installation_date = Column(DateTime(timezone=True), nullable=True)
    capacity_per_day = Column(Float, nullable=False) # Meters
    running_speed_per_hr = Column(Float, nullable=False) # Meters/hour
    efficiency_pct = Column(Float, nullable=False, default=80.0) # Percentage 0-100
    reed_width = Column(Float, nullable=True) # cm
    total_ends = Column(Integer, nullable=True)
    status = Column(String, default="Idle") # Running, Idle, Maintenance, Breakdown
    location = Column(String, nullable=True) # Shed A, Shed B
    last_service_date = Column(DateTime(timezone=True), nullable=True)
    next_service_date = Column(DateTime(timezone=True), nullable=True)
    remarks = Column(String, nullable=True)
    
    current_warp = Column(String, nullable=True) # E.g., Cotton 40s (12,000 ends)
    current_weft = Column(String, nullable=True) # E.g., Polyester 150D

    allocations = relationship("LoomAllocation", back_populates="loom", cascade="all, delete-orphan")


class LoomAllocation(Base):
    __tablename__ = "loom_allocations"

    id = Column(Integer, primary_key=True, index=True)
    loom_id = Column(Integer, ForeignKey("loom_master.id"), nullable=False)
    order_id = Column(String, nullable=False) # Refers to a generic order string for now
    warp_ends = Column(Integer, nullable=True)
    weft_density = Column(Integer, nullable=True)
    fabric_type = Column(String, nullable=True)
    assigned_meters = Column(Float, nullable=False)
    completed_meters = Column(Float, default=0.0)
    start_time = Column(DateTime(timezone=True), default=datetime.utcnow)
    expected_finish_time = Column(DateTime(timezone=True), nullable=True)
    allocation_status = Column(String, default="Pending") # Pending, Active, Completed, Halted

    loom = relationship("LoomMaster", back_populates="allocations")
    production_logs = relationship("ProductionLog", back_populates="allocation", cascade="all, delete-orphan")


class ProductionLog(Base):
    __tablename__ = "production_logs"

    id = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("loom_allocations.id"), nullable=False)
    meters_produced = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow)
    downtime_minutes = Column(Integer, default=0)
    remarks = Column(String, nullable=True)

    allocation = relationship("LoomAllocation", back_populates="production_logs")

class OperatorMaster(Base):
    __tablename__ = "operator_master"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(String, index=True, unique=True, nullable=False)
    operator_name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    designation = Column(String, nullable=True) # Weaver / Assistant / Supervisor
    skill_level = Column(String, nullable=True) # Junior / Senior / Expert
    assigned_loom = Column(String, nullable=True) # E.g., LM-001
    assigned_shift = Column(String, nullable=True) # E.g., Day Shift
    join_date = Column(DateTime(timezone=True), nullable=True)
    contact_number = Column(String, nullable=True)
    status = Column(Boolean, default=True) # True=Active, False=Inactive
