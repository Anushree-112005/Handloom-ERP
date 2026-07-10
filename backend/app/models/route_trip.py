"""Route and Trip models."""
from sqlalchemy import Column, String, Integer, DateTime, func, Float
from app.core.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(255), nullable=False)
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    distance_km = Column(Float)
    estimated_duration_hours = Column(Float)
    route_type = Column(String(50), default="Regular")  # Regular, Express, etc.
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Extra fields for UI parity
    toll_charges = Column(Float, default=0.0)
    road_condition = Column(String(50), default="Good")
    avg_speed = Column(Float, default=0.0)
    difficulty = Column(String(50), default="Medium")

    # Fuel and tracking fields for frontend compatibility
    fuel_cost_estimate = Column(Float, default=0.0)
    fuel_date = Column(String(50))
    fuel_station_id = Column(Integer)
    fuel_type = Column(String(50))
    fuel_quantity_liters = Column(Float, default=0.0)
    fuel_rate_per_liter = Column(Float, default=0.0)
    fuel_odometer_reading = Column(Float)
    fuel_payment_mode = Column(String(50))
    fuel_vehicle_number = Column(String(50))
    fuel_station_name = Column(String(255))


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, nullable=False)
    driver_id = Column(Integer)
    route_id = Column(Integer)
    trip_date = Column(String(50), nullable=False)
    start_location = Column(String(255))
    end_location = Column(String(255))
    start_time = Column(String(50))
    end_time = Column(String(50))
    odometer_start = Column(Float)
    odometer_end = Column(Float)
    fuel_used = Column(Float)
    status = Column(String(50), default="Planned")  # Planned, In Progress, Completed
    revenue = Column(Float, default=0)
    expenses = Column(Float, default=0)
    notes = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def date(self):
        return self.trip_date

