from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.models.ledger import Ledger
from app.models.ledger_group import LedgerGroup
from app.models.voucher import Voucher, VoucherEntry

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────
class LedgerCreate(BaseModel):
    name:               str
    alias:              Optional[str] = None
    group:              str
    opening_balance:    float = 0.0
    balance_type:       str = "Dr"
    party_type:         Optional[str] = None
    gstin:              Optional[str] = None
    pan:                Optional[str] = None
    address:            Optional[str] = None
    state_code:         Optional[str] = None
    bank_name:          Optional[str] = None
    account_number:     Optional[str] = None
    ifsc_code:          Optional[str] = None
    gst_registration_type: Optional[str] = "regular"
    default_gst_rate:   float = 0.0
    hsn_sac_code:       Optional[str] = None
    company_id:         int

# ── Endpoints ──────────────────────────────────────────────────────────────
@router.post("/")
def create_ledger(payload: LedgerCreate, db: Session = Depends(get_db)):
    existing = db.query(Ledger).filter(
        Ledger.name == payload.name,
        Ledger.company_id == payload.company_id
    ).first()
    if existing:
        raise HTTPException(400, f"Ledger '{payload.name}' already exists")
    # Resolve group_id
    grp = db.query(LedgerGroup).filter(
        LedgerGroup.name == payload.group,
        LedgerGroup.company_id == payload.company_id
    ).first()
    data = payload.model_dump()
    data["group_id"] = grp.id if grp else None
    ledger = Ledger(**data)
    db.add(ledger)
    db.commit()
    db.refresh(ledger)
    return _ledger_out(ledger)

@router.get("/")
def list_ledgers(
    company_id: int,
    group:      Optional[str] = None,
    search:     Optional[str] = None,
    nature:     Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Ledger).filter(
        Ledger.company_id == company_id,
        Ledger.is_active == True
    )
    if group:
        q = q.filter(Ledger.group == group)
    if search:
        q = q.filter(Ledger.name.ilike(f"%{search}%"))
    if nature:
        group_names = [
            g.name for g in db.query(LedgerGroup).filter(
                LedgerGroup.company_id == company_id,
                LedgerGroup.nature == nature
            ).all()
        ]
        q = q.filter(Ledger.group.in_(group_names))
    return [_ledger_out(l) for l in q.order_by(Ledger.name).all()]

@router.get("/{ledger_id}")
def get_ledger(ledger_id: int, db: Session = Depends(get_db)):
    l = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not l:
        raise HTTPException(404, "Ledger not found")
    return _ledger_out(l)

@router.put("/{ledger_id}")
def update_ledger(ledger_id: int, payload: LedgerCreate, db: Session = Depends(get_db)):
    l = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not l:
        raise HTTPException(404, "Ledger not found")
    if l.is_system:
        raise HTTPException(400, "Cannot edit system ledgers")
    for k, v in payload.model_dump().items():
        if hasattr(l, k):
            setattr(l, k, v)
    db.commit()
    return _ledger_out(l)

@router.delete("/{ledger_id}")
def delete_ledger(ledger_id: int, db: Session = Depends(get_db)):
    l = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not l:
        raise HTTPException(404, "Ledger not found")
    if l.is_system:
        raise HTTPException(400, "Cannot delete system ledgers")
    l.is_active = False  # pyrefly: ignore[bad-assignment]
    db.commit()
    return {"message": "Ledger deactivated"}

@router.get("/{ledger_id}/balance")
def ledger_balance(ledger_id: int, db: Session = Depends(get_db)):
    l = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not l:
        raise HTTPException(404, "Ledger not found")
    return _calc_balance(l, db)

