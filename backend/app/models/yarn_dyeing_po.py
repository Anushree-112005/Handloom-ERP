from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class YarnDyeingPO(Base):
    __tablename__ = "yarn_dyeing_pos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Order Information
    po_no = Column(String(50), unique=True, index=True)
    po_date = Column(Date)
    supplier_dyeing_unit = Column(String(255))
    supplier_code = Column(String(100))
    delivery_date = Column(Date)
    payment_terms = Column(String(255))
    buyer_name = Column(String(255))
    status = Column(String(50), default="Active")
    remarks = Column(Text)

    # Reference Information
    indent_no = Column(String(100))
    sales_order_no = Column(String(100))
    production_order_no = Column(String(100))
    buyer_order_no = Column(String(100))
    department = Column(String(100))

    # Tax & Charges
    taxable_value = Column(Numeric(10, 2), default=0)
    dyeing_charge = Column(Numeric(10, 2), default=0)
    packing_charge = Column(Numeric(10, 2), default=0)
    transport_charge = Column(Numeric(10, 2), default=0)
    cgst_pct = Column(Numeric(5, 2), default=0)
    cgst_amount = Column(Numeric(10, 2), default=0)
    sgst_pct = Column(Numeric(5, 2), default=0)
    sgst_amount = Column(Numeric(10, 2), default=0)
    igst_pct = Column(Numeric(5, 2), default=0)
    igst_amount = Column(Numeric(10, 2), default=0)
    round_off = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(10, 2), default=0)

    # Delivery Details
    delivery_location = Column(String(255))
    dispatch_mode = Column(String(100))
    transport_name = Column(String(150))
    vehicle_type = Column(String(100))
    delivery_instructions = Column(Text)
    terms_conditions = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("YarnDyeingPOItem", back_populates="order", cascade="all, delete-orphan")

class YarnDyeingPOItem(Base):
    __tablename__ = "yarn_dyeing_po_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("yarn_dyeing_pos.id"), nullable=False)
    
    yarn_code = Column(String(100))
    yarn_name = Column(String(255))
    yarn_count = Column(String(100))
    yarn_type = Column(String(100))
    mill_name = Column(String(255))
    lot_no = Column(String(100))
    shade_name = Column(String(100))
    shade_code = Column(String(100))
    uom = Column(String(50))
    qty_kg = Column(Numeric(10, 2), default=0)
    rate_per_kg = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(10, 2), default=0)

    order = relationship("YarnDyeingPO", back_populates="items")
