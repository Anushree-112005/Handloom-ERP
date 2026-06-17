from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime, timezone
from finance_app.database import get_db
from finance_app.models.banking import BankReconciliation
from finance_app.models.voucher import Voucher, VoucherEntry
from finance_app.models.ledger import Ledger

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────
class ReconcileRequest(BaseModel):
    company_id:    int
    voucher_id:    int
    bank_ledger_id: int
    bank_date:     date
    reconciled_by: str = "admin"
    notes:         Optional[str] = None

# ── Helpers ────────────────────────────────────────────────────────────────
BANK_GROUPS = ["Bank Accounts", "Bank OD Accounts"]

def _get_bank_ledgers(company_id: int, db: Session):
    return db.query(Ledger).filter(
        Ledger.company_id == company_id,
        Ledger.group.in_(BANK_GROUPS)
    ).all()

def _ledger_balance(ledger_id: int, db: Session) -> float:
    """Compute running balance from voucher entries."""
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not ledger:
        return 0.0
    dr_total = db.query(func.sum(VoucherEntry.dr_amount)).filter(
        VoucherEntry.ledger_id == ledger_id
    ).scalar() or 0.0
    cr_total = db.query(func.sum(VoucherEntry.cr_amount)).filter(
        VoucherEntry.ledger_id == ledger_id
    ).scalar() or 0.0
    opening  = ledger.opening_balance or 0.0
    if ledger.balance_type == "Dr":
        return opening + dr_total - cr_total
    else:
        return opening + cr_total - dr_total

# ── Endpoints ──────────────────────────────────────────────────────────────
@router.get("/accounts/")
def get_bank_accounts(company_id: int, db: Session = Depends(get_db)):
    """Return all bank ledgers with their computed running balance."""
    bank_ledgers = _get_bank_ledgers(company_id, db)
    result = []
    for ledger in bank_ledgers:
        balance = _ledger_balance(ledger.id, db)
        # Count unreconciled items
        reconciled_voucher_ids = select(BankReconciliation.voucher_id).where(
            BankReconciliation.bank_ledger_id == ledger.id
        )
        unreconciled_count = db.query(func.count(VoucherEntry.voucher_id.distinct())).filter(
            VoucherEntry.ledger_id == ledger.id,
            ~VoucherEntry.voucher_id.in_(reconciled_voucher_ids)
        ).scalar() or 0
        result.append({
            "id":                 ledger.id,
            "name":               ledger.name,
            "group":              ledger.group,
            "balance":            balance,
            "balance_type":       ledger.balance_type,
            "unreconciled_count": unreconciled_count,
        })
    return result

