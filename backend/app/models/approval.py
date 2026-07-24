"""Generic Approval model for various entity workflows."""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(100), index=True, nullable=False)  # e.g., 'BuyerOrder', 'SalesInvoice', 'GoodsRelease'
    entity_id = Column(String(100), index=True, nullable=False)    # ID or string ref of the record
    approval_type = Column(String(100), nullable=False)            # e.g., 'PI Approval', 'DC Approval'
    status = Column(String(50), default="Pending")                 # Pending, Approved, Rejected
    
    # User / Role details
    requested_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    approved_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    required_role = Column(String(100), nullable=True)             # e.g., 'Dispatch Manager', 'Production Manager'

    comments = Column(Text, nullable=True)
    extra_data = Column(JSON, default=dict)                        # Store snapshot or extra approval payload
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    requested_by = relationship("Employee", foreign_keys=[requested_by_id], backref="requested_approvals")
    approved_by = relationship("Employee", foreign_keys=[approved_by_id], backref="actioned_approvals")
