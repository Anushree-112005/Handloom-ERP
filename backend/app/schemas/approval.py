from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ApprovalCreate(BaseModel):
    entity_type: str
    entity_id: str
    approval_type: str
    required_role: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

class ApprovalAction(BaseModel):
    action: str = Field(..., description="'Approve' or 'Reject'")
    comments: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

class EmployeeBase(BaseModel):
    id: int
    name: str
    employee_code: str
    designation: Optional[str]
    
    class Config:
        orm_mode = True

class ApprovalResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: str
    approval_type: str
    status: str
    required_role: Optional[str]
    comments: Optional[str]
    extra_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    requested_by_id: Optional[int]
    approved_by_id: Optional[int]
    requested_by: Optional[EmployeeBase]
    approved_by: Optional[EmployeeBase]

    class Config:
        orm_mode = True
