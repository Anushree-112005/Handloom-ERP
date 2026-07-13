from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import date
from enum import Enum

class VoucherType(str, Enum):
    PAYMENT     = "Payment"
    RECEIPT     = "Receipt"
    JOURNAL     = "Journal"
    SALES       = "Sales"
    PURCHASE    = "Purchase"
    CREDIT_NOTE = "Credit Note"
    DEBIT_NOTE  = "Debit Note"
    CONTRA      = "Contra"

class VoucherEntryIn(BaseModel):
    ledger_id:   int
    ledger_name: str
    dr_amount:   float = 0.0
    cr_amount:   float = 0.0
    gst_rate:    float = 0.0
    item_id:     Optional[int] = None
    item_name:   Optional[str] = None
    quantity:    Optional[float] = None
    rate:        Optional[float] = None

class VoucherCreate(BaseModel):
    voucher_type: VoucherType
    date:         date
    narration:    Optional[str] = None
    reference_no: Optional[str] = None
    company_id:   int
    party_id:     Optional[int] = None
    entries:      List[VoucherEntryIn]

    @field_validator("entries")
    def validate_balance(cls, entries):
        total_dr = sum(e.dr_amount for e in entries)
        total_cr = sum(e.cr_amount for e in entries)
        if abs(total_dr - total_cr) > 0.01:
            raise ValueError(f"Voucher not balanced: Dr={total_dr} Cr={total_cr}")
        return entries

class VoucherOut(VoucherCreate):
    id:             int
    voucher_number: str
    status:         str
    total_amount:   float

    class Config:
        from_attributes = True
