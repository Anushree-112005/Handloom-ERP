from sqlalchemy import Column, Integer, String, DateTime, func
from app.core.database import Base

class CompanySetting(Base):
    __tablename__ = "company_setting"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200), nullable=False)
    description = Column(String)  # Holds description/subtitle (e.g. THE HOUSE OF FABRICS)
    logo = Column(String)  # Holds base64 string or URL
    address = Column(String)
    email = Column(String(100))
    phone = Column(String(50))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
