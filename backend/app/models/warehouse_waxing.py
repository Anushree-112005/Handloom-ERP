from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class WarehouseWaxing(Base):
    __tablename__ = "warehouse_waxing"

    id = Column(Integer, primary_key=True, index=True)
    material_name = Column(String, index=True)
    stock_quantity = Column(Float, default=0.0)
    waxing_status = Column(String, default="Pending")
    image_url = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
