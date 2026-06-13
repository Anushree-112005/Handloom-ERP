from sqlalchemy import Integer, String, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base
from datetime import datetime, timezone, date
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ledger_group import LedgerGroup
    from app.models.ledger import Ledger
    from app.models.stock_item import StockItem
    from app.models.voucher import Voucher



class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int]                  = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str]                = mapped_column(String, nullable=False, unique=True)
    legal_name: Mapped[Optional[str]] = mapped_column(String)
    gstin: Mapped[Optional[str]]      = mapped_column(String)
    pan: Mapped[Optional[str]]        = mapped_column(String)
    state_code: Mapped[Optional[str]] = mapped_column(String(2))
    address: Mapped[Optional[str]]    = mapped_column(String)
    city: Mapped[Optional[str]]       = mapped_column(String)
    pincode: Mapped[Optional[str]]    = mapped_column(String)
    phone: Mapped[Optional[str]]      = mapped_column(String)
    email: Mapped[Optional[str]]      = mapped_column(String)
    base_currency: Mapped[str]       = mapped_column(String, default="INR")
    maintain_accounts: Mapped[bool]   = mapped_column(Boolean, default=True)
    maintain_inventory: Mapped[bool]  = mapped_column(Boolean, default=False)
    is_active: Mapped[bool]           = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime]      = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    financial_years: Mapped[List["FinancialYear"]] = relationship("FinancialYear", back_populates="company", cascade="all, delete-orphan")
    ledger_groups: Mapped[List["LedgerGroup"]]   = relationship("LedgerGroup", back_populates="company", cascade="all, delete-orphan")
    ledgers: Mapped[List["Ledger"]]         = relationship("Ledger", back_populates="company", cascade="all, delete-orphan")
    stock_items: Mapped[List["StockItem"]]     = relationship("StockItem", back_populates="company", cascade="all, delete-orphan")
    vouchers: Mapped[List["Voucher"]]        = relationship("Voucher", back_populates="company", cascade="all, delete-orphan")


class FinancialYear(Base):
    __tablename__ = "financial_years"

    id: Mapped[int]          = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int]  = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date]   = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    is_closed: Mapped[bool]  = mapped_column(Boolean, default=False)

    company: Mapped[Company] = relationship("Company", back_populates="financial_years")
