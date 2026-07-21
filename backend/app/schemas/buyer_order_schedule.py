from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class BuyerOrderScheduleEntryBase(BaseModel):
    approval: bool = False
    schedule_date: Optional[date] = None
    schedule_mtr: Decimal = Decimal('0.0')

class BuyerOrderScheduleEntryCreate(BuyerOrderScheduleEntryBase):
    pass

class BuyerOrderScheduleEntryResponse(BuyerOrderScheduleEntryBase):
    id: int
    schedule_id: int

    class Config:
        from_attributes = True

class BuyerOrderScheduleBase(BaseModel):
    schedule_no: str
    schedule_date: date
    schedule_order: Optional[str] = None
    ibpo_ref_no: Optional[str] = None
    po_date: Optional[date] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    quality: Optional[str] = None
    order_mtr: Decimal = Decimal('0.0')
    min_mtr: Decimal = Decimal('0.0')
    max_mtr: Decimal = Decimal('0.0')
    tolerance_pct: Decimal = Decimal('0.0')
    delivery_starting: Optional[date] = None
    party_completion_date: Optional[date] = None
    company_completion_date: Optional[date] = None
    production_start_date: Optional[date] = None

class BuyerOrderScheduleCreate(BuyerOrderScheduleBase):
    entries: List[BuyerOrderScheduleEntryCreate] = []

class BuyerOrderScheduleUpdate(BaseModel):
    schedule_date: Optional[date] = None
    schedule_order: Optional[str] = None
    ibpo_ref_no: Optional[str] = None
    po_date: Optional[date] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    quality: Optional[str] = None
    order_mtr: Optional[Decimal] = None
    min_mtr: Optional[Decimal] = None
    max_mtr: Optional[Decimal] = None
    tolerance_pct: Optional[Decimal] = None
    delivery_starting: Optional[date] = None
    party_completion_date: Optional[date] = None
    company_completion_date: Optional[date] = None
    production_start_date: Optional[date] = None
    entries: Optional[List[BuyerOrderScheduleEntryCreate]] = None

class BuyerOrderScheduleResponse(BuyerOrderScheduleBase):
    id: int
    entries: List[BuyerOrderScheduleEntryResponse] = []

    class Config:
        from_attributes = True
