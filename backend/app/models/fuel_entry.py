"""Fuel Entry models."""
from sqlalchemy import Column, String, Integer, DateTime, func, Float
from app.core.database import Base


class FuelEntry(Base):
    __tablename__ = "fuel_entries"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=False)
    entry_date = Column(String(50), nullable=False)
    odometer_reading = Column(Float, nullable=False)
    fuel_quantity = Column(Float, nullable=False)
    fuel_cost = Column(Float, nullable=False)
    fuel_type = Column(String(50), default="Diesel")  # Diesel, Petrol, LPG, CNG, Hybrid
    fuel_station = Column(String(255))
    notes = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
