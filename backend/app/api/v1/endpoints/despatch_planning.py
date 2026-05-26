"""Despatch Planning CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.despatch_planning import DespatchPlanning

router = APIRouter(prefix="/despatch-planning", tags=["Despatch Planning"])

def parse_date_safe(v):
    if not v:
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return None
        # Try YYYY-MM-DD
        try:
            return date.fromisoformat(v)
        except ValueError:
            pass
        # Try DD/MM/YYYY
        try:
            return datetime.strptime(v, "%d/%m/%Y").date()
        except ValueError:
            pass
        # Try YYYY-MM-DDTHH:MM:SS...
        try:
            return datetime.fromisoformat(v.split('T')[0]).date()
        except ValueError:
            pass
    return v

class DespatchPlanningBase(BaseModel):
    ibpo: Optional[str] = None
    po_date: Optional[date] = None
    ref_no: Optional[str] = None
    planning_date: Optional[date] = None
    billing_party: Optional[str] = None
    delivery_party: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    state_code: Optional[str] = None
    design_no: Optional[str] = None
    pino: Optional[str] = None
    order_qty: Optional[Decimal] = Decimal("0.0")
    amd_foc_mtr: Optional[Decimal] = Decimal("0.0")
    total_qty: Optional[Decimal] = Decimal("0.0")
    uom: Optional[str] = "MTR"
    delivery_start: Optional[date] = None
    party_comp_date: Optional[date] = None
    comp_date: Optional[date] = None
    lc_no: Optional[str] = None
    lc_date: Optional[date] = None
    ibpo_rate: Optional[Decimal] = Decimal("0.0")
    currency: Optional[str] = "INR"
    certificate_type: Optional[str] = None
    fabric_type: Optional[str] = None
    planned_mtrs: Optional[Decimal] = Decimal("0.0")
    tolerance_pct: Optional[Decimal] = Decimal("0.0")
    max_dispatch_qty: Optional[Decimal] = Decimal("0.0")
    stock: Optional[Decimal] = Decimal("0.0")
    tot_desp_mtrs: Optional[Decimal] = Decimal("0.0")
    balance_mtrs: Optional[Decimal] = Decimal("0.0")
    last_desp_date: Optional[date] = None
    hsn_code: Optional[str] = None
    merchant: Optional[str] = None
    city: Optional[str] = None
    point_of_contact: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = "Planned"

    @field_validator(
        'po_date', 'planning_date', 'delivery_start', 'party_comp_date',
        'comp_date', 'lc_date', 'last_desp_date', mode='before'
    )
    @classmethod
    def validate_dates(cls, v):
        return parse_date_safe(v)

class DespatchPlanningCreate(DespatchPlanningBase):
    pass

class DespatchPlanningUpdate(DespatchPlanningBase):
    pass

class DespatchPlanningOut(DespatchPlanningBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[DespatchPlanningOut])
async def list_plans(
    search: Optional[str] = None,
    merchant: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(DespatchPlanning)
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                DespatchPlanning.ref_no.ilike(search_filter),
                DespatchPlanning.billing_party.ilike(search_filter),
                DespatchPlanning.design_no.ilike(search_filter),
            )
        )
    if merchant and merchant != "All":
        q = q.where(DespatchPlanning.merchant == merchant)
    
    q = q.order_by(DespatchPlanning.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=DespatchPlanningOut, status_code=201)
async def create_plan(plan: DespatchPlanningCreate, db: AsyncSession = Depends(get_db)):
    # Check if Ref No already exists
    if plan.ref_no:
        existing = await db.execute(
            select(DespatchPlanning).where(DespatchPlanning.ref_no == plan.ref_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Ref No already exists")

    db_plan = DespatchPlanning(**plan.model_dump())
    db.add(db_plan)
    await db.commit()
    await db.refresh(db_plan)
    return db_plan

@router.get("/{plan_id}", response_model=DespatchPlanningOut)
async def get_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DespatchPlanning).where(DespatchPlanning.id == plan_id))
    db_plan = result.scalar_one_or_none()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return db_plan

@router.put("/{plan_id}", response_model=DespatchPlanningOut)
async def update_plan(plan_id: int, plan: DespatchPlanningUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DespatchPlanning).where(DespatchPlanning.id == plan_id))
    db_plan = result.scalar_one_or_none()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # If Ref No is updated, check for uniqueness
    if plan.ref_no and plan.ref_no != db_plan.ref_no:
        existing = await db.execute(
            select(DespatchPlanning).where(DespatchPlanning.ref_no == plan.ref_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Ref No already exists")

    for key, value in plan.model_dump(exclude_unset=True).items():
        setattr(db_plan, key, value)

    await db.commit()
    await db.refresh(db_plan)
    return db_plan

@router.delete("/{plan_id}", status_code=204)
async def delete_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DespatchPlanning).where(DespatchPlanning.id == plan_id))
    db_plan = result.scalar_one_or_none()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    await db.delete(db_plan)
    await db.commit()
    return None
