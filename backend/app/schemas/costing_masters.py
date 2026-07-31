from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class YarnRateMasterBase(BaseModel):
    yarn_count: str
    color: Optional[str] = None
    rate_per_kg: float = 0
    effective_date: Optional[date] = None
    status: str = "Active"

class YarnRateMasterCreate(YarnRateMasterBase):
    pass

class YarnRateMasterUpdate(YarnRateMasterBase):
    pass

class YarnRateMasterOut(YarnRateMasterBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class WashTypeMasterBase(BaseModel):
    wash_type: str
    rate_per_m: float = 0
    shrinkage_pct: float = 0
    status: str = "Active"

class WashTypeMasterCreate(WashTypeMasterBase):
    pass

class WashTypeMasterUpdate(WashTypeMasterBase):
    pass

class WashTypeMasterOut(WashTypeMasterBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class ConstructionMasterBase(BaseModel):
    construction: str
    warp: Optional[str] = None
    weft: Optional[str] = None
    epi: float = 0
    ppi: float = 0
    width: float = 0

class ConstructionMasterCreate(ConstructionMasterBase):
    pass

class ConstructionMasterUpdate(ConstructionMasterBase):
    pass

class ConstructionMasterOut(ConstructionMasterBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class WastageMasterBase(BaseModel):
    count: str
    default_wastage: float = 0
    default_dwl: float = 0
    crimp: float = 0

class WastageMasterCreate(WastageMasterBase):
    pass

class WastageMasterUpdate(WastageMasterBase):
    pass

class WastageMasterOut(WastageMasterBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
