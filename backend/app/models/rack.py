"""Rack Master model."""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func
from app.core.database import Base

class Rack(Base):
    __tablename__ = "racks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    category = Column(String(100))
    specific_data = Column(Text)
    image_url = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
