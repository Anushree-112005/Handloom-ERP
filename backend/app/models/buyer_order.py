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
    billing_address = Column(Text)
    delivery_address = Column(Text)
    state = Column(String(100))
    state_code = Column(String(10))
    gst_no = Column(String(20))
    pan_no = Column(String(15))
    nomination_type = Column(String(50))
    payment_terms = Column(String(100))
    outstanding = Column(Numeric(12, 2), default=0)
    overdue = Column(Numeric(12, 2), default=0)
    credit_days = Column(Integer, default=0)
    transport_mode = Column(String(50))
    transport_name = Column(String(150))
    delivery_place = Column(String(150))
    lr_type = Column(String(50))
    lr_terms = Column(String(100))
    commission_pct = Column(Numeric(5, 2), default=0)
    status = Column(String(30), default="Active")
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
    design_no = Column(String(50))
    fabric_type = Column(String(100))
    color = Column(String(50))
    order_mtrs = Column(Numeric(12, 2), default=0)
    tolerance_pct = Column(Numeric(5, 2), default=0)
    uom = Column(String(20), default="MTR")
    hsn_code = Column(String(20))
    rate = Column(Numeric(12, 2), default=0)
    amount = Column(Numeric(14, 2), default=0)
    buyer_style = Column(String(100))
    party_terms = Column(String(100))

    order = relationship("BuyerOrder", back_populates="items")
