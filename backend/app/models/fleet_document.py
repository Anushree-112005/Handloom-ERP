"""Fleet Documents models."""
from sqlalchemy import Column, String, Integer, DateTime, func
from app.core.database import Base


class FleetDocument(Base):
    __tablename__ = "fleet_documents"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=False)
    document_type = Column(String(100), nullable=False)  # RC, Insurance, Fitness, Permit, etc.
    document_name = Column(String(255))
    document_path = Column(String(500))
    expiry_date = Column(String(50))
    issued_date = Column(String(50))
    authority = Column(String(255))
    reference_number = Column(String(100))
    notes = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
