from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.proforma_invoice import ProformaInvoice, ProformaInvoiceItem
from app.schemas.proforma_invoice import ProformaInvoiceCreate, ProformaInvoiceResponse, ProformaInvoiceUpdate

router = APIRouter(prefix="/proforma-invoices", tags=["Proforma Invoices"])

@router.post("/", response_model=ProformaInvoiceResponse)
async def create_proforma_invoice(invoice: ProformaInvoiceCreate, db: AsyncSession = Depends(get_db)):
    db_invoice = ProformaInvoice(
        pi_number=invoice.pi_number,
        pi_date=invoice.pi_date,
        payment_mode=invoice.payment_mode,
        revised_on=invoice.revised_on,
        consignee=invoice.consignee,
        delivery_at=invoice.delivery_at,
        billing_address=invoice.billing_address,
        delivery_address=invoice.delivery_address,
        revision_notes=invoice.revision_notes,
        special_instructions=invoice.special_instructions,
        total_quantity=invoice.total_quantity,
        total_bale=invoice.total_bale,
        other_charges=invoice.other_charges,
        less_pct=invoice.less_pct,
        freight_charges=invoice.freight_charges,
        packing_charges=invoice.packing_charges,
        insurance_charges=invoice.insurance_charges,
        tax_type=invoice.tax_type,
        cgst_pct=invoice.cgst_pct,
        sgst_pct=invoice.sgst_pct,
        igst_pct=invoice.igst_pct,
        tcs_amount=invoice.tcs_amount,
        discount_pct=invoice.discount_pct,
        taxable_amount=invoice.taxable_amount,
        tax_amount=invoice.tax_amount,
        gst_amount=invoice.gst_amount,
        gross_amount=invoice.gross_amount,
        rounded_off=invoice.rounded_off,
        net_amount=invoice.net_amount,
        terms_conditions=invoice.terms_conditions,
        approval_status=invoice.approval_status
    )
    db.add(db_invoice)
    await db.flush()

    for item in invoice.items:
        db_item = ProformaInvoiceItem(
            invoice_id=db_invoice.id,
            ibpo_no=item.ibpo_no,
            style=item.style,
            description=item.description,
            pattern=item.pattern,
            composition=item.composition,
            po_number=item.po_number,
            delivery_date=item.delivery_date,
            quantity=item.quantity,
            rate=item.rate,
            amount=item.amount
        )
        db.add(db_item)
    
    await db.commit()
    await db.refresh(db_invoice, ['items'])
    return db_invoice

@router.get("/", response_model=List[ProformaInvoiceResponse])
async def list_proforma_invoices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProformaInvoice).options(selectinload(ProformaInvoice.items)).order_by(ProformaInvoice.id.desc()))
    return result.scalars().all()

@router.get("/{invoice_id}", response_model=ProformaInvoiceResponse)
async def get_proforma_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProformaInvoice)
        .options(selectinload(ProformaInvoice.items))
        .where(ProformaInvoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    return invoice

@router.put("/{invoice_id}", response_model=ProformaInvoiceResponse)
async def update_proforma_invoice(invoice_id: int, invoice_update: ProformaInvoiceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProformaInvoice)
        .options(selectinload(ProformaInvoice.items))
        .where(ProformaInvoice.id == invoice_id)
    )
    db_invoice = result.scalar_one_or_none()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")

    update_data = invoice_update.dict(exclude_unset=True, exclude={'items'})
    for key, value in update_data.items():
        setattr(db_invoice, key, value)
    
    if invoice_update.items is not None:
        # Delete existing items
        for item in db_invoice.items:
            await db.delete(item)
        await db.flush()
        
        # Add new items
        for item in invoice_update.items:
            db_item = ProformaInvoiceItem(
                invoice_id=db_invoice.id,
                **item.dict()
            )
            db.add(db_item)
            
    await db.commit()
    await db.refresh(db_invoice, ['items'])
    return db_invoice

@router.delete("/{invoice_id}")
async def delete_proforma_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProformaInvoice).where(ProformaInvoice.id == invoice_id))
    db_invoice = result.scalar_one_or_none()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Proforma Invoice not found")
    
    await db.delete(db_invoice)
    await db.commit()
    return {"message": "Proforma Invoice deleted successfully"}
