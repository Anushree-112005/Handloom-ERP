from sqlalchemy import Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from finance_app.database import Base
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from finance_app.models.company import Company


class StockItem(Base):
    __tablename__ = "stock_items"

    id: Mapped[int]                   = mapped_column(Integer, primary_key=True, index=True)
    item_code: Mapped[Optional[str]]  = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str]                 = mapped_column(String, nullable=False)
    item_category: Mapped[str]        = mapped_column(String(50), default="CONSUMABLE") # YARN, GREIGE_FABRIC, FINISHED_FABRIC, SPARE, CONSUMABLE
    unit: Mapped[Optional[str]]       = mapped_column(String)          # Nos, Kg, Ltr, Mtrs, Box
    hsn_code: Mapped[Optional[str]]   = mapped_column(String)
    gst_rate: Mapped[float]           = mapped_column(Float, default=18.0)
    purchase_rate: Mapped[float]      = mapped_column(Float, default=0.0)
    selling_rate: Mapped[float]       = mapped_column(Float, default=0.0)
    opening_qty: Mapped[float]        = mapped_column(Float, default=0.0)
    opening_rate: Mapped[float]       = mapped_column(Float, default=0.0)
    yarn_form: Mapped[str]            = mapped_column(String(20), default="NA") # CONE, HANK, NA
    reorder_level: Mapped[float]      = mapped_column(Float, default=0.0)
    is_active: Mapped[bool]           = mapped_column(Boolean, default=True)
    company_id: Mapped[int]           = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="stock_items")


