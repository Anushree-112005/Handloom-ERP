"""Warp Beam Receipt & Warp Delivery models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class WarpBeamReceipt(Base):
    __tablename__ = "warp_beam_receipts"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True)
    rcvd_date = Column(Date)
    rcvd_type = Column(String(50))
    beam_type = Column(String(50))
    party_name = Column(String(255))
    design_no = Column(String(50))
    order_no = Column(String(50))
    color = Column(String(50))
    warp_count = Column(String(50))
    warp_ends = Column(Integer, default=0)
    warp_meters = Column(Numeric(10, 2), default=0)
    set_no = Column(String(50))
    siz_dc_no = Column(String(50))
    siz_dc_date = Column(Date)
    status = Column(String(30), default="Received")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    beams = relationship("WarpBeamDetail", back_populates="receipt", cascade="all, delete-orphan")


class WarpBeamDetail(Base):
    __tablename__ = "warp_beam_details"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("warp_beam_receipts.id"), nullable=False)
    beam_no = Column(String(50))
    warp_mtrs = Column(Numeric(10, 2), default=0)
    beam_type = Column(String(50))
    delivery_to_weaver = Column(String(150))
    order_no = Column(String(50))
    dc_no = Column(String(50))
    dc_date = Column(Date)
    loom_no = Column(String(50))
    loading_date = Column(Date)
    total_meters = Column(Numeric(10, 2), default=0)

    receipt = relationship("WarpBeamReceipt", back_populates="beams")


class WarpDelivery(Base):
    __tablename__ = "warp_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(50), unique=True, index=True)
    dc_date = Column(Date)
    delivery_type = Column(String(50))
    party_name = Column(String(255))
    design_no = Column(String(50))
    order_no = Column(String(50))
    transport = Column(String(150))
    vehicle_no = Column(String(50))
    total_meters = Column(Numeric(10, 2), default=0)
    balance_meters = Column(Numeric(10, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Delivered")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("WarpDeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class WarpDeliveryItem(Base):
    __tablename__ = "warp_delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("warp_deliveries.id"), nullable=False)
    beam_no = Column(String(50))
    warp_mtrs = Column(Numeric(10, 2), default=0)
    beam_type = Column(String(50))
    loom_no = Column(String(50))

    delivery = relationship("WarpDelivery", back_populates="items")
