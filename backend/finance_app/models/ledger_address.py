from sqlalchemy import Integer, String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from finance_app.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from finance_app.models.ledger import Ledger

class LedgerAddress(Base):
    __tablename__ = "ledger_addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ledger_id: Mapped[int] = mapped_column(Integer, ForeignKey("ledgers.id", ondelete="CASCADE"), nullable=False)
    
    address_type: Mapped[str] = mapped_column(String, default="Bill")  # Bill, Ship, Branch, Head Office
    alias: Mapped[Optional[str]] = mapped_column(String)  # Tally Alias (1, 2, 3)
    
    address: Mapped[Optional[str]] = mapped_column(Text)
    city: Mapped[Optional[str]] = mapped_column(String)
    district: Mapped[Optional[str]] = mapped_column(String)
    state: Mapped[Optional[str]] = mapped_column(String)
    state_code: Mapped[Optional[str]] = mapped_column(String)
    pin_code: Mapped[Optional[str]] = mapped_column(String)
    country: Mapped[Optional[str]] = mapped_column(String, default="India")
    sales_region: Mapped[Optional[str]] = mapped_column(String)
    
    gst_no: Mapped[Optional[str]] = mapped_column(String)
    pan_no: Mapped[Optional[str]] = mapped_column(String)
    contact_number: Mapped[Optional[str]] = mapped_column(String)
    contact_person: Mapped[Optional[str]] = mapped_column(String)

    ledger: Mapped["Ledger"] = relationship("Ledger", back_populates="addresses")
