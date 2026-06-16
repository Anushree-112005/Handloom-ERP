"""Maintenance Log models."""
from sqlalchemy import Column, String, Integer, DateTime, func, Float
from app.core.database import Base


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=False)
    service_date = Column(String(50), nullable=False)
    maintenance_type = Column(String(100), nullable=False)
    work_description = Column(String(1000))
    labor_cost = Column(Float, default=0)
    parts_cost = Column(Float, default=0)
    status = Column(String(50), default="In Progress")  # In Progress, Completed, Verified
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
