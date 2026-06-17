from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from finance_app.database import get_db
from finance_app.models.company import FinancialYear

router = APIRouter()

class FYCreate(BaseModel):
    company_id: int
    label:      str
    start_date: str
    end_date:   str
    is_current: bool = True

@router.get("/")
def list_financial_years(company_id: int, db: Session = Depends(get_db)):
    fys = db.query(FinancialYear).filter(FinancialYear.company_id == company_id).all()
    return [
        {
            "id": f.id, "label": f.label,
            "start_date": str(f.start_date), "end_date": str(f.end_date),
            "is_current": f.is_current, "is_closed": f.is_closed,
            "company_id": f.company_id,
        }
        for f in fys
    ]

@router.post("/")
def create_financial_year(payload: FYCreate, db: Session = Depends(get_db)):
    from datetime import date
    if payload.is_current:
        db.query(FinancialYear).filter(
            FinancialYear.company_id == payload.company_id
        ).update({"is_current": False})
    fy = FinancialYear(
        company_id=payload.company_id,
        label=payload.label,
        start_date=date.fromisoformat(payload.start_date),
        end_date=date.fromisoformat(payload.end_date),
        is_current=payload.is_current,
    )
    db.add(fy)
    db.commit()
    db.refresh(fy)
    return {"id": fy.id, "label": fy.label,
            "start_date": str(fy.start_date), "end_date": str(fy.end_date),
            "is_current": fy.is_current}

@router.put("/{fy_id}/set-current")
def set_current_fy(fy_id: int, db: Session = Depends(get_db)):
    fy = db.query(FinancialYear).filter(FinancialYear.id == fy_id).first()
    if not fy:
        raise HTTPException(404, "Financial year not found")
    db.query(FinancialYear).filter(
        FinancialYear.company_id == fy.company_id
    ).update({"is_current": False})
    fy.is_current = True  # pyrefly: ignore[bad-assignment]
    db.commit()
    return {"message": f"{fy.label} is now current"}
