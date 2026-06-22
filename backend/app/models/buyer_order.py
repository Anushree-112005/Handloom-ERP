"""Buyer Order Posting model with line items."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class BuyerOrder(Base):
    __tablename__ = "buyer_orders"

    id = Column(Integer, primary_key=True, index=True)
    ibpo_number = Column(String(50), unique=True, index=True)
    order_date = Column(Date, nullable=False)
    party_name = Column(String(255))
    party_id = Column(Integer, ForeignKey("party_master.id"))
    agent_name = Column(String(255))
    order_type = Column(String(50))  # Regular, Export, Special
    certified_type = Column(String(50))
    buyer_name = Column(String(255))
    billing_address = Column(Text)
    delivery_address = Column(Text)
    state = Column(String(100))
    state_code = Column(String(10))
    gst_no = Column(String(20))
    pan_no = Column(String(15))
    commission_type = Column(String(50))
    commission_pct = Column(Numeric(5, 2), default=0)
    order_taken_by = Column(String(150))
    merchandiser = Column(String(150))
    nomination_type = Column(String(50))
    regular_special = Column(String(50))

    # Payment Details
    outstanding = Column(Numeric(12, 2), default=0)
    overdue = Column(Numeric(12, 2), default=0)
    due_30_days = Column(Numeric(12, 2), default=0)
    status = Column(String(30), default="Active")
    status_remark = Column(Text)
    max_crd_days = Column(Integer, default=0)
    po_credit = Column(Integer, default=0)
    po_max_crd = Column(Integer, default=0)
    bill_credit = Column(Integer, default=0)
    payment_detail = Column(Text)
    payment_terms = Column(String(100))
    payment_file_path = Column(String(255))

    # Transport & Delivery
    transport_mode = Column(String(50))
    transport_name = Column(String(150))
    party_terms = Column(String(100))
    lr_type = Column(String(50))
    lr_terms = Column(String(100))
    party_comp_date = Column(Date)
    exfactory_date = Column(Date)
    delivery_starting = Column(Date)
    delivery_at = Column(String(150))
    desp_mtr_min = Column(Numeric(12, 2), default=0)
    desp_mtr_max = Column(Numeric(12, 2), default=0)
    delivery_place = Column(String(150))

    # Process Follow & Instructions
    process_sequence = Column(Text)
    process_instruction = Column(Text)
    email_to = Column(Text)
    email_cc = Column(Text)
    yarn_instruction = Column(Text)
    prod_instruction = Column(Text)
    delivery_instruction = Column(Text)
    remarks = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("BuyerOrderItem", back_populates="order", cascade="all, delete-orphan")


class BuyerOrderItem(Base):
    __tablename__ = "buyer_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("buyer_orders.id"), nullable=False)
    party_po_no = Column(String(50))
    po_date = Column(Date)
    point_of_contact = Column(String(150))
    order_mtrs = Column(Numeric(12, 2), default=0)
    uom = Column(String(20), default="MTR")
    tolerance_pct = Column(Numeric(5, 2), default=0)
    total_mtr_yard = Column(Numeric(12, 2), default=0)
    hsn_code = Column(String(20))
    sample_mtr = Column(Numeric(12, 2), default=0)
    buyer_style = Column(String(100))
    short_no = Column(String(50))
    design_no = Column(String(50))
    gry_construction = Column(String(150))
    fabric_type = Column(String(100))
    color = Column(String(50))
    construction = Column(String(150))
    weaving_type = Column(String(50))
    pick_on_table = Column(Integer)
    print_name = Column(String(100))
    finish_reed = Column(Integer)
    finish_pick = Column(Integer)
    finish_width = Column(Numeric(10, 2))
    cuttable_width = Column(Numeric(10, 2))
    pattern = Column(String(50))
    packing_type = Column(String(50))
    loom_type = Column(String(50))
    insurance = Column(String(10))
    packing_charge = Column(Numeric(10, 2), default=0)
    end_use = Column(String(100))
    season = Column(String(50))
    party_comment = Column(Text)
    fabric_content = Column(String(150))
    development_id = Column(String(50))
    country = Column(String(50))
    combo = Column(String(50))
    currency = Column(String(50))
    pc_type = Column(String(50))
    gsm = Column(Numeric(10, 2))
    price = Column(Numeric(12, 2), default=0)
    gst_pct = Column(Numeric(5, 2), default=0)
    gst_rate = Column(Numeric(12, 2), default=0)
    rate = Column(Numeric(12, 2), default=0)
    amount = Column(Numeric(14, 2), default=0)
    image_design_path = Column(String(255))
    party_terms = Column(String(100))

    order = relationship("BuyerOrder", back_populates="items")

class BuyerOrderSchedule(Base):
    __tablename__ = "buyer_order_schedules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(String(50), unique=True, index=True)
    order_id_ref = Column(String(50))
    buyer_ref = Column(String(100))
    shipment_date = Column(Date)
    delivery_place = Column(String(150))
    delivery_terms = Column(String(100))
    qty = Column(String(50))
    fabric_type = Column(String(100))
    shade = Column(String(100))
    lot_no = Column(String(100))
    packing_type = Column(String(50))
    transporter_name = Column(String(150))
    transport_mode = Column(String(50))
    remarks = Column(Text)
    status = Column(String(30), default="Scheduled")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BuyerOrderSequence(Base):
    __tablename__ = "buyer_order_sequences"

    id = Column(Integer, primary_key=True, index=True)
    sequence_id = Column(String(50), unique=True, index=True)
    order_id_ref = Column(String(50))
    prefix = Column(String(50))
    fin_year = Column(String(20))
    running_no = Column(Integer)
    buyer_name = Column(String(150))
    party_name = Column(String(150))
    order_type = Column(String(50))
    category = Column(String(50))
    buyer_ref = Column(String(100))
    generated_order_no = Column(String(100))
    created_by = Column(String(100))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BuyerOrderAmendment(Base):
    __tablename__ = "buyer_order_amendments"

    id = Column(Integer, primary_key=True, index=True)
    amendment_id = Column(String(50), unique=True, index=True)
    order_id_ref = Column(String(50))
    amd_date = Column(Date)
    field_changed = Column(String(100))
    old_value = Column(String(200))
    new_value = Column(String(200))
    remarks = Column(Text)
    approved_by = Column(String(100))
    effective_date = Column(Date)
    buyer_ref = Column(String(100))
    fabric_details = Column(Text)
    shade = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BuyerOrderCompletion(Base):
    __tablename__ = "buyer_order_completions"

    id = Column(Integer, primary_key=True, index=True)
    cmp_id = Column(String(50), unique=True, index=True)
    order_id_ref = Column(String(50))
    completion_date = Column(Date)
    status = Column(String(50), default="Closed")
    final_dispatch_qty = Column(String(100))
    balance_qty = Column(String(100))
    fabric_type = Column(String(100))
    shade = Column(String(100))
    lot_no = Column(String(100))
    packing_type = Column(String(100))
    delivery_place = Column(String(150))
    transporter_name = Column(String(150))
    buyer_ref = Column(String(100))
    remarks = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BuyerOrderDispatch(Base):
    __tablename__ = "buyer_order_dispatches"

    id = Column(Integer, primary_key=True, index=True)
    indent_id = Column(String(50), unique=True, index=True)
    order_id_ref = Column(String(50))
    transporter_name = Column(String(150))
    lr_no = Column(String(100))
    vehicle_no = Column(String(100))
    delivery_place = Column(String(150))
    packing_type = Column(String(100))
    dispatch_date = Column(Date)
    shade = Column(String(100))
    lot_no = Column(String(100))
    quantity = Column(String(100))
    remarks = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BuyerOrderExpense(Base):
    __tablename__ = "buyer_order_expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(String(50), unique=True, index=True)
    order_id_ref = Column(String(50))
    expense_type = Column(String(100))
    amount = Column(Numeric(10, 2))
    currency = Column(String(50), default="INR")
    payment_mode = Column(String(50))
    vendor_name = Column(String(150))
    invoice_ref = Column(String(100))
    remarks = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
