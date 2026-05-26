"""Log Report CRUD endpoints and audit log seeder."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from app.core.database import get_db
from app.models.log_report import LogReport

router = APIRouter(prefix="/log-reports", tags=["Log Reports"])

class LogReportBase(BaseModel):
    user_name: Optional[str] = None
    user_id: Optional[str] = None
    mode: Optional[str] = None
    module: Optional[str] = None
    remarks: Optional[str] = None

class LogReportCreate(LogReportBase):
    log_date: Optional[datetime] = None

class LogReportOut(LogReportBase):
    id: int
    log_date: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[LogReportOut])
async def list_logs(
    module: Optional[str] = None,
    mode: Optional[str] = None,
    user_id: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):

    q = select(LogReport)
    
    if module and module != "All Modules" and module != "-":
        q = q.where(LogReport.module == module)
    
    if mode and mode != "All Modes" and mode != "-":
        q = q.where(LogReport.mode == mode)

    if user_id and user_id != "All Users" and user_id != "-":
        q = q.where(LogReport.user_id == user_id)

    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                LogReport.remarks.ilike(search_filter),
                LogReport.user_name.ilike(search_filter),
                LogReport.user_id.ilike(search_filter)
            )
        )

    q = q.order_by(LogReport.log_date.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=LogReportOut, status_code=201)
async def create_log(log_data: LogReportCreate, db: AsyncSession = Depends(get_db)):
    dump = log_data.model_dump()
    if not dump.get("log_date"):
        dump["log_date"] = datetime.now()
    
    db_log = LogReport(**dump)
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

@router.delete("/{log_id}", status_code=204)
async def delete_log(log_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LogReport).where(LogReport.id == log_id))
    db_log = result.scalar_one_or_none()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log record not found")

    await db.delete(db_log)
    await db.commit()
    return None
