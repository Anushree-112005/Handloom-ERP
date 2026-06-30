"""Dyed Yarn Received & Delivery models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class DyedYarnReceived(Base):
    __tablename__ = "dyed_yarn_received"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), unique=True, index=True)
    receipt_date = Column(Date)
    yarn_dyeing_po_no = Column(String(50))
    yarn_dyeing_delivery_no = Column(String(50))
    processor_name = Column(String(150))
    buyer_name = Column(String(150))
    party_invoice_no = Column(String(50))
    driver_mobile = Column(String(50))
    checked_by = Column(String(100))
    qc_status = Column(String(50), default="Pending")
    receipt_status = Column(String(50), default="Pending")
    total_taken_qty = Column(Numeric(10, 2), default=0)
    total_received_qty = Column(Numeric(10, 2), default=0)
    total_short_qty = Column(Numeric(10, 2), default=0)
    total_excess_qty = Column(Numeric(10, 2), default=0)
    total_bags = Column(Integer, default=0)
    total_cones = Column(Integer, default=0)
    total_gross_weight = Column(Numeric(10, 2), default=0)
    total_net_weight = Column(Numeric(10, 2), default=0)

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
    yarn_type = Column(String(100))
    ply = Column(String(20))
    batch_no = Column(String(50))
    gross_weight = Column(Numeric(10, 2), default=0)
    tare_weight = Column(Numeric(10, 2), default=0)
    net_weight = Column(Numeric(10, 2), default=0)
    excess_qty = Column(Numeric(10, 2), default=0)
    accepted_qty = Column(Numeric(10, 2), default=0)
    rejected_qty = Column(Numeric(10, 2), default=0)
    qc_remarks = Column(Text)

    receipt = relationship("DyedYarnReceived", back_populates="items")


class DyedYarnDelivery(Base):
    __tablename__ = "dyed_yarn_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    delivery_no = Column(String(50), unique=True, index=True)
    dc_no = Column(String(50), index=True)
    dc_date = Column(Date)
    delivery_date = Column(Date)
    delivery_type = Column(String(50))
    delivery_mode = Column(String(50))
    yarn_dyeing_po_no = Column(String(50))
    processor_name = Column(String(150))
    party_name = Column(String(255))
    order_no = Column(String(50))
    ref_no = Column(String(50))
    design_no = Column(String(50))
    merchandiser = Column(String(100))
    
    vehicle_no = Column(String(50))
    driver_name = Column(String(100))
    driver_mobile = Column(String(50))
    transport_name = Column(String(150))
    lr_no = Column(String(50))
    gate_pass_no = Column(String(50))
    eway_bill_no = Column(String(50))
    dispatch_from_godown = Column(String(150))
    remarks = Column(Text)

    # Quantity Summary
    total_ordered_qty = Column(Numeric(10, 2), default=0)
    total_prev_delivered_qty = Column(Numeric(10, 2), default=0)
    total_current_delivery_qty = Column(Numeric(10, 2), default=0)
    total_balance_qty = Column(Numeric(10, 2), default=0)
    total_bags = Column(Integer, default=0)
    total_cones = Column(Integer, default=0)
    total_gross_weight = Column(Numeric(10, 2), default=0)
    total_net_weight = Column(Numeric(10, 2), default=0)

    # Financial / Logistics Details
    freight_charges = Column(Numeric(14, 2), default=0)
    loading_charges = Column(Numeric(14, 2), default=0)
    unloading_charges = Column(Numeric(14, 2), default=0)
    insurance_charges = Column(Numeric(14, 2), default=0)
    other_charges = Column(Numeric(14, 2), default=0)
    transport_remarks = Column(Text)

    # Tax Details
    taxable_amount = Column(Numeric(14, 2), default=0)
    sgst_pct = Column(Numeric(5, 2), default=0)
    sgst_amount = Column(Numeric(14, 2), default=0)
    cgst_pct = Column(Numeric(5, 2), default=0)
    cgst_amount = Column(Numeric(14, 2), default=0)
    igst_pct = Column(Numeric(5, 2), default=0)
    igst_amount = Column(Numeric(14, 2), default=0)
    total_gst = Column(Numeric(14, 2), default=0)

    # Summary
    gross_amount = Column(Numeric(14, 2), default=0)
    discount = Column(Numeric(14, 2), default=0)
    round_off = Column(Numeric(10, 2), default=0)
    grand_total = Column(Numeric(14, 2), default=0)
    advance = Column(Numeric(14, 2), default=0)
    balance = Column(Numeric(14, 2), default=0)

    delivery_status = Column(String(50), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("DyedYarnDeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class DyedYarnDeliveryItem(Base):
    __tablename__ = "dyed_yarn_delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("dyed_yarn_deliveries.id"), nullable=False)
    
    sp_no = Column(String(50))
    design_no = Column(String(50))
    yarn_type = Column(String(100))
    yarn_count = Column(String(50))
    ply = Column(String(20))
    colour = Column(String(50))
    shade_no = Column(String(50))
    lot_no = Column(String(50))
    batch_no = Column(String(50))
    unit = Column(String(20), default="KGS")
    
    ordered_qty = Column(Numeric(10, 2), default=0)
    prev_delivered_qty = Column(Numeric(10, 2), default=0)
    balance_qty = Column(Numeric(10, 2), default=0)
    current_delivery_qty = Column(Numeric(10, 2), default=0)
    
    no_of_bags = Column(Integer, default=0)
    no_of_cones = Column(Integer, default=0)
    gross_weight = Column(Numeric(10, 2), default=0)
    tare_weight = Column(Numeric(10, 2), default=0)
    net_weight = Column(Numeric(10, 2), default=0)
    
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)
    remarks = Column(Text)

    delivery = relationship("DyedYarnDelivery", back_populates="items")
