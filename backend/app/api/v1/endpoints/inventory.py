from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.models.inventory import StockBalance, StockLedger, StockAudit, SurplusStock, SparesStock, LotReconciliation
from finance_app.models.stock_item import StockItem

router = APIRouter()

@router.get("/stock-dashboard")
async def get_stock_dashboard(db: AsyncSession = Depends(get_db)):
    # Calculate KPIs
    # Note: For SQLite compatibility in this demo, using basic sum.
    # In a real app with proper async setup, we'd use select(func.sum(StockBalance.closing_qty))...
    balances_result = await db.execute(select(StockBalance, StockItem).join(StockItem, StockItem.id == StockBalance.stock_item_id))
    balances = balances_result.all()
    
    kpis = {
        "yarn_qty": 0, "yarn_val": 0,
        "greige_qty": 0, "greige_val": 0,
        "finished_qty": 0, "finished_val": 0,
        "at_job_work_qty": 0, "at_job_work_val": 0
    }
    
    for bal, item in balances:
        if bal.status == 'AT_JOB_WORK':
            kpis["at_job_work_qty"] += bal.closing_qty
            kpis["at_job_work_val"] += bal.closing_value
            
        elif bal.status == 'AVAILABLE':
            if item.item_category == 'YARN':
                kpis["yarn_qty"] += bal.closing_qty
                kpis["yarn_val"] += bal.closing_value
            elif item.item_category == 'GREIGE_FABRIC':
                kpis["greige_qty"] += bal.closing_qty
                kpis["greige_val"] += bal.closing_value
            elif item.item_category == 'FINISHED_FABRIC':
                kpis["finished_qty"] += bal.closing_qty
                kpis["finished_val"] += bal.closing_value

    # Low stock alerts count
    low_stock_count = sum(1 for bal, item in balances if bal.closing_qty <= item.reorder_level)
    
    return {
        "kpis": kpis,
        "low_stock_count": low_stock_count,
        "pending_audits": 0
    }

@router.get("/stock-summary")
async def get_stock_summary(category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(StockBalance, StockItem).join(StockItem, StockItem.id == StockBalance.stock_item_id)
    if category:
        stmt = stmt.where(StockItem.item_category == category)
        
    result = await db.execute(stmt)
    records = result.all()
    
    summary = []
    for bal, item in records:
        summary.append({
            "id": bal.id,
            "item_name": item.name,
            "item_code": item.item_code,
            "godown_id": bal.godown_id,
            "status": bal.status,
            "closing_qty": float(bal.closing_qty),
            "closing_value": float(bal.closing_value),
            "unit": item.unit
        })
    return summary

@router.get("/stock-ledger")
async def get_stock_ledger(db: AsyncSession = Depends(get_db)):
    stmt = select(StockLedger, StockItem).join(StockItem, StockItem.id == StockLedger.stock_item_id).order_by(StockLedger.txn_date.desc(), StockLedger.id.desc()).limit(100)
    result = await db.execute(stmt)
    records = result.all()
    
    ledger = []
    for leg, item in records:
        ledger.append({
            "id": leg.id,
            "txn_date": leg.txn_date,
            "item_name": item.name,
            "lot_no": leg.lot_no,
            "movement_type": leg.movement_type,
            "qty": float(leg.qty),
            "status": leg.status,
            "ref_voucher_type": leg.ref_voucher_type
        })
    return ledger

@router.get("/alerts/low-stock")
async def get_low_stock_alerts(db: AsyncSession = Depends(get_db)):
    stmt = select(StockBalance, StockItem).join(StockItem, StockItem.id == StockBalance.stock_item_id)
    result = await db.execute(stmt)
    records = result.all()
    
    alerts = []
    for bal, item in records:
        if bal.closing_qty <= item.reorder_level:
            alerts.append({
                "item_name": item.name,
                "current_qty": float(bal.closing_qty),
                "reorder_level": float(item.reorder_level),
                "status": bal.status
            })
    return alerts
