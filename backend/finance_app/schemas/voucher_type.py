from pydantic import BaseModel
from typing import Optional

class VoucherTypeBase(BaseModel):
    name: str
    parent_type: str
    numbering_method: Optional[str] = "Automatic"
    prefix: Optional[str] = None
    suffix: Optional[str] = None
    starting_number: Optional[int] = 1
    inventory_affected: Optional[bool] = False
    is_active: Optional[bool] = True

class VoucherTypeCreate(VoucherTypeBase):
    pass

class VoucherTypeOut(VoucherTypeBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True
