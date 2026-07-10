from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timezone
from pydantic import BaseModel, field_validator
from finance_app.database import get_db
from finance_app.models.voucher import Voucher, VoucherEntry
from finance_app.models.audit import AuditLog

router = APIRouter()

# ── Audit helper ───────────────────────────────────────────────────────────
def _audit(db: Session, company_id: int, record_id: int, action: str,
           field_name: Optional[str] = None, old_value: Optional[str] = None,
           new_value: Optional[str] = None, description: Optional[str] = None, changed_by: str = "system"):
    # Get the last audit log's hash for the chain
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_log.hash if last_log and last_log.hash else None

    audit_log = AuditLog(
        company_id  = company_id,
        table_name  = "vouchers",
        record_id   = record_id,
        action      = action,
        field_name  = field_name,
        old_value   = old_value,
        new_value   = new_value,
        changed_by  = changed_by,
        changed_at  = datetime.now(timezone.utc),
        description = description,
        previous_hash = prev_hash
    )
    audit_log.hash = audit_log.compute_hash()
    db.add(audit_log)

PREFIXES = {
    "Payment": "PMT", "Receipt": "RCT", "Journal": "JRN",
    "Sales": "SLS", "Purchase": "PUR", "Credit Note": "CNT",
    "Debit Note": "DNT", "Contra": "CTR",
}

# ── Schemas ────────────────────────────────────────────────────────────────
class EntryIn(BaseModel):
    ledger_id:       int
    ledger_name:     str
    dr_amount:       float = 0.0
    cr_amount:       float = 0.0
    gst_rate:        float = 0.0
    gst_type:        Optional[str] = None
    is_gst_entry:    bool = False
    stock_item_id:   Optional[int] = None
    stock_item_name: Optional[str] = None
    qty:             Optional[float] = None
    rate:            Optional[float] = None
    cost_centre:     Optional[str] = None
    location_id:     Optional[int] = None
    location_name:   Optional[str] = None

class VoucherCreate(BaseModel):
    voucher_type:   str
    date:           date
    narration:      Optional[str] = None
    reference_no:   Optional[str] = None
    reference_date: Optional[date] = None
    status:         str = "Posted"
    company_id:     int
    fy_id:          Optional[int] = None
    entries:        List[EntryIn]

    @field_validator("entries")
    @classmethod
    def check_balance(cls, entries):
        total_dr = sum(e.dr_amount for e in entries)
        total_cr = sum(e.cr_amount for e in entries)
        if abs(total_dr - total_cr) > 0.01:
            diff = abs(total_dr - total_cr)
            raise ValueError(
                f"Voucher not balanced: Dr=₹{total_dr:.2f} Cr=₹{total_cr:.2f} "
                f"Diff=₹{diff:.2f}"
            )
        return entries

# ── Helpers ────────────────────────────────────────────────────────────────
def _next_number(db: Session, vtype: str, company_id: int) -> str:
    prefix = PREFIXES.get(vtype, "VCH")
    count = db.query(Voucher).filter(
        Voucher.voucher_type == vtype,
        Voucher.company_id == company_id
    ).count()
    return f"{prefix}-{str(count + 1).zfill(4)}"

def _voucher_out(v: Voucher):
    return {
        "id": v.id,
        "voucher_number": v.voucher_number,
        "voucher_type": v.voucher_type,
        "date": str(v.date),
        "narration": v.narration,
        "reference_no": v.reference_no,
        "status": v.status,
        "total_amount": v.total_amount,
        "company_id": v.company_id,
        "party_id": v.party_id,
        "fy_id": v.fy_id,
        "entries": [
            {
                "id": e.id,
                "ledger_id": e.ledger_id,
                "ledger_name": e.ledger_name,
                "dr_amount": e.dr_amount,
                "cr_amount": e.cr_amount,
                "gst_rate": e.gst_rate,
                "gst_type": e.gst_type,
                "is_gst_entry": e.is_gst_entry,
                "stock_item_id": e.stock_item_id,
                "stock_item_name": e.stock_item_name,
                "qty": e.qty,
                "rate": e.rate,
                "location_id": e.location_id,
                "location_name": e.location_name,
            }
            for e in v.entries
        ],
    }

