"""
SubMaster — unified table for all Type-1 generic master entries.

Each row belongs to an 'entity' (e.g. "color_master", "unit_master").
The dynamic API and GenericMasterForm component both key off this entity name.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index
from sqlalchemy.sql import func
from app.core.database import Base


class SubMaster(Base):
    __tablename__ = "sub_masters"

    id = Column(Integer, primary_key=True, index=True)
    entity = Column(String(80), nullable=False, index=True)    # e.g. "color_master"
    name = Column(String(200), nullable=False)                  # Primary display value
    code = Column(String(50), nullable=True)                    # Optional short code
    description = Column(Text, nullable=True)                   # Optional notes
    extra_field_1 = Column(String(200), nullable=True)          # Configurable per entity
    extra_field_2 = Column(String(200), nullable=True)          # Configurable per entity
    extra_field_3 = Column(String(200), nullable=True)          # Configurable per entity
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_sub_masters_entity_name", "entity", "name"),
    )
