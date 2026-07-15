from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from app.core.database import Base

class CostingSheet(Base):
    __tablename__ = "costing_sheets"

    id = Column(Integer, primary_key=True, index=True)
    costing_no = Column(String(50), unique=True, index=True)
    buyer = Column(String(255))
    buyer_order = Column(String(100))
    sales_order = Column(String(100))
    product = Column(String(255))
    style_no = Column(String(100))
    fabric_type = Column(String(100))
    fabric_construction = Column(String(255))
    gsm = Column(String(50))
    width = Column(String(50))
    color = Column(String(100))
    quantity = Column(Numeric(12, 2))
    unit = Column(String(20))
    delivery_date = Column(Date)
    currency = Column(String(10), default="INR")
    exchange_rate = Column(Numeric(10, 4), default=1)
    remarks = Column(Text)

    status = Column(String(50), default="Draft")
    prepared_by = Column(String(150))
    reviewed_by = Column(String(150))
    approved_by = Column(String(150))
    approval_date = Column(Date)
    comments = Column(Text)
    approval_history = Column(JSON, default=list)

    bom_items = Column(JSON, default=list)
    process_costs = Column(JSON, default=list)
    labour_costs = Column(JSON, default=list)
    machine_costs = Column(JSON, default=list)
    overhead_costs = Column(JSON, default=list)
    logistics_packing = Column(JSON, default=dict)
    testing_costs = Column(JSON, default=list)
    wastage = Column(JSON, default=list)

    estimated_cost = Column(Numeric(15, 2), default=0)
    actual_cost = Column(Numeric(15, 2), default=0)
    selling_price = Column(Numeric(15, 2), default=0)
    profit_margin_pct = Column(Numeric(5, 2), default=0)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
