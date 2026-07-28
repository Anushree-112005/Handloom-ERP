from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime
from app.core.database import get_db
from app.models.dyed_yarn import DyedYarnReceived, DyedYarnReceivedItem

router = APIRouter(prefix="/dyed-yarn-receipts", tags=["Dyed Yarn Receipts"])

class DyedYarnReceivedItemBase(BaseModel):
    cone_type: Optional[str] = None
    yarn_count: Optional[str] = None
    received_count: Optional[str] = None
    shade_no: Optional[str] = None
    our_lot_no: Optional[str] = None
    color: Optional[str] = None
    taken_kgs: Optional[float] = 0
    dyed_lot_no: Optional[str] = None
    bags: Optional[float] = 0
    cones: Optional[float] = 0
    rcvd_kgs: Optional[float] = 0
    short_kgs: Optional[float] = 0
    short_pct: Optional[float] = 0
    remarks: Optional[str] = None
    yarn_type: Optional[str] = None
    ply: Optional[str] = None
    batch_no: Optional[str] = None
    gross_weight: Optional[float] = 0
    tare_weight: Optional[float] = 0
    net_weight: Optional[float] = 0
    excess_qty: Optional[float] = 0
    accepted_qty: Optional[float] = 0
    rejected_qty: Optional[float] = 0
    qc_remarks: Optional[str] = None
    
    # New fields to match YarnInwardItem
    rate: Optional[float] = 0.0
    amount: Optional[float] = 0.0
    mill_name: Optional[str] = None
    color_code: Optional[str] = None
    our_id: Optional[str] = None
    kgs: Optional[float] = 0.0

class DyedYarnReceivedCreate(BaseModel):
    inv_no: Optional[str] = None
    inv_date: Optional[date] = None
    received_type: Optional[str] = None
    receive_mode: Optional[str] = None
    party_name: Optional[str] = None
    design_no: Optional[str] = None
    design_count: Optional[str] = None
    order_no: Optional[str] = None
    our_dc_no: Optional[str] = None
    party_dc_no: Optional[str] = None
    dc_date: Optional[date] = None
    vehicle_no: Optional[str] = None
    transport: Optional[str] = None
    driver_name: Optional[str] = None
    lr_no: Optional[str] = None
    received_by: Optional[str] = None
    received_time: Optional[str] = None
    godown: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = "Received"
    receipt_no: Optional[str] = None
    receipt_date: Optional[date] = None
    yarn_dyeing_po_no: Optional[str] = None
    yarn_dyeing_delivery_no: Optional[str] = None
    processor_name: Optional[str] = None
    buyer_name: Optional[str] = None
    party_invoice_no: Optional[str] = None
    driver_mobile: Optional[str] = None
    checked_by: Optional[str] = None
    qc_status: Optional[str] = "Pending"
    receipt_status: Optional[str] = "Pending"
    total_taken_qty: Optional[float] = 0
    total_received_qty: Optional[float] = 0
    total_short_qty: Optional[float] = 0
    total_excess_qty: Optional[float] = 0
    total_bags: Optional[float] = 0
    total_cones: Optional[float] = 0
    total_gross_weight: Optional[float] = 0
    total_net_weight: Optional[float] = 0

    # New fields to match YarnInward
    entry_date: Optional[date] = None
    inward_date: Optional[date] = None
    po_no_dt: Optional[str] = None
    agent_name: Optional[str] = None
    stock_godown: Optional[str] = None
    godown_id: Optional[int] = None
    cone_type: Optional[str] = None
    order_kgs: Optional[float] = 0.0
    received_kgs: Optional[float] = 0.0
    balance_kgs: Optional[float] = 0.0
    pc_id: Optional[str] = None
    tolerance_pct: Optional[float] = 0.0
    bill_no: Optional[str] = None
    bill_amount: Optional[float] = 0.0
    gross_kgs: Optional[float] = 0.0
    net_kgs: Optional[float] = 0.0
    chipnam: Optional[str] = None
    due_days: Optional[int] = 0
    veh_no: Optional[str] = None
    eway_bill: Optional[str] = None
    org_grn_no: Optional[str] = None
    gate_no: Optional[str] = None
    wbridge_no: Optional[str] = None
    w_weight: Optional[float] = 0.0
    other_remarks: Optional[str] = None
    packing: Optional[str] = None
    freight: Optional[float] = 0.0
    gross_amount: Optional[float] = 0.0
    tax_type: Optional[str] = None
    cgst_pct: Optional[float] = 0.0
    sgst_pct: Optional[float] = 0.0
    igst_pct: Optional[float] = 0.0
    tax_value: Optional[float] = 0.0
    tcs_value: Optional[float] = 0.0
    tds_pct: Optional[float] = 0.0
    total_tax: Optional[float] = 0.0
    round_off: Optional[float] = 0.0
    net_amount: Optional[float] = 0.0
    ref_no: Optional[str] = None

    items: List[DyedYarnReceivedItemBase] = []

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_dyed_yarn_receipt(receipt_in: DyedYarnReceivedCreate, db: AsyncSession = Depends(get_db)):
    receipt_data = receipt_in.dict(exclude={"items"})
    db_receipt = DyedYarnReceived(**receipt_data)
    
    if not db_receipt.receipt_no:
        q = select(DyedYarnReceived).order_by(desc(DyedYarnReceived.id))
        result = await db.execute(q)
        last_receipt = result.scalars().first()
        new_id = (last_receipt.id + 1) if last_receipt else 1
        db_receipt.receipt_no = f"DYR-{new_id:05d}"
        if not db_receipt.inv_no:
            db_receipt.inv_no = db_receipt.receipt_no

    db.add(db_receipt)
    await db.commit()
    await db.refresh(db_receipt)

    for item_in in receipt_in.items:
        db_item = DyedYarnReceivedItem(
            receipt_id=db_receipt.id,
            **item_in.dict()
        )
        db.add(db_item)
    
    await db.commit()

    # RULE 1 & 2: INVENTORY MODULE INTEGRATION (Receipt from Job Work + Loss Calc)
    from app.services.inventory_service import post_stock_ledger
    from finance_app.models.stock_item import StockItem
    from app.models.inventory import StockLedger
    
    for item_in in receipt_in.items:
        stmt_item = select(StockItem).where(StockItem.name == item_in.yarn_count)
        res_item = await db.execute(stmt_item)
        stock_item = res_item.scalars().first()
        
        if stock_item:
            # Rule 2: Loss % Calc
            sent_qty = item_in.delivery_qty or 0.0
            recv_qty = item_in.received_qty or 0.0
            loss_pct = 0.0
            if sent_qty > 0:
                loss_pct = ((sent_qty - recv_qty) / sent_qty) * 100
                
            remarks = f"Dyed Yarn Received. Loss: {loss_pct:.2f}%"
            
            # Decrease AT_JOB_WORK
            await post_stock_ledger(
                db=db,
                stock_item_id=stock_item.id,
                status="AT_JOB_WORK",
                movement_type="TRANSFER_OUT",
                qty=-sent_qty,
                lot_no=item_in.lot_no,
                ref_voucher_type="DYEING_RECEIPT",
                ref_voucher_no=db_receipt.receipt_no,
                remarks=remarks
            )
            # Increase AVAILABLE (only received qty)
            await post_stock_ledger(
                db=db,
                stock_item_id=stock_item.id,
                status="AVAILABLE",
                movement_type="INWARD", # Treating receipt as inward for the new location
                qty=recv_qty,
                lot_no=item_in.lot_no,
                godown_id=db_receipt.godown_id,
                ref_voucher_type="DYEING_RECEIPT",
                ref_voucher_no=db_receipt.receipt_no,
                remarks=remarks
            )
    return {"id": db_receipt.id, "message": "Dyed Yarn Receipt created successfully"}

