"""Stationary Module Schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import date, datetime

class StationaryItemBase(BaseModel):
    category: str
    data: Dict[str, Any]

class StationaryItemCreate(StationaryItemBase):
    pass

class StationaryItemResponse(StationaryItemBase):
    id: int
    class Config:
        from_attributes = True

# Swatch Card Schemas
class SwatchCardBase(BaseModel):
    swatch_type: str
    digital_id: str
    count_spec: str
    construction_spec: str
    design_no: Optional[str] = None
    color: Optional[str] = None
    party_name: Optional[str] = None
    buyer_comments: Optional[str] = None
    attachment_path: Optional[str] = None

class SwatchCardCreate(SwatchCardBase):
    pass

class SwatchCardResponse(SwatchCardBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Fabric Inspection Roll Schemas
class FabricInspectionRollBase(BaseModel):
    fabric_inward_id: str
    roll_no: str
    declared_meters: float
    actual_meters: float
    points: int
    defects: Optional[Dict[str, Any]] = {}
    remarks: Optional[str] = None

class FabricInspectionRollCreate(FabricInspectionRollBase):
    pass

class FabricInspectionRollResponse(FabricInspectionRollBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Returnable DC Schemas
class ReturnableDCBase(BaseModel):
    dc_no: str
    dc_stream: str
    date: date
    asset_name: str
    serial_no: Optional[str] = None
    fault_description: Optional[str] = None
    service_vendor: str
    quotation_no: Optional[str] = None
    quotation_amount: float
    service_po_no: Optional[str] = None
    advance_payment: float
    status: str = "Outward"
    return_date: Optional[date] = None
    remarks: Optional[str] = None

class ReturnableDCCreate(ReturnableDCBase):
    pass

class ReturnableDCResponse(ReturnableDCBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
