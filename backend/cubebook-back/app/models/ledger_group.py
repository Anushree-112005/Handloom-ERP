from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.ledger import Ledger


class LedgerGroup(Base):
    __tablename__ = "ledger_groups"

    id: Mapped[int]                     = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str]                   = mapped_column(String, nullable=False)
    parent_group: Mapped[Optional[str]] = mapped_column(String)
    parent_id: Mapped[Optional[int]]    = mapped_column(Integer, ForeignKey("ledger_groups.id"), nullable=True)
    nature: Mapped[Optional[str]]       = mapped_column(String)        # asset / liability / income / expense
    is_system: Mapped[bool]             = mapped_column(Boolean, default=False)
    company_id: Mapped[int]             = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="ledger_groups")
    parent: Mapped[Optional["LedgerGroup"]] = relationship("LedgerGroup", remote_side=[id], back_populates="children")
    children: Mapped[List["LedgerGroup"]] = relationship("LedgerGroup", back_populates="parent", foreign_keys=[parent_id])
    ledgers: Mapped[List["Ledger"]] = relationship("Ledger", back_populates="group_obj")
