from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BuyerOrderCompletion(Base):
    __tablename__ = "buyer_order_completions"

    id = Column(Integer, primary_key=True, index=True)
    completion_date = Column(Date, nullable=False)
    party_name = Column(String(255))
    updated_to = Column(String(50))
    records_updated = Column(Integer, default=0)
    remarks = Column(String(255))
    
    details = relationship("BuyerOrderCompletionDetail", back_populates="completion", cascade="all, delete-orphan")


class BuyerOrderCompletionDetail(Base):
    __tablename__ = "buyer_order_completion_details"

    id = Column(Integer, primary_key=True, index=True)
    completion_id = Column(Integer, ForeignKey("buyer_order_completions.id", ondelete="CASCADE"))
    ibpo_no = Column(String(100))
    po_no = Column(String(100))
    design_no = Column(String(100))
    quality = Column(String(255))
    order_mtr = Column(Numeric(12, 2), default=0)
    dispatch_mtr = Column(Numeric(12, 2), default=0)
    return_mtr = Column(Numeric(12, 2), default=0)
    balance_mtr = Column(Numeric(12, 2), default=0)
    row_remarks = Column(String(255))

    completion = relationship("BuyerOrderCompletion", back_populates="details")
