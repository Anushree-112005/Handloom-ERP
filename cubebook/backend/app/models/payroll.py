from sqlalchemy import Integer, String, Float, Date, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, relationship, mapped_column
from app.database import Base
from datetime import date, datetime, timezone
from typing import Optional, List, TYPE_CHECKING


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int]                       = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int]               = mapped_column(Integer, nullable=False, index=True)
    emp_code: Mapped[str]                 = mapped_column(String, nullable=False)
    full_name: Mapped[str]               = mapped_column(String, nullable=False)
    designation: Mapped[Optional[str]]    = mapped_column(String)
    department: Mapped[Optional[str]]     = mapped_column(String)
    bank_account: Mapped[Optional[str]]   = mapped_column(String)
    ifsc_code: Mapped[Optional[str]]      = mapped_column(String)
    bank_name: Mapped[Optional[str]]      = mapped_column(String)
    # Salary components (monthly, in INR)
    basic_salary: Mapped[float]           = mapped_column(Float, default=0.0)
    hra: Mapped[float]                    = mapped_column(Float, default=0.0)
    other_allowances: Mapped[float]       = mapped_column(Float, default=0.0)
    # Deductions
    pf_deduction: Mapped[float]           = mapped_column(Float, default=0.0)
    professional_tax: Mapped[float]       = mapped_column(Float, default=0.0)
    # Meta
    joining_date: Mapped[Optional[date]]  = mapped_column(Date)
    status: Mapped[str]                   = mapped_column(String, default="Active")  # Active | Inactive
    created_at: Mapped[datetime]          = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    salary_records: Mapped[List["SalaryRecord"]] = relationship("SalaryRecord", back_populates="employee",
                                  cascade="all, delete-orphan")


class SalaryRecord(Base):
    __tablename__ = "salary_records"

    id: Mapped[int]                         = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int]                 = mapped_column(Integer, nullable=False, index=True)
    employee_id: Mapped[int]                = mapped_column(Integer, ForeignKey("employees.id"), nullable=False)
    month: Mapped[int]                      = mapped_column(Integer, nullable=False)   # 1-12
    year: Mapped[int]                       = mapped_column(Integer, nullable=False)
    # Earnings (snapshot at time of processing)
    basic: Mapped[float]                    = mapped_column(Float, default=0.0)
    hra: Mapped[float]                      = mapped_column(Float, default=0.0)
    other_allowances: Mapped[float]         = mapped_column(Float, default=0.0)
    gross_salary: Mapped[float]             = mapped_column(Float, default=0.0)
    # Deductions
    pf_deduction: Mapped[float]             = mapped_column(Float, default=0.0)
    professional_tax: Mapped[float]         = mapped_column(Float, default=0.0)
    other_deductions: Mapped[float]         = mapped_column(Float, default=0.0)
    net_pay: Mapped[float]                  = mapped_column(Float, default=0.0)
    # Status
    status: Mapped[str]                     = mapped_column(String, default="Draft")  # Draft | Processed | Disbursed
    voucher_id: Mapped[Optional[int]]       = mapped_column(Integer, ForeignKey("vouchers.id"), nullable=True)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]]            = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="salary_records")
