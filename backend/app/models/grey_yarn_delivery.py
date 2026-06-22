"""Grey Yarn Delivery models."""
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class GreyYarnDelivery(Base):
    __tablename__ = "grey_yarn_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(50), unique=True, index=True)
    dc_date = Column(Date, nullable=False)
    ref_date = Column(Date)
    stock_godown = Column(String(255))
    delivery_type = Column(String(100))
    party_name = Column(String(255))
    delivery_mode = Column(String(100))
    delivery_address = Column(Text)
    design_no = Column(String(100))
    order_no = Column(String(100))
    transport = Column(String(255))
    vehicle_no = Column(String(100))
    delivery_name = Column(String(255))
    delivery_time = Column(String(20))
    certificate_type = Column(String(100))
    design_count = Column(String(100))
    
    order_kgs = Column(Float, default=0.0)
    total_dely_kgs = Column(Float, default=0.0)
    total_rtn_kgs = Column(Float, default=0.0)
    balance_kgs = Column(Float, default=0.0)

    status = Column(String(30), default="Delivered")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("GreyYarnDeliveryItem", back_populates="delivery", cascade="all, delete-orphan")


class GreyYarnDeliveryItem(Base):
    __tablename__ = "grey_yarn_delivery_items"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("grey_yarn_deliveries.id"), nullable=False)
    
    cone_type = Column(String(50))
    count = Column(String(100))
    our_lot_no = Column(String(100))
    color = Column(String(100))
    stock = Column(Float, default=0.0)
    bags = Column(Integer, default=0)
    cones = Column(Integer, default=0)
    total_kgs = Column(Float, default=0.0)
    rate = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

    delivery = relationship("GreyYarnDelivery", back_populates="items")
