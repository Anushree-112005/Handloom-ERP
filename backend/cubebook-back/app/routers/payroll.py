from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, timezone
from app.database import get_db
from app.models.payroll import Employee, SalaryRecord
from app.models.voucher import Voucher, VoucherEntry
from app.models.ledger import Ledger

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────
class EmployeeCreate(BaseModel):
    emp_code:          str
    full_name:         str
    designation:       Optional[str] = None
    department:        Optional[str] = None
    bank_account:      Optional[str] = None
    ifsc_code:         Optional[str] = None
    bank_name:         Optional[str] = None
    basic_salary:      float = 0.0
    hra:               float = 0.0
    other_allowances:  float = 0.0
    pf_deduction:      float = 0.0
    professional_tax:  float = 0.0
    joining_date:      Optional[date] = None
    status:            str = "Active"
    company_id:        int

class EmployeeUpdate(BaseModel):
    full_name:         Optional[str] = None
    designation:       Optional[str] = None
    department:        Optional[str] = None
    bank_account:      Optional[str] = None
    ifsc_code:         Optional[str] = None
    bank_name:         Optional[str] = None
    basic_salary:      Optional[float] = None
    hra:               Optional[float] = None
    other_allowances:  Optional[float] = None
    pf_deduction:      Optional[float] = None
    professional_tax:  Optional[float] = None
    status:            Optional[str] = None

class ProcessSalaryRequest(BaseModel):
    company_id: int
    month:      int   # 1-12
    year:       int
    adjustments: Optional[List[dict]] = None  # [{employee_id, other_deductions, notes}]

class DisburseRequest(BaseModel):
    salary_record_ids: List[int]
    company_id:        int
    payment_ledger_id: int  # Bank/Cash ledger to pay from

# ── Helpers ────────────────────────────────────────────────────────────────
MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April", 5: "May",
    6: "June", 7: "July", 8: "August", 9: "September",
    10: "October", 11: "November", 12: "December"
}

def _emp_out(e: Employee):
    return {
        "id":               e.id,
        "company_id":       e.company_id,
        "emp_code":         e.emp_code,
        "full_name":        e.full_name,
        "designation":      e.designation,
        "department":       e.department,
        "bank_account":     e.bank_account,
        "ifsc_code":        e.ifsc_code,
        "bank_name":        e.bank_name,
        "basic_salary":     e.basic_salary,
        "hra":              e.hra,
        "other_allowances": e.other_allowances,
        "pf_deduction":     e.pf_deduction,
        "professional_tax": e.professional_tax,
        "joining_date":     str(e.joining_date) if e.joining_date else None,
        "status":           e.status,
        "gross_salary":     e.basic_salary + e.hra + e.other_allowances,
        "net_pay":          (e.basic_salary + e.hra + e.other_allowances) - e.pf_deduction - e.professional_tax,
        "created_at":       str(e.created_at),
    }

def _record_out(r: SalaryRecord):
    return {
        "id":               r.id,
        "company_id":       r.company_id,
        "employee_id":      r.employee_id,
        "employee_name":    r.employee.full_name if r.employee else None,
        "emp_code":         r.employee.emp_code if r.employee else None,
        "month":            r.month,
        "year":             r.year,
        "month_label":      f"{MONTH_NAMES.get(r.month, '')} {r.year}",
        "basic":            r.basic,
        "hra":              r.hra,
        "other_allowances": r.other_allowances,
        "gross_salary":     r.gross_salary,
        "pf_deduction":     r.pf_deduction,
        "professional_tax": r.professional_tax,
        "other_deductions": r.other_deductions,
        "net_pay":          r.net_pay,
        "status":           r.status,
        "voucher_id":       r.voucher_id,
        "processed_at":     str(r.processed_at) if r.processed_at else None,
        "notes":            r.notes,
    }

