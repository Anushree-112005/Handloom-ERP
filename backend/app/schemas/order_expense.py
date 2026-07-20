from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class OrderExpenseEntryBase(BaseModel):
    expense_type: Optional[str] = None
    remarks: Optional[str] = None
    quantity: Decimal = Decimal('0.0')
    unit: Optional[str] = None
    rate: Decimal = Decimal('0.0')
    amount: Decimal = Decimal('0.0')

class OrderExpenseEntryCreate(OrderExpenseEntryBase):
    pass

class OrderExpenseEntryResponse(OrderExpenseEntryBase):
    id: int
    expense_id: int

    class Config:
        from_attributes = True

class OrderExpenseBase(BaseModel):
    reference_no: str
    date: date
    ibpo_number: Optional[str] = None
    ibpo_date: Optional[date] = None
    party_name: Optional[str] = None
    quality: Optional[str] = None
    order_mtr: Decimal = Decimal('0.0')
    fabric_type: Optional[str] = None
    order_type: Optional[str] = None
    merchandiser: Optional[str] = None
    net_amount: Decimal = Decimal('0.0')

class OrderExpenseCreate(OrderExpenseBase):
    entries: List[OrderExpenseEntryCreate] = []

class OrderExpenseUpdate(BaseModel):
    ibpo_number: Optional[str] = None
    ibpo_date: Optional[date] = None
    party_name: Optional[str] = None
    quality: Optional[str] = None
    order_mtr: Optional[Decimal] = None
    fabric_type: Optional[str] = None
    order_type: Optional[str] = None
    merchandiser: Optional[str] = None
    net_amount: Optional[Decimal] = None
    entries: Optional[List[OrderExpenseEntryCreate]] = None

class OrderExpenseResponse(OrderExpenseBase):
    id: int
    entries: List[OrderExpenseEntryResponse] = []

    class Config:
        from_attributes = True
