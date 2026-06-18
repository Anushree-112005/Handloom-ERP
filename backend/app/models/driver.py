"""Driver management models."""
from sqlalchemy import Column, String, Integer, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    driver_name = Column(String(255), nullable=False)
    driver_license = Column(String(100), unique=True, nullable=False)
    license_expiry_date = Column(String(50))
    phone_number = Column(String(20), nullable=False)
    address = Column(String(500))
    years_of_experience = Column(Integer, default=0)
    status = Column(String(50), default="Active")  # Active, Inactive, On Leave
    qualification = Column(String(100), default="HMV")  # LMV, HMV, Multi-Axle, Hazmat
    aadhar_number = Column(String(50))
    emergency_contact = Column(String(20))
    assigned_vehicle_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
