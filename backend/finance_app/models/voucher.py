from sqlalchemy import Integer, String, Float, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from finance_app.database import Base
from datetime import date as py_date
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from finance_app.models.company import Company
    from finance_app.models.ledger import Ledger


class Voucher(Base):
    __tablename__ = "vouchers"

    id: Mapped[int]                     = mapped_column(Integer, primary_key=True, index=True)
    voucher_number: Mapped[str]         = mapped_column(String, nullable=False, index=True)
    voucher_type: Mapped[str]           = mapped_column(String, nullable=False)
    # Types: Payment, Receipt, Journal, Sales, Purchase,
    #        Credit Note, Debit Note, Contra
    date: Mapped[py_date]                  = mapped_column(Date, nullable=False, index=True)
    narration: Mapped[Optional[str]]    = mapped_column(Text)
    reference_no: Mapped[Optional[str]] = mapped_column(String)
    reference_date: Mapped[Optional[py_date]] = mapped_column(Date)
    status: Mapped[str]                 = mapped_column(String, default="Posted")   # Draft / Posted / Cancelled
    total_amount: Mapped[float]         = mapped_column(Float, default=0.0)
    is_optional: Mapped[bool]           = mapped_column(Boolean, default=False)
    company_id: Mapped[int]             = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    fy_id: Mapped[Optional[int]]        = mapped_column(Integer, ForeignKey("financial_years.id"), nullable=True)

    entries: Mapped[List["VoucherEntry"]] = relationship("VoucherEntry", back_populates="voucher",
                           cascade="all, delete-orphan")
    company: Mapped["Company"] = relationship("Company", back_populates="vouchers")


class VoucherEntry(Base):
    __tablename__ = "voucher_entries"

    id: Mapped[int]                      = mapped_column(Integer, primary_key=True, index=True)
    voucher_id: Mapped[int]              = mapped_column(Integer, ForeignKey("vouchers.id"), nullable=False)
    ledger_id: Mapped[Optional[int]]     = mapped_column(Integer, ForeignKey("ledgers.id"), nullable=True)
    ledger_name: Mapped[Optional[str]]   = mapped_column(String)
    dr_amount: Mapped[float]             = mapped_column(Float, default=0.0)
    cr_amount: Mapped[float]             = mapped_column(Float, default=0.0)
    # GST
    gst_rate: Mapped[float]              = mapped_column(Float, default=0.0)
    gst_type: Mapped[Optional[str]]      = mapped_column(String)        # CGST / SGST / IGST / None
    is_gst_entry: Mapped[bool]           = mapped_column(Boolean, default=False)
    # Stock (for Sales/Purchase)
    stock_item_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("stock_items.id"), nullable=True)
    stock_item_name: Mapped[Optional[str]] = mapped_column(String)
    qty: Mapped[Optional[float]]         = mapped_column(Float)
    rate: Mapped[Optional[float]]        = mapped_column(Float)
    cost_centre: Mapped[Optional[str]]   = mapped_column(String)
    location_id: Mapped[Optional[int]]   = mapped_column(Integer, ForeignKey("locations.id"), nullable=True)
    location_name: Mapped[Optional[str]] = mapped_column(String)

    voucher: Mapped["Voucher"] = relationship("Voucher", back_populates="entries")
    ledger: Mapped[Optional["Ledger"]]  = relationship("Ledger", back_populates="entries")


