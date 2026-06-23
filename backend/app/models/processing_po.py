from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProcessingPO(Base):
    __tablename__ = "processing_pos"

    id = Column(Integer, primary_key=True, index=True)
    po_no = Column(String(50), unique=True, index=True, nullable=False)
    po_date = Column(Date, nullable=False)
    supplier_processing_unit = Column(String(150))
    supplier_code = Column(String(50))
    delivery_date = Column(Date)
    payment_terms = Column(String(200))
    buyer_name = Column(String(100))
    status = Column(String(20), default="Active")
    remarks = Column(Text)

    indent_no = Column(String(50))
    sales_order_no = Column(String(50))
    production_order_no = Column(String(50))
    buyer_order_no = Column(String(50))
    department = Column(String(100))

    taxable_value = Column(Numeric(12, 2), default=0)
    processing_charge = Column(Numeric(12, 2), default=0)
    packing_charge = Column(Numeric(12, 2), default=0)
    loading_charge = Column(Numeric(12, 2), default=0)
    unloading_charge = Column(Numeric(12, 2), default=0)
    transport_charge = Column(Numeric(12, 2), default=0)
    other_charges = Column(Numeric(12, 2), default=0)
    cgst_pct = Column(Numeric(5, 2), default=0)
    cgst_amount = Column(Numeric(12, 2), default=0)
    sgst_pct = Column(Numeric(5, 2), default=0)
    sgst_amount = Column(Numeric(12, 2), default=0)
    igst_pct = Column(Numeric(5, 2), default=0)
    igst_amount = Column(Numeric(12, 2), default=0)
    round_off = Column(Numeric(12, 2), default=0)
    net_amount = Column(Numeric(12, 2), default=0)

    delivery_location = Column(String(200))
    dispatch_mode = Column(String(100))
    transport_name = Column(String(150))
    vehicle_no = Column(String(100))
    delivery_instructions = Column(Text)
    terms_conditions = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("ProcessingPOItem", back_populates="po", cascade="all, delete-orphan")

class ProcessingPOItem(Base):
    __tablename__ = "processing_po_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("processing_pos.id", ondelete="CASCADE"), nullable=False)
    
    fabric_code = Column(String(50))
    fabric_name = Column(String(150))
    fabric_type = Column(String(100))
    design_no = Column(String(100))
    gsm = Column(String(50))
    width = Column(String(50))
    color = Column(String(100))
    batch_no = Column(String(100))
    lot_no = Column(String(100))
    uom = Column(String(20))
    qty = Column(Numeric(12, 3), default=0)
    rate = Column(Numeric(12, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    po = relationship("ProcessingPO", back_populates="items")
