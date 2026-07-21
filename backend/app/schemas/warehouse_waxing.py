from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WarehouseWaxingBase(BaseModel):
    material_name: str
    stock_quantity: float
    waxing_status: str = "Pending"
    remarks: Optional[str] = None

class WarehouseWaxingCreate(WarehouseWaxingBase):
    pass

class WarehouseWaxingUpdate(BaseModel):
    waxing_status: Optional[str] = None
    remarks: Optional[str] = None

class WarehouseWaxingResponse(WarehouseWaxingBase):
    id: int
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
