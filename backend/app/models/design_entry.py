from sqlalchemy import Column, Integer, String, Float, Date, DateTime, func
from app.core.database import Base

class DesignEntry(Base):
    __tablename__ = "design_entry"

    id = Column(Integer, primary_key=True, index=True)
    ds_ref_no = Column(String(50), unique=True, index=True, nullable=False)
    ds_date = Column(Date, nullable=False)
    design_no = Column(String(100), nullable=False)
    color = Column(String(100))
    created_by = Column(String(100))
    gry_const = Column(String(200))
    count_rxpxw = Column(String(100))
    buyer_name = Column(String(150))
    ibpo_no = Column(String(100))
    
    order_mtr = Column(Float, default=0.0)
    ex_mtr = Column(Float, default=0.0)
    total_mtr = Column(Float, default=0.0)
    crimp_pct = Column(Float, default=0.0)
    skg_pct = Column(Float, default=0.0)
    warp_mtr = Column(Float, default=0.0)
    weft_pro_mtr = Column(Float, default=0.0)
    gray_width = Column(Float, default=0.0)
    finish_width = Column(Float, default=0.0)
    reed_ol = Column(Float, default=0.0)
    pick_ot = Column(Float, default=0.0)
    reed = Column(Float, default=0.0)
    
    fabric = Column(String(100))
    total_ends = Column(Float, default=0.0)
    warp_width = Column(Float, default=0.0)
    qlm = Column(Float, default=0.0)
    toie_pct = Column(Float, default=0.0)
    selvage_waste = Column(Float, default=0.0)
    
    weaving = Column(String(100))
    design_type = Column(String(100))
    packing_less = Column(Float, default=0.0)
    weight_grm = Column(Float, default=0.0)
    dyeing_loss_pct = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
