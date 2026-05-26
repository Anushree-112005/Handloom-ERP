"""Packing Slip / Bale Entry model."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class PackingSlip(Base):
    __tablename__ = "packing_slips"

    id = Column(Integer, primary_key=True, index=True)
    slip_no = Column(String(50), unique=True, index=True)
    slip_date = Column(Date)
    party_name = Column(String(255))
    design_no = Column(String(50))
    order_no = Column(String(50))
    ibpo = Column(String(50))
    godown = Column(String(100))
    total_meters = Column(Numeric(10, 2), default=0)
    total_pieces = Column(Integer, default=0)
    total_bales = Column(Integer, default=0)
    gross_weight = Column(Numeric(10, 2), default=0)
    net_weight = Column(Numeric(10, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Packed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("PackingSlipItem", back_populates="slip", cascade="all, delete-orphan")


class PackingSlipItem(Base):
    __tablename__ = "packing_slip_items"

    id = Column(Integer, primary_key=True, index=True)
    slip_id = Column(Integer, ForeignKey("packing_slips.id"), nullable=False)
    bale_no = Column(String(50))
    piece_no = Column(String(50))
    design_no = Column(String(50))
    color = Column(String(50))
    meters = Column(Numeric(10, 2), default=0)
    weight = Column(Numeric(10, 2), default=0)
    grade = Column(String(10))
    lot_no = Column(String(50))
    loom_no = Column(String(50))
    pass_mtr = Column(Numeric(10, 2), default=0)

    slip = relationship("PackingSlip", back_populates="items")
