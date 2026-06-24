"""Dyed Yarn Received & Delivery models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class DyedYarnReceived(Base):
    __tablename__ = "dyed_yarn_received"

    id = Column(Integer, primary_key=True, index=True)
    inv_no = Column(String(50), index=True)
    inv_date = Column(Date)
    received_type = Column(String(50))
    receive_mode = Column(String(50))
    party_name = Column(String(255))
    design_no = Column(String(50))
    design_count = Column(String(50))
    order_no = Column(String(50))
    our_dc_no = Column(String(50))
    party_dc_no = Column(String(50))
    dc_date = Column(Date)
    
    vehicle_no = Column(String(50))
    transport = Column(String(100))
    driver_name = Column(String(100))
    lr_no = Column(String(50))
    received_by = Column(String(100))
    received_time = Column(String(20))
    godown = Column(String(100))
    
    remarks = Column(Text)
    status = Column(String(30), default="Received")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("DyedYarnReceivedItem", back_populates="receipt", cascade="all, delete-orphan")


class DyedYarnReceivedItem(Base):
    __tablename__ = "dyed_yarn_received_items"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("dyed_yarn_received.id"), nullable=False)
    cone_type = Column(String(20))
    yarn_count = Column(String(50))
    shade_no = Column(String(50))
    our_lot_no = Column(String(50))
    color = Column(String(50))
    taken_kgs = Column(Numeric(10, 2), default=0)
    dyed_lot_no = Column(String(50))
    bags = Column(Integer, default=0)
    cones = Column(Integer, default=0)
    rcvd_kgs = Column(Numeric(10, 2), default=0)
    short_kgs = Column(Numeric(10, 2), default=0)
    short_pct = Column(Numeric(5, 2), default=0)
    remarks = Column(Text)

    receipt = relationship("DyedYarnReceived", back_populates="items")


class DyedYarnDelivery(Base):
    __tablename__ = "dyed_yarn_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(50), unique=True, index=True)
    dc_no_alt = Column(String(80))
    dc_date = Column(Date, nullable=False)
    add_date = Column(Date)
    delivery_type = Column(String(50))
    delivery_mode = Column(String(50))
    party_name = Column(String(255))
    delivery_address = Column(Text)
    design_no = Column(String(50))
    order_no = Column(String(50))
    design_type = Column(String(50))
    transport = Column(String(150))
    certificate_type = Column(String(50))
    driver_name = Column(String(100))
    delivery_time = Column(String(50))
    
    vehicle_no = Column(String(50))
    lr_no = Column(String(50))
    delivery_challan_type = Column(String(50))
    customer_po_no = Column(String(50))
    dyeing_batch_no = Column(String(50))
    dispatch_from = Column(String(100))
    received_by = Column(String(100))
    mobile_no = Column(String(20))
    
    total_delv_kgs = Column(Numeric(10, 2), default=0)
    total_rin_kgs = Column(Numeric(10, 2), default=0)
    balance_kgs = Column(Numeric(10, 2), default=0)
    
    # Financial fields
    cost = Column(Numeric(14, 2), default=0)
    freight_charges = Column(Numeric(14, 2), default=0)
    loading_charges = Column(Numeric(14, 2), default=0)
    insurance = Column(Numeric(14, 2), default=0)
    other_charges = Column(Numeric(14, 2), default=0)
    discount = Column(Numeric(14, 2), default=0)
    gross_amount = Column(Numeric(14, 2), default=0)
    tax_value = Column(Numeric(14, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    total_gst = Column(Numeric(14, 2), default=0)
    tcs = Column(Numeric(14, 2), default=0)
    tds = Column(Numeric(14, 2), default=0)
    advance_received = Column(Numeric(14, 2), default=0)
    round_off = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    balance_amount = Column(Numeric(14, 2), default=0)
    
    remarks = Column(Text)
    status = Column(String(30), default="Delivered")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("DyedYarnDeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class DyedYarnDeliveryItem(Base):
    __tablename__ = "dyed_yarn_delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("dyed_yarn_deliveries.id"), nullable=False)
    yarn_type = Column(String(100))
    count = Column(String(50))
    color = Column(String(50))
    shade_no = Column(String(50))
    lot_no = Column(String(50))
    batch_no = Column(String(50))
    stock = Column(String(100))
    bags = Column(Integer, default=0)
    cones = Column(Integer, default=0)
    total_kgs = Column(Numeric(10, 2), default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)
    remarks = Column(Text)

    delivery = relationship("DyedYarnDelivery", back_populates="items")
