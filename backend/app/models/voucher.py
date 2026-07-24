"""Voucher module models for accounting and inventory."""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Date, Enum as SQLEnum, Text, func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base

class LedgerNature(str, enum.Enum):
    ASSETS = "Assets"
    LIABILITIES = "Liabilities"
    INCOME = "Income"
    EXPENSES = "Expenses"

class BalanceType(str, enum.Enum):
    DR = "DR"
    CR = "CR"

class LedgerGroup(Base):
    __tablename__ = "ledger_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    parent_group_id = Column(Integer, ForeignKey("ledger_groups.id"), nullable=True)
    nature = Column(SQLEnum(LedgerNature), nullable=False)
    company_id = Column(Integer, nullable=True)

    sub_groups = relationship("LedgerGroup", backref="parent_group", remote_side=[id])
    ledgers = relationship("Ledger", back_populates="group")

class Ledger(Base):
    __tablename__ = "ledgers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    group_id = Column(Integer, ForeignKey("ledger_groups.id"), nullable=False)
    opening_balance = Column(Float, default=0.0)
    opening_balance_type = Column(SQLEnum(BalanceType), nullable=True)
    gstin = Column(String(15), nullable=True)
    company_id = Column(Integer, nullable=True)

    group = relationship("LedgerGroup", back_populates="ledgers")
    entries = relationship("VoucherEntry", back_populates="ledger")

class VoucherType(Base):
    __tablename__ = "voucher_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    prefix = Column(String(20), nullable=False)
    affects_stock = Column(Boolean, default=False)
    affects_accounts = Column(Boolean, default=True)

    vouchers = relationship("Voucher", back_populates="voucher_type")

class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    voucher_type_id = Column(Integer, ForeignKey("voucher_types.id"), nullable=False)
    voucher_number = Column(String(100), nullable=False, unique=True, index=True)
    voucher_date = Column(Date, nullable=False, index=True)
    reference_number = Column(String(100), nullable=True)
    narration = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0)
    company_id = Column(Integer, nullable=True)
    financial_year = Column(String(20), nullable=True)
    billing_address_id = Column(Integer, nullable=True)
    shipping_address_id = Column(Integer, nullable=True)
    is_cancelled = Column(Boolean, default=False)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    voucher_type = relationship("VoucherType", back_populates="vouchers")
    entries = relationship("VoucherEntry", back_populates="voucher", cascade="all, delete-orphan")
    item_entries = relationship("VoucherItemEntry", back_populates="voucher", cascade="all, delete-orphan")

class VoucherEntry(Base):
    __tablename__ = "voucher_entries"

    id = Column(Integer, primary_key=True, index=True)
    voucher_id = Column(Integer, ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False)
    ledger_id = Column(Integer, ForeignKey("ledgers.id"), nullable=False)
    debit_amount = Column(Float, default=0.0)
    credit_amount = Column(Float, default=0.0)
    bill_ref = Column(String(100), nullable=True)

    voucher = relationship("Voucher", back_populates="entries")
    ledger = relationship("Ledger", back_populates="entries")

class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    unit = Column(String(50), nullable=False)
    hsn_code = Column(String(20), nullable=True)
    gst_rate = Column(Float, default=0.0)
    company_id = Column(Integer, nullable=True)

    item_entries = relationship("VoucherItemEntry", back_populates="stock_item")

class VoucherItemEntry(Base):
    __tablename__ = "voucher_item_entries"

    id = Column(Integer, primary_key=True, index=True)
    voucher_id = Column(Integer, ForeignKey("vouchers.id", ondelete="CASCADE"), nullable=False)
    stock_item_id = Column(Integer, ForeignKey("stock_items.id"), nullable=False)
    godown_id = Column(Integer, nullable=True)
    quantity = Column(Float, default=0.0)
    rate = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

    voucher = relationship("Voucher", back_populates="item_entries")
    stock_item = relationship("StockItem", back_populates="item_entries")
