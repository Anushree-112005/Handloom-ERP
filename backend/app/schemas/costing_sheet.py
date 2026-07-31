from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# Construction
class CostingConstructionBase(BaseModel):
    warp_count_1: Optional[str] = None
    warp_count_2: Optional[str] = None
    warp_rate_1: float = 0
    warp_rate_2: float = 0
    warp_crimp_pct: float = 0
    seer: float = 0
    
    weft_count: Optional[str] = None
    weft_rate: float = 0
    weft_crimp_pct: float = 0
    
    finish_epi: float = 0
    finish_ppi: float = 0
    finish_width: float = 0
    
    greige_epi: float = 0
    greige_width: float = 0
    reed: float = 0
    reed_space: float = 0
    
    total_ends: float = 0
    weft_length: float = 0
    warp_glm: float = 0
    weft_glm: float = 0
    gsm: float = 0
    oz_yd2: float = 0

# Yarn Line
class CostingYarnLineBase(BaseModel):
    yarn_type: str # Warp 1, Warp 2, Weft
    color: str
    percentage: float = 0
    ends_picks: float = 0
    rate: float = 0
    dy_wt: float = 0
    dwl: float = 0
    wastage_pct: float = 0
    rem: float = 0
    rv: float = 0
    ttl_kg: float = 0
    rate_kg: float = 0
    cost_m: float = 0

# Warping
class CostingWarpingBase(BaseModel):
    warping_rate_1: float = 0
    warping_rate_2: float = 0
    sizing_rate_1: float = 0
    sizing_rate_2: float = 0
    pick_rate: float = 0
    warping_cost: float = 0
    sizing_cost: float = 0
    weaving_cost: float = 0
    actual_weaving_cost: float = 0

# Washing
class CostingWashingBase(BaseModel):
    wash_type: Optional[str] = None
    rate: float = 0
    shrinkage_pct: float = 0
    washing_cost: float = 0
    washed_fabric_cost: float = 0

# Summary
class CostingSummaryBase(BaseModel):
    unwash_fabric_cost: float = 0
    washed_fabric_cost: float = 0
    greige_yarn_cost: float = 0
    dyed_yarn_cost: float = 0
    warping_cost: float = 0
    sizing_cost: float = 0
    weaving_cost: float = 0
    washing_cost: float = 0
    greige_quantity: float = 0
    beam_quantity: float = 0
    warp_1_beam: float = 0
    warp_2_beam: float = 0

# Main Costing Sheet
class CostingSheetBase(BaseModel):
    buyer: Optional[str] = None
    buyer_order: Optional[str] = None
    construction: Optional[str] = None
    costing_date: Optional[date] = None
    po_quantity: float = 0
    status: str = "Draft"
    estimated_cost: float = 0
    actual_cost: float = 0
    selling_price: float = 0
    profit_margin_pct: float = 0
    profit_value: float = 0

class CostingSheetCreate(CostingSheetBase):
    costing_no: Optional[str] = None
    construction_details: Optional[CostingConstructionBase] = None
    yarn_lines: Optional[List[CostingYarnLineBase]] = []
    warping_details: Optional[CostingWarpingBase] = None
    washing_details: Optional[CostingWashingBase] = None
    summary: Optional[CostingSummaryBase] = None

class CostingSheetUpdate(CostingSheetBase):
    construction_details: Optional[CostingConstructionBase] = None
    yarn_lines: Optional[List[CostingYarnLineBase]] = []
    warping_details: Optional[CostingWarpingBase] = None
    washing_details: Optional[CostingWashingBase] = None
    summary: Optional[CostingSummaryBase] = None
    status: Optional[str] = None
    actual_cost: Optional[float] = None

class CostingSheetOut(CostingSheetBase):
    id: int
    costing_no: str
    created_at: datetime
    updated_at: datetime
    
    construction_details: Optional[CostingConstructionBase] = None
    yarn_lines: Optional[List[CostingYarnLineBase]] = []
    warping_details: Optional[CostingWarpingBase] = None
    washing_details: Optional[CostingWashingBase] = None
    summary: Optional[CostingSummaryBase] = None

    class Config:
        from_attributes = True
