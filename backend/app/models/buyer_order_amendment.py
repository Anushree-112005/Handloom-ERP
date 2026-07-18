from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BuyerOrderAmendment(Base):
    __tablename__ = "buyer_order_amendments"

    id = Column(Integer, primary_key=True, index=True)
    amendment_no = Column(String(50), unique=True, index=True)
    amendment_date = Column(Date, nullable=False)
    last_amendment_date = Column(Date, nullable=True)
    ibpo_ref_no = Column(String(100), index=True)
    po_date = Column(Date, nullable=True)
    party_name = Column(String(255))
    design_no = Column(String(100))
    quality_print_name = Column(String(255))
    order_mtr = Column(Numeric(12, 2), default=0)
    tolerance_pct = Column(Numeric(5, 2), default=0)
    delivery_starting = Column(Date, nullable=True)
    party_completion_date = Column(Date, nullable=True)
    company_completion_date = Column(Date, nullable=True)
    last_dispatch_date = Column(Date, nullable=True)
    total_dispatch_mtr = Column(Numeric(12, 2), default=0)
    party_rate = Column(Numeric(12, 2), default=0)
    amendment_mtr = Column(Numeric(12, 2), default=0)
    total_mtr = Column(Numeric(12, 2), default=0)
    status = Column(String(50), default='Pending')

    details = relationship("BuyerOrderAmendmentDetail", back_populates="amendment", cascade="all, delete-orphan")


class BuyerOrderAmendmentDetail(Base):
    __tablename__ = "buyer_order_amendment_details"

    id = Column(Integer, primary_key=True, index=True)
    amendment_id = Column(Integer, ForeignKey("buyer_order_amendments.id", ondelete="CASCADE"))
    order_date = Column(Date, nullable=True)
    completion_date = Column(Date, nullable=True)
    amendment_order_mtr = Column(Numeric(12, 2), default=0)
    amendment_type = Column(String(100))
    reason = Column(String(255))

    amendment = relationship("BuyerOrderAmendment", back_populates="details")
