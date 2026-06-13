"""Report job model for tracking generated reports."""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, func
from app.core.database import Base


class ReportJob(Base):
    __tablename__ = "report_jobs"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(100), nullable=False)  # e.g. "buyer_order"
    title = Column(String(255), nullable=False)
    format = Column(String(20), nullable=False)  # "pdf", "excel", "csv"
    filters = Column(JSON, default={})
    status = Column(String(30), default="queued")  # queued, processing, completed, failed
    file_path = Column(String(500), nullable=True)
    filename = Column(String(255), nullable=True)
    error = Column(Text, nullable=True)
    user_id = Column(String(50), index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
