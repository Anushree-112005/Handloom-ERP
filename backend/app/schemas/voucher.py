from pydantic import BaseModel, Field, condecimal
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class LedgerNature(str, Enum):
    ASSETS = "Assets"
    LIABILITIES = "Liabilities"
    INCOME = "Income"
    EXPENSES = "Expenses"

class BalanceType(str, Enum):
    DR = "DR"
    CR = "CR"

# Ledger Group Schemas
class LedgerGroupBase(BaseModel):
    name: str
    parent_group_id: Optional[int] = None
    nature: LedgerNature
    company_id: Optional[int] = None

class LedgerGroupCreate(LedgerGroupBase):
    pass

class LedgerGroupResponse(LedgerGroupBase):
    id: int

    class Config:
        from_attributes = True

# Ledger Schemas
class LedgerBase(BaseModel):
    name: str
    group_id: int
    opening_balance: float = 0.0
    opening_balance_type: Optional[BalanceType] = None
    gstin: Optional[str] = None
    company_id: Optional[int] = None

class LedgerCreate(LedgerBase):
    pass

class LedgerResponse(LedgerBase):
    id: int

    class Config:
        from_attributes = True

# Voucher Type Schemas
class VoucherTypeBase(BaseModel):
    name: str
    prefix: str
    affects_stock: bool = False
    affects_accounts: bool = True

class VoucherTypeCreate(VoucherTypeBase):
    pass

class VoucherTypeResponse(VoucherTypeBase):
    id: int

    class Config:
        from_attributes = True

# Voucher Entry Schemas
class VoucherEntryBase(BaseModel):
    ledger_id: int
    debit_amount: float = 0.0
    credit_amount: float = 0.0
    bill_ref: Optional[str] = None

class VoucherEntryCreate(VoucherEntryBase):
    pass

class VoucherEntryResponse(VoucherEntryBase):
    id: int
    voucher_id: int

    class Config:
        from_attributes = True

# Voucher Item Entry Schemas
class VoucherItemEntryBase(BaseModel):
    stock_item_id: int
    godown_id: Optional[int] = None
    quantity: float = 0.0
    rate: float = 0.0
    discount_percent: float = 0.0
    amount: float = 0.0

class VoucherItemEntryCreate(VoucherItemEntryBase):
    pass

class VoucherItemEntryResponse(VoucherItemEntryBase):
    id: int
    voucher_id: int

    class Config:
        from_attributes = True

# Voucher Schemas
class VoucherBase(BaseModel):
    voucher_type_id: int
    voucher_date: date
    reference_number: Optional[str] = None
    narration: Optional[str] = None
    company_id: Optional[int] = None
    financial_year: Optional[str] = None
    billing_address_id: Optional[int] = None
    shipping_address_id: Optional[int] = None

class VoucherCreate(VoucherBase):
    entries: List[VoucherEntryCreate]
    item_entries: Optional[List[VoucherItemEntryCreate]] = []

class VoucherResponse(VoucherBase):
    id: int
    voucher_number: str
    total_amount: float
    is_cancelled: bool
    created_by: Optional[int] = None
    created_at: datetime
    entries: List[VoucherEntryResponse] = []
    item_entries: List[VoucherItemEntryResponse] = []

    class Config:
        from_attributes = True
