from sqlalchemy import Column, Integer, String, Date, Numeric, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProformaInvoice(Base):
    __tablename__ = "proforma_invoices"

    id = Column(Integer, primary_key=True, index=True)
    pi_number = Column(String(50), unique=True, index=True)
    pi_date = Column(Date, nullable=False)
    payment_mode = Column(String(100))
    revised_on = Column(Date, nullable=True)
    consignee = Column(String(255))
    delivery_at = Column(String(255))
    billing_address = Column(Text)
    delivery_address = Column(Text)
    revision_notes = Column(Text)
    special_instructions = Column(Text)
    
    total_quantity = Column(Numeric(12, 2), default=0)
    total_bale = Column(Integer, default=0)
    other_charges = Column(Numeric(12, 2), default=0)
    less_pct = Column(Numeric(5, 2), default=0)
    freight_charges = Column(Numeric(12, 2), default=0)
    packing_charges = Column(Numeric(12, 2), default=0)
    insurance_charges = Column(Numeric(12, 2), default=0)
    
    tax_type = Column(String(50), default='GST')
    cgst_pct = Column(Numeric(5, 2), default=0)
    sgst_pct = Column(Numeric(5, 2), default=0)
    igst_pct = Column(Numeric(5, 2), default=0)
    tcs_amount = Column(Numeric(12, 2), default=0)
    discount_pct = Column(Numeric(5, 2), default=0)
    
    taxable_amount = Column(Numeric(12, 2), default=0)
    tax_amount = Column(Numeric(12, 2), default=0)
    gst_amount = Column(Numeric(12, 2), default=0)
    gross_amount = Column(Numeric(12, 2), default=0)
    rounded_off = Column(Numeric(12, 2), default=0)
    net_amount = Column(Numeric(12, 2), default=0)
    
    terms_conditions = Column(JSON, default=[])
    approval_status = Column(String(50), default='Pending')

    items = relationship("ProformaInvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class ProformaInvoiceItem(Base):
    __tablename__ = "proforma_invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("proforma_invoices.id", ondelete="CASCADE"))
    ibpo_no = Column(String(100))
    style = Column(String(150))
    description = Column(String(255))
    pattern = Column(String(100))
    composition = Column(String(255))
    po_number = Column(String(100))
    delivery_date = Column(Date, nullable=True)
    quantity = Column(Numeric(12, 2), default=0)
    rate = Column(Numeric(12, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    invoice = relationship("ProformaInvoice", back_populates="items")
