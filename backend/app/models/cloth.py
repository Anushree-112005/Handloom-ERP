"""Cloth Inward, On-Table Checking, Cloth Delivery models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ClothInward(Base):
    __tablename__ = "cloth_inwards"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True)
    inv_no = Column(String(50))
    inv_date = Column(Date)
    received_type = Column(String(50))
    party_name = Column(String(255))
    design_no = Column(String(50))
    order_no = Column(String(50))
    dc_no = Column(String(50))
    dc_date = Column(Date)
    total_meters = Column(Numeric(10, 2), default=0)
    total_pieces = Column(Integer, default=0)
    gross_amount = Column(Numeric(14, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Received")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("ClothInwardItem", back_populates="inward", cascade="all, delete-orphan")


class ClothInwardItem(Base):
    __tablename__ = "cloth_inward_items"

    id = Column(Integer, primary_key=True, index=True)
    inward_id = Column(Integer, ForeignKey("cloth_inwards.id"), nullable=False)
    design_no = Column(String(50))
    color = Column(String(50))
    lot_no = Column(String(50))
    meters = Column(Numeric(10, 2), default=0)
    pieces = Column(Integer, default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    inward = relationship("ClothInward", back_populates="items")


class OnTableChecking(Base):
    __tablename__ = "on_table_checking"

    id = Column(Integer, primary_key=True, index=True)
    ref_no = Column(String(50), unique=True, index=True)
    checking_date = Column(Date)
    design_no = Column(String(50))
    order_no = Column(String(50))
    party_name = Column(String(255))
    lot_no = Column(String(50))
    total_meters = Column(Numeric(10, 2), default=0)
    total_pieces = Column(Integer, default=0)
    pass_meters = Column(Numeric(10, 2), default=0)
    reject_meters = Column(Numeric(10, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Checked")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("OnTableCheckingItem", back_populates="checking", cascade="all, delete-orphan")


class OnTableCheckingItem(Base):
    __tablename__ = "on_table_checking_items"

    id = Column(Integer, primary_key=True, index=True)
    checking_id = Column(Integer, ForeignKey("on_table_checking.id"), nullable=False)
    piece_no = Column(String(50))
    meters = Column(Numeric(10, 2), default=0)
    defect_type = Column(String(100))
    grade = Column(String(10))
    remarks = Column(Text)

    checking = relationship("OnTableChecking", back_populates="items")


class ClothDelivery(Base):
    __tablename__ = "cloth_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(50), unique=True, index=True)
    dc_date = Column(Date)
    delivery_type = Column(String(50))
    delivery_mode = Column(String(50))
    party_name = Column(String(255))
    design_no = Column(String(50))
    order_no = Column(String(50))
    transport = Column(String(150))
    total_meters = Column(Numeric(10, 2), default=0)
    total_pieces = Column(Integer, default=0)
    gross_amount = Column(Numeric(14, 2), default=0)
    sgst = Column(Numeric(10, 2), default=0)
    igst = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(14, 2), default=0)
    remarks = Column(Text)
    status = Column(String(30), default="Delivered")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("ClothDeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class ClothDeliveryItem(Base):
    __tablename__ = "cloth_delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("cloth_deliveries.id"), nullable=False)
    design_no = Column(String(50))
    color = Column(String(50))
    lot_no = Column(String(50))
    meters = Column(Numeric(10, 2), default=0)
    pieces = Column(Integer, default=0)
    rate = Column(Numeric(10, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    delivery = relationship("ClothDelivery", back_populates="items")