@router.get("")
async def list_dyed_yarn_receipts(db: AsyncSession = Depends(get_db)):
    try:
        q = select(DyedYarnReceived).options(selectinload(DyedYarnReceived.items)).order_by(desc(DyedYarnReceived.id))
        result = await db.execute(q)
        receipts = result.scalars().all()
        
        output = []
        for r in receipts:
            output.append({
                "id": r.id,
                "inv_no": r.inv_no,
                "inv_date": r.inv_date,
                "party_name": r.party_name,
                "received_type": r.received_type,
                "receive_mode": r.receive_mode,
                "total_bags": r.total_bags,
                "total_received_qty": float(r.total_received_qty) if r.total_received_qty else 0.0,
                "status": r.status,
                "items": [{"color": i.color, "rcvd_kgs": float(i.rcvd_kgs) if i.rcvd_kgs else 0.0} for i in r.items]
            })
        return output
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{receipt_id}")
async def get_dyed_yarn_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnReceived).options(selectinload(DyedYarnReceived.items)).where(DyedYarnReceived.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Dyed Yarn Receipt not found")
    
    output = {c.name: getattr(db_receipt, c.name) for c in db_receipt.__table__.columns}
    output["items"] = []
    for item in db_receipt.items:
        output["items"].append({c.name: float(getattr(item, c.name)) if hasattr(getattr(item, c.name), 'normalize') else getattr(item, c.name) for c in item.__table__.columns})
        
    return output

@router.put("/{receipt_id}")
async def update_dyed_yarn_receipt(receipt_id: int, receipt_in: DyedYarnReceivedCreate, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnReceived).options(selectinload(DyedYarnReceived.items)).where(DyedYarnReceived.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Dyed Yarn Receipt not found")

    update_data = receipt_in.dict(exclude_unset=True, exclude={"items"})
    for key, value in update_data.items():
        setattr(db_receipt, key, value)
        
    for item in db_receipt.items:
        await db.delete(item)
    
    for item_in in receipt_in.items:
        db_item = DyedYarnReceivedItem(
            receipt_id=db_receipt.id,
            **item_in.dict()
        )
        db.add(db_item)
        
    await db.commit()
    return {"message": "Dyed Yarn Receipt updated successfully"}

@router.delete("/{receipt_id}")
async def delete_dyed_yarn_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    q = select(DyedYarnReceived).where(DyedYarnReceived.id == receipt_id)
    result = await db.execute(q)
    db_receipt = result.scalar_one_or_none()
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Dyed Yarn Receipt not found")
        
    await db.delete(db_receipt)
    await db.commit()
    return {"message": "Dyed Yarn Receipt deleted successfully"}
