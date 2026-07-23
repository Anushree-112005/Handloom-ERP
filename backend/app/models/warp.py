"""Warp Beam Receipt & Warp Delivery models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class WarpBeamReceipt(Base):
    __tablename__ = "warp_beam_receipts"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True)
    rcvd_date = Column(Date)
    rcvd_type = Column(String(50))
    beam_type = Column(String(50))
    party_name = Column(String(255))
    design_no = Column(String(50))
    order_no = Column(String(50))
    color = Column(String(50))
    warp_count = Column(String(50))
    warp_ends = Column(Integer, default=0)
    warp_meters = Column(Numeric(10, 2), default=0)
    set_no = Column(String(50))
    siz_dc_no = Column(String(50))
    siz_dc_date = Column(Date)
    status = Column(String(30), default="Received")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    beams = relationship("WarpBeamDetail", back_populates="receipt", cascade="all, delete-orphan")


class WarpBeamDetail(Base):
    __tablename__ = "warp_beam_details"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("warp_beam_receipts.id"), nullable=False)
    beam_no = Column(String(50))
    warp_mtrs = Column(Numeric(10, 2), default=0)
    beam_type = Column(String(50))
    delivery_to_weaver = Column(String(150))
    order_no = Column(String(50))
    dc_no = Column(String(50))
    dc_date = Column(Date)
    loom_no = Column(String(50))
    loading_date = Column(Date)
    total_meters = Column(Numeric(10, 2), default=0)

    receipt = relationship("WarpBeamReceipt", back_populates="beams")


class WarpDelivery(Base):
    __tablename__ = "warp_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(50), unique=True, index=True)
    ref_no = Column(String(50))
    dc_sno = Column(String(50))
    dc_date = Column(Date)
    delivery_type = Column(String(50))
    sizing_name = Column(String(255))
    party_name = Column(String(255))
    entry_type = Column(String(50))
    delivery_beam = Column(String(100))
    bpo_no = Column(String(50))
    design_no = Column(String(50))
    order_no = Column(String(50))
    address = Column(Text)
    set_id = Column(String(50))
    warp_ends = Column(Integer, default=0)
    yarn_count = Column(String(50))
    vendor_po_no = Column(String(50))
    po_date = Column(Date)
    
    party_po_no = Column(String(50))
    delivery_time = Column(String(20))
    driver_name = Column(String(100))
    mobile_no = Column(String(20))
    lr_no = Column(String(50))
    
    order_mtrs = Column(Numeric(10, 2), default=0)
    with_crimp = Column(String(50))
    delivered_mtrs = Column(Numeric(10, 2), default=0)
    transport = Column(String(150))
    vehicle_no = Column(String(50))
    
    total_beams = Column(Integer, default=0)
    total_meters = Column(Numeric(10, 2), default=0)
    total_exptd_mtrs = Column(Numeric(10, 2), default=0)
    balance_meters = Column(Numeric(10, 2), default=0)
    
    terms_conditions = Column(JSON, default=list)
    gross_amt = Column(Numeric(10, 2), default=0)
    tax_type = Column(String(50))
    cgst_pct = Column(Numeric(5, 2), default=0)
    cgst_amount = Column(Numeric(10, 2), default=0)
    sgst_pct = Column(Numeric(5, 2), default=0)
    sgst_amount = Column(Numeric(10, 2), default=0)
    igst_pct = Column(Numeric(5, 2), default=0)
    igst_amount = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(10, 2), default=0)
    
    remarks = Column(Text)
    status = Column(String(30), default="Delivered")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("WarpDeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class WarpDeliveryItem(Base):
    __tablename__ = "warp_delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("warp_deliveries.id"), nullable=False)
    beam_no = Column(String(50))
    beam_type = Column(String(50))
    yarn_count = Column(String(50))
    warp_ends = Column(Integer, default=0)
    reed_width = Column(Numeric(10, 2), default=0)
    warp_mtrs = Column(Numeric(10, 2), default=0)
    weight_kgs = Column(Numeric(10, 2), default=0)
    loom_no = Column(String(50))
    beam_status = Column(String(50))
    remarks = Column(Text)

    delivery = relationship("WarpDelivery", back_populates="items")
