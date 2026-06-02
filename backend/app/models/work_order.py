from sqlalchemy import Column, Integer, String, Date, JSON
from app.core.database import Base

class WorkOrderTransaction(Base):
    __tablename__ = "work_order_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_no = Column(String, unique=True, index=True, nullable=False)
    module_type = Column(String, index=True, nullable=False)  # e.g., 'design_create', 'short_amd'
    date = Column(Date, nullable=False)
    buyer_name = Column(String, nullable=True)
    status = Column(String, default="Active")
    details = Column(JSON, default=dict)  # All dynamic fields
