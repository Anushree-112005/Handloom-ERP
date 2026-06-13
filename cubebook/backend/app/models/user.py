from sqlalchemy import Integer, String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id: Mapped[int]             = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str]       = mapped_column(String, unique=True, nullable=False, index=True)
    full_name: Mapped[str]      = mapped_column(String, nullable=False)
    email: Mapped[str]          = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str]           = mapped_column(String, default="Accountant")
    # Roles: Administrator, Accountant, Sales Manager, Auditor
    is_active: Mapped[bool]     = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
