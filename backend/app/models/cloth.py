"""Cloth Inward, On-Table Checking, Cloth Delivery models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ClothInward(Base):
    __tablename__ = "cloth_inwards"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True) # Maps to Inw ID
    inward_type = Column(String(100))
    inw_date = Column(Date)
    vendor_order = Column(String(100))
    party_name = Column(String(255)) # Maps to Vendor Name
    dc_no = Column(String(50)) # Maps to Vendor DC No
    dc_date = Column(Date)
    vendor_order_mtr = Column(Numeric(10, 2), default=0)
    order_mtr_plus_10 = Column(Numeric(10, 2), default=0)
    received_mtr = Column(Numeric(10, 2), default=0)
    balance_mtr = Column(Numeric(10, 2), default=0)
    ibpo = Column(String(100))
    design_no = Column(String(50))
    const_fabric_type = Column(String(255))
    reed = Column(String(100))
    pick = Column(String(100))
    width = Column(String(100))
    order_mtr = Column(Numeric(10, 2), default=0)
    warp_mtr = Column(Numeric(10, 2), default=0)
    inward_mtr = Column(Numeric(10, 2), default=0)
    shed_no = Column(String(100))
    loom_no = Column(String(100))
    attn_no = Column(String(100))
    beam_no = Column(String(100))
    szt_no = Column(String(100))
    total_pieces = Column(Integer, default=0) # Maps to Total Pc
    total_meters = Column(Numeric(10, 2), default=0) # Maps to Total Mtr
    inspection_type = Column(String(100))
    inv_pin = Column(String(100))
    remarks = Column(Text)
    process_type = Column(String(100))
    process_remarks = Column(Text)
    
    # Keeping old columns for compatibility
    inv_no = Column(String(50))
    inv_date = Column(Date)
    received_type = Column(String(50))
    order_no = Column(String(50))
    gross_amount = Column(Numeric(14, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    status = Column(String(30), default="Received")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("ClothInwardItem", back_populates="inward", cascade="all, delete-orphan")


class ClothInwardItem(Base):
    __tablename__ = "cloth_inward_items"

    id = Column(Integer, primary_key=True, index=True)
    inward_id = Column(Integer, ForeignKey("cloth_inwards.id"), nullable=False)
    piece_no = Column(String(100)) # Maps to Pcno
    weight = Column(Numeric(10, 2), default=0)
    vloom = Column(String(100))
    vpc_no = Column(String(100))
    meters = Column(Numeric(10, 2), default=0) # Maps to Mtr
    
    # Keeping old columns for compatibility
    design_no = Column(String(50))
    color = Column(String(50))
    lot_no = Column(String(50))
    pieces = Column(Integer, default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    inward = relationship("ClothInward", back_populates="items")


class OnTableChecking(Base):
    __tablename__ = "on_table_checking"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True)
    checking_date = Column(Date)
    table_no = Column(String(100))
    design_no = Column(String(50))
    order_no = Column(String(50))
    party_name = Column(String(255))
    lot_no = Column(String(50))
    total_meters = Column(Numeric(10, 2), default=0)
    total_pieces = Column(Integer, default=0)
    pass_meters = Column(Numeric(10, 2), default=0)
    reject_meters = Column(Numeric(10, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Checked")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("OnTableCheckingItem", back_populates="checking", cascade="all, delete-orphan")


class OnTableCheckingItem(Base):
    __tablename__ = "on_table_checking_items"

    id = Column(Integer, primary_key=True, index=True)
    checking_id = Column(Integer, ForeignKey("on_table_checking.id"), nullable=False)
    piece_no = Column(String(50))
    vpc_no = Column(String(100))
    inv_pin = Column(String(100))
    checking_pin = Column(String(100))
    pc_type = Column(String(100))  # Pass/Fail/Reject
    pc_1 = Column(Text)
    pc_2 = Column(Text)
    pc_3 = Column(Text)
    pc_4 = Column(Text)
    pc_5 = Column(Text)
    pc_6 = Column(Text)
    pc_7 = Column(Text)
    swex = Column(Text)
    meters = Column(Numeric(10, 2), default=0)
    defect_type = Column(String(100))
    grade = Column(String(10))
    remarks = Column(Text)

    checking = relationship("OnTableChecking", back_populates="items")


class ClothDelivery(Base):
    __tablename__ = "cloth_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(50), unique=True, index=True)
    dc_date = Column(Date)
    delivery_type = Column(String(50))
    delivery_mode = Column(String(50))
    party_name = Column(String(255))
    design_no = Column(String(50))
    order_no = Column(String(50))
    transport = Column(String(150))
    total_meters = Column(Numeric(10, 2), default=0)
    total_pieces = Column(Integer, default=0)
    gross_amount = Column(Numeric(14, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Delivered")
    
    # Newly added fields based on reference document / image
    po_no = Column(String(100))
    process_type = Column(String(100))
    ibpo = Column(String(100))
    fabric_detail = Column(Text)
    pc_type = Column(String(100))
    ibpo_order_mtr = Column(Numeric(10, 2), default=0)
    delivery_mtr = Column(Numeric(10, 2), default=0)
    balance = Column(Numeric(10, 2), default=0)
    fresh_width = Column(Numeric(10, 2), default=0)
    finish_fold = Column(String(100))
    process_comm = Column(Text)
    bpo_no = Column(String(100))
    design_no_bottom = Column(String(100))
    buyer_name = Column(String(255))
    lot_no = Column(String(100))
    griege_rate = Column(Numeric(10, 2), default=0)
    return_type = Column(String(100))
    oba = Column(String(255))
    finish_pick = Column(Numeric(10, 2), default=0)
    glm = Column(Numeric(10, 2), default=0)
    
    # Voucher Entry Section
    voucher_no = Column(String(100))
    voucher_date = Column(Date)
    rate_mtr = Column(Numeric(10, 2), default=0)
    debited_amount = Column(Numeric(14, 2), default=0)
    detailed_remarks = Column(Text)
    
    # Gate Pass Section
    transport_name = Column(String(255))
    vehicle_no = Column(String(100))
    driver_name = Column(String(255))
    mobile_no = Column(String(50))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("ClothDeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class ClothDeliveryItem(Base):
    __tablename__ = "cloth_delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("cloth_deliveries.id"), nullable=False)
    design_no = Column(String(50))
    color = Column(String(50))
    lot_no = Column(String(50))
    meters = Column(Numeric(10, 2), default=0)
    pieces = Column(Integer, default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)
    
    # Newly added fields based on reference document / grid
    piece_no = Column(String(100))
    ok_mtr = Column(Numeric(10, 2), default=0)
    fold_mtr = Column(Numeric(10, 2), default=0)

    delivery = relationship("ClothDelivery", back_populates="items")
