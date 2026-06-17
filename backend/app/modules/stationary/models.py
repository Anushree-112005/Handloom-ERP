"""Stationary and Consumables Module Database Models."""
from sqlalchemy import Column, Integer, String, JSON, DateTime, Date, Float, Text, func
from app.core.database import Base

class StationaryItem(Base):
    __tablename__ = "stationary_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), index=True, nullable=False)  # e.g. 'consumables_categories', etc.
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SwatchCard(Base):
    __tablename__ = "swatch_cards"

    id = Column(Integer, primary_key=True, index=True)
    swatch_type = Column(String(50), nullable=False)  # e.g., 'Yarn', 'Fabric', 'Dyeing', 'Printed', 'Solid', 'Buyer A4'
    digital_id = Column(String(50), unique=True, index=True, nullable=False)  # Unique ID for punching logic
    count_spec = Column(String(100), nullable=False)  # Count specification
    construction_spec = Column(String(100), nullable=False)  # Construction specification
    design_no = Column(String(100), nullable=True)
    color = Column(String(100), nullable=True)
    party_name = Column(String(255), nullable=True)
    buyer_comments = Column(Text, nullable=True)
    attachment_path = Column(String(500), nullable=True)  # Image/PDF attachment path for Buyer A4 Swatch Card
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class FabricInspectionRoll(Base):
    __tablename__ = "fabric_inspection_rolls"

    id = Column(Integer, primary_key=True, index=True)
    fabric_inward_id = Column(String(50), index=True, nullable=False)  # Link to cloth_inwards reference
    roll_no = Column(String(50), nullable=False)
    declared_meters = Column(Float, default=0.0)
    actual_meters = Column(Float, default=0.0)
    points = Column(Integer, default=0)
    defects = Column(JSON, nullable=True, default=dict)  # Map defect points/locations
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class ReturnableDC(Base):
    __tablename__ = "returnable_dcs"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(50), unique=True, index=True, nullable=False)
    dc_stream = Column(String(50), nullable=False)  # e.g., 'Yarn Unit', 'Fabric Unit', 'General Service'
    date = Column(Date, nullable=False)
    asset_name = Column(String(255), nullable=False)  # e.g., Sewing Machine, Dyeing Motor
    serial_no = Column(String(100), nullable=True)
    fault_description = Column(Text, nullable=True)
    service_vendor = Column(String(255), nullable=False)
    quotation_no = Column(String(100), nullable=True)
    quotation_amount = Column(Float, default=0.0)
    service_po_no = Column(String(100), nullable=True)
    advance_payment = Column(Float, default=0.0)
    status = Column(String(50), default="Outward")  # e.g., Outward, Returned, Completed
    return_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
