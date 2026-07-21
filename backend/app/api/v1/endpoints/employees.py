from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

from app.core.database import get_db
from app.models.employee import Employee
from app.models.rbac import UserRole, Role
from app.core.security import get_password_hash

router = APIRouter(prefix="/employees", tags=["Employee Master"])

class EmployeeBase(BaseModel):
    employee_code: str
    username: Optional[str] = None
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
    deductions: float = 0.0
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
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    date_of_joining: Optional[str] = None
    employment_type: Optional[str] = None
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
    company_depl: Optional[bool] = False
    company_mtm: Optional[bool] = False
    module_permissions: Optional[dict] = {}
    menu_permissions: Optional[dict] = {}
    email: Optional[str] = None
    
    # Audit Fields
    last_login: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_by: Optional[str] = None
    access_expiry_date: Optional[datetime] = None
    
    role_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    password: Optional[str] = None

class EmployeeUpdate(EmployeeBase):
    password: Optional[str] = None

class EmployeeOut(EmployeeBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    role_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=Any)
async def list_employees(
    page: Optional[int] = Query(None),
    limit: Optional[int] = Query(10),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Employee, UserRole.role_id, Role.name.label("role_name"))
        .outerjoin(UserRole, UserRole.user_id == Employee.id)
        .outerjoin(Role, Role.id == UserRole.role_id)
    )

    if search:
        query = query.where(
            (Employee.name.ilike(f"%{search}%")) |
            (Employee.employee_code.ilike(f"%{search}%"))
        )

    if page is not None:
        count_query = select(func.count()).select_from(Employee)
        if search:
            count_query = count_query.where(
                (Employee.name.ilike(f"%{search}%")) |
                (Employee.employee_code.ilike(f"%{search}%"))
            )
        total_res = await db.execute(count_query)
        total = total_res.scalar()

        query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    rows = result.all()
    out = []
    for emp, r_id, r_name in rows:
        emp_dict = emp.__dict__.copy()
        emp_dict.pop("_sa_instance_state", None)
        emp_dict["role_id"] = r_id
        emp_dict["role_name"] = r_name
        out.append(emp_dict)
    
    if page is not None:
        return {"data": out, "total": total, "page": page, "limit": limit}
    return out

@router.post("/", response_model=EmployeeOut, status_code=201)
async def create_employee(emp: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Employee).where(Employee.employee_code == emp.employee_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee Code already exists")
    
    if not emp.mobile or not emp.mobile.strip():
        raise HTTPException(status_code=400, detail="Phone number is required")
    mobile_val = emp.mobile.strip()
    if not (mobile_val.isdigit() and len(mobile_val) == 10):
        raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits")
    
    data = emp.model_dump(exclude={"password", "role_id"})
    if emp.password:
        data["password_hash"] = get_password_hash(emp.password)
    db_emp = Employee(**data)
    db.add(db_emp)
    await db.flush() # get db_emp.id
    
    if emp.role_id:
        db.add(UserRole(user_id=db_emp.id, role_id=emp.role_id))
        
    await db.commit()
    await db.refresh(db_emp)
    
    emp_out = db_emp.__dict__.copy()
    emp_out["role_id"] = emp.role_id
    if emp.role_id:
        role_res = await db.execute(select(Role).where(Role.id == emp.role_id))
        role = role_res.scalar_one_or_none()
        emp_out["role_name"] = role.name if role else None
        
    return emp_out

@router.put("/{emp_id}", response_model=EmployeeOut)
async def update_employee(emp_id: int, emp: EmployeeUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == emp_id))
    db_emp = result.scalar_one_or_none()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if emp.mobile is not None:
        mobile_val = emp.mobile.strip()
        if not mobile_val:
            raise HTTPException(status_code=400, detail="Phone number is required")
        if not (mobile_val.isdigit() and len(mobile_val) == 10):
            raise HTTPException(status_code=400, detail="Phone number must be exactly 10 digits")

    data = emp.model_dump(exclude={"password", "role_id"}, exclude_unset=True)
    if emp.password:
        data["password_hash"] = get_password_hash(emp.password)
        
    for k, v in data.items():
        setattr(db_emp, k, v)
        
    if "role_id" in emp.model_dump(exclude_unset=True):
        await db.execute(UserRole.__table__.delete().where(UserRole.user_id == emp_id))
        if emp.role_id:
            db.add(UserRole(user_id=emp_id, role_id=emp.role_id))
            
    await db.commit()
    await db.refresh(db_emp)
    
    emp_out = db_emp.__dict__.copy()
    role_res = await db.execute(
        select(UserRole.role_id, Role.name)
        .join(Role, Role.id == UserRole.role_id)
        .where(UserRole.user_id == emp_id)
    )
    r = role_res.first()
    if r:
        emp_out["role_id"] = r[0]
        emp_out["role_name"] = r[1]
        
    return emp_out

@router.get("/{emp_id}", response_model=EmployeeOut)
async def get_employee(emp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Employee, UserRole.role_id, Role.name.label("role_name"))
        .outerjoin(UserRole, UserRole.user_id == Employee.id)
        .outerjoin(Role, Role.id == UserRole.role_id)
        .where(Employee.id == emp_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    emp, r_id, r_name = row
    emp_out = emp.__dict__.copy()
    emp_out["role_id"] = r_id
    emp_out["role_name"] = r_name
    return emp_out

@router.delete("/{emp_id}", status_code=204)
async def delete_employee(emp_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.id == emp_id))
    db_emp = result.scalar_one_or_none()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    await db.delete(db_emp)
    await db.commit()
    return None
