from sqlalchemy import Column, Integer, String, Date, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BuyerOrderSchedule(Base):
    __tablename__ = "buyer_order_schedules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_no = Column(String(50), unique=True, index=True)
    schedule_date = Column(Date, nullable=False)
    schedule_order = Column(String(100))
    ibpo_ref_no = Column(String(100), index=True)
    po_date = Column(Date, nullable=True)
    party_name = Column(String(255))
    design_no = Column(String(100))
    quality = Column(String(255))
    order_mtr = Column(Numeric(12, 2), default=0)
    min_mtr = Column(Numeric(12, 2), default=0)
    max_mtr = Column(Numeric(12, 2), default=0)
    tolerance_pct = Column(Numeric(5, 2), default=0)
    delivery_starting = Column(Date, nullable=True)
    party_completion_date = Column(Date, nullable=True)
    company_completion_date = Column(Date, nullable=True)
    production_start_date = Column(Date, nullable=True)

    entries = relationship("BuyerOrderScheduleEntry", back_populates="schedule", cascade="all, delete-orphan")


class BuyerOrderScheduleEntry(Base):
    __tablename__ = "buyer_order_schedule_entries"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("buyer_order_schedules.id", ondelete="CASCADE"))
    approval = Column(Boolean, default=False)
    schedule_date = Column(Date, nullable=True)
    schedule_mtr = Column(Numeric(12, 2), default=0)

    schedule = relationship("BuyerOrderSchedule", back_populates="entries")
