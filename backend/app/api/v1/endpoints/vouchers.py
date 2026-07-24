from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.voucher import Voucher, VoucherEntry, VoucherType, VoucherItemEntry, Ledger
from app.schemas.voucher import (
    VoucherCreate, VoucherResponse, VoucherTypeResponse, 
    VoucherTypeCreate, LedgerResponse, LedgerCreate
)

router = APIRouter()

@router.post("/", response_model=VoucherResponse)
def create_voucher(
    *,
    db: Session = Depends(get_db),
    voucher_in: VoucherCreate,
) -> Any:
    """
    Create new voucher.
    """
    # 1. Validate double-entry logic
    total_debit = sum(entry.debit_amount for entry in voucher_in.entries)
    total_credit = sum(entry.credit_amount for entry in voucher_in.entries)
    
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Voucher is unbalanced. Total Debit: {total_debit}, Total Credit: {total_credit}"
        )

    # 2. Get Voucher Type and generate Voucher Number
    v_type = db.query(VoucherType).filter(VoucherType.id == voucher_in.voucher_type_id).first()
    if not v_type:
        raise HTTPException(status_code=404, detail="Voucher type not found")
        
    fin_year = voucher_in.financial_year or "2026-27"
    
    # Simple auto-increment logic for voucher number
    last_voucher = db.query(Voucher).filter(
        Voucher.voucher_type_id == v_type.id,
        Voucher.financial_year == fin_year
    ).order_by(Voucher.id.desc()).first()
    
    seq = 1
    if last_voucher:
        try:
            last_seq = int(last_voucher.voucher_number.split("/")[-1])
            seq = last_seq + 1
        except Exception:
            pass
            
    voucher_number = f"{v_type.prefix}/{fin_year}/{seq:04d}"

    # 3. Create Voucher within transaction
    voucher = Voucher(
        voucher_type_id=voucher_in.voucher_type_id,
        voucher_number=voucher_number,
        voucher_date=voucher_in.voucher_date,
        reference_number=voucher_in.reference_number,
        narration=voucher_in.narration,
        total_amount=total_debit,
        company_id=voucher_in.company_id,
        financial_year=fin_year,
        billing_address_id=voucher_in.billing_address_id,
        shipping_address_id=voucher_in.shipping_address_id,
    )
    db.add(voucher)
    db.flush() # To get voucher.id

    # 4. Add Ledger Entries
    for entry_in in voucher_in.entries:
        entry = VoucherEntry(
            voucher_id=voucher.id,
            ledger_id=entry_in.ledger_id,
            debit_amount=entry_in.debit_amount,
            credit_amount=entry_in.credit_amount,
            bill_ref=entry_in.bill_ref
        )
        db.add(entry)
        
    # 5. Add Item Entries (if any)
    if voucher_in.item_entries:
        for item_in in voucher_in.item_entries:
            item_entry = VoucherItemEntry(
                voucher_id=voucher.id,
                stock_item_id=item_in.stock_item_id,
                godown_id=item_in.godown_id,
                quantity=item_in.quantity,
                rate=item_in.rate,
                discount_percent=item_in.discount_percent,
                amount=item_in.amount
            )
            db.add(item_entry)

    db.commit()
    db.refresh(voucher)
    return voucher

@router.get("/", response_model=List[VoucherResponse])
def read_vouchers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve vouchers.
    """
    vouchers = db.query(Voucher).offset(skip).limit(limit).all()
    return vouchers

@router.get("/ledgers/{ledger_id}/balance")
def get_ledger_balance(
    ledger_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get dynamic balance for a ledger.
    """
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id).first()
    if not ledger:
        raise HTTPException(status_code=404, detail="Ledger not found")
        
    # Sum all debit and credit entries
    totals = db.query(
        func.sum(VoucherEntry.debit_amount).label('total_debit'),
        func.sum(VoucherEntry.credit_amount).label('total_credit')
    ).filter(VoucherEntry.ledger_id == ledger_id).first()
    
    total_debit = totals.total_debit or 0.0
    total_credit = totals.total_credit or 0.0
    
    # Consider opening balance
    if ledger.opening_balance_type == "DR":
        total_debit += ledger.opening_balance
    elif ledger.opening_balance_type == "CR":
        total_credit += ledger.opening_balance
        
    balance = total_debit - total_credit
    balance_type = "DR" if balance >= 0 else "CR"
    
    return {
        "ledger_id": ledger.id,
        "ledger_name": ledger.name,
        "total_debit": total_debit,
        "total_credit": total_credit,
        "balance": abs(balance),
        "balance_type": balance_type
    }
