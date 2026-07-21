from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class BuyerOrderCompletionDetailBase(BaseModel):
    ibpo_no: Optional[str] = None
    po_no: Optional[str] = None
    design_no: Optional[str] = None
    quality: Optional[str] = None
    order_mtr: Decimal = Decimal('0.0')
    dispatch_mtr: Decimal = Decimal('0.0')
    return_mtr: Decimal = Decimal('0.0')
    balance_mtr: Decimal = Decimal('0.0')
    row_remarks: Optional[str] = None

class BuyerOrderCompletionDetailCreate(BuyerOrderCompletionDetailBase):
    pass

class BuyerOrderCompletionDetailResponse(BuyerOrderCompletionDetailBase):
    id: int
    completion_id: int

    class Config:
        from_attributes = True

class BuyerOrderCompletionBase(BaseModel):
    completion_date: date
    party_name: Optional[str] = None
    updated_to: Optional[str] = None
    records_updated: int = 0
    remarks: Optional[str] = None

class BuyerOrderCompletionCreate(BuyerOrderCompletionBase):
    details: List[BuyerOrderCompletionDetailCreate] = []

class BuyerOrderCompletionUpdate(BaseModel):
    completion_date: Optional[date] = None
    party_name: Optional[str] = None
    updated_to: Optional[str] = None
    records_updated: Optional[int] = None
    remarks: Optional[str] = None
    details: Optional[List[BuyerOrderCompletionDetailCreate]] = None

class BuyerOrderCompletionResponse(BuyerOrderCompletionBase):
    id: int
    details: List[BuyerOrderCompletionDetailResponse] = []

    class Config:
        from_attributes = True
