from pydantic import BaseModel
from typing import Optional
from datetime import date

class CompanyCreate(BaseModel):
    name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[str] = None
    financial_year_start: Optional[date] = None

class CompanyOut(CompanyCreate):
    id: int

    class Config:
        from_attributes = True
