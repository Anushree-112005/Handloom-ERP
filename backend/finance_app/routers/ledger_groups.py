from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from finance_app.database import get_db
from finance_app.models.ledger_group import LedgerGroup

router = APIRouter()

class GroupCreate(BaseModel):
    name:         str
    parent_group: Optional[str] = None
    nature:       str   # asset / liability / income / expense
    company_id:   int

@router.get("/")
def list_groups(company_id: int, db: Session = Depends(get_db)):
    groups = db.query(LedgerGroup).filter(
        LedgerGroup.company_id == company_id
    ).order_by(LedgerGroup.name).all()
    return [
        {
            "id": g.id, "name": g.name, "parent_group": g.parent_group,
            "parent_id": g.parent_id, "nature": g.nature,
            "is_system": g.is_system, "company_id": g.company_id,
        }
        for g in groups
    ]

@router.get("/tree")
def groups_tree(company_id: int, db: Session = Depends(get_db)):
    """Return full chart of accounts as nested tree"""
    all_groups = db.query(LedgerGroup).filter(
        LedgerGroup.company_id == company_id
    ).all()

    def build(g):
        return {
            "id": g.id, "name": g.name, "nature": g.nature,
            "is_system": g.is_system,
            "ledgers": [
                {"id": l.id, "name": l.name,
                 "opening_balance": l.opening_balance,
                 "balance_type": l.balance_type}
                for l in g.ledgers
            ],
            "children": [build(c) for c in g.children]
        }

    roots = [g for g in all_groups if g.parent_id is None]
    return [build(r) for r in roots]

@router.post("/")
def create_group(payload: GroupCreate, db: Session = Depends(get_db)):
    parent_id = None
    if payload.parent_group:
        pg = db.query(LedgerGroup).filter(
            LedgerGroup.name == payload.parent_group,
            LedgerGroup.company_id == payload.company_id
        ).first()
        if pg:
            parent_id = pg.id
    g = LedgerGroup(
        name=payload.name, parent_group=payload.parent_group,
        parent_id=parent_id, nature=payload.nature,
        company_id=payload.company_id, is_system=False
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return {"id": g.id, "name": g.name, "nature": g.nature}

@router.delete("/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    g = db.query(LedgerGroup).filter(LedgerGroup.id == group_id).first()
    if not g:
        raise HTTPException(404, "Group not found")
    if g.is_system:
        raise HTTPException(400, "Cannot delete system groups")
    db.delete(g)
    db.commit()
    return {"message": "Deleted"}

class GroupUpdate(BaseModel):
    name:         str
    parent_group: Optional[str] = None
    nature:       str

@router.put("/{group_id}")
def update_group(group_id: int, payload: GroupUpdate, db: Session = Depends(get_db)):
    g = db.query(LedgerGroup).filter(LedgerGroup.id == group_id).first()
    if not g:
        raise HTTPException(404, "Group not found")
    if g.is_system:
        raise HTTPException(400, "Cannot update system groups")
    
    parent_id = None
    if payload.parent_group:
        pg = db.query(LedgerGroup).filter(
            LedgerGroup.name == payload.parent_group,
            LedgerGroup.company_id == g.company_id
        ).first()
        if pg:
            parent_id = pg.id
            
    g.name = payload.name
    g.parent_group = payload.parent_group
    g.parent_id = parent_id
    g.nature = payload.nature
    db.commit()
    db.refresh(g)
    return {"id": g.id, "name": g.name, "nature": g.nature}
