"""Yarn Inward Entry models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class YarnInward(Base):
    __tablename__ = "yarn_inwards"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True)
    entry_date = Column(Date)
    inward_date = Column(Date)
    status = Column(String(30), default="Received")
    received_type = Column(String(50))
    received_from = Column(String(255))
    po_no_dt = Column(String(100))
    agent_name = Column(String(255))
    stock_godown = Column(String(255))
    godown_id = Column(Integer)
    cone_type = Column(String(50))
    
    order_kgs = Column(Float, default=0.0)
    received_kgs = Column(Float, default=0.0)
    balance_kgs = Column(Float, default=0.0)
    
    pc_id = Column(String(100))
    tolerance_pct = Column(Float, default=0.0)
    bill_no = Column(String(100))
    bill_amount = Column(Float, default=0.0)
    gross_kgs = Column(Float, default=0.0)
    net_kgs = Column(Float, default=0.0)
    chipnam = Column(String(100))
    due_days = Column(Integer, default=0)
    
    transport = Column(String(255))
    veh_no = Column(String(100))
    total_bags = Column(Integer, default=0)
    eway_bill = Column(String(100))
    org_grn_no = Column(String(100))
    gate_no = Column(String(100))
    wbridge_no = Column(String(100))
    w_weight = Column(Float, default=0.0)

    # Tax / Other Details
    other_remarks = Column(Text)
    packing = Column(String(100))
    freight = Column(Float, default=0.0)
    gross_amount = Column(Float, default=0.0)
    tax_type = Column(String(100))
    cgst_pct = Column(Float, default=0.0)
    sgst_pct = Column(Float, default=0.0)
    igst_pct = Column(Float, default=0.0)
    tax_value = Column(Float, default=0.0)
    tcs_value = Column(Float, default=0.0)
    tds_pct = Column(Float, default=0.0)
    total_tax = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    net_amount = Column(Float, default=0.0)
    remarks = Column(Text)
    terms_conditions = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("YarnInwardItem", back_populates="inward", cascade="all, delete-orphan")


class YarnInwardItem(Base):
    __tablename__ = "yarn_inward_items"

    id = Column(Integer, primary_key=True, index=True)
    inward_id = Column(Integer, ForeignKey("yarn_inwards.id"), nullable=False)
    
    yarn_count = Column(String(100))
    mill_name = Column(String(255))
    colour = Column(String(100))
    color_code = Column(String(100))
    lot_no = Column(String(100))
    our_id = Column(String(100))
    rack_id = Column(Integer, ForeignKey("racks.id"), nullable=True)
    bags = Column(Integer, default=0)
    kgs = Column(Float, default=0.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

    inward = relationship("YarnInward", back_populates="items")
