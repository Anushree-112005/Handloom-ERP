from sqlalchemy import Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from finance_app.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from finance_app.models.company import Company

class Currency(Base):
    __tablename__ = "currencies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    iso_code: Mapped[str] = mapped_column(String, nullable=False)
    exchange_rate: Mapped[float] = mapped_column(Float, default=1.0)
    is_base: Mapped[bool] = mapped_column(Boolean, default=False)
    
    company: Mapped["Company"] = relationship("Company")
