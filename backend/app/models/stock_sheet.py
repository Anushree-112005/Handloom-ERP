from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func, JSON
from app.core.database import Base

class StockSheetItem(Base):
    __tablename__ = "stock_sheet_items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(100), unique=True, index=True)
    item_name = Column(String(255))
    category = Column(String(100))
    material_type = Column(String(100))
    warehouse = Column(String(150))
    batch_no = Column(String(100))
    unit = Column(String(50))
    
    opening_stock = Column(Numeric(15, 2), default=0)
    stock_in = Column(Numeric(15, 2), default=0)
    stock_out = Column(Numeric(15, 2), default=0)
    current_stock = Column(Numeric(15, 2), default=0)
    reserved_stock = Column(Numeric(15, 2), default=0)
    available_stock = Column(Numeric(15, 2), default=0)
    reorder_level = Column(Numeric(15, 2), default=0)
    
    unit_cost = Column(Numeric(15, 2), default=0)
    stock_value = Column(Numeric(15, 2), default=0)
    last_transaction_date = Column(Date)
    
    status = Column(String(50), default="In Stock")
    
    # Detailed sub-tables stored as JSON
    stock_summary = Column(JSON, default=dict) # Opening, purchased, prod consumption, output, sales, dispatch, returns, adjustments, closing, available, reserved
    movements = Column(JSON, default=list) # [{date, type, ref_no, module, warehouse, in, out, balance, user}]
    batches = Column(JSON, default=list) # [{batch_no, mfg_date, exp_date, qty, warehouse, status}]
    valuation = Column(JSON, default=dict) # average_cost, standard_cost, current_value, total_value, last_purchase_rate, last_issue_rate
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
