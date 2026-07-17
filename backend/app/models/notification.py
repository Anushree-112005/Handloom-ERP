from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from typing import Optional

class Notification(Base):
    __tablename__ = "notifications"

    id: int = Column(Integer, primary_key=True, index=True)
    user_role: str = Column(String(100), index=True)  # e.g., "Design Team", "Export Documentation Staff"
    message: str = Column(String(500))
    related_ibpo: Optional[str] = Column(String(100), index=True, nullable=True)
    is_read: bool = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
