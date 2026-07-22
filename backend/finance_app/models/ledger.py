from sqlalchemy import Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from finance_app.database import Base
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from finance_app.models.company import Company
    from finance_app.models.ledger_group import LedgerGroup
    from finance_app.models.voucher import VoucherEntry


class Ledger(Base):
    __tablename__ = "ledgers"

    id: Mapped[int]               = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str]             = mapped_column(String, nullable=False, index=True)
    alias: Mapped[Optional[str]]  = mapped_column(String)
    group: Mapped[str]            = mapped_column(String, nullable=False)
    group_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("ledger_groups.id"), nullable=True)
    # Opening balance
    opening_balance: Mapped[float] = mapped_column(Float, default=0.0)
    balance_type: Mapped[str]     = mapped_column(String, default="Dr")     # Dr or Cr
    # Party details
    party_type: Mapped[Optional[str]] = mapped_column(String)
    gstin: Mapped[Optional[str]]      = mapped_column(String)
    pan: Mapped[Optional[str]]        = mapped_column(String)
    address: Mapped[Optional[str]]    = mapped_column(Text)
    state_code: Mapped[Optional[str]] = mapped_column(String(2))
    pin_code: Mapped[Optional[str]]   = mapped_column(String)
    contact_number: Mapped[Optional[str]] = mapped_column(String)
    # Bank details
    bank_name: Mapped[Optional[str]]  = mapped_column(String)
    account_number: Mapped[Optional[str]] = mapped_column(String)
    ifsc_code: Mapped[Optional[str]]  = mapped_column(String)
    # Tax settings
    gst_registration_type: Mapped[str] = mapped_column(String, default="regular")
    default_gst_rate: Mapped[float]    = mapped_column(Float, default=0.0)
    hsn_sac_code: Mapped[Optional[str]] = mapped_column(String)
    # System flags
    is_active: Mapped[bool]        = mapped_column(Boolean, default=True)
    is_system: Mapped[bool]        = mapped_column(Boolean, default=False)
    company_id: Mapped[int]        = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)

    company: Mapped["Company"]   = relationship("Company", back_populates="ledgers")
    group_obj: Mapped[Optional["LedgerGroup"]] = relationship("LedgerGroup", back_populates="ledgers")
    entries: Mapped[List["VoucherEntry"]]   = relationship("VoucherEntry", back_populates="ledger")