@router.get("/unreconciled/")
def get_unreconciled(company_id: int, bank_ledger_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Return vouchers involving bank accounts that haven't been reconciled yet."""
    if bank_ledger_id:
        bank_ledger_ids = [bank_ledger_id]
    else:
        bank_ledger_ids = [l.id for l in _get_bank_ledgers(company_id, db)]

    if not bank_ledger_ids:
        return []

    # Subquery: all reconciled voucher IDs for these specific bank ledgers
    reconciled_ids = {
        r.voucher_id for r in db.query(BankReconciliation).filter(
            BankReconciliation.company_id == company_id,
            BankReconciliation.bank_ledger_id.in_(bank_ledger_ids)
        ).all()
    }

    # Get vouchers that touch these bank ledgers
    entries = db.query(VoucherEntry).filter(
        VoucherEntry.ledger_id.in_(bank_ledger_ids)
    ).all()

    seen_entries = set()
    result = []
    for entry in entries:
        if (entry.voucher_id, entry.ledger_id) in seen_entries:
            continue
        if entry.voucher_id in reconciled_ids:
            # Wait, since reconciled_ids is filtered by bank_ledger_ids, this works:
            # but what if a voucher is reconciled in bank A but not bank B?
            # We need to check if *this specific* voucher_id + ledger_id is reconciled.
            pass
        
        # Proper check:
        # We need to know if this specific entry (voucher + ledger) is reconciled.
        # Let's rebuild reconciled_set to be a set of tuples (voucher_id, bank_ledger_id)
        pass

    # Re-building reconciled set properly:
    reconciled_pairs = {
        (r.voucher_id, r.bank_ledger_id) for r in db.query(BankReconciliation).filter(
            BankReconciliation.company_id == company_id,
            BankReconciliation.bank_ledger_id.in_(bank_ledger_ids)
        ).all()
    }
    
    seen_entries = set()
    result = []
    for entry in entries:
        pair = (entry.voucher_id, entry.ledger_id)
        if pair in seen_entries or pair in reconciled_pairs:
            continue
        seen_entries.add(pair)
        voucher = db.query(Voucher).filter(
            Voucher.id == entry.voucher_id,
            Voucher.company_id == company_id,
            Voucher.status == "Posted"
        ).first()
        if not voucher:
            continue
        ledger = db.query(Ledger).filter(Ledger.id == entry.ledger_id).first()
        amount = entry.dr_amount if entry.cr_amount > entry.dr_amount else entry.cr_amount
        # The "amount" for bank = the bigger side
        amount = max(entry.dr_amount, entry.cr_amount)
        txn_type = "Credit" if entry.dr_amount > 0 else "Debit"
        result.append({
            "voucher_id":      voucher.id,
            "voucher_number":  voucher.voucher_number,
            "voucher_type":    voucher.voucher_type,
            "date":            str(voucher.date),
            "narration":       voucher.narration or "",
            "particulars":     voucher.narration or voucher.voucher_number,
            "reference_no":    voucher.reference_no or "",
            "total_amount":    amount,
            "txn_type":        txn_type,
            "bank_ledger_id":  entry.ledger_id,
            "bank_ledger_name": ledger.name if ledger else "",
        })

    return sorted(result, key=lambda x: x["date"], reverse=True)

@router.post("/reconcile")
def reconcile_voucher(payload: ReconcileRequest, db: Session = Depends(get_db)):
    """Mark a voucher as reconciled with the bank date."""
    # Check if already reconciled for this specific bank ledger
    existing = db.query(BankReconciliation).filter(
        BankReconciliation.voucher_id == payload.voucher_id,
        BankReconciliation.bank_ledger_id == payload.bank_ledger_id
    ).first()
    if existing:
        # Update bank date
        existing.bank_date = payload.bank_date
        existing.reconciled_at = datetime.now(timezone.utc)
        db.commit()
        return {"message": "Reconciliation date updated", "id": existing.id}

    recon = BankReconciliation(
        company_id     = payload.company_id,
        voucher_id     = payload.voucher_id,
        bank_ledger_id = payload.bank_ledger_id,
        bank_date      = payload.bank_date,
        reconciled_at  = datetime.now(timezone.utc),
        reconciled_by  = payload.reconciled_by,
        notes          = payload.notes,
    )
    db.add(recon)
    db.commit()
    db.refresh(recon)
    return {"message": "Voucher reconciled successfully", "id": recon.id}

@router.delete("/reconcile/{voucher_id}")
def unreconcile_voucher(voucher_id: int, db: Session = Depends(get_db)):
    """Remove a reconciliation record (unreconcile)."""
    recon = db.query(BankReconciliation).filter(
        BankReconciliation.voucher_id == voucher_id
    ).first()
    if not recon:
        raise HTTPException(404, "Reconciliation record not found")
    db.delete(recon)
    db.commit()
    return {"message": "Unreconciled successfully"}

@router.get("/cheques/")
def get_cheques(company_id: int, bank_ledger_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Return Payment vouchers with cheque/instrument references (for cheque register)."""
    if bank_ledger_id:
        bank_ledger_ids = [bank_ledger_id]
    else:
        bank_ledger_ids = [l.id for l in _get_bank_ledgers(company_id, db)]

    if not bank_ledger_ids:
        return []

    # Get all reconciled voucher IDs (tuple of voucher_id, bank_ledger_id)
    recon_map = {
        (r.voucher_id, r.bank_ledger_id): r for r in db.query(BankReconciliation).filter(
            BankReconciliation.company_id == company_id
        ).all()
    }

    # Payment vouchers involving bank ledgers
    entries = db.query(VoucherEntry).filter(
        VoucherEntry.ledger_id.in_(bank_ledger_ids)
    ).all()

    seen = set()
    result = []
    for entry in entries:
        pair = (entry.voucher_id, entry.ledger_id)
        if pair in seen:
            continue
        seen.add(pair)
        voucher = db.query(Voucher).filter(
            Voucher.id == entry.voucher_id,
            Voucher.company_id == company_id,
            Voucher.voucher_type.in_(["Payment", "Receipt"])
        ).first()
        if not voucher:
            continue
        recon = recon_map.get(pair)
        ledger = db.query(Ledger).filter(Ledger.id == entry.ledger_id).first()
        result.append({
            "voucher_id":      voucher.id,
            "voucher_number":  voucher.voucher_number,
            "voucher_type":    voucher.voucher_type,
            "date":            str(voucher.date),
            "payee":           voucher.narration or voucher.voucher_number,
            "reference_no":    voucher.reference_no or "—",
            "amount":          voucher.total_amount,
            "bank_ledger_id":  entry.ledger_id,
            "bank_ledger_name": ledger.name if ledger else "",
            "is_reconciled":   recon is not None,
            "bank_date":       str(recon.bank_date) if recon else None,
        })

    return sorted(result, key=lambda x: x["date"], reverse=True)

@router.get("/reconciled/")
def get_reconciled(company_id: int, bank_ledger_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Return all reconciled transactions."""
    q = db.query(BankReconciliation).filter(BankReconciliation.company_id == company_id)
    if bank_ledger_id:
        q = q.filter(BankReconciliation.bank_ledger_id == bank_ledger_id)
    reconciledList = q.order_by(BankReconciliation.bank_date.desc()).all()

    result = []
    for recon in reconciledList:
        voucher = db.query(Voucher).filter(Voucher.id == recon.voucher_id).first()
        ledger  = db.query(Ledger).filter(Ledger.id == recon.bank_ledger_id).first()
        result.append({
            "recon_id":         recon.id,
            "voucher_id":       recon.voucher_id,
            "voucher_number":   voucher.voucher_number if voucher else "",
            "voucher_type":     voucher.voucher_type if voucher else "",
            "voucher_date":     str(voucher.date) if voucher else "",
            "bank_date":        str(recon.bank_date),
            "bank_ledger_name": ledger.name if ledger else "",
            "amount":           voucher.total_amount if voucher else 0,
            "reconciled_by":    recon.reconciled_by,
            "reconciled_at":    str(recon.reconciled_at),
        })
    return result

@router.get("/post-dated/")
def get_post_dated(company_id: int, db: Session = Depends(get_db)):
    """Return vouchers with reference_date in the future (post-dated instruments)."""
    today = date.today()
    vouchers = db.query(Voucher).filter(
        Voucher.company_id == company_id,
        Voucher.reference_date > today,
        Voucher.status == "Posted"
    ).order_by(Voucher.reference_date.asc()).all()

    result = []
    for v in vouchers:
        result.append({
            "voucher_id":    v.id,
            "voucher_number": v.voucher_number,
            "voucher_type":  v.voucher_type,
            "date":          str(v.date),
            "due_date":      str(v.reference_date),
            "narration":     v.narration or "",
            "reference_no":  v.reference_no or "",
            "amount":        v.total_amount,
            "status":        v.status,
        })
    return result
