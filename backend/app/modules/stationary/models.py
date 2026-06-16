"""Stationary Module Database Models."""
from sqlalchemy import Column, Integer, String, JSON, DateTime, func
from app.core.database import Base

class StationaryItem(Base):
    __tablename__ = "stationary_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), index=True, nullable=False)  # e.g. 'consumables_categories', 'consumables_items', etc.
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
