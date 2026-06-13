from sqlalchemy import Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base
from typing import Optional


class UnitOfMeasure(Base):
    __tablename__ = "units_of_measure"
    id: Mapped[int]                   = mapped_column(Integer, primary_key=True, index=True)
    symbol: Mapped[str]               = mapped_column(String, nullable=False)
    formal_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    company_id: Mapped[int]           = mapped_column(Integer, ForeignKey("companies.id"))


class StockGroup(Base):
    __tablename__ = "stock_groups"
    id: Mapped[int]                  = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str]                = mapped_column(String, nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("stock_groups.id"), nullable=True)
    company_id: Mapped[int]          = mapped_column(Integer, ForeignKey("companies.id"))


class StockCategory(Base):
    __tablename__ = "stock_categories"
    id: Mapped[int]                  = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str]                = mapped_column(String, nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("stock_categories.id"), nullable=True)
    is_active: Mapped[bool]          = mapped_column(Boolean, default=True)
    company_id: Mapped[int]          = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)


class Location(Base):
    __tablename__ = "locations"
    id: Mapped[int]                  = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str]                = mapped_column(String, nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("locations.id"), nullable=True)
    is_active: Mapped[bool]          = mapped_column(Boolean, default=True)
    company_id: Mapped[int]          = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)


