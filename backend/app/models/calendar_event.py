"""Calendar Event model for standalone user-created events."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, func
from app.core.database import Base

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    event_date = Column(Date, nullable=False)
    event_time = Column(String(50))
    event_type = Column(String(100), default="Meeting")
    description = Column(Text)
    created_by = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