@router.get("/{ledger_id}/statement")
def ledger_statement(
    ledger_id: int,
    from_date: str,
    to_date:   str,
    db: Session = Depends(get_db)
):
    from datetime import date as dt
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not ledger:
        raise HTTPException(404, "Ledger not found")

    fd = dt.fromisoformat(from_date)
    td = dt.fromisoformat(to_date)

    # Opening balance = ob + all entries before from_date
    pre = db.query(VoucherEntry).filter(
        VoucherEntry.ledger_id == ledger_id
    ).join(Voucher).filter(
        Voucher.status == "Posted", Voucher.date < fd
    ).all()
    ob_dr = ledger.opening_balance if ledger.balance_type == "Dr" else 0
    ob_cr = ledger.opening_balance if ledger.balance_type == "Cr" else 0
    for e in pre:
        ob_dr += e.dr_amount
        ob_cr += e.cr_amount
    opening = ob_dr - ob_cr

    # Period entries
    period_entries = db.query(VoucherEntry).filter(
        VoucherEntry.ledger_id == ledger_id
    ).join(Voucher).filter(
        Voucher.status == "Posted",
        Voucher.date >= fd,
        Voucher.date <= td
    ).order_by(Voucher.date, Voucher.id).all()

    rows = []
    running = opening
    for e in period_entries:
        v = e.voucher
        running += e.dr_amount - e.cr_amount
        rows.append({
            "date": str(v.date),
            "voucher_number": v.voucher_number,
            "voucher_type": v.voucher_type,
            "narration": v.narration,
            "reference_no": v.reference_no,
            "dr_amount": round(e.dr_amount, 2),  # pyrefly: ignore[bad-argument-type]
            "cr_amount": round(e.cr_amount, 2),  # pyrefly: ignore[bad-argument-type]
            "running_balance": round(abs(running), 2),  # pyrefly: ignore[bad-argument-type]
            "balance_type": "Dr" if running >= 0 else "Cr",
        })

    closing = running
    return {
        "ledger_id": ledger_id,
        "ledger_name": ledger.name,
        "group": ledger.group,
        "from_date": from_date, "to_date": to_date,
        "opening_balance": round(abs(opening), 2),  # pyrefly: ignore[bad-argument-type]
        "opening_type": "Dr" if opening >= 0 else "Cr",
        "entries": rows,
        "total_dr": round(sum(r["dr_amount"] for r in rows), 2),
        "total_cr": round(sum(r["cr_amount"] for r in rows), 2),
        "closing_balance": round(abs(closing), 2),  # pyrefly: ignore[bad-argument-type]
        "closing_type": "Dr" if closing >= 0 else "Cr",
    }

# ── Helpers ────────────────────────────────────────────────────────────────
def _ledger_out(l: Ledger):
    return {
        "id": l.id, "name": l.name, "alias": l.alias,
        "group": l.group, "group_id": l.group_id,
        "opening_balance": l.opening_balance, "balance_type": l.balance_type,
        "party_type": l.party_type, "gstin": l.gstin, "pan": l.pan,
        "address": l.address, "state_code": l.state_code,
        "bank_name": l.bank_name, "account_number": l.account_number,
        "ifsc_code": l.ifsc_code,
        "gst_registration_type": l.gst_registration_type,
        "default_gst_rate": l.default_gst_rate,
        "hsn_sac_code": l.hsn_sac_code,
        "is_active": l.is_active, "is_system": l.is_system,
        "company_id": l.company_id,
    }

def _calc_balance(l: Ledger, db: Session):
    entries = db.query(VoucherEntry).filter(
        VoucherEntry.ledger_id == l.id
    ).join(Voucher).filter(Voucher.status == "Posted").all()
    dr = l.opening_balance if l.balance_type == "Dr" else 0
    cr = l.opening_balance if l.balance_type == "Cr" else 0
    for e in entries:
        dr += e.dr_amount
        cr += e.cr_amount
    net = dr - cr
    return {
        "ledger_id": l.id, "ledger_name": l.name,
        "total_dr": round(dr, 2), "total_cr": round(cr, 2),  # pyrefly: ignore[bad-argument-type]
        "closing_balance": round(abs(net), 2),  # pyrefly: ignore[bad-argument-type]
        "balance_type": "Dr" if net >= 0 else "Cr",
    }
