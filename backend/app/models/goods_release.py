"""Goods Release Advice (GRA) model."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class GoodsRelease(Base):
    __tablename__ = "goods_releases"

    id = Column(Integer, primary_key=True, index=True)
    gra_no = Column(String(50), unique=True, index=True)
    gra_date = Column(Date, nullable=False)
    party_name = Column(String(255))
    ibpo = Column(String(50))
    design_no = Column(String(50))
    order_no = Column(String(50))
    transport_mode = Column(String(50))
    transport_name = Column(String(150))
    vehicle_no = Column(String(50))
    lr_no = Column(String(50))
    lr_date = Column(Date)
    delivery_address = Column(Text)
    total_meters = Column(Numeric(10, 2), default=0)
    total_bales = Column(Integer, default=0)
    gross_weight = Column(Numeric(10, 2), default=0)
    net_weight = Column(Numeric(10, 2), default=0)
    approval_status = Column(String(30), default="Pending")
    approved_by = Column(String(100))
    remarks = Column(Text)
    status = Column(String(30), default="Draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("GoodsReleaseItem", back_populates="release", cascade="all, delete-orphan")


class GoodsReleaseItem(Base):
    __tablename__ = "goods_release_items"

    id = Column(Integer, primary_key=True, index=True)
    release_id = Column(Integer, ForeignKey("goods_releases.id"), nullable=False)
    packing_slip_no = Column(String(50))
    bale_no = Column(String(50))
    design_no = Column(String(50))
    color = Column(String(50))
    meters = Column(Numeric(10, 2), default=0)
    pieces = Column(Integer, default=0)
    weight = Column(Numeric(10, 2), default=0)

    release = relationship("GoodsRelease", back_populates="items")
