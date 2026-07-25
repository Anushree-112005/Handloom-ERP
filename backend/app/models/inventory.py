from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Enum, BIGINT, DECIMAL, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class StockLedger(Base):
    __tablename__ = "stock_ledger"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    txn_date = Column(Date, nullable=False, default=datetime.utcnow)
    stock_item_id = Column(Integer, nullable=False) # FK to finance_app.stock_items
    lot_no = Column(String(50), index=True, nullable=True)
    design_id = Column(Integer, nullable=True) # FK to design_entries
    ibpo_id = Column(Integer, index=True, nullable=True) # FK to buyer_orders
    party_id = Column(Integer, nullable=True) # FK to party_master
    godown_id = Column(Integer, nullable=True)
    status = Column(Enum('AVAILABLE','AT_JOB_WORK','IN_TRANSIT','RESERVED','HOLD_REJECTED','SOLD','SURPLUS', name='stock_ledger_status_enum'), nullable=False)
    movement_type = Column(Enum('INWARD','OUTWARD','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT_IN','ADJUSTMENT_OUT', name='stock_ledger_movement_type_enum'), nullable=False)
    qty = Column(DECIMAL(14,3), nullable=False)
    uom = Column(String(10), nullable=True)
    rate = Column(DECIMAL(12,2), nullable=True)
    value = Column(DECIMAL(14,2), nullable=True)
    ref_voucher_type = Column(String(40), nullable=True)
    ref_voucher_no = Column(String(40), nullable=True)
    grade = Column(Enum('A','B','C','REJECT', name='stock_ledger_grade_enum'), nullable=True)
    remarks = Column(String(255), nullable=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class StockBalance(Base):
    __tablename__ = "stock_balance"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    stock_item_id = Column(Integer, nullable=False)
    godown_id = Column(Integer, nullable=True)
    status = Column(Enum('AVAILABLE','AT_JOB_WORK','IN_TRANSIT','RESERVED','HOLD_REJECTED','SOLD','SURPLUS', name='stock_balance_status_enum'), nullable=False)
    closing_qty = Column(DECIMAL(14,3), default=0.0)
    closing_value = Column(DECIMAL(14,2), default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('stock_item_id', 'godown_id', 'status', name='uq_stock_balance'),
    )

class LotReconciliation(Base):
    __tablename__ = "lot_reconciliation"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    lot_no = Column(String(50), unique=True, nullable=False)
    ibpo_id = Column(Integer, nullable=True)
    design_id = Column(Integer, nullable=True)
    expected_qty = Column(DECIMAL(14,3), default=0.0)
    yarn_inward_qty = Column(DECIMAL(14,3), default=0.0)
    dyed_yarn_qty = Column(DECIMAL(14,3), default=0.0)
    warped_qty = Column(DECIMAL(14,3), default=0.0)
    sized_qty = Column(DECIMAL(14,3), default=0.0)
    grey_fabric_qty = Column(DECIMAL(14,3), default=0.0)
    finished_fabric_qty = Column(DECIMAL(14,3), default=0.0)
    total_loss_pct = Column(DECIMAL(5,2), default=0.0)
    status = Column(Enum('IN_PROGRESS','RECONCILED','VARIANCE_FLAGGED', name='lot_recon_status_enum'), default='IN_PROGRESS')
    reconciled_by = Column(Integer, nullable=True)
    reconciled_at = Column(DateTime, nullable=True)

class SurplusStock(Base):
    __tablename__ = "surplus_stock"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    stock_item_id = Column(Integer, nullable=False)
    source_lot_no = Column(String(50), nullable=True)
    source_ibpo_id = Column(Integer, nullable=True)
    qty = Column(DECIMAL(14,3), default=0.0)
    rate = Column(DECIMAL(12,2), default=0.0)
    reason = Column(Enum('EXCESS_PRODUCTION','ORDER_CANCELLED','QC_REJECT_RESALE', name='surplus_reason_enum'), nullable=True)
    status = Column(Enum('IN_STOCK','SOLD','SCRAPPED', name='surplus_status_enum'), default='IN_STOCK')
    opening_date = Column(Date, default=datetime.utcnow)
    aging_days = Column(Integer, default=0)

class SparesStock(Base):
    __tablename__ = "spares_stock"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    spare_id = Column(Integer, nullable=False) # FK to stock_item
    txn_date = Column(Date, default=datetime.utcnow)
    movement_type = Column(Enum('INWARD','ISSUE', name='spares_movement_enum'), nullable=False)
    qty = Column(DECIMAL(14,3), nullable=False)
    issued_to_machine_id = Column(Integer, nullable=True)
    issued_to_department = Column(String(100), nullable=True)
    remarks = Column(String(255), nullable=True)

class StockAudit(Base):
    __tablename__ = "stock_audit"
    
    id = Column(BIGINT, primary_key=True, autoincrement=True)
    audit_date = Column(Date, default=datetime.utcnow)
    stock_item_id = Column(Integer, nullable=False)
    godown_id = Column(Integer, nullable=True)
    system_qty = Column(DECIMAL(14,3), default=0.0)
    physical_qty = Column(DECIMAL(14,3), default=0.0)
    variance_qty = Column(DECIMAL(14,3), default=0.0)
    variance_reason = Column(String(255), nullable=True)
    adjustment_voucher_no = Column(String(40), nullable=True)
    audited_by = Column(Integer, nullable=True)
    status = Column(Enum('PENDING','ADJUSTED', name='stock_audit_status_enum'), default='PENDING')
