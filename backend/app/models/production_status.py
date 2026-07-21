from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ProductionStatus(Base):
    __tablename__ = "production_status"

    id = Column(Integer, primary_key=True, index=True)
    buyer_order_id = Column(Integer, ForeignKey("buyer_orders.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(String(100), nullable=False)
    status = Column(String(50), default="Not Started")
    completed_qty = Column(Integer, default=0)
    pending_qty = Column(Integer, default=0)
    remarks = Column(Text, nullable=True)
    attachment = Column(String(255), nullable=True)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    buyer_order = relationship("BuyerOrder", backref="production_statuses")


class ProductionStatusHistory(Base):
    __tablename__ = "production_status_history"

    id = Column(Integer, primary_key=True, index=True)
    buyer_order_id = Column(Integer, ForeignKey("buyer_orders.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(String(100), nullable=False)
    prev_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    remarks = Column(Text, nullable=True)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    buyer_order = relationship("BuyerOrder", backref="production_status_histories")