# ── Demo seed data ────────────────────────────────────────────────────────
_DEMO_EMPLOYEES = [
    dict(emp_code="EMP001", full_name="Rajesh Kumar",      designation="Senior Accountant",  department="Accounts",    basic_salary=35000, hra=14000, other_allowances=5000,  pf_deduction=4200, professional_tax=200, bank_account="001234567890", ifsc_code="HDFC0001234", bank_name="HDFC Bank",      status="Active"),
    dict(emp_code="EMP002", full_name="Priya Sharma",       designation="HR Manager",           department="HR",         basic_salary=42000, hra=16800, other_allowances=8000,  pf_deduction=5040, professional_tax=200, bank_account="002345678901", ifsc_code="ICIC0002345", bank_name="ICICI Bank",     status="Active"),
    dict(emp_code="EMP003", full_name="Arjun Mehta",        designation="Sales Executive",       department="Sales",      basic_salary=28000, hra=11200, other_allowances=6000,  pf_deduction=3360, professional_tax=200, bank_account="003456789012", ifsc_code="SBIN0003456", bank_name="State Bank",      status="Active"),
    dict(emp_code="EMP004", full_name="Sunita Patel",       designation="Operations Head",       department="Operations", basic_salary=55000, hra=22000, other_allowances=10000, pf_deduction=6600, professional_tax=200, bank_account="004567890123", ifsc_code="AXIS0004567", bank_name="Axis Bank",       status="Active"),
    dict(emp_code="EMP005", full_name="Vikram Singh",       designation="IT Engineer",            department="IT",         basic_salary=48000, hra=19200, other_allowances=7500,  pf_deduction=5760, professional_tax=200, bank_account="005678901234", ifsc_code="KOTAK005678", bank_name="Kotak Bank",      status="Active"),
    dict(emp_code="EMP006", full_name="Meena Iyer",         designation="Accountant",             department="Accounts",   basic_salary=30000, hra=12000, other_allowances=4000,  pf_deduction=3600, professional_tax=200, bank_account="006789012345", ifsc_code="HDFC0006789", bank_name="HDFC Bank",      status="Active"),
    dict(emp_code="EMP007", full_name="Deepak Joshi",       designation="Production Supervisor",  department="Production", basic_salary=32000, hra=12800, other_allowances=5500,  pf_deduction=3840, professional_tax=200, bank_account="007890123456", ifsc_code="PUNB0007890", bank_name="Punjab National", status="Active"),
    dict(emp_code="EMP008", full_name="Ananya Krishnan",    designation="Management Trainee",     department="Management", basic_salary=25000, hra=10000, other_allowances=3000,  pf_deduction=3000, professional_tax=150, bank_account="008901234567", ifsc_code="ICIC0008901", bank_name="ICICI Bank",     status="Active"),
]

def _auto_seed_employees(company_id: int, db: Session):
    """Auto-populate demo employees when a company has none."""
    for d in _DEMO_EMPLOYEES:
        emp = Employee(
            company_id       = company_id,
            joining_date     = date(2023, 4, 1),
            created_at       = datetime.now(timezone.utc),
            **d,
        )
        db.add(emp)
    db.commit()

# ── Employee Endpoints ──────────────────────────────────────────────────────
@router.get("/employees/")
def list_employees(company_id: int, db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.company_id == company_id).order_by(Employee.emp_code).all()
    # Auto-seed demo data on first access
    if not employees:
        _auto_seed_employees(company_id, db)
        employees = db.query(Employee).filter(Employee.company_id == company_id).order_by(Employee.emp_code).all()
    return [_emp_out(e) for e in employees]

@router.post("/employees/")
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.company_id == payload.company_id, Employee.emp_code == payload.emp_code).first():
        raise HTTPException(400, f"Employee code {payload.emp_code} already exists")
    emp = Employee(**payload.model_dump())
    emp.created_at = datetime.now(timezone.utc)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return _emp_out(emp)

@router.get("/employees/{emp_id}")
def get_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    return _emp_out(emp)

