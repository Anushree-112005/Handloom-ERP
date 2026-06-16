"""Stationary Module Schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any

class StationaryItemBase(BaseModel):
    category: str
    data: Dict[str, Any]

class StationaryItemCreate(StationaryItemBase):
    pass

class StationaryItemResponse(StationaryItemBase):
    id: int
    class Config:
        from_attributes = True
