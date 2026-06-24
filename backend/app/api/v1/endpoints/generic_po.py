from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.models.generic_po import GenericPurchaseOrder, GenericPurchaseOrderItem

router = APIRouter(prefix="/generic-po", tags=["Generic Purchase Orders"])

class GenericPurchaseOrderItemBase(BaseModel):
    yarn_count: Optional[str] = None
    colour: Optional[str] = None
    item_name: Optional[str] = None
    order_qty: Optional[float] = 0
    uom: Optional[str] = None
    delivery_date: Optional[date] = None
    rate: Optional[float] = 0
    amount: Optional[float] = 0

class GenericPurchaseOrderCreate(BaseModel):
    po_type: str
    po_no: Optional[str] = None
    po_date: Optional[date] = None
    org_name: Optional[str] = None
    internal_po_no: Optional[str] = None
    used_for: Optional[str] = None
    against_ref: Optional[str] = None
    agent_name: Optional[str] = None
    supplier_name: Optional[str] = None
    delivery_at: Optional[str] = None
    status: Optional[str] = "Active"
    packing_type: Optional[str] = None
    labeling: Optional[str] = None
    remarks: Optional[str] = None

    transport: Optional[str] = None
    freight_type: Optional[str] = None
    freight_chg: Optional[float] = 0
    insurance_chg: Optional[float] = 0
    total_order_kgs: Optional[float] = 0
    dispatch_date: Optional[date] = None
    due_days: Optional[int] = 0

    tax_type: Optional[str] = None
    taxable_amount: Optional[float] = 0
    sgst_pct: Optional[float] = 0
    cgst_pct: Optional[float] = 0
    igst_pct: Optional[float] = 0
    net_amount: Optional[float] = 0
    terms_conditions: Optional[List[str]] = []
    items: List[GenericPurchaseOrderItemBase] = []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_generic_po(data: GenericPurchaseOrderCreate, db: AsyncSession = Depends(get_db)):
    db_po = GenericPurchaseOrder(**data.model_dump(exclude={"items"}))
    
    if not db_po.po_no:
        q = select(GenericPurchaseOrder).order_by(desc(GenericPurchaseOrder.id))
        result = await db.execute(q)
        last_rec = result.scalars().first()
        new_id = (last_rec.id + 1) if last_rec else 1
        db_po.po_no = f"PO-{new_id:05d}"

    db.add(db_po)
    await db.commit()
    await db.refresh(db_po)

    for item_in in data.items:
        db_item = GenericPurchaseOrderItem(order_id=db_po.id, **item_in.model_dump())
        db.add(db_item)
    
    await db.commit()
    return {"id": db_po.id, "po_no": db_po.po_no, "message": "Order created successfully"}

@router.get("")
async def list_generic_pos(po_type: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    try:
        q = select(GenericPurchaseOrder).options(selectinload(GenericPurchaseOrder.items)).order_by(desc(GenericPurchaseOrder.id))
        if po_type:
            q = q.where(GenericPurchaseOrder.po_type == po_type)
            
        result = await db.execute(q)
        orders = result.scalars().all()
        
        output = []
        for r in orders:
            output.append({
                "id": r.id,
                "po_type": r.po_type,
                "po_no": r.po_no,
                "po_date": r.po_date,
                "supplier_name": r.supplier_name,
                "net_amount": float(r.net_amount) if r.net_amount else 0.0,
                "status": r.status
            })
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{po_id}")
async def get_generic_po(po_id: int, db: AsyncSession = Depends(get_db)):
    q = select(GenericPurchaseOrder).options(selectinload(GenericPurchaseOrder.items)).where(GenericPurchaseOrder.id == po_id)
    result = await db.execute(q)
    db_po = result.scalar_one_or_none()
    
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")
    
    output = {c.name: getattr(db_po, c.name) for c in db_po.__table__.columns}
    output["items"] = []
    for item in db_po.items:
        output["items"].append({c.name: float(getattr(item, c.name)) if hasattr(getattr(item, c.name), 'normalize') else getattr(item, c.name) for c in item.__table__.columns})
        
    return output

@router.delete("/{po_id}")
async def delete_generic_po(po_id: int, db: AsyncSession = Depends(get_db)):
    q = select(GenericPurchaseOrder).where(GenericPurchaseOrder.id == po_id)
    result = await db.execute(q)
    db_po = result.scalar_one_or_none()
    
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")
        
    await db.delete(db_po)
    await db.commit()
    return {"message": "Order deleted successfully"}
