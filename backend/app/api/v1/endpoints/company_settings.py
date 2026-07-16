from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.company_setting import CompanySetting
from app.models.log_report import LogReport

router = APIRouter(prefix="/company-settings", tags=["Company Settings"])

class CompanySettingBase(BaseModel):
    company_name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    financial_year: Optional[str] = None

class CompanySettingCreate(CompanySettingBase):
    pass

class CompanySettingOut(CompanySettingBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=Optional[CompanySettingOut])
async def get_company_setting(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CompanySetting).limit(1))
    setting = result.scalar_one_or_none()
    return setting

@router.post("/", response_model=CompanySettingOut, status_code=200)
async def save_company_setting(data: CompanySettingCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CompanySetting).limit(1))
    setting = result.scalar_one_or_none()

    if setting:
        # Update existing
        for key, value in data.model_dump().items():
            setattr(setting, key, value)
    else:
        # Create new
        setting = CompanySetting(**data.model_dump())
        db.add(setting)

    # Add LogReport
    new_log = LogReport(
        user_name="Admin",
        user_id="admin",
        mode="Save",
        module="Company Settings",
        remarks=f"Company Settings Updated: {data.company_name}"
    )
    db.add(new_log)

    await db.commit()
    await db.refresh(setting)
    return setting
