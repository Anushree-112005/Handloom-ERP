from typing import Optional, List
from pydantic import BaseModel, constr
from datetime import datetime

class PartyAddressBase(BaseModel):
    address_type: Optional[str] = "Bill"
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: str  # Mandatory for E-way bill compliance
    state_code: Optional[str] = None
    pin_code: str  # Mandatory for E-way bill compliance
    country: Optional[str] = "India"
    sales_region: Optional[str] = None
    
    # Tally Integration Fields
    alias: Optional[str] = None
    gst_no: str  # Mandatory for E-way bill compliance
    pan_no: Optional[str] = None
    contact_number: str  # Mandatory for E-way bill compliance
    contact_person: Optional[str] = None

class PartyAddressCreate(PartyAddressBase):
    pass

class PartyAddressUpdate(PartyAddressBase):
    pass

class PartyAddressInDB(PartyAddressBase):
    id: int
    party_id: int

    class Config:
        orm_mode = True


class PartyMasterBase(BaseModel):
    customer_code: Optional[str] = None
    party_type: str
    company_name: str
    party_group: Optional[str] = None
    customer_grade: Optional[str] = None
    status: Optional[str] = "Active"
    
    # Primary Address Fields (Optional if we use addresses list, but keeping for compatibility)
    address_type: Optional[str] = "Bill"
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    pin_code: Optional[str] = None
    country: Optional[str] = "India"
    sales_region: Optional[str] = None
    currency: Optional[str] = "INR"
    
    phone: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    
    gst_no: Optional[str] = None
    gst_type: Optional[str] = None
    pan_no: Optional[str] = None
    tin_no: Optional[str] = None
    cst_no: Optional[str] = None
    tally_ledger_name: Optional[str] = None
    tally_no: Optional[str] = None
    address_sno: Optional[str] = None
    tcs_applicable: Optional[str] = None
    
    tds: Optional[str] = None
    tds_percent: Optional[float] = 0.0
    pc_id: Optional[str] = None
    
    merchandiser: Optional[str] = None
    manager: Optional[str] = None
    account_incharge: Optional[str] = None
    agent_name: Optional[str] = None
    buyer_name: Optional[str] = None
    
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    
    credit_days: Optional[int] = 0
    credit_limit: Optional[float] = 0.0
    
    deliver_party_name: Optional[str] = None
    payment_terms: Optional[str] = None
    transport_name: Optional[str] = None
    delivery_address: Optional[str] = None

class PartyMasterCreate(PartyMasterBase):
    addresses: Optional[List[PartyAddressCreate]] = []

class PartyMasterUpdate(PartyMasterBase):
    addresses: Optional[List[PartyAddressUpdate]] = None

class PartyMasterInDBBase(PartyMasterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class PartyMaster(PartyMasterInDBBase):
    addresses: List[PartyAddressInDB] = []
