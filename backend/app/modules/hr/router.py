"""HR Module API Router."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, cast

from app.core.database import get_db
from app.modules.hr.models import HRItem

from app.modules.hr.biometric import test_device_connection, sync_biometric_attendance
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/hr", tags=["Human Resources"])

@router.post("/biometric/test-connection")
async def test_connection_endpoint(payload: dict = Body(...)):
    ip = payload.get("ip", "192.168.0.202")
    port = int(payload.get("port", 4370))
    success, msg = await run_in_threadpool(test_device_connection, ip, port)
    return {"success": success, "message": msg}

@router.post("/biometric/sync")
async def sync_biometric_endpoint(payload: dict = Body(...), db: AsyncSession = Depends(get_db)):
    ip = payload.get("ip", "192.168.0.202")
    port = int(payload.get("port", 4370))
    mock = bool(payload.get("mock", False))
    res = await sync_biometric_attendance(db, ip, port, mock)
    return res

@router.get("/{category}")
async def list_hr_items(category: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HRItem).where(HRItem.category == category))
    items = result.scalars().all()
    return [{"id": item.id, "category": item.category, "employee_id": item.employee_id, **(cast(dict, item.data) or {})} for item in items]

@router.get("/{category}/{item_id}")
async def get_hr_item(category: str, item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HRItem).where(HRItem.category == category, HRItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"id": item.id, "category": item.category, "employee_id": item.employee_id, **(cast(dict, item.data) or {})}

@router.post("/{category}", status_code=201)
async def create_hr_item(category: str, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    emp_id = payload.get("employee_id") or payload.get("employee_code") or payload.get("employee")
    db_item = HRItem(
        category=category,
        employee_id=str(emp_id) if emp_id is not None else None,
        data=payload
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return {"id": db_item.id, "category": db_item.category, "employee_id": db_item.employee_id, **(cast(dict, db_item.data) or {})}

@router.put("/{category}/{item_id}")
async def update_hr_item(category: str, item_id: int, payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HRItem).where(HRItem.category == category, HRItem.id == item_id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    emp_id = payload.get("employee_id") or payload.get("employee_code") or payload.get("employee")
    db_item.employee_id = cast(Any, str(emp_id) if emp_id is not None else db_item.employee_id)
    merged_data = {**(cast(dict, db_item.data) or {}), **payload}
    db_item.data = cast(Any, merged_data)
    
    await db.commit()
    await db.refresh(db_item)
    return {"id": db_item.id, "category": db_item.category, "employee_id": db_item.employee_id, **(cast(dict, db_item.data) or {})}

@router.delete("/{category}/{item_id}", status_code=204)
async def delete_hr_item(category: str, item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HRItem).where(HRItem.category == category, HRItem.id == item_id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(db_item)
    await db.commit()
    return None
