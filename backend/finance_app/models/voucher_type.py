from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from finance_app.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from finance_app.models.company import Company

class VoucherType(Base):
    __tablename__ = "voucher_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    
    name: Mapped[str] = mapped_column(String, nullable=False)
    parent_type: Mapped[str] = mapped_column(String, nullable=False) # e.g. "Purchase", "Sales"
    
    numbering_method: Mapped[str] = mapped_column(String, default="Automatic") # Automatic, Manual, None
    prefix: Mapped[str] = mapped_column(String, nullable=True)
    suffix: Mapped[str] = mapped_column(String, nullable=True)
    starting_number: Mapped[int] = mapped_column(Integer, default=1)
    
    inventory_affected: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    company: Mapped["Company"] = relationship("Company")
