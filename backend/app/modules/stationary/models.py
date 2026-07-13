"""Stationary and Consumables Module Database Models."""
from sqlalchemy import Column, Integer, String, JSON, DateTime, Date, Float, Text, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class StationaryItem(Base):
    __tablename__ = "stationary_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), index=True, nullable=False)
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class CriticalityEnum(str, enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class ABCClassEnum(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"

class XYZClassEnum(str, enum.Enum):
    X = "X"
    Y = "Y"
    Z = "Z"

class MaterialCategory(Base):
    __tablename__ = "stationary_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("stationary_categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    parent = relationship("MaterialCategory", remote_side=[id])

class UOMMaster(Base):
    __tablename__ = "stationary_uoms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    decimal_precision = Column(Integer, default=2)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class Warehouse(Base):
    __tablename__ = "stationary_warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    branch = Column(String(100), nullable=True)
    manager = Column(String(100), nullable=True)
    capacity = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class WarehouseRack(Base):
    __tablename__ = "stationary_racks"
    
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("stationary_warehouses.id"), nullable=False)
    code = Column(String(50), nullable=False)
    levels = Column(Integer, default=1)
    rows = Column(Integer, default=1)
    columns = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

class WarehouseBin(Base):
    __tablename__ = "stationary_bins"
    
    id = Column(Integer, primary_key=True, index=True)
    rack_id = Column(Integer, ForeignKey("stationary_racks.id"), nullable=False)
    code = Column(String(100), nullable=False) # e.g. A-02-04-01
    shelf = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)

class MaterialMaster(Base):
    __tablename__ = "stationary_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, index=True, nullable=False)
    item_name = Column(String(200), nullable=False)
    short_name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    category_id = Column(Integer, ForeignKey("stationary_categories.id"), nullable=True)
    sub_category = Column(String(100), nullable=True)
    material_type = Column(String(100), nullable=True)
    brand = Column(String(100), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    
    abc_class = Column(String(10), nullable=True)
    xyz_class = Column(String(10), nullable=True)
    stock_criticality = Column(String(50), nullable=True)
    
    base_uom_id = Column(Integer, ForeignKey("stationary_uoms.id"), nullable=True)
    alt_uom_id = Column(Integer, ForeignKey("stationary_uoms.id"), nullable=True)
    conversion_factor = Column(Float, default=1.0)
    
    min_stock = Column(Float, default=0.0)
    max_stock = Column(Float, default=0.0)
    reorder_level = Column(Float, default=0.0)
    reorder_qty = Column(Float, default=0.0)
    safety_stock = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=0)
    
    hsn_code = Column(String(50), nullable=True)
    gst_percent = Column(Float, default=0.0)
    purchase_rate = Column(Float, default=0.0)
    average_cost = Column(Float, default=0.0)
    standard_cost = Column(Float, default=0.0)
    
    default_warehouse_id = Column(Integer, ForeignKey("stationary_warehouses.id"), nullable=True)
    default_bin_id = Column(Integer, ForeignKey("stationary_bins.id"), nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    # Store images/PDFs as JSON array or single strings
    item_image = Column(String(500), nullable=True)
    technical_spec = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class MaterialStock(Base):
    __tablename__ = "stationary_stock"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("stationary_materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("stationary_warehouses.id"), nullable=True)
    bin_id = Column(Integer, ForeignKey("stationary_bins.id"), nullable=True)
    quantity = Column(Float, default=0.0)
    value = Column(Float, default=0.0)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())

class StockLedger(Base):
    __tablename__ = "stationary_stock_ledger"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_type = Column(String(50), nullable=False) # Purchase, GRN, Issue, Transfer, Adjustment, Return, Opening
    transaction_ref = Column(String(100), nullable=True)
    material_id = Column(Integer, ForeignKey("stationary_materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("stationary_warehouses.id"), nullable=True)
    bin_id = Column(Integer, ForeignKey("stationary_bins.id"), nullable=True)
    quantity = Column(Float, nullable=False) # Positive or Negative
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class GoodsReceiptNote(Base):
    __tablename__ = "stationary_grn"
    
    id = Column(Integer, primary_key=True, index=True)
    grn_no = Column(String(50), unique=True, index=True, nullable=False)
    gate_entry_no = Column(String(50), nullable=True)
    po_no = Column(String(50), nullable=True)
    date = Column(Date, nullable=False)
    vendor = Column(String(200), nullable=True)
    vehicle_no = Column(String(50), nullable=True)
    driver_name = Column(String(100), nullable=True)
    bill_no = Column(String(100), nullable=True)
    is_provisional = Column(Boolean, default=False)
    status = Column(String(50), default="Pending Verification") # Pending Verification, QC, Approved, Rejected
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by = Column(String(100), nullable=True)

class GRNItem(Base):
    __tablename__ = "stationary_grn_items"
    
    id = Column(Integer, primary_key=True, index=True)
    grn_id = Column(Integer, ForeignKey("stationary_grn.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("stationary_materials.id"), nullable=False)
    received_qty = Column(Float, default=0.0)
    accepted_qty = Column(Float, default=0.0)
    rejected_qty = Column(Float, default=0.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    qc_remarks = Column(Text, nullable=True)
    
class StockIssue(Base):
    __tablename__ = "stationary_stock_issues"
    
    id = Column(Integer, primary_key=True, index=True)
    issue_no = Column(String(50), unique=True, index=True, nullable=False)
    date = Column(Date, nullable=False)
    department = Column(String(100), nullable=True)
    cost_center = Column(String(100), nullable=True)
    requested_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)
    issued_by = Column(String(100), nullable=True)
    purpose = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    status = Column(String(50), default="Issued")
    created_at = Column(DateTime, server_default=func.now())

class StockIssueItem(Base):
    __tablename__ = "stationary_stock_issue_items"
    
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("stationary_stock_issues.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("stationary_materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

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
