<<<<<<< HEAD
"""Employee Master Model with HR Profile."""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func
from app.core.database import Base

=======
"""Employee / User model with role-based access control."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, func
from app.core.database import Base


>>>>>>> 048802c6a0e838215281295d658f4e749ede1691
class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
<<<<<<< HEAD
    
    # Identity & Login
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)

    # Personal info
    name = Column(String(150), nullable=False)
    dob = Column(String(50))
    gender = Column(String(20))
    blood_group = Column(String(10))
    mobile = Column(String(50))
    address = Column(String(500))
    family_details = Column(String(500))

    # Employment
    department = Column(String(100))
    designation = Column(String(100))
    category = Column(String(50))
    unit = Column(String(100))
    production_line = Column(String(100))
    shift = Column(String(50))
    skill_level = Column(String(50))

    # Identity & Statutory
    aadhaar_no = Column(String(50))
    pan_no = Column(String(50))
    pf_account = Column(String(50))
    esi_no = Column(String(50))
    uan = Column(String(50))
    biometric_id = Column(String(50))
    medical_fitness = Column(String(100))

    # Salary & Wages
    wage_type = Column(String(50))
    basic_salary = Column(Float, default=0.0)
    hra = Column(Float, default=0.0)
    da = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    pf_esi_percent = Column(Float, default=0.0)

    # Education & Experience
    qualification = Column(String(100))
    iti_trade = Column(String(100))
    machine_knowledge = Column(String(255))
    training_records = Column(String(255))

    # Bank Details
    bank_name = Column(String(100))
    ifsc_code = Column(String(50))
    account_number = Column(String(100))
    payment_mode = Column(String(50))

    # Emergency & Nominee
    emergency_contact = Column(String(100))
    pf_nominee = Column(String(100))
    gratuity_nominee = Column(String(100))

    # Status & Flags
    status = Column(String(50), default="Active")
    biometric_link = Column(Boolean, default=False)
    canteen = Column(Boolean, default=False)
    transport = Column(Boolean, default=False)
    accommodation = Column(Boolean, default=False)

=======
    user_id = Column(String(50), unique=True, nullable=False, index=True)
    user_name = Column(String(150), nullable=False)
    user_type = Column(String(30), default="Staff")  # Admin, Manager, Staff, Operator
    status = Column(String(20), default="Enable")
    web_access = Column(String(20), default="Allow")
    department = Column(String(100))
    designation = Column(String(100))
    email = Column(String(255), unique=True)
    password_hash = Column(String(255), nullable=False)
    company_depl = Column(Boolean, default=False)
    company_mtm = Column(Boolean, default=False)
    # Module permissions stored as JSON: {"master": true, "buyer_order": true, ...}
    module_permissions = Column(JSON, default={})
    # Menu-level permissions: {"A11": true, "A12": false, ...}
    menu_permissions = Column(JSON, default={})
>>>>>>> 048802c6a0e838215281295d658f4e749ede1691
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
