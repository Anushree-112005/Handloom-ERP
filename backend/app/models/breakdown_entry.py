"""Breakdown Entry models."""
from sqlalchemy import Column, String, Integer, DateTime, func, Float
from app.core.database import Base


class BreakdownEntry(Base):
    __tablename__ = "breakdown_entries"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=False)
    breakdown_date = Column(String(50), nullable=False)
    location = Column(String(500), nullable=False)
    issue_description = Column(String(1000))
    repair_required = Column(String(1000))
    status = Column(String(50), default="Reported")  # Reported, In Progress, Resolved
    resolution_time_hours = Column(Float, default=0)
    assistance_type = Column(String(100), default="Roadside Assistance")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
