from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class OrderExpense(Base):
    __tablename__ = "order_expenses"

    id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String(50), unique=True, index=True)
    date = Column(Date, nullable=False)
    ibpo_number = Column(String(100), index=True)
    ibpo_date = Column(Date, nullable=True)
    party_name = Column(String(255))
    quality = Column(String(255))
    order_mtr = Column(Numeric(12, 2), default=0)
    fabric_type = Column(String(100))
    order_type = Column(String(100))
    merchandiser = Column(String(255))
    net_amount = Column(Numeric(12, 2), default=0)

    entries = relationship("OrderExpenseEntry", back_populates="expense", cascade="all, delete-orphan")


class OrderExpenseEntry(Base):
    __tablename__ = "order_expense_entries"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("order_expenses.id", ondelete="CASCADE"))
    expense_type = Column(String(150))
    remarks = Column(String(255))
    quantity = Column(Numeric(12, 2), default=0)
    unit = Column(String(50))
    rate = Column(Numeric(12, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    expense = relationship("OrderExpense", back_populates="entries")
