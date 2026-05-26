"""Yarn Purchase Order and Inward models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class YarnPurchaseOrder(Base):
    __tablename__ = "yarn_purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, index=True)
    po_date = Column(Date, nullable=False)
    party_name = Column(String(255))
    party_id = Column(Integer, ForeignKey("party_master.id"))
    order_type = Column(String(50))
    design_no = Column(String(50))
    delivery_date = Column(Date)
    payment_terms = Column(String(100))
    remarks = Column(Text)
    total_amount = Column(Numeric(14, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    cgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    status = Column(String(30), default="Open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("YarnPurchaseItem", back_populates="purchase_order", cascade="all, delete-orphan")


class YarnPurchaseItem(Base):
    __tablename__ = "yarn_purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("yarn_purchase_orders.id"), nullable=False)
    yarn_type = Column(String(100))
    count = Column(String(50))
    color = Column(String(50))
    lot_no = Column(String(50))
    bags = Column(Integer, default=0)
    cones = Column(Integer, default=0)
    total_kgs = Column(Numeric(10, 2), default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    purchase_order = relationship("YarnPurchaseOrder", back_populates="items")
