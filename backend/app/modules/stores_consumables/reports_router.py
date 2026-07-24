from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.modules.stores_consumables.reports_service import StoresReportsService

router = APIRouter(prefix="/stores-consumables/reports", tags=["Stores & Consumables Reports"])

@router.get("/po-print")
async def get_po_print_report(
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    vendor: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await StoresReportsService.get_po_print_report(db, search, date_from, date_to, vendor, status)

@router.get("/po-status")
async def get_po_status_report(
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    vendor: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await StoresReportsService.get_po_status_report(db, search, date_from, date_to, vendor, status)

@router.get("/purchase-received")
async def get_purchase_received_report(
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    vendor: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await StoresReportsService.get_purchase_received_report(db, search, date_from, date_to, vendor, category)

@router.get("/consumption")
async def get_consumption_report(
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    department: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await StoresReportsService.get_consumption_report(db, search, date_from, date_to, department, category)

@router.get("/stock")
async def get_stock_report(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await StoresReportsService.get_stock_report(db, search, category, status)
