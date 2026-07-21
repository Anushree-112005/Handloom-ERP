from pydantic import BaseModel
from typing import Optional

class CurrencyBase(BaseModel):
    symbol: str
    name: str
    iso_code: str
    exchange_rate: Optional[float] = 1.0
    is_base: Optional[bool] = False

class CurrencyCreate(CurrencyBase):
    pass

class CurrencyOut(CurrencyBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True
