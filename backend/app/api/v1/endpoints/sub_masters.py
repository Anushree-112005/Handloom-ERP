"""
Dynamic Sub-Master CRUD endpoints.

All Type-1 master forms route through these endpoints using the {entity} path parameter.
Example: GET /api/v1/sub-masters/color_master → returns all color master entries.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.sub_master import SubMaster

router = APIRouter(prefix="/sub-masters", tags=["Sub Masters"])


# ──────────────── Schemas ────────────────

class SubMasterCreate(BaseModel):
    entity: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    extra_field_1: Optional[str] = None
    extra_field_2: Optional[str] = None
    extra_field_3: Optional[str] = None
    is_active: Optional[bool] = True

class SubMasterUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    extra_field_1: Optional[str] = None
    extra_field_2: Optional[str] = None
    extra_field_3: Optional[str] = None
    is_active: Optional[bool] = None

class SubMasterOut(BaseModel):
    id: int
    entity: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    extra_field_1: Optional[str] = None
    extra_field_2: Optional[str] = None
    extra_field_3: Optional[str] = None
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


# ──────────────── Endpoints ────────────────

@router.get("/{entity}")
async def list_sub_masters(
    entity: str,
    search: Optional[str] = Query(None),
    active_only: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """List all records for a given master entity."""
    query = select(SubMaster).where(SubMaster.entity == entity)
    if active_only:
        query = query.where(SubMaster.is_active == True)
    if search:
        query = query.where(SubMaster.name.ilike(f"%{search}%"))
    query = query.order_by(SubMaster.name)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "entity": r.entity,
            "name": r.name,
            "code": r.code,
            "description": r.description,
            "extra_field_1": r.extra_field_1,
            "extra_field_2": r.extra_field_2,
            "extra_field_3": r.extra_field_3,
            "is_active": r.is_active,
            "created_at": str(r.created_at) if r.created_at else None,
            "updated_at": str(r.updated_at) if r.updated_at else None,
        }
        for r in rows
    ]


@router.get("/{entity}/stats")
async def sub_master_stats(entity: str, db: AsyncSession = Depends(get_db)):
    """Return total and active count for a given entity."""
    total = await db.execute(
        select(func.count(SubMaster.id)).where(SubMaster.entity == entity)
    )
    active = await db.execute(
        select(func.count(SubMaster.id)).where(
            SubMaster.entity == entity, SubMaster.is_active == True
        )
    )
    return {
        "total": total.scalar_one(),
        "active": active.scalar_one(),
    }


@router.post("/{entity}")
async def create_sub_master(
    entity: str, payload: SubMasterCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new sub-master record."""
    payload.entity = entity
    row = SubMaster(**payload.model_dump())
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return {
        "id": row.id,
        "entity": row.entity,
        "name": row.name,
        "code": row.code,
        "description": row.description,
        "extra_field_1": row.extra_field_1,
        "extra_field_2": row.extra_field_2,
        "extra_field_3": row.extra_field_3,
        "is_active": row.is_active,
        "created_at": str(row.created_at) if row.created_at else None,
        "updated_at": str(row.updated_at) if row.updated_at else None,
    }


@router.put("/{entity}/{record_id}")
async def update_sub_master(
    entity: str,
    record_id: int,
    payload: SubMasterUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing sub-master record."""
    result = await db.execute(
        select(SubMaster).where(SubMaster.id == record_id, SubMaster.entity == entity)
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, val)
    await db.commit()
    await db.refresh(row)
    return {
        "id": row.id,
        "entity": row.entity,
        "name": row.name,
        "code": row.code,
        "description": row.description,
        "extra_field_1": row.extra_field_1,
        "extra_field_2": row.extra_field_2,
        "extra_field_3": row.extra_field_3,
        "is_active": row.is_active,
        "created_at": str(row.created_at) if row.created_at else None,
        "updated_at": str(row.updated_at) if row.updated_at else None,
    }


@router.delete("/{entity}/{record_id}")
async def delete_sub_master(
    entity: str, record_id: int, db: AsyncSession = Depends(get_db)
):
    """Delete a sub-master record."""
    result = await db.execute(
        select(SubMaster).where(SubMaster.id == record_id, SubMaster.entity == entity)
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Record not found")
    await db.delete(row)
    await db.commit()
    return {"ok": True, "deleted_id": record_id}


@router.get("/")
async def list_all_entities(db: AsyncSession = Depends(get_db)):
    """Return all distinct entity names with counts — useful for admin dashboard."""
    result = await db.execute(
        select(SubMaster.entity, func.count(SubMaster.id).label("count"))
        .group_by(SubMaster.entity)
        .order_by(SubMaster.entity)
    )
    return [{"entity": r.entity, "count": r.count} for r in result.all()]
