from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.inventory import StockGroup, UnitOfMeasure, StockCategory, Location

router = APIRouter()

# ══════════════════════════════════════════════════════════════════════════════
# STOCK GROUPS
# ══════════════════════════════════════════════════════════════════════════════

class StockGroupCreate(BaseModel):
    name:       str
    parent_id:  Optional[int] = None
    company_id: int

class StockGroupUpdate(BaseModel):
    name:      str
    parent_id: Optional[int] = None

@router.get("/stock-groups/")
def list_stock_groups(company_id: int, db: Session = Depends(get_db)):
    groups = db.query(StockGroup).filter(
        StockGroup.company_id == company_id
    ).order_by(StockGroup.name).all()
    return [_sg_out(g) for g in groups]

@router.post("/stock-groups/")
def create_stock_group(payload: StockGroupCreate, db: Session = Depends(get_db)):
    existing = db.query(StockGroup).filter(
        StockGroup.name == payload.name,
        StockGroup.company_id == payload.company_id
    ).first()
    if existing:
        raise HTTPException(400, f"Stock group '{payload.name}' already exists")
    g = StockGroup(name=payload.name, parent_id=payload.parent_id,
                   company_id=payload.company_id)
    db.add(g)
    db.commit()
    db.refresh(g)
    return _sg_out(g)

@router.get("/stock-groups/{group_id}")
def get_stock_group(group_id: int, db: Session = Depends(get_db)):
    g = db.query(StockGroup).filter(StockGroup.id == group_id).first()
    if not g:
        raise HTTPException(404, "Stock group not found")
    return _sg_out(g)

@router.put("/stock-groups/{group_id}")
def update_stock_group(group_id: int, payload: StockGroupUpdate,
                       db: Session = Depends(get_db)):
    g = db.query(StockGroup).filter(StockGroup.id == group_id).first()
    if not g:
        raise HTTPException(404, "Stock group not found")
    g.name = payload.name
    g.parent_id = payload.parent_id
    db.commit()
    return _sg_out(g)

@router.delete("/stock-groups/{group_id}")
def delete_stock_group(group_id: int, db: Session = Depends(get_db)):
    g = db.query(StockGroup).filter(StockGroup.id == group_id).first()
    if not g:
        raise HTTPException(404, "Stock group not found")
    db.delete(g)
    db.commit()
    return {"message": "Deleted"}

def _sg_out(g):
    return {"id": g.id, "name": g.name, "parent_id": g.parent_id,
            "company_id": g.company_id}


# ══════════════════════════════════════════════════════════════════════════════
# STOCK CATEGORIES
# ══════════════════════════════════════════════════════════════════════════════

class StockCategoryCreate(BaseModel):
    name:       str
    parent_id:  Optional[int] = None
    company_id: int

class StockCategoryUpdate(BaseModel):
    name:      str
    parent_id: Optional[int] = None

@router.get("/stock-categories/")
def list_stock_categories(company_id: int, db: Session = Depends(get_db)):
    cats = db.query(StockCategory).filter(
        StockCategory.company_id == company_id,
        StockCategory.is_active == True
    ).order_by(StockCategory.name).all()
    return [_sc_out(c) for c in cats]

