"""Yarn Inward Entry model."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class YarnInward(Base):
    __tablename__ = "yarn_inwards"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True)
    inv_no = Column(String(50))
    inv_date = Column(Date)
    received_type = Column(String(50))
    receive_mode = Column(String(50))
    party_name = Column(String(255))
    party_id = Column(Integer, ForeignKey("party_master.id"))
    design_no = Column(String(50))
    order_no = Column(String(50))
    dc_no = Column(String(50))
    dc_date = Column(Date)
    total_kgs = Column(Numeric(10, 2), default=0)
    gross_amount = Column(Numeric(14, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Received")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("YarnInwardItem", back_populates="inward", cascade="all, delete-orphan")


class YarnInwardItem(Base):
    __tablename__ = "yarn_inward_items"

    id = Column(Integer, primary_key=True, index=True)
    inward_id = Column(Integer, ForeignKey("yarn_inwards.id"), nullable=False)
    yarn_type = Column(String(100))
    count = Column(String(50))
    color = Column(String(50))
    lot_no = Column(String(50))
    stock = Column(String(100))
    bags = Column(Integer, default=0)
    cones = Column(Integer, default=0)
    total_kgs = Column(Numeric(10, 2), default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    inward = relationship("YarnInward", back_populates="items")
