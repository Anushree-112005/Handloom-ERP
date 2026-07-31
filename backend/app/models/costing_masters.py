from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Boolean, func
from app.core.database import Base

class YarnRateMaster(Base):
    __tablename__ = "yarn_rate_master"

    id = Column(Integer, primary_key=True, index=True)
    yarn_count = Column(String(100), index=True)
    color = Column(String(100))
    rate_per_kg = Column(Numeric(10, 2), default=0)
    effective_date = Column(Date)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class WashTypeMaster(Base):
    __tablename__ = "wash_type_master"

    id = Column(Integer, primary_key=True, index=True)
    wash_type = Column(String(100), index=True)
    rate_per_m = Column(Numeric(10, 2), default=0)
    shrinkage_pct = Column(Numeric(5, 2), default=0)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class ConstructionMaster(Base):
    __tablename__ = "construction_master"

    id = Column(Integer, primary_key=True, index=True)
    construction = Column(String(255), unique=True, index=True)
    warp = Column(String(100))
    weft = Column(String(100))
    epi = Column(Numeric(10, 2), default=0)
    ppi = Column(Numeric(10, 2), default=0)
    width = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class WastageMaster(Base):
    __tablename__ = "wastage_master"

    id = Column(Integer, primary_key=True, index=True)
    count = Column(String(100), unique=True, index=True)
    default_wastage = Column(Numeric(5, 2), default=0)
    default_dwl = Column(Numeric(5, 2), default=0)
    crimp = Column(Numeric(5, 2), default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
