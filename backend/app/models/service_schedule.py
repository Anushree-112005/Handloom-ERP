"""Service Schedule models."""
from sqlalchemy import Column, String, Integer, DateTime, func, Float
from app.core.database import Base


class ServiceSchedule(Base):
    __tablename__ = "service_schedules"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=False)
    scheduled_date = Column(String(50), nullable=False)
    service_type = Column(String(100), nullable=False)  # Periodic Service, Oil Change, etc.
    status = Column(String(50), default="Pending")  # Pending, Completed, Overdue
    service_provider = Column(String(255))
    estimated_cost = Column(Float, default=0)
    notes = Column(String(1000))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
