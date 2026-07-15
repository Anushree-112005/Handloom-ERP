from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from finance_app.database import get_db
from finance_app.models.voucher_type import VoucherType
from finance_app.schemas.voucher_type import VoucherTypeCreate, VoucherTypeOut

router = APIRouter()

@router.get("/", response_model=List[VoucherTypeOut])
def get_voucher_types(company_id: int, db: Session = Depends(get_db)):
    voucher_types = db.query(VoucherType).filter(VoucherType.company_id == company_id).all()
    return voucher_types

@router.post("/", response_model=VoucherTypeOut)
def create_voucher_type(company_id: int, voucher_type: VoucherTypeCreate, db: Session = Depends(get_db)):
    db_voucher_type = VoucherType(**voucher_type.model_dump(), company_id=company_id)
    db.add(db_voucher_type)
    db.commit()
    db.refresh(db_voucher_type)
    return db_voucher_type

@router.delete("/{vt_id}")
def delete_voucher_type(vt_id: int, db: Session = Depends(get_db)):
    vt = db.query(VoucherType).filter(VoucherType.id == vt_id).first()
    if not vt:
        raise HTTPException(status_code=404, detail="Voucher Type not found")
    db.delete(vt)
    db.commit()
    return {"message": "Voucher Type deleted"}
