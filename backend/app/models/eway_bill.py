"""E-Way Bill Entry model."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class EwayBill(Base):
    __tablename__ = "eway_bills"

    id = Column(Integer, primary_key=True, index=True)
    eway_bill_no = Column(String(50), unique=True, index=True)
    eway_date = Column(Date)
    supply_type = Column(String(50))
    sub_type = Column(String(50))
    document_type = Column(String(50))
    document_no = Column(String(50))
    document_date = Column(Date)
    invoice_type = Column(String(50))
    token_ex_date = Column(String(50))
    org_name = Column(String(100))
    dc_no_date = Column(String(100))
    token_no = Column(Text)
    result = Column(Text)
    error = Column(Text)
    
    bill_from_name = Column(String(255))
    bill_from_address = Column(Text)
    bill_from_gstin = Column(String(20))
    bill_from_pin = Column(String(10))
    bill_from_state = Column(String(100))
    bill_from_state_code = Column(String(10))
    
    dispatch_from_name = Column(String(255))
    dispatch_from_address = Column(Text)
    dispatch_from_pin = Column(String(10))
    dispatch_from_place = Column(String(150))
    dispatch_from_state = Column(String(100))
    dispatch_from_state_code = Column(String(10))
    
    bill_to_name = Column(String(255))
    bill_to_address = Column(Text)
    bill_to_gstin = Column(String(20))
    bill_to_pin = Column(String(10))
    bill_to_state = Column(String(100))
    bill_to_state_code = Column(String(10))
    
    dispatch_to_name = Column(String(255))
    dispatch_to_address = Column(Text)
    dispatch_to_pin = Column(String(10))
    dispatch_to_place = Column(String(150))
    dispatch_to_state = Column(String(100))
    dispatch_to_state_code = Column(String(10))
    
    distance = Column(Numeric(10, 2), default=0)
    total_value = Column(Numeric(14, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    cgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("EwayBillItem", back_populates="bill", cascade="all, delete-orphan")


class EwayBillItem(Base):
    __tablename__ = "eway_bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("eway_bills.id"), nullable=False)
    product_name = Column(String(255))
    hsn_code = Column(String(20))
    unit = Column(String(20))
    qty = Column(Numeric(10, 2), default=0)
    taxable_value = Column(Numeric(12, 2), default=0)
    tax_rate = Column(Numeric(5, 2), default=0)

    bill = relationship("EwayBill", back_populates="items")
