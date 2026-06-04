"""
AI-Assisted Textile Design models.
Stores fabric designs with warp/weft grids, AI analysis results, and yarn requirements.
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, JSON, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class TextileDesign(Base):
    __tablename__ = "textile_designs"

    id = Column(Integer, primary_key=True, index=True)
    design_no = Column(String(100), unique=True, index=True, nullable=False)
    design_name = Column(String(200))
    status = Column(String(50), default="Draft")  # Draft, Verified, Approved

    # Design Header
    weave_type = Column(String(100))       # Plain, Twill, Satin, Dobby, Jacquard
    loom_width = Column(Float, default=0.0)
    finished_width = Column(Float, default=0.0)
    reed = Column(Float, default=0.0)
    pick = Column(Float, default=0.0)
    total_ends = Column(Float, default=0.0)
    total_picks = Column(Float, default=0.0)
    ppi = Column(Float, default=0.0)          # Picks per inch
    epi = Column(Float, default=0.0)          # Ends per inch
    fabric_length = Column(Float, default=0.0)  # in meters

    # AI Analysis Results
    image_path = Column(Text)
    ai_detected_weave = Column(String(100))
    ai_confidence = Column(Float, default=0.0)
    ai_color_clusters = Column(JSON, default=list)
    ai_stripe_repeat = Column(JSON, default=list)
    ai_fft_profile = Column(JSON, default=dict)
    ai_estimated_ends = Column(JSON, default=list)
    ai_analysis_status = Column(String(50))  # pending, completed, failed

    # Yarn Requirement Summary
    warp_kg = Column(Float, default=0.0)
    weft_kg = Column(Float, default=0.0)
    total_kg = Column(Float, default=0.0)

    # Wastage
    warp_wastage_pct = Column(Float, default=5.0)
    weft_wastage_pct = Column(Float, default=3.0)

    # Metadata
    created_by = Column(String(100))
    verified_by = Column(String(100))
    approved_by = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    warp_items = relationship("WarpDesignItem", back_populates="design", cascade="all, delete-orphan")
    weft_items = relationship("WeftDesignItem", back_populates="design", cascade="all, delete-orphan")


class WarpDesignItem(Base):
    __tablename__ = "warp_design_items"

    id = Column(Integer, primary_key=True, index=True)
    design_id = Column(Integer, ForeignKey("textile_designs.id", ondelete="CASCADE"), nullable=False)
    sno = Column(Integer)
    yarn_count = Column(String(100))   # e.g., "2/40S CTN"
    color = Column(String(100))
    threads = Column(Integer, default=0)
    ratio_pct = Column(Float, default=0.0)
    req_kg = Column(Float, default=0.0)

    design = relationship("TextileDesign", back_populates="warp_items")


class WeftDesignItem(Base):
    __tablename__ = "weft_design_items"

    id = Column(Integer, primary_key=True, index=True)
    design_id = Column(Integer, ForeignKey("textile_designs.id", ondelete="CASCADE"), nullable=False)
    sno = Column(Integer)
    yarn_count = Column(String(100))   # e.g., "30S Slub"
    color = Column(String(100))
    threads = Column(Integer, default=0)
    ratio_pct = Column(Float, default=0.0)
    req_kg = Column(Float, default=0.0)

    design = relationship("TextileDesign", back_populates="weft_items")
