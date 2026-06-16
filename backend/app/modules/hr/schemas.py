"""HR Module Schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any

class HRItemBase(BaseModel):
    category: str
    employee_id: Optional[str] = None
    data: Dict[str, Any]

class HRItemCreate(HRItemBase):
    pass

class HRItemUpdate(BaseModel):
    category: Optional[str] = None
    employee_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class HRItemResponse(HRItemBase):
    id: int
    class Config:
        from_attributes = True
