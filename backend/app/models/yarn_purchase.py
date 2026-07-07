"""Yarn Purchase Order models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Text, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class YarnPurchaseOrder(Base):
    __tablename__ = "yarn_purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, index=True)
    po_date = Column(Date, nullable=False)
    org_name = Column(String(255))
    internal_po_no = Column(String(100))
    used_for = Column(String(100))
    against_ref = Column(String(100))
    design_no = Column(String(100))
    agent_name = Column(String(255))
    supplier_name = Column(String(255))
    delivery_at = Column(String(255))
    
    # Tax / Other Details
    freight_type = Column(String(100))
    freight_chg = Column(Float, default=0.0)
    insurance_chg = Column(Float, default=0.0)
    total_order_kgs = Column(Float, default=0.0)
    transport = Column(String(255))
    tax_type = Column(String(100))
    taxable_amount = Column(Float, default=0.0)
    dispatch_date = Column(Date)
    packing_type = Column(String(100))
    sgst_pct = Column(Float, default=0.0)
    cgst_pct = Column(Float, default=0.0)
    igst_pct = Column(Float, default=0.0)
    labeling = Column(String(255))
    colour = Column(String(100))
    net_amount = Column(Float, default=0.0)
    due_days = Column(Integer, default=0)
    remarks = Column(Text)
    
    status = Column(String(30), default="Open")
    terms_conditions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    count_details = relationship("YarnPurchaseCountDetail", back_populates="purchase_order", cascade="all, delete-orphan")
    indent_details = relationship("YarnPurchaseIndentDetail", back_populates="purchase_order", cascade="all, delete-orphan")


class YarnPurchaseCountDetail(Base):
    __tablename__ = "yarn_purchase_count_details"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("yarn_purchase_orders.id"), nullable=False)
    
    supplier_name = Column(String(255))
    fibre_group = Column(String(100))
    yarn_count = Column(String(100))
    yarn_csp = Column(Float, default=0.0)
    min_cone_wgt = Column(Float, default=0.0)
    order_kgs = Column(Float, default=0.0)
    mill_name = Column(String(255))
    print_name = Column(String(255))
    tolerance_pct = Column(Float, default=0.0)

    purchase_order = relationship("YarnPurchaseOrder", back_populates="count_details")


class YarnPurchaseIndentDetail(Base):
    __tablename__ = "yarn_purchase_indent_details"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("yarn_purchase_orders.id"), nullable=False)
    
    req_ind_no = Column(String(100))
    design_no = Column(String(100))
    ibpo_no = Column(String(100))
    party_name = Column(String(255))
    fabric_name = Column(String(255))
    yarn_count = Column(String(100))
    order_mtrs = Column(Float, default=0.0)
    warp_qty = Column(Float, default=0.0)
    weft_qty = Column(Float, default=0.0)
    tot_reqd_qty = Column(Float, default=0.0)
    appd_qty = Column(Float, default=0.0)
    order_qty = Column(Float, default=0.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    colour = Column(String(100))
    delivery_date = Column(String(100))
    packing_type = Column(String(100))
    labeling = Column(String(255))
    uom = Column(String(50), default="KGS")

    purchase_order = relationship("YarnPurchaseOrder", back_populates="indent_details")
