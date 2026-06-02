"""Sales Invoice CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from app.core.database import get_db
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem

router = APIRouter(prefix="/sales-invoices", tags=["Sales Invoices"])

def parse_date_safe(v):
    if not v:
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        v = v.strip()
        if not v:
            return None
        # Try YYYY-MM-DD
        try:
            return date.fromisoformat(v)
        except ValueError:
            pass
        # Try DD/MM/YYYY
        try:
            return datetime.strptime(v, "%d/%m/%Y").date()
        except ValueError:
            pass
        # Try DD-MMM-YYYY (e.g. 20-May-2026)
        try:
            return datetime.strptime(v, "%d-%b-%Y").date()
        except ValueError:
            pass
        # Try YYYY-MM-DDTHH:MM:SS...
        try:
            return datetime.fromisoformat(v.split('T')[0]).date()
        except ValueError:
            pass
    return v

class SalesInvoiceItemBase(BaseModel):
    design_no: Optional[str] = None
    color: Optional[str] = None
    uom: Optional[str] = "MTR"
    qty: Optional[Decimal] = Decimal("0.0")
    rate: Optional[Decimal] = Decimal("0.0")
    amount: Optional[Decimal] = Decimal("0.0")
    description: Optional[str] = None
    total_bale: Optional[int] = None

class SalesInvoiceItemCreate(SalesInvoiceItemBase):
    pass

class SalesInvoiceItemOut(SalesInvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True

class SalesInvoiceBase(BaseModel):
    invoice_no: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_type: Optional[str] = "Proforma Invoice"
    party_name: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    gst_no: Optional[str] = None
    hsn_code: Optional[str] = None
    total_qty: Optional[Decimal] = Decimal("0.0")
    gross_weight: Optional[Decimal] = Decimal("0.0")
    gross_amount: Optional[Decimal] = Decimal("0.0")
    discount_pct: Optional[Decimal] = Decimal("0.0")
    discount_amount: Optional[Decimal] = Decimal("0.0")
    taxable_amount: Optional[Decimal] = Decimal("0.0")
    sgst: Optional[Decimal] = Decimal("0.0")
    cgst: Optional[Decimal] = Decimal("0.0")
    igst: Optional[Decimal] = Decimal("0.0")
    other_charges: Optional[Decimal] = Decimal("0.0")
    round_off: Optional[Decimal] = Decimal("0.0")
    net_amount: Optional[Decimal] = Decimal("0.0")
    remarks: Optional[str] = None
    status: Optional[str] = "Draft"

    currency: Optional[str] = "INR"
    exchange_rate: Optional[Decimal] = Decimal("1.0")
    rodtep_amount: Optional[Decimal] = Decimal("0.0")
    drawback_amount: Optional[Decimal] = Decimal("0.0")
    ad_code: Optional[str] = None
    iec_number: Optional[str] = None
    firc_reference: Optional[str] = None

    @field_validator('invoice_date', mode='before')
    @classmethod
    def validate_invoice_date(cls, v):
        return parse_date_safe(v)

class SalesInvoiceCreate(SalesInvoiceBase):
    items: List[SalesInvoiceItemCreate] = []

class SalesInvoiceUpdate(SalesInvoiceBase):
    items: Optional[List[SalesInvoiceItemCreate]] = None

class SalesInvoiceOut(SalesInvoiceBase):
    id: int
    items: List[SalesInvoiceItemOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[SalesInvoiceOut])
async def list_invoices(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    q = select(SalesInvoice).options(selectinload(SalesInvoice.items))
    if search:
        search_filter = f"%{search}%"
        q = q.where(
            or_(
                SalesInvoice.invoice_no.ilike(search_filter),
                SalesInvoice.party_name.ilike(search_filter),
            )
        )
    q = q.order_by(SalesInvoice.id.desc())
    result = await db.execute(q)
    return result.scalars().all()

@router.post("/", response_model=SalesInvoiceOut, status_code=201)
async def create_invoice(invoice_data: SalesInvoiceCreate, db: AsyncSession = Depends(get_db)):
    # Check if Invoice No already exists
    if invoice_data.invoice_no:
        existing = await db.execute(
            select(SalesInvoice).where(SalesInvoice.invoice_no == invoice_data.invoice_no)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Invoice number already exists")

    dump = invoice_data.model_dump()
    items_data = dump.pop("items", [])
    
    db_invoice = SalesInvoice(**dump)
    db.add(db_invoice)
    await db.flush()  # Populates db_invoice.id

    for item in items_data:
        db_item = SalesInvoiceItem(invoice_id=db_invoice.id, **item)
        db.add(db_item)

    await db.commit()
    
    # Reload with items
    result = await db.execute(
        select(SalesInvoice)
        .options(selectinload(SalesInvoice.items))
        .where(SalesInvoice.id == db_invoice.id)
    )
    return result.scalar_one()

@router.get("/{invoice_id}", response_model=SalesInvoiceOut)
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SalesInvoice)
        .options(selectinload(SalesInvoice.items))
        .where(SalesInvoice.id == invoice_id)
    )
    db_invoice = result.scalar_one_or_none()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return db_invoice

@router.put("/{invoice_id}", response_model=SalesInvoiceOut)
async def update_invoice(
    invoice_id: int, 
    invoice_data: SalesInvoiceUpdate, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SalesInvoice)
        .options(selectinload(SalesInvoice.items))
        .where(SalesInvoice.id == invoice_id)
    )
    db_invoice = result.scalar_one_or_none()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    dump = invoice_data.model_dump(exclude_unset=True)
    items_data = dump.pop("items", None)

    for key, value in dump.items():
        setattr(db_invoice, key, value)

    if items_data is not None:
        # Delete old items
        for item in db_invoice.items:
            await db.delete(item)
        
        # Add new items
        for item in items_data:
            db_item = SalesInvoiceItem(invoice_id=db_invoice.id, **item)
            db.add(db_item)

    await db.commit()
    
    # Reload
    result = await db.execute(
        select(SalesInvoice)
        .options(selectinload(SalesInvoice.items))
        .where(SalesInvoice.id == db_invoice.id)
    )
    return result.scalar_one()

@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SalesInvoice).where(SalesInvoice.id == invoice_id))
    db_invoice = result.scalar_one_or_none()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    await db.delete(db_invoice)
    await db.commit()
    return None
