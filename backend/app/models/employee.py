"""Employee / User model with role-based access control."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, func
from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
