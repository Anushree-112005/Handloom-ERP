from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from finance_app.database import get_db
from finance_app.models.currency import Currency
from finance_app.schemas.currency import CurrencyCreate, CurrencyOut

router = APIRouter()

@router.get("/", response_model=List[CurrencyOut])
def get_currencies(company_id: int, db: Session = Depends(get_db)):
    currencies = db.query(Currency).filter(Currency.company_id == company_id).all()
    return currencies

@router.post("/", response_model=CurrencyOut)
def create_currency(company_id: int, currency: CurrencyCreate, db: Session = Depends(get_db)):
    db_currency = Currency(**currency.model_dump(), company_id=company_id)
    db.add(db_currency)
    db.commit()
    db.refresh(db_currency)
    return db_currency

@router.delete("/{currency_id}")
def delete_currency(currency_id: int, db: Session = Depends(get_db)):
    currency = db.query(Currency).filter(Currency.id == currency_id).first()
    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")
    db.delete(currency)
    db.commit()
    return {"message": "Currency deleted"}
