"""General Master for dynamic dropdown options."""
from sqlalchemy import Column, Integer, String
from app.core.database import Base

class GeneralMaster(Base):
    __tablename__ = "general_master"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), index=True, nullable=False)
    value = Column(String(100), nullable=False)
