from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class WarehouseMaterial(Base):
    __tablename__ = "warehouse_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    material_name = Column(String(255), index=True)
    category = Column(String(100), index=True)
    quantity = Column(Float, default=0.0)
    uom = Column(String(50), default="Kgs")
    location = Column("warehouse_location", String(255))
    status = Column(String(100), default="Pending")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    images = relationship("WarehouseMaterialImage", back_populates="material", cascade="all, delete-orphan", lazy="selectin")

class WarehouseMaterialImage(Base):
    __tablename__ = "warehouse_material_images"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("warehouse_materials.id", ondelete="CASCADE"))
    image_url = Column(String(500))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    material = relationship("WarehouseMaterial", back_populates="images")
