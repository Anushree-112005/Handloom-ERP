from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.stock_item import StockItem

router = APIRouter()

class StockItemCreate(BaseModel):
    item_code:     Optional[str] = None
    name:          str
    item_category: str = "CONSUMABLE"
    unit:          Optional[str] = "Nos"
    hsn_code:      Optional[str] = None
    gst_rate:      float = 18.0
    purchase_rate: float = 0.0
    selling_rate:  float = 0.0
    opening_qty:   float = 0.0
    opening_rate:  float = 0.0
    yarn_form:     str = "NA"
    reorder_level: float = 0.0
    company_id:    int

@router.get("/")
def list_stock_items(company_id: int, db: Session = Depends(get_db)):
    items = db.query(StockItem).filter(
        StockItem.company_id == company_id,
        StockItem.is_active == True
    ).order_by(StockItem.name).all()
    return [_item_out(i) for i in items]

@router.post("/")
def create_stock_item(payload: StockItemCreate, db: Session = Depends(get_db)):
    existing = db.query(StockItem).filter(
        StockItem.name == payload.name,
        StockItem.company_id == payload.company_id
    ).first()
    if existing:
        raise HTTPException(400, f"Stock item '{payload.name}' already exists")
    item = StockItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _item_out(item)

@router.get("/{item_id}")
def get_stock_item(item_id: int, db: Session = Depends(get_db)):
    i = db.query(StockItem).filter(StockItem.id == item_id).first()
    if not i:
        raise HTTPException(404, "Stock item not found")
    return _item_out(i)

@router.put("/{item_id}")
def update_stock_item(item_id: int, payload: StockItemCreate, db: Session = Depends(get_db)):
    i = db.query(StockItem).filter(StockItem.id == item_id).first()
    if not i:
        raise HTTPException(404, "Stock item not found")
    for k, v in payload.model_dump().items():
        if hasattr(i, k):
            setattr(i, k, v)
    db.commit()
    return _item_out(i)

@router.delete("/{item_id}")
def delete_stock_item(item_id: int, db: Session = Depends(get_db)):
    i = db.query(StockItem).filter(StockItem.id == item_id).first()
    if not i:
        raise HTTPException(404, "Stock item not found")
    i.is_active = False  # pyrefly: ignore[bad-assignment]
    db.commit()
    return {"message": "Deleted"}

def _item_out(i: StockItem):
    return {
        "id": i.id, "name": i.name, "unit": i.unit,
        "item_code": i.item_code, "item_category": i.item_category,
        "hsn_code": i.hsn_code, "gst_rate": i.gst_rate,
        "purchase_rate": i.purchase_rate, "selling_rate": i.selling_rate,
        "opening_qty": i.opening_qty, "opening_rate": i.opening_rate,
        "yarn_form": i.yarn_form, "reorder_level": i.reorder_level,
        "opening_value": round(i.opening_qty * i.opening_rate, 2),  # pyrefly: ignore[bad-argument-type]
        "company_id": i.company_id,
    }
