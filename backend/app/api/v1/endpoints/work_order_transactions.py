from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

from app.core.database import get_db
from app.models.work_order import WorkOrderTransaction

router = APIRouter(prefix="/work-order-transactions", tags=["Work Order Transactions"])

class WorkOrderTransactionBase(BaseModel):
    module_type: str
    date: date
    buyer_name: Optional[str] = None
    status: Optional[str] = "Active"
    details: Optional[Dict[str, Any]] = {}
    transaction_no: Optional[str] = None

class WorkOrderTransactionCreate(WorkOrderTransactionBase):
    pass

class WorkOrderTransactionOut(WorkOrderTransactionBase):
    id: int
    transaction_no: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[WorkOrderTransactionOut])
async def list_transactions(module_type: Optional[str] = None, skip: int = 0, limit: int = 1000, db: AsyncSession = Depends(get_db)):
    q = select(WorkOrderTransaction)
    if module_type:
        q = q.where(WorkOrderTransaction.module_type == module_type)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=WorkOrderTransactionOut, status_code=201)
async def create_transaction(data: WorkOrderTransactionCreate, db: AsyncSession = Depends(get_db)):
    # Generate a unique transaction_no based on module_type
    prefix_map = {
        'design_create': 'DES-ORD-',
        'dev_bulk_order': 'DBO-',
        'dev_bulk_followup': 'DBF-',
        'short_amd': 'SHT-AMD-',
        'hsn_amd': 'HSN-AMD-',
        'vendor_order': 'VND-ORD-',
        'cloth_po': 'CLO-PO-',
        'dyeing_order': 'DYE-ORD-',
        'cloth_dyeing_order': 'CLO-DYE-',
        'doubling_twisting': 'DBL-TWS-',
        'warp_sizing_order': 'WRP-SIZ-',
        'internal_fabric_req': 'INT-FAB-',
        
        # Completions
        'vendor_order_comp': 'VOC-',
        'cloth_po_comp': 'CPC-',
        'dyeing_order_comp': 'DOC-',
        'warp_sizing_comp': 'WSC-',
        'cloth_dyeing_comp': 'CDC-',
        
        # Approvals
        'buyer_order_app': 'BOA-',
        'pi_app': 'PIA-',
        'vendor_work_app': 'VWA-',
        'internal_fabric_app': 'IFA-',
        'yarn_req_app': 'YRA-',
        'yarn_work_app': 'YWA-',

        # WarpSizing
        'beam_received': 'WBR-',
        'beam_delivery': 'WBD-',
        'empty_beam': 'EBE-',
        'warping_report': 'WSR-',
        'sizing_report': 'SSR-',
        'ws_bills': 'WSB-',
        'set_amend': 'SAM-',

        # Greige
        'vendor_inward': 'GRY-IN-',
        'ot_checking': 'GRY-CHK-',
        'cloth_mending': 'GRY-MND-',
        'cloth_packing': 'GRY-PKG-',
        'cloth_delivery': 'GRY-DEL-',
        'bale_delivery': 'GRY-BLD-',
        'bale_amd': 'GRY-BAM-',
        'lot_amd': 'GRY-LAM-',
        'goods_release': 'GRY-GRA-',
        'gry_invoice': 'GRY-INV-',
        'eway_bill': 'GRY-EWB-',
        'einvoice_eway': 'GRY-EIN-',
        
        # Surplus Stock & Hangers
        'surplus_opening': 'SOP-',
        'surplus_report': 'SRP-',
        'surplus_download': 'SED-',
        'surplus_report_new': 'SRN-',
        'surplus_inward': 'SIW-',
        'surplus_delivery': 'SDE-',
        'customer_hanger': 'HNG-',
        'spares_section': 'SEC-',
        'spares_creation': 'SPR-',
        'spares_opening': 'OS-',
        'spares_request_indent': 'IND-',
        'spares_indent_approval': 'IAP-',
        'spares_purchase_order': 'SPO-',
        'spares_po_approval': 'SPA-',
        'spares_work_order': 'WO-',
        'spares_purchase_entry': 'SPE-',
        'spares_consumption': 'CON-',
        'spares_jobwork_issue': 'JWI-',
        'spares_jobwork_recv': 'JWR-'
    }
    if data.transaction_no:
        txn_no = data.transaction_no
    else:
        prefix = prefix_map.get(data.module_type, 'WOT-')
        max_id_q = await db.execute(select(func.max(WorkOrderTransaction.id)))
        max_id = max_id_q.scalar() or 0
        txn_no = f"{prefix}{(max_id + 1):03d}"
    
    # Check if unique transaction number exists
    existing_txn_q = await db.execute(select(WorkOrderTransaction).where(WorkOrderTransaction.transaction_no == txn_no))
    if existing_txn_q.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Transaction number '{txn_no}' already exists.")
    
    model_data = data.model_dump()
    model_data.pop('transaction_no', None)
    
    txn = WorkOrderTransaction(**model_data, transaction_no=txn_no)
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    return txn

@router.get("/{txn_id}", response_model=WorkOrderTransactionOut)
async def get_transaction(txn_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkOrderTransaction).where(WorkOrderTransaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@router.put("/{txn_id}", response_model=WorkOrderTransactionOut)
async def update_transaction(txn_id: int, data: WorkOrderTransactionCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkOrderTransaction).where(WorkOrderTransaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in data.model_dump().items():
        setattr(txn, key, value)
        
    await db.commit()
    await db.refresh(txn)
    return txn

@router.delete("/{txn_id}", status_code=204)
async def delete_transaction(txn_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkOrderTransaction).where(WorkOrderTransaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    await db.delete(txn)
    await db.commit()
    return None
