from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class BuyerOrderAmendmentDetailBase(BaseModel):
    order_date: Optional[date] = None
    completion_date: Optional[date] = None
    amendment_order_mtr: Decimal = Decimal('0.0')
    amendment_type: Optional[str] = None
    reason: Optional[str] = None

class BuyerOrderAmendmentDetailCreate(BuyerOrderAmendmentDetailBase):
    pass

class BuyerOrderAmendmentDetailResponse(BuyerOrderAmendmentDetailBase):
    id: int
    amendment_id: int

    class Config:
        from_attributes = True

class BuyerOrderAmendmentBase(BaseModel):
    amendment_no: str
    amendment_date: date
    last_amendment_date: Optional[date] = None
    ibpo_ref_no: Optional[str] = None
    po_date: Optional[date] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    quality_print_name: Optional[str] = None
    order_mtr: Decimal = Decimal('0.0')
    tolerance_pct: Decimal = Decimal('0.0')
    delivery_starting: Optional[date] = None
    party_completion_date: Optional[date] = None
    company_completion_date: Optional[date] = None
    last_dispatch_date: Optional[date] = None
    total_dispatch_mtr: Decimal = Decimal('0.0')
    party_rate: Decimal = Decimal('0.0')
    amendment_mtr: Decimal = Decimal('0.0')
    total_mtr: Decimal = Decimal('0.0')
    status: str = 'Pending'

class BuyerOrderAmendmentCreate(BuyerOrderAmendmentBase):
    details: List[BuyerOrderAmendmentDetailCreate] = []

class BuyerOrderAmendmentUpdate(BaseModel):
    last_amendment_date: Optional[date] = None
    ibpo_ref_no: Optional[str] = None
    po_date: Optional[date] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    quality_print_name: Optional[str] = None
    order_mtr: Optional[Decimal] = None
    tolerance_pct: Optional[Decimal] = None
    delivery_starting: Optional[date] = None
    party_completion_date: Optional[date] = None
    company_completion_date: Optional[date] = None
    last_dispatch_date: Optional[date] = None
    total_dispatch_mtr: Optional[Decimal] = None
    party_rate: Optional[Decimal] = None
    amendment_mtr: Optional[Decimal] = None
    total_mtr: Optional[Decimal] = None
    status: Optional[str] = None
    details: Optional[List[BuyerOrderAmendmentDetailCreate]] = None

class BuyerOrderAmendmentResponse(BuyerOrderAmendmentBase):
    id: int
    details: List[BuyerOrderAmendmentDetailResponse] = []

    class Config:
        from_attributes = True
