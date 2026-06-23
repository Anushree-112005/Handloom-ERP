from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class GenericPurchaseOrder(Base):
    __tablename__ = "generic_purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_type = Column(String(100), index=True)
    po_no = Column(String(50), unique=True, index=True)
    po_date = Column(Date)
    org_name = Column(String(255))
    internal_po_no = Column(String(100))
    used_for = Column(String(255))
    against_ref = Column(String(255))
    agent_name = Column(String(255))
    supplier_name = Column(String(255))
    delivery_at = Column(String(255))
    status = Column(String(50), default="Active")
    packing_type = Column(String(100))
    labeling = Column(String(255))
    remarks = Column(Text)

    transport = Column(String(150))
    freight_type = Column(String(100))
    freight_chg = Column(Numeric(10, 2), default=0)
    insurance_chg = Column(Numeric(10, 2), default=0)
    total_order_kgs = Column(Numeric(10, 2), default=0)
    dispatch_date = Column(Date)
    due_days = Column(Integer, default=0)

    tax_type = Column(String(50))
    taxable_amount = Column(Numeric(10, 2), default=0)
    sgst_pct = Column(Numeric(5, 2), default=0)
    cgst_pct = Column(Numeric(5, 2), default=0)
    igst_pct = Column(Numeric(5, 2), default=0)
    net_amount = Column(Numeric(10, 2), default=0)
    terms_conditions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("GenericPurchaseOrderItem", back_populates="order", cascade="all, delete-orphan")

class GenericPurchaseOrderItem(Base):
    __tablename__ = "generic_purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("generic_purchase_orders.id"), nullable=False)
    yarn_count = Column(String(100))
    colour = Column(String(100))
    item_name = Column(String(255))
    order_qty = Column(Numeric(10, 2), default=0)
    uom = Column(String(50))
    delivery_date = Column(Date)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(10, 2), default=0)

    order = relationship("GenericPurchaseOrder", back_populates="items")
