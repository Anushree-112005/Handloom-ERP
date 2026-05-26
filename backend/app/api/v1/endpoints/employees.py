from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.models.employee import Employee
from app.core.security import get_password_hash

router = APIRouter(prefix="/employees", tags=["Employee Master"])

class EmployeeBase(BaseModel):
    employee_code: str
    name: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    family_details: Optional[str] = None

    department: Optional[str] = None
    designation: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    production_line: Optional[str] = None
    shift: Optional[str] = None
    skill_level: Optional[str] = None

    aadhaar_no: Optional[str] = None
    pan_no: Optional[str] = None
    pf_account: Optional[str] = None
    esi_no: Optional[str] = None
    uan: Optional[str] = None
    biometric_id: Optional[str] = None
    medical_fitness: Optional[str] = None

    wage_type: Optional[str] = None
    basic_salary: float = 0.0
    hra: float = 0.0
    da: float = 0.0
    allowances: float = 0.0
    pf_esi_percent: float = 0.0

    qualification: Optional[str] = None
    iti_trade: Optional[str] = None
    machine_knowledge: Optional[str] = None
    training_records: Optional[str] = None

    bank_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_number: Optional[str] = None
    payment_mode: Optional[str] = None

    emergency_contact: Optional[str] = None
    pf_nominee: Optional[str] = None
    gratuity_nominee: Optional[str] = None

    status: str = "Active"
    biometric_link: bool = False
    canteen: bool = False
    transport: bool = False
    accommodation: bool = False
    
    # User Management & Access Control
    user_type: Optional[str] = "Staff"
    web_access: Optional[str] = "Allow"
    company_depl: bool = False
    company_mtm: bool = False
    module_permissions: Optional[dict] = {}
    menu_permissions: Optional[dict] = {}
    email: Optional[str] = None
    
    # Audit Fields
    last_login: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_by: Optional[str] = None
    access_expiry_date: Optional[datetime] = None

class EmployeeCreate(EmployeeBase):
    password: Optional[str] = None

class EmployeeUpdate(EmployeeBase):
    password: Optional[str] = None

class EmployeeOut(EmployeeBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[EmployeeOut])
async def list_employees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee))
    return result.scalars().all()

@router.post("/", response_model=EmployeeOut, status_code=201)
async def create_employee(emp: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Employee).where(Employee.employee_code == emp.employee_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee Code already exists")
    
    data = emp.model_dump(exclude={"password"})
    if emp.password:
        data["password_hash"] = get_password_hash(emp.password)
    db_emp = Employee(**data)
    db.add(db_emp)
    await db.commit()
    await db.refresh(db_emp)
    return db_emp

@router.put("/{emp_id}", response_model=EmployeeOut)
async def update_employee(emp_id: int, emp: EmployeeUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == emp_id))
    db_emp = result.scalar_one_or_none()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    data = emp.model_dump(exclude={"password"}, exclude_unset=True)
    if emp.password:
        data["password_hash"] = get_password_hash(emp.password)
        
    for k, v in data.items():
        setattr(db_emp, k, v)
        
    await db.commit()
    await db.refresh(db_emp)
    return db_emp

@router.delete("/{emp_id}", status_code=204)
async def delete_employee(emp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == emp_id))
    db_emp = result.scalar_one_or_none()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await db.delete(db_emp)
    await db.commit()
    return None
