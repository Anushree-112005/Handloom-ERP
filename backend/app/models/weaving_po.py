from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class WeavingPO(Base):
    __tablename__ = "weaving_pos"

    id = Column(Integer, primary_key=True, index=True)
    po_no = Column(String(50), unique=True, index=True, nullable=False)
    po_date = Column(Date, nullable=False)
    supplier_weaver = Column(String(150))
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

    # New top-level specification and vendor order detail fields from client form
    order_type = Column(String(50))
    design_color = Column(String(100))
    fabric = Column(String(100))
    weaving_type = Column(String(100))
    loom_type = Column(String(100))
    fabric_type = Column(String(100))
    reed = Column(String(50))
    pick = Column(String(50))
    warp_width = Column(String(50))
    warp_ends = Column(String(50))
    warp_meters = Column(String(50))
    weft_meters = Column(String(50))
    fabric_width = Column(String(50))
    finished_width = Column(String(50))
    wages_mtr_kgs = Column(String(50))
    selected_count = Column(String(100))
    merchandiser = Column(String(100))
    certificate_type = Column(String(100))

    cooly_mtr = Column(Numeric(12, 2), default=0)
    cooly_pick = Column(Numeric(12, 2), default=0)
    salvage_waste_pct = Column(Numeric(5, 2), default=0)
    no_repeat = Column(String(50))
    crimp_pct = Column(Numeric(5, 2), default=0)
    shrinkage = Column(String(50))
    v_order_mtrs = Column(Numeric(12, 2), default=0)
    min_mtrs = Column(Numeric(12, 2), default=0)
    delivery_at = Column(String(200))
    warp_isu_mtrs = Column(Numeric(12, 2), default=0)
    warp_issued = Column(Boolean, default=False)
    delivery_command = Column(Text)

    taxable_value = Column(Numeric(12, 2), default=0)
    weaving_charge = Column(Numeric(12, 2), default=0)
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

    items = relationship("WeavingPOItem", back_populates="po", cascade="all, delete-orphan")

class WeavingPOItem(Base):
    __tablename__ = "weaving_po_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("weaving_pos.id", ondelete="CASCADE"), nullable=False)
    
    fabric_code = Column(String(50))
    fabric_name = Column(String(150))
    design_no = Column(String(100))
    fabric_type = Column(String(100))
    color = Column(String(100))
    gsm = Column(String(50))
    width = Column(String(50))
    uom = Column(String(20))
    qty_mtrs = Column(Numeric(12, 3), default=0)
    rate_per_mtr = Column(Numeric(12, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    po = relationship("WeavingPO", back_populates="items")
