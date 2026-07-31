from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class CostingSheet(Base):
    __tablename__ = "costing_sheets"

    id = Column(Integer, primary_key=True, index=True)
    costing_no = Column(String(50), unique=True, index=True)
    buyer = Column(String(255))
    buyer_order = Column(String(100))
    construction = Column(String(255))
    costing_date = Column(Date)
    po_quantity = Column(Numeric(12, 2), default=0)
    
    status = Column(String(50), default="Draft")
    prepared_by = Column(String(150))
    reviewed_by = Column(String(150))
    approved_by = Column(String(150))
    approval_date = Column(Date)
    comments = Column(Text)
    
    estimated_cost = Column(Numeric(15, 2), default=0)
    actual_cost = Column(Numeric(15, 2), default=0)
    selling_price = Column(Numeric(15, 2), default=0)
    profit_margin_pct = Column(Numeric(5, 2), default=0)
    profit_value = Column(Numeric(15, 2), default=0)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    construction_details = relationship("CostingConstruction", back_populates="costing_sheet", uselist=False, cascade="all, delete-orphan")
    yarn_lines = relationship("CostingYarnLine", back_populates="costing_sheet", cascade="all, delete-orphan")
    warping_details = relationship("CostingWarping", back_populates="costing_sheet", uselist=False, cascade="all, delete-orphan")
    washing_details = relationship("CostingWashing", back_populates="costing_sheet", uselist=False, cascade="all, delete-orphan")
    summary = relationship("CostingSummary", back_populates="costing_sheet", uselist=False, cascade="all, delete-orphan")


class CostingConstruction(Base):
    __tablename__ = "costing_construction"

    id = Column(Integer, primary_key=True, index=True)
    costing_sheet_id = Column(Integer, ForeignKey("costing_sheets.id", ondelete="CASCADE"))
    
    warp_count_1 = Column(String(50))
    warp_count_2 = Column(String(50))
    warp_rate_1 = Column(Numeric(10, 2), default=0)
    warp_rate_2 = Column(Numeric(10, 2), default=0)
    warp_crimp_pct = Column(Numeric(5, 2), default=0)
    seer = Column(Numeric(10, 2), default=0)
    
    weft_count = Column(String(50))
    weft_rate = Column(Numeric(10, 2), default=0)
    weft_crimp_pct = Column(Numeric(5, 2), default=0)
    
    finish_epi = Column(Numeric(10, 2), default=0)
    finish_ppi = Column(Numeric(10, 2), default=0)
    finish_width = Column(Numeric(10, 2), default=0)
    
    greige_epi = Column(Numeric(10, 2), default=0)
    greige_width = Column(Numeric(10, 2), default=0)
    reed = Column(Numeric(10, 2), default=0)
    reed_space = Column(Numeric(10, 2), default=0)
    
    total_ends = Column(Numeric(10, 2), default=0)
    weft_length = Column(Numeric(10, 2), default=0)
    warp_glm = Column(Numeric(10, 2), default=0)
    weft_glm = Column(Numeric(10, 2), default=0)
    gsm = Column(Numeric(10, 2), default=0)
    oz_yd2 = Column(Numeric(10, 2), default=0)
    
    costing_sheet = relationship("CostingSheet", back_populates="construction_details")

class CostingYarnLine(Base):
    __tablename__ = "costing_yarn_lines"

    id = Column(Integer, primary_key=True, index=True)
    costing_sheet_id = Column(Integer, ForeignKey("costing_sheets.id", ondelete="CASCADE"))
    
    yarn_type = Column(String(50)) # Warp 1, Warp 2, Weft
    color = Column(String(100))
    percentage = Column(Numeric(5, 2), default=0)
    ends_picks = Column(Numeric(10, 2), default=0)
    rate = Column(Numeric(10, 2), default=0)
    dy_wt = Column(Numeric(10, 4), default=0)
    dwl = Column(Numeric(10, 4), default=0)
    wastage_pct = Column(Numeric(5, 2), default=0)
    rem = Column(Numeric(10, 4), default=0)
    rv = Column(Numeric(10, 4), default=0)
    ttl_kg = Column(Numeric(10, 4), default=0)
    rate_kg = Column(Numeric(10, 2), default=0)
    cost_m = Column(Numeric(10, 2), default=0)
    
    costing_sheet = relationship("CostingSheet", back_populates="yarn_lines")

class CostingWarping(Base):
    __tablename__ = "costing_warping"

    id = Column(Integer, primary_key=True, index=True)
    costing_sheet_id = Column(Integer, ForeignKey("costing_sheets.id", ondelete="CASCADE"))
    
    warping_rate_1 = Column(Numeric(10, 2), default=0)
    warping_rate_2 = Column(Numeric(10, 2), default=0)
    sizing_rate_1 = Column(Numeric(10, 2), default=0)
    sizing_rate_2 = Column(Numeric(10, 2), default=0)
    pick_rate = Column(Numeric(10, 2), default=0)
    
    warping_cost = Column(Numeric(10, 2), default=0)
    sizing_cost = Column(Numeric(10, 2), default=0)
    weaving_cost = Column(Numeric(10, 2), default=0)
    actual_weaving_cost = Column(Numeric(10, 2), default=0)
    
    costing_sheet = relationship("CostingSheet", back_populates="warping_details")

class CostingWashing(Base):
    __tablename__ = "costing_washing"

    id = Column(Integer, primary_key=True, index=True)
    costing_sheet_id = Column(Integer, ForeignKey("costing_sheets.id", ondelete="CASCADE"))
    
    wash_type = Column(String(100))
    rate = Column(Numeric(10, 2), default=0)
    shrinkage_pct = Column(Numeric(5, 2), default=0)
    
    washing_cost = Column(Numeric(10, 2), default=0)
    washed_fabric_cost = Column(Numeric(10, 2), default=0)
    
    costing_sheet = relationship("CostingSheet", back_populates="washing_details")

class CostingSummary(Base):
    __tablename__ = "costing_summary"

    id = Column(Integer, primary_key=True, index=True)
    costing_sheet_id = Column(Integer, ForeignKey("costing_sheets.id", ondelete="CASCADE"))
    
    unwash_fabric_cost = Column(Numeric(10, 2), default=0)
    washed_fabric_cost = Column(Numeric(10, 2), default=0)
    
    greige_yarn_cost = Column(Numeric(10, 2), default=0)
    dyed_yarn_cost = Column(Numeric(10, 2), default=0)
    warping_cost = Column(Numeric(10, 2), default=0)
    sizing_cost = Column(Numeric(10, 2), default=0)
    weaving_cost = Column(Numeric(10, 2), default=0)
    washing_cost = Column(Numeric(10, 2), default=0)
    
    greige_quantity = Column(Numeric(10, 2), default=0)
    beam_quantity = Column(Numeric(10, 2), default=0)
    warp_1_beam = Column(Numeric(10, 2), default=0)
    warp_2_beam = Column(Numeric(10, 2), default=0)
    
    costing_sheet = relationship("CostingSheet", back_populates="summary")
