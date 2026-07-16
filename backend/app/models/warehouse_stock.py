from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class WarehouseMaterial(Base):
    __tablename__ = "warehouse_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String(100), index=True, nullable=True)
    material_name = Column(String(255), index=True)
    category = Column(String(100), index=True, nullable=True)
    quantity = Column(Float, default=0.0)
    uom = Column(String(50), default="Kgs")
    location = Column("warehouse_location", String(255))
    remarks = Column(Text, nullable=True)
    status = Column(String(100), default="Pending")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    images = relationship("WarehouseMaterialImage", back_populates="material", cascade="all, delete-orphan", lazy="selectin")

    @property
    def warehouse_location(self):
        return self.location

    @warehouse_location.setter
    def warehouse_location(self, value):
        self.location = value

class WarehouseMaterialImage(Base):
    __tablename__ = "warehouse_material_images"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("warehouse_materials.id", ondelete="CASCADE"))
    image_url = Column(String(500))
    uploaded_by = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    material = relationship("WarehouseMaterial", back_populates="images")

    @property
    def uploaded_date(self):
        return self.uploaded_at

    @uploaded_date.setter
    def uploaded_date(self, value):
        self.uploaded_at = value
