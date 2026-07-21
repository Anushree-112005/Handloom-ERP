from sqlalchemy import Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from finance_app.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from finance_app.models.company import Company

class GSTRegistration(Base):
    __tablename__ = "gst_registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    
    state_code: Mapped[str] = mapped_column(String(2), nullable=False)
    state_name: Mapped[str] = mapped_column(String, nullable=False)
    gstin: Mapped[str] = mapped_column(String, nullable=False)
    registration_type: Mapped[str] = mapped_column(String, default="Regular") # Regular, Composition
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    
    company: Mapped["Company"] = relationship("Company")

class GSTClassification(Base):
    __tablename__ = "gst_classifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    
    name: Mapped[str] = mapped_column(String, nullable=False)
    hsn_sac: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    
    cgst_rate: Mapped[float] = mapped_column(Float, default=2.5)
    sgst_rate: Mapped[float] = mapped_column(Float, default=2.5)
    igst_rate: Mapped[float] = mapped_column(Float, default=5.0)
    
    company: Mapped["Company"] = relationship("Company")
