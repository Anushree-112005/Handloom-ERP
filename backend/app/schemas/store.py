from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoreBase(BaseModel):
    name: str
    department: str
    store_type: Optional[str] = "MAIN"
    parent_store_id: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True

class StoreCreate(StoreBase):
    pass

class Store(StoreBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class StoreTransferRequest(BaseModel):
    item_id: str
    from_store_id: int
    to_store_id: int
    quantity: float
    user_id: Optional[int] = None