@router.put("/employees/{emp_id}")
def update_employee(emp_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return _emp_out(emp)

@router.delete("/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    db.delete(emp)
    db.commit()
    return {"message": "Employee deleted"}

# ── Salary Record Endpoints ─────────────────────────────────────────────────
@router.get("/salary-records/")
def list_salary_records(
    company_id: int,
    month: Optional[int] = None,
    year:  Optional[int] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(SalaryRecord).options(joinedload(SalaryRecord.employee)).filter(
        SalaryRecord.company_id == company_id
    )
    if month:       q = q.filter(SalaryRecord.month == month)
    if year:        q = q.filter(SalaryRecord.year == year)
    if employee_id: q = q.filter(SalaryRecord.employee_id == employee_id)
    records = q.order_by(SalaryRecord.year.desc(), SalaryRecord.month.desc(), SalaryRecord.employee_id).all()
    return [_record_out(r) for r in records]

@router.post("/process-salary")
def process_salary(payload: ProcessSalaryRequest, db: Session = Depends(get_db)):
    """Generate SalaryRecord rows for all Active employees for the given month/year."""
    # Check if already processed
    existing = db.query(SalaryRecord).filter(
        SalaryRecord.company_id == payload.company_id,
        SalaryRecord.month == payload.month,
        SalaryRecord.year  == payload.year,
    ).count()
    if existing > 0:
        raise HTTPException(400, f"Salary already processed for {MONTH_NAMES.get(payload.month)} {payload.year}. Delete existing records to reprocess.")

    employees = db.query(Employee).filter(
        Employee.company_id == payload.company_id,
        Employee.status == "Active"
    ).all()

    if not employees:
        raise HTTPException(400, "No active employees found")

    adj_map = {}
    if payload.adjustments:
        adj_map = {a["employee_id"]: a for a in payload.adjustments}

    created = []
    for emp in employees:
        adj = adj_map.get(emp.id, {})
        other_ded = float(adj.get("other_deductions", 0.0))
        gross = emp.basic_salary + emp.hra + emp.other_allowances
        net   = gross - emp.pf_deduction - emp.professional_tax - other_ded
        record = SalaryRecord(
            company_id       = payload.company_id,
            employee_id      = emp.id,
            month            = payload.month,
            year             = payload.year,
            basic            = emp.basic_salary,
            hra              = emp.hra,
            other_allowances = emp.other_allowances,
            gross_salary     = gross,
            pf_deduction     = emp.pf_deduction,
            professional_tax = emp.professional_tax,
            other_deductions = other_ded,
            net_pay          = max(net, 0),
            status           = "Processed",
            processed_at     = datetime.now(timezone.utc),
            notes            = adj.get("notes"),
        )
        db.add(record)
        db.flush()
        db.refresh(record)
        created.append(record)

    db.commit()
    # Re-load with employee relationship
    for r in created:
        db.refresh(r)
    return {
        "message": f"Salary processed for {len(created)} employees ({MONTH_NAMES.get(payload.month)} {payload.year})",
        "records": [_record_out(r) for r in created]
    }

@router.put("/salary-records/{record_id}/disburse")
def disburse_salary(record_id: int, payment_ledger_id: int, company_id: int, db: Session = Depends(get_db)):
    """Mark a salary record as Disbursed and create a Payment Voucher."""
    record = db.query(SalaryRecord).options(joinedload(SalaryRecord.employee)).filter(
        SalaryRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(404, "Salary record not found")
    if record.status == "Disbursed":
        raise HTTPException(400, "Already disbursed")

    emp = record.employee
    # Find or create Salary Expense ledger
    salary_ledger = db.query(Ledger).filter(
        Ledger.company_id == company_id,
        Ledger.name.in_(["Salary Expense", "Salary & Wages", "Salaries"])
    ).first()
    if not salary_ledger:
        # Auto-create salary expense ledger
        salary_ledger = Ledger(
            name="Salary Expense",
            group="Indirect Expenses",
            balance_type="Dr",
            opening_balance=0.0,
            company_id=company_id,
        )
        db.add(salary_ledger)
        db.flush()

    payment_ledger = db.query(Ledger).filter(Ledger.id == payment_ledger_id).first()
    if not payment_ledger:
        raise HTTPException(404, "Payment ledger not found")

    # Auto-number the voucher
    from app.models.voucher import Voucher, VoucherEntry
    count = db.query(Voucher).filter(Voucher.company_id == company_id, Voucher.voucher_type == "Payment").count()
    vno = f"PMT-{str(count + 1).zfill(4)}"

    narration = f"Salary payment for {emp.full_name} ({emp.emp_code}) - {MONTH_NAMES.get(record.month)} {record.year}"
    v = Voucher(
        voucher_number = vno,
        voucher_type   = "Payment",
        date           = date(record.year, record.month, 28),  # last business day approx
        narration      = narration,
        reference_no   = f"SAL-{record.year}-{record.month:02d}-{emp.emp_code}",
        status         = "Posted",
        total_amount   = record.net_pay,
        company_id     = company_id,
    )
    db.add(v)
    db.flush()

    # Debit Salary Expense
    db.add(VoucherEntry(
        voucher_id  = v.id,
        ledger_id   = salary_ledger.id,
        ledger_name = salary_ledger.name,
        dr_amount   = record.net_pay,
        cr_amount   = 0.0,
    ))
    # Credit Bank/Cash
    db.add(VoucherEntry(
        voucher_id  = v.id,
        ledger_id   = payment_ledger.id,
        ledger_name = payment_ledger.name,
        dr_amount   = 0.0,
        cr_amount   = record.net_pay,
    ))

    record.status     = "Disbursed"
    record.voucher_id = v.id
    db.commit()
    db.refresh(record)
    return {
        "message":    f"Salary disbursed: Voucher {vno} created",
        "voucher_id": v.id,
        "record":     _record_out(record)
    }

@router.delete("/salary-records/")
def delete_salary_run(company_id: int, month: int, year: int, db: Session = Depends(get_db)):
    """Delete all non-disbursed salary records for a month/year (allows reprocessing)."""
    records = db.query(SalaryRecord).filter(
        SalaryRecord.company_id == company_id,
        SalaryRecord.month == month,
        SalaryRecord.year == year,
        SalaryRecord.status != "Disbursed"
    ).all()
    count = len(records)
    for r in records:
        db.delete(r)
    db.commit()
    return {"message": f"Deleted {count} salary records for {MONTH_NAMES.get(month)} {year}"}
