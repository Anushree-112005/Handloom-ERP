from pydantic import BaseModel
from typing import Optional

class GSTRegistrationBase(BaseModel):
    state_code: str
    state_name: str
    gstin: str
    registration_type: Optional[str] = "Regular"
    is_primary: Optional[bool] = False

class GSTRegistrationCreate(GSTRegistrationBase):
    pass

class GSTRegistrationOut(GSTRegistrationBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True

class GSTClassificationBase(BaseModel):
    name: str
    hsn_sac: str
    description: Optional[str] = None
    cgst_rate: Optional[float] = 2.5
    sgst_rate: Optional[float] = 2.5
    igst_rate: Optional[float] = 5.0

class GSTClassificationCreate(GSTClassificationBase):
    pass

class GSTClassificationOut(GSTClassificationBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True
