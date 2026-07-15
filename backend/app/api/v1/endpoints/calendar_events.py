from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.calendar_event import CalendarEvent

router = APIRouter()

# Pydantic Schemas
class CalendarEventBase(BaseModel):
    title: str
    event_date: date
    event_time: Optional[str] = None
    event_type: Optional[str] = "Meeting"
    description: Optional[str] = None
    created_by: Optional[str] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventResponse(CalendarEventBase):
    id: int

    class Config:
        orm_mode = True

@router.post("/", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    event: CalendarEventCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        new_event = CalendarEvent(**event.dict())
        db.add(new_event)
        await db.commit()
        await db.refresh(new_event)
        return new_event
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[CalendarEventResponse])
async def list_calendar_events(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(CalendarEvent).offset(skip).limit(limit))
        events = result.scalars().all()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
