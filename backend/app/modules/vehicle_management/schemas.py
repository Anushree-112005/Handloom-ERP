"""Vehicle Management Module Schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any

class FleetItemBase(BaseModel):
    category: str
    data: Dict[str, Any]

class FleetItemCreate(FleetItemBase):
    pass

class FleetItemResponse(FleetItemBase):
    id: int
    class Config:
        from_attributes = True
