"""HR Module Database Models."""
from sqlalchemy import Column, Integer, String, JSON, DateTime, func
from app.core.database import Base

class HRItem(Base):
    __tablename__ = "hr_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), index=True, nullable=False)  # e.g. 'attendance', 'leaves', etc.
    employee_id = Column(String(50), index=True, nullable=True)
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
