from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class LoomMasterBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    loom_name: str
    loom_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    installation_date: Optional[datetime] = None
    capacity_per_day: float
    running_speed_per_hr: float
    efficiency_pct: float
    reed_width: Optional[float] = None
    total_ends: Optional[int] = None
    status: Optional[str] = "Idle"
    location: Optional[str] = None
    last_service_date: Optional[datetime] = None
    next_service_date: Optional[datetime] = None
    remarks: Optional[str] = None
    current_warp: Optional[str] = None
    current_weft: Optional[str] = None

class LoomMasterCreate(LoomMasterBase):
    pass

class LoomMasterResponse(LoomMasterBase):
    id: int
    class Config:
        from_attributes = True

class LoomAllocationBase(BaseModel):
    loom_id: int
    order_id: str
    warp_ends: Optional[int] = None
    weft_density: Optional[int] = None
    fabric_type: Optional[str] = None
    assigned_meters: float
    completed_meters: Optional[float] = 0.0
    allocation_status: Optional[str] = "Pending"

class LoomAllocationCreate(LoomAllocationBase):
    pass

class LoomAllocationResponse(LoomAllocationBase):
    id: int
    start_time: datetime
    expected_finish_time: Optional[datetime] = None
    loom_name: Optional[str] = None
    class Config:
        from_attributes = True

class ProductionLogBase(BaseModel):
    allocation_id: int
    meters_produced: float
    downtime_minutes: Optional[int] = 0
    remarks: Optional[str] = None

class ProductionLogCreate(ProductionLogBase):
    pass

class ProductionLogResponse(ProductionLogBase):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class OperatorMasterBase(BaseModel):
    operator_id: str
    operator_name: str
    department: Optional[str] = None
    designation: Optional[str] = None
    skill_level: Optional[str] = None
    assigned_loom: Optional[str] = None
    assigned_shift: Optional[str] = None
    join_date: Optional[datetime] = None
    contact_number: Optional[str] = None
    status: Optional[bool] = True

class OperatorMasterCreate(OperatorMasterBase):
    pass

class OperatorMasterResponse(OperatorMasterBase):
    id: int
    class Config:
        from_attributes = True

class LoomBreakdownBase(BaseModel):
    loom_id: int
    breakdown_id: str
    start_time: str
    end_time: Optional[str] = None
    total_downtime: Optional[float] = 0.0
    reason_category: str
    reason_details: Optional[str] = None
    reported_by: Optional[str] = None
    attended_by: Optional[str] = None
    action_taken: Optional[str] = None
    status: Optional[str] = "Open"

class LoomBreakdownCreate(LoomBreakdownBase):
    pass

class LoomBreakdownResponse(LoomBreakdownBase):
    id: int
    date: datetime
    class Config:
        from_attributes = True

class WarpingDeliveryBase(BaseModel):
    requisition_id: str
    order_id: str
    loom_id: int
    warp_configuration: str
    weft_configuration: str
    status: Optional[str] = "Pending"

class WarpingDeliveryCreate(WarpingDeliveryBase):
    pass

class WarpingDeliveryResponse(WarpingDeliveryBase):
    id: int
    date: datetime
    class Config:
        from_attributes = True
