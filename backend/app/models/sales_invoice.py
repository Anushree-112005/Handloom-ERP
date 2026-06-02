"""Sales Invoice model."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SalesInvoice(Base):
    __tablename__ = "sales_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(50), unique=True, index=True)
    invoice_date = Column(Date, nullable=False)
    invoice_type = Column(String(50), default="Proforma Invoice")
    party_name = Column(String(255))
    party_id = Column(Integer, ForeignKey("party_master.id"))
    ibpo = Column(String(50))
    design_no = Column(String(50))
    billing_address = Column(Text)
    delivery_address = Column(Text)
    state = Column(String(100))
    state_code = Column(String(10))
    gst_no = Column(String(20))
    hsn_code = Column(String(20))
    total_qty = Column(Numeric(10, 2), default=0)
    gross_weight = Column(Numeric(10, 2), default=0)
    gross_amount = Column(Numeric(14, 2), default=0)
    discount_pct = Column(Numeric(5, 2), default=0)
    discount_amount = Column(Numeric(12, 2), default=0)
    taxable_amount = Column(Numeric(14, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    cgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    other_charges = Column(Numeric(10, 2), default=0)
    round_off = Column(Numeric(6, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Draft")

    # Export specific fields
    currency = Column(String(10), default="INR")
    exchange_rate = Column(Numeric(10, 4), default=1.0)
    rodtep_amount = Column(Numeric(12, 2), default=0)
    drawback_amount = Column(Numeric(12, 2), default=0)
    ad_code = Column(String(50))
    iec_number = Column(String(50))
    firc_reference = Column(String(100))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("SalesInvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class SalesInvoiceItem(Base):
    __tablename__ = "sales_invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("sales_invoices.id"), nullable=False)
    design_no = Column(String(50))
    color = Column(String(50))
    uom = Column(String(20), default="MTR")
    qty = Column(Numeric(10, 2), default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)
    description = Column(String(255))
    total_bale = Column(Integer)

    invoice = relationship("SalesInvoice", back_populates="items")
