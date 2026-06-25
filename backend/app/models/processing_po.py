from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProcessingPO(Base):
    __tablename__ = "processing_pos"

    id = Column(Integer, primary_key=True, index=True)
    po_s_no = Column(String(50))
    po_date = Column(Date, nullable=False)
    party_name = Column(String(150))
    po_no = Column(String(50), unique=True, index=True, nullable=False)
    delivery_date = Column(Date)
    
    merchandiser = Column(String(100))
    merchandiser_ext = Column(String(100))
    fob_point = Column(String(100))
    glm = Column(String(50))
    
    process_sequence = Column(String(200))
    process_sequence_ext = Column(String(200))
    grey_rate = Column(Numeric(12, 2), default=0)
    
    order_type = Column(String(100))
    order_type_ext = Column(String(100))
    
    status = Column(String(20), default="Active")

    total_mtr = Column(Numeric(12, 2), default=0)
    gross_amt = Column(Numeric(12, 2), default=0)
    
    tax_type = Column(String(50))
    cgst = Column(Numeric(12, 2), default=0)
    sgst = Column(Numeric(12, 2), default=0)
    igst = Column(Numeric(12, 2), default=0)
    total_gst = Column(Numeric(12, 2), default=0)
    
    payment = Column(String(100))
    packing = Column(String(100))
    ship_pack_chg = Column(Numeric(12, 2), default=0)
    add_other = Column(Numeric(12, 2), default=0)
    tax_value = Column(Numeric(12, 2), default=0)
    
    delivery_instruction = Column(Text)
    round_off = Column(Numeric(12, 2), default=0)
    net_amount = Column(Numeric(12, 2), default=0)
    remarks = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("ProcessingPOItem", back_populates="po", cascade="all, delete-orphan")

class ProcessingPOItem(Base):
    __tablename__ = "processing_po_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("processing_pos.id", ondelete="CASCADE"), nullable=False)
    
    design_no = Column(String(100))
    ibpo_no = Column(String(100))
    fabric_construction = Column(String(200))
    colour_process = Column(String(100))
    mtr = Column(Numeric(12, 2), default=0)
    kgs = Column(Numeric(12, 3), default=0)
    rate = Column(Numeric(12, 2), default=0)
    amount = Column(Numeric(12, 2), default=0)

    po = relationship("ProcessingPO", back_populates="items")
