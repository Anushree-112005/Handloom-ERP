from pydantic import BaseModel
from typing import Optional
from datetime import date

class CompanyCreate(BaseModel):
    name: str
    legal_name: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    cin: Optional[str] = None
    state_code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    
    maintain_accounts: Optional[bool] = True
    maintain_inventory: Optional[bool] = False
    is_active: Optional[bool] = True

    fy_start: Optional[date] = date(2026, 4, 1)

    # Currency configurations
    currency_symbol: Optional[str] = "₹"
    currency_name: Optional[str] = "INR"
    currency_iso_code: Optional[str] = "INR"
    currency_decimal_places: Optional[int] = 2
    currency_show_in_millions: Optional[bool] = False
    currency_suffix_symbol: Optional[bool] = False
    currency_space_between_amount_and_symbol: Optional[bool] = False
    currency_amount_words_unit: Optional[str] = "Rupees"
    currency_amount_words_decimal: Optional[str] = "Paise"

class CompanyOut(CompanyCreate):
    id: int

    class Config:
        from_attributes = True
