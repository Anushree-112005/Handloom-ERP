from sqlalchemy import Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.company import Company


class StockItem(Base):
    __tablename__ = "stock_items"

    id: Mapped[int]                   = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str]                 = mapped_column(String, nullable=False)
    unit: Mapped[Optional[str]]       = mapped_column(String)          # Nos, Kg, Ltr, Mtrs, Box
    hsn_code: Mapped[Optional[str]]   = mapped_column(String)
    gst_rate: Mapped[float]           = mapped_column(Float, default=18.0)
    purchase_rate: Mapped[float]      = mapped_column(Float, default=0.0)
    selling_rate: Mapped[float]       = mapped_column(Float, default=0.0)
    opening_qty: Mapped[float]        = mapped_column(Float, default=0.0)
    opening_rate: Mapped[float]       = mapped_column(Float, default=0.0)
    is_active: Mapped[bool]           = mapped_column(Boolean, default=True)
    company_id: Mapped[int]           = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="stock_items")


