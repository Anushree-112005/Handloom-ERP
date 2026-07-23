"""Party Master model — customers, vendors, agents, processors."""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base
class PartyMaster(Base):
    __tablename__ = "party_master"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, index=True)
    party_type = Column(String(50), nullable=False)  # Sales, Purchase, Logistics, Agent
    company_name = Column(String(255), nullable=False)
    party_group = Column(String(100))
    customer_grade = Column(String(10))
    status = Column(String(20), default="Active")
    
    address_type = Column(String(50), default="Bill")
    address = Column(Text)
    city = Column(String(100))
    district = Column(String(100))
    state = Column(String(100))
    state_code = Column(String(10))
    pin_code = Column(String(20))
    country = Column(String(100), default="India")
    sales_region = Column(String(100))
    currency = Column(String(50), default="INR")
    
    phone = Column(String(50))
    mobile = Column(String(20))
    email = Column(String(255))
    contact_person = Column(String(150))
    
    gst_no = Column(String(50))
    gst_type = Column(String(50))
    pan_no = Column(String(20))
    tin_no = Column(String(50))
    cst_no = Column(String(50))
    tally_ledger_name = Column(String(150))
    tally_no = Column(String(100))
    address_sno = Column(String(50))
    tcs_applicable = Column(String(10))
    
    tds = Column(String(50))
    tds_percent = Column(Float, default=0.0)
    pc_id = Column(String(50))
    
    merchandiser = Column(String(100))
    manager = Column(String(100))
    account_incharge = Column(String(100))
    agent_name = Column(String(150))
    buyer_name = Column(String(150))
    
    bank_name = Column(String(150))
    bank_account = Column(String(50))
    ifsc_code = Column(String(15))
    
    credit_days = Column(Integer, default=0)
    credit_limit = Column(Float, default=0.0)
    
    deliver_party_name = Column(String(150))
    payment_terms = Column(String(100))
    transport_name = Column(String(150))
    delivery_address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    addresses = relationship("PartyAddress", back_populates="party", cascade="all, delete-orphan")


class PartyAddress(Base):
    __tablename__ = "party_addresses"

    id = Column(Integer, primary_key=True, index=True)
    party_id = Column(Integer, ForeignKey("party_master.id", ondelete="CASCADE"), nullable=False)
    
    address = Column(Text)
    city = Column(String(100))
    district = Column(String(100))
    state = Column(String(100))
    state_code = Column(String(10))
    pin_code = Column(String(20))
    country = Column(String(100), default="India")
    sales_region = Column(String(100))
    address_type = Column(String(50), default="Bill")  # Bill, Ship, Branch, Head Office
    
    alias = Column(String(50))  # Tally Address Name/Code (e.g., 1, 2, Branch-A)
    gst_no = Column(String(50))
    pan_no = Column(String(20))
    contact_number = Column(String(50))
    contact_person = Column(String(150))

    party = relationship("PartyMaster", back_populates="addresses")
