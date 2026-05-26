"""Log Report / Audit Trail model."""
from sqlalchemy import Column, Integer, String, DateTime, Text, func
from app.core.database import Base


class LogReport(Base):
    __tablename__ = "log_reports"

    id = Column(Integer, primary_key=True, index=True)
    log_date = Column(DateTime(timezone=True), server_default=func.now())
    user_name = Column(String(150))
    user_id = Column(String(50))
    mode = Column(String(30))  # Save, Update, Delete, Approval, Print
    module = Column(String(100))
    remarks = Column(Text)
