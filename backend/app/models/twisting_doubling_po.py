from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class TwistingDoublingPO(Base):
    __tablename__ = "twisting_doubling_pos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Order Information
    po_no = Column(String(50), unique=True, index=True)
    po_date = Column(Date)
    supplier_worker = Column(String(255))
    supplier_code = Column(String(100))
    delivery_date = Column(Date)
    payment_terms = Column(String(255))
    buyer_name = Column(String(255))
    status = Column(String(50), default="Active")
    remarks = Column(Text)

    # Reference Information
    ref_no_1 = Column(String(100))
    entry_against = Column(String(100))
    packing_type = Column(String(100))

    # Tax Details
    tax_type = Column(String(100))
    taxable_amount = Column(Numeric(10, 2), default=0)
    total_order_kgs = Column(Numeric(10, 2), default=0)
    cgst_pct = Column(Numeric(5, 2), default=0)
    cgst_amount = Column(Numeric(10, 2), default=0)
    sgst_pct = Column(Numeric(5, 2), default=0)
    sgst_amount = Column(Numeric(10, 2), default=0)
    igst_pct = Column(Numeric(5, 2), default=0)
    igst_amount = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(10, 2), default=0)

    # Delivery Details
    delivery_location = Column(String(255))
    dispatch_mode = Column(String(100))
    transport_name = Column(String(150))
    vehicle_type = Column(String(100))
    delivery_instructions = Column(Text)
    terms_conditions = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("TwistingDoublingPOItem", back_populates="order", cascade="all, delete-orphan")

class TwistingDoublingPOItem(Base):
    __tablename__ = "twisting_doubling_po_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("twisting_doubling_pos.id"), nullable=False)
    
    fibre_group = Column(String(100))
    yarn_count = Column(String(100))
    mill_name = Column(String(255))
    design_no = Column(String(100))
    colour = Column(String(100))
    conversion_count = Column(String(100))
    order_kgs = Column(Numeric(10, 2), default=0)
    job_work_charge = Column(Numeric(10, 2), default=0)
    tolerance_pct = Column(Numeric(5, 2), default=0)
    amount = Column(Numeric(10, 2), default=0)

    order = relationship("TwistingDoublingPO", back_populates="items")
