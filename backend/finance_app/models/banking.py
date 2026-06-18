from sqlalchemy import Integer, String, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from finance_app.database import Base
from datetime import date, datetime, timezone
from typing import Optional


class BankReconciliation(Base):
    __tablename__ = "bank_reconciliations"

    id: Mapped[int]                        = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int]               = mapped_column(Integer, nullable=False, index=True)
    voucher_id: Mapped[int]               = mapped_column(Integer, ForeignKey("vouchers.id"), nullable=False)
    bank_ledger_id: Mapped[int]           = mapped_column(Integer, ForeignKey("ledgers.id"), nullable=False)
    bank_date: Mapped[date]               = mapped_column(Date, nullable=False)
    reconciled_at: Mapped[datetime]       = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    reconciled_by: Mapped[str]            = mapped_column(String, default="system")
    notes: Mapped[Optional[str]]          = mapped_column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint('voucher_id', 'bank_ledger_id', name='uq_voucher_bank'),
    )
