from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WarehouseMaterialImageBase(BaseModel):
    image_url: str
    uploaded_by: Optional[str] = None

class WarehouseMaterialImageResponse(WarehouseMaterialImageBase):
    id: int
    material_id: int
    uploaded_date: datetime

    class Config:
        from_attributes = True

class WarehouseMaterialBase(BaseModel):
    material_code: Optional[str] = None
    material_name: str
    warehouse_location: str
    quantity: float = 0.0
    remarks: Optional[str] = None

class WarehouseMaterialCreate(WarehouseMaterialBase):
    pass

class WarehouseMaterialUpdate(BaseModel):
    material_code: Optional[str] = None
    material_name: Optional[str] = None
    warehouse_location: Optional[str] = None
    quantity: Optional[float] = None
    remarks: Optional[str] = None

class WarehouseMaterialResponse(WarehouseMaterialBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    images: List[WarehouseMaterialImageResponse] = []

    class Config:
        from_attributes = True