@router.post("/stock-categories/")
def create_stock_category(payload: StockCategoryCreate,
                           db: Session = Depends(get_db)):
    existing = db.query(StockCategory).filter(
        StockCategory.name == payload.name,
        StockCategory.company_id == payload.company_id
    ).first()
    if existing:
        raise HTTPException(400, f"Stock category '{payload.name}' already exists")
    c = StockCategory(name=payload.name, parent_id=payload.parent_id,
                      company_id=payload.company_id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return _sc_out(c)

@router.get("/stock-categories/{cat_id}")
def get_stock_category(cat_id: int, db: Session = Depends(get_db)):
    c = db.query(StockCategory).filter(StockCategory.id == cat_id).first()
    if not c:
        raise HTTPException(404, "Stock category not found")
    return _sc_out(c)

@router.put("/stock-categories/{cat_id}")
def update_stock_category(cat_id: int, payload: StockCategoryUpdate,
                           db: Session = Depends(get_db)):
    c = db.query(StockCategory).filter(StockCategory.id == cat_id).first()
    if not c:
        raise HTTPException(404, "Stock category not found")
    c.name = payload.name
    c.parent_id = payload.parent_id
    db.commit()
    return _sc_out(c)

@router.delete("/stock-categories/{cat_id}")
def delete_stock_category(cat_id: int, db: Session = Depends(get_db)):
    c = db.query(StockCategory).filter(StockCategory.id == cat_id).first()
    if not c:
        raise HTTPException(404, "Stock category not found")
    c.is_active = False
    db.commit()
    return {"message": "Deleted"}

def _sc_out(c):
    return {"id": c.id, "name": c.name, "parent_id": c.parent_id,
            "company_id": c.company_id}


# ══════════════════════════════════════════════════════════════════════════════
# UNITS OF MEASURE
# ══════════════════════════════════════════════════════════════════════════════

class UnitCreate(BaseModel):
    symbol:      str
    formal_name: Optional[str] = None
    company_id:  int

class UnitUpdate(BaseModel):
    symbol:      str
    formal_name: Optional[str] = None

@router.get("/units/")
def list_units(company_id: int, db: Session = Depends(get_db)):
    units = db.query(UnitOfMeasure).filter(
        UnitOfMeasure.company_id == company_id
    ).order_by(UnitOfMeasure.symbol).all()
    return [_u_out(u) for u in units]

@router.post("/units/")
def create_unit(payload: UnitCreate, db: Session = Depends(get_db)):
    existing = db.query(UnitOfMeasure).filter(
        UnitOfMeasure.symbol == payload.symbol,
        UnitOfMeasure.company_id == payload.company_id
    ).first()
    if existing:
        raise HTTPException(400, f"Unit '{payload.symbol}' already exists")
    u = UnitOfMeasure(symbol=payload.symbol, formal_name=payload.formal_name,
                      company_id=payload.company_id)
    db.add(u)
    db.commit()
    db.refresh(u)
    return _u_out(u)

@router.get("/units/{unit_id}")
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    u = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == unit_id).first()
    if not u:
        raise HTTPException(404, "Unit not found")
    return _u_out(u)

@router.put("/units/{unit_id}")
def update_unit(unit_id: int, payload: UnitUpdate,
                db: Session = Depends(get_db)):
    u = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == unit_id).first()
    if not u:
        raise HTTPException(404, "Unit not found")
    u.symbol = payload.symbol
    u.formal_name = payload.formal_name
    db.commit()
    return _u_out(u)

@router.delete("/units/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    u = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == unit_id).first()
    if not u:
        raise HTTPException(404, "Unit not found")
    db.delete(u)
    db.commit()
    return {"message": "Deleted"}

def _u_out(u):
    return {"id": u.id, "symbol": u.symbol, "formal_name": u.formal_name,
            "company_id": u.company_id}


# ══════════════════════════════════════════════════════════════════════════════
# LOCATIONS
# ══════════════════════════════════════════════════════════════════════════════

class LocationCreate(BaseModel):
    name:       str
    parent_id:  Optional[int] = None
    company_id: int

class LocationUpdate(BaseModel):
    name:      str
    parent_id: Optional[int] = None

@router.get("/locations/")
def list_locations(company_id: int, db: Session = Depends(get_db)):
    locs = db.query(Location).filter(
        Location.company_id == company_id,
        Location.is_active == True
    ).order_by(Location.name).all()
    return [_loc_out(l) for l in locs]

@router.post("/locations/")
def create_location(payload: LocationCreate, db: Session = Depends(get_db)):
    existing = db.query(Location).filter(
        Location.name == payload.name,
        Location.company_id == payload.company_id
    ).first()
    if existing:
        raise HTTPException(400, f"Location '{payload.name}' already exists")
    loc = Location(name=payload.name, parent_id=payload.parent_id,
                   company_id=payload.company_id)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return _loc_out(loc)

@router.get("/locations/{loc_id}")
def get_location(loc_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == loc_id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    return _loc_out(loc)

@router.put("/locations/{loc_id}")
def update_location(loc_id: int, payload: LocationUpdate,
                    db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == loc_id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    loc.name = payload.name
    loc.parent_id = payload.parent_id
    db.commit()
    return _loc_out(loc)

@router.delete("/locations/{loc_id}")
def delete_location(loc_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == loc_id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    loc.is_active = False
    db.commit()
    return {"message": "Deleted"}

def _loc_out(loc):
    return {"id": loc.id, "name": loc.name, "parent_id": loc.parent_id,
            "company_id": loc.company_id}
