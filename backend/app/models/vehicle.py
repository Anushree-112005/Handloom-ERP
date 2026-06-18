"""Vehicle and Fleet Management models."""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, func
from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    
    # Vehicle Identification
    vehicle_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), default="YARN_CARRIER")  # YARN_CARRIER, FABRIC_TRUCK, etc.
    
    # Vehicle Details
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    year_of_manufacture = Column(Integer, nullable=True)
    chassis_number = Column(String(100), nullable=True)
    engine_number = Column(String(100), nullable=True)
    
    # Capacity
    capacity_tons = Column(Float, nullable=True)
    
    # Registration & Legal Documents
    rc_number = Column(String(100), nullable=True)
    insurance_number = Column(String(100), nullable=True)
    
    # Document Expiry Dates
    insurance_expiry = Column(String(50), nullable=True)
    fitness_expiry = Column(String(50), nullable=True)
    permit_expiry = Column(String(50), nullable=True)
    pollution_expiry = Column(String(50), nullable=True)
    
    # Operational
    current_mileage = Column(Float, default=0)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, INACTIVE, UNDER_MAINTENANCE
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
