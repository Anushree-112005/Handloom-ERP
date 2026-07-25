from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Store(Base):
    __tablename__ = "erp_stores"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    department = Column(String(100))
    store_type = Column(String(50), default="MAIN") # e.g., MAIN, DEPARTMENTAL
    parent_store_id = Column(Integer, ForeignKey("erp_stores.id"), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Self-referential relationship for store hierarchy
    parent_store = relationship("Store", remote_side=[id], backref="sub_stores")
