from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class WarehouseMaterial(Base):
    __tablename__ = "warehouse_materials"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String, index=True, nullable=True) # e.g., MAT001
    material_name = Column(String, index=True, nullable=False)
    warehouse_location = Column(String, nullable=False) # Chennai, Tirupur, Erode
    quantity = Column(Float, default=0.0)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    images = relationship("WarehouseMaterialImage", back_populates="material", cascade="all, delete-orphan")


class WarehouseMaterialImage(Base):
    __tablename__ = "warehouse_material_images"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("warehouse_materials.id"), nullable=False)
    image_url = Column(String, nullable=False)
    
    uploaded_by = Column(String, nullable=True) # Could be employee name/ID
    uploaded_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    material = relationship("WarehouseMaterial", back_populates="images")