# ── Endpoints ──────────────────────────────────────────────────────────────
@router.post("/")
def create_voucher(payload: VoucherCreate, db: Session = Depends(get_db)):
    vno   = _next_number(db, payload.voucher_type, payload.company_id)
    total = sum(e.dr_amount for e in payload.entries if e.dr_amount > 0)
    v = Voucher(
        voucher_number=vno,
        voucher_type=payload.voucher_type,
        date=payload.date,
        narration=payload.narration,
        reference_no=payload.reference_no,
        status=payload.status,
        total_amount=total,
        company_id=payload.company_id,
        party_id=payload.party_id,
        fy_id=payload.fy_id,
    )
    db.add(v)
    db.flush()
    for e in payload.entries:
        db.add(VoucherEntry(voucher_id=v.id, **e.model_dump()))
    # ── Audit: Created ──
    _audit(db, payload.company_id, v.id, "Created",
           description=f"{payload.voucher_type} {vno} created | ₹{total:.2f}")
    db.commit()
    db.refresh(v)
    return _voucher_out(v)

@router.get("/")
def list_vouchers(
    company_id:   int,
    voucher_type: Optional[str] = None,
    from_date:    Optional[date] = None,
    to_date:      Optional[date] = None,
    status:       Optional[str] = None,
    search:       Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    q = db.query(Voucher).filter(Voucher.company_id == company_id)
    if voucher_type: q = q.filter(Voucher.voucher_type == voucher_type)
    if from_date:    q = q.filter(Voucher.date >= from_date)
    if to_date:      q = q.filter(Voucher.date <= to_date)
    if status:       q = q.filter(Voucher.status == status)
    if search:       q = q.filter(Voucher.voucher_number.ilike(f"%{search}%"))
    vouchers = q.order_by(Voucher.date.desc(), Voucher.id.desc()).offset(skip).limit(limit).all()
    return [_voucher_out(v) for v in vouchers]

@router.get("/{voucher_id}")
def get_voucher(voucher_id: int, db: Session = Depends(get_db)):
    v = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not v:
        raise HTTPException(404, "Voucher not found")
    return _voucher_out(v)

@router.put("/{voucher_id}")
def update_voucher(voucher_id: int, payload: VoucherCreate, db: Session = Depends(get_db)):
    v = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not v:
        raise HTTPException(404, "Voucher not found")
    if v.status == "Cancelled":
        raise HTTPException(400, "Cannot edit a cancelled voucher")
    # ── Audit: diff fields before overwrite ──
    new_total = float(sum(e.dr_amount for e in payload.entries if e.dr_amount > 0))
    fields_to_check = [
        ("date",         str(v.date),         str(payload.date)),
        ("narration",    v.narration,         payload.narration),
        ("reference_no", v.reference_no,      payload.reference_no),
        ("total_amount", str(v.total_amount), str(new_total)),
    ]
    for field, old_val, new_val in fields_to_check:
        if old_val != new_val:
            _audit(db, v.company_id, v.id, "Updated",
                   field_name=field, old_value=old_val, new_value=new_val)
    # Replace entries
    db.query(VoucherEntry).filter(VoucherEntry.voucher_id == voucher_id).delete()
    for e in payload.entries:
        db.add(VoucherEntry(voucher_id=voucher_id, **e.model_dump()))
    v.narration    = payload.narration if payload.narration is not None else v.narration
    v.reference_no = payload.reference_no if payload.reference_no is not None else v.reference_no
    v.date         = payload.date
    v.party_id     = payload.party_id
    v.total_amount = new_total
    db.commit()
    db.refresh(v)
    return _voucher_out(v)

@router.put("/{voucher_id}/cancel")
def cancel_voucher(voucher_id: int, db: Session = Depends(get_db)):
    v = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not v:
        raise HTTPException(404, "Voucher not found")
    _audit(db, v.company_id, v.id, "Cancelled",
           field_name="status", old_value="Posted", new_value="Cancelled",
           description=f"{v.voucher_type} {v.voucher_number} cancelled")
    v.status = "Cancelled"
    db.commit()
    return {"message": f"Voucher {v.voucher_number} cancelled"}

@router.delete("/{voucher_id}")
def delete_voucher(voucher_id: int, db: Session = Depends(get_db)):
    v = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not v:
        raise HTTPException(404, "Voucher not found")
    _audit(db, v.company_id, v.id, "Deleted",
           description=f"{v.voucher_type} {v.voucher_number} deleted")
    db.delete(v)
    db.commit()
    return {"message": "Deleted"}
