"""Party Master model — customers, vendors, agents, processors."""
from sqlalchemy import Column, Integer, String, DateTime, Text, func
from app.core.database import Base


class PartyMaster(Base):
    __tablename__ = "party_master"

    id = Column(Integer, primary_key=True, index=True)
    customer_code = Column(String(50), unique=True, index=True)
    party_type = Column(String(50), nullable=False)  # Sales, Purchase, Logistics, Agent
    company_name = Column(String(255), nullable=False)
    customer_grade = Column(String(10))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    state_code = Column(String(10))
    pin_code = Column(String(10))
    country = Column(String(100), default="India")
    phone = Column(String(20))
    mobile = Column(String(20))
    email = Column(String(255))
    gst_no = Column(String(20))
    pan_no = Column(String(15))
    tin_no = Column(String(20))
    cst_no = Column(String(20))
    contact_person = Column(String(150))
    bank_name = Column(String(150))
    bank_account = Column(String(50))
    ifsc_code = Column(String(15))
    credit_days = Column(Integer, default=0)
    credit_limit = Column(Integer, default=0)
    status = Column(String(20), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
