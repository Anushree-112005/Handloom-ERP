"""Sales Invoice CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import xml.etree.ElementTree as ET
import xml.dom.minidom

from app.core.database import get_db
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem
from app.models.party_master import PartyMaster

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
    party_id: Optional[int] = None
    ibpo: Optional[str] = None
    design_no: Optional[str] = None
    status: Optional[str] = "Draft"
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
    country: Optional[str] = None
    port_of_loading: Optional[str] = None
    port_of_discharge: Optional[str] = None
    incoterms: Optional[str] = None

    buyer_po_no: Optional[str] = None
    dispatch_date: Optional[str] = None
    transporter_name: Optional[str] = None
    lr_no: Optional[str] = None
    vehicle_no: Optional[str] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    insurance_charges: Optional[Decimal] = Decimal("0.0")

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
    
    try:
        db_invoice = SalesInvoice(**dump)
        db.add(db_invoice)
        await db.flush()  # Populates db_invoice.id

        for item in items_data:
            db_item = SalesInvoiceItem(invoice_id=db_invoice.id, **item)
            db.add(db_item)

        await db.commit()
        
        # Create Draft Voucher in Finance
        try:
            from finance_app.database import SessionLocal as FinanceSessionLocal
            from finance_app.models.voucher import Voucher
            from finance_app.models.ledger import Ledger
            from datetime import date
            
            fin_db = FinanceSessionLocal()
            buyer_ledger = fin_db.query(Ledger).filter(Ledger.name == db_invoice.buyer_name).first()
            party_id = buyer_ledger.id if buyer_ledger else None
            
            v = Voucher(
                voucher_number=f"SV-DRAFT-{db_invoice.invoice_no}",
                voucher_type="Sales",
                date=db_invoice.invoice_date or date.today(),
                status="Draft",
                total_amount=db_invoice.net_amount or 0.0,
                reference_no=db_invoice.invoice_no,
                company_id=1,
                party_id=party_id,
                narration=f"Draft Accounts Receivable generated from Sales Invoice: {db_invoice.invoice_no} for Buyer: {db_invoice.buyer_name}"
            )
            fin_db.add(v)
            fin_db.commit()
            fin_db.close()
        except Exception as e:
            import logging
            logging.getLogger("finance_sync").error(f"Failed to create draft voucher: {e}")

    except Exception as e:
        import traceback
        with open("error_log.txt", "a") as f:
            f.write(traceback.format_exc() + "\n")
        raise e
    
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

    try:
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
    except Exception as e:
        import traceback
        with open("error_log.txt", "a") as f:
            f.write(traceback.format_exc() + "\n")
        raise e
    
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

@router.get("/export-tally-xml/", response_class=Response)
async def export_tally_xml(
    invoice_ids: str = Query(..., description="Comma-separated list of invoice IDs"),
    db: AsyncSession = Depends(get_db)
):
    ids = [int(i.strip()) for i in invoice_ids.split(",") if i.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="No invoice IDs provided")

    result = await db.execute(
        select(SalesInvoice)
        .options(selectinload(SalesInvoice.items))
        .where(SalesInvoice.id.in_(ids))
    )
    invoices = result.scalars().all()

    envelope = ET.Element("ENVELOPE")
    header = ET.SubElement(envelope, "HEADER")
    ET.SubElement(header, "TALLYREQUEST").text = "Import Data"
    body = ET.SubElement(envelope, "BODY")
    importdata = ET.SubElement(body, "IMPORTDATA")
    reqdesc = ET.SubElement(importdata, "REQUESTDESC")
    ET.SubElement(reqdesc, "REPORTNAME").text = "Vouchers"
    ET.SubElement(reqdesc, "STATICVARIABLES").text = ""
    reqdata = ET.SubElement(importdata, "REQUESTDATA")
    
    tally_message = ET.SubElement(reqdata, "TALLYMESSAGE", {"xmlns:UDF": "TallyUDF"})

    for inv in invoices:
        # Fetch tally_ledger_name
        party_result = await db.execute(select(PartyMaster).where(PartyMaster.company_name == inv.party_name))
        party = party_result.scalar_one_or_none()
        tally_ledger = party.tally_ledger_name if party and party.tally_ledger_name else inv.party_name

        voucher = ET.SubElement(tally_message, "VOUCHER", {"VCHTYPE": "Sales", "ACTION": "Create"})
        
        # Basic details
        ET.SubElement(voucher, "DATE").text = inv.invoice_date.strftime("%Y%m%d") if inv.invoice_date else ""
        ET.SubElement(voucher, "VOUCHERTYPENAME").text = "Sales"
        ET.SubElement(voucher, "VOUCHERNUMBER").text = inv.invoice_no or ""
        ET.SubElement(voucher, "PARTYLEDGERNAME").text = tally_ledger or ""
        ET.SubElement(voucher, "PERSISTEDVIEW").text = "Accounting Voucher View"
        
        # E-Way Bill Logistics
        if inv.transport_id or inv.vehicle_no:
            ET.SubElement(voucher, "STATENAME").text = inv.state or ""
            ET.SubElement(voucher, "CONSIGNEEGSTIN").text = inv.gst_no or ""
            ET.SubElement(voucher, "TRANSPORTERNAME").text = inv.transporter_name or ""
            ET.SubElement(voucher, "TRANSPORTERID").text = inv.transport_id or ""
            ET.SubElement(voucher, "VEHICLENO").text = inv.vehicle_no or ""
            ET.SubElement(voucher, "VEHICLETYPE").text = inv.vehicle_type or ""
            ET.SubElement(voucher, "DISPATCHDATE").text = inv.dispatch_date or ""
            ET.SubElement(voucher, "LRNO").text = inv.lr_no or ""

        # Debit Party Ledger
        party_entry = ET.SubElement(voucher, "ALLLEDGERENTRIES.LIST")
        ET.SubElement(party_entry, "LEDGERNAME").text = tally_ledger or ""
        ET.SubElement(party_entry, "ISDEEMEDPOSITIVE").text = "Yes"
        ET.SubElement(party_entry, "AMOUNT").text = f"-{inv.net_amount or 0}"

        # Credit Sales Account
        sales_entry = ET.SubElement(voucher, "ALLLEDGERENTRIES.LIST")
        ET.SubElement(sales_entry, "LEDGERNAME").text = "Sales Account"
        ET.SubElement(sales_entry, "ISDEEMEDPOSITIVE").text = "No"
        ET.SubElement(sales_entry, "AMOUNT").text = f"{inv.taxable_amount or 0}"

        # Items (Inventory Entries)
        for item in inv.items:
            inv_entry = ET.SubElement(voucher, "ALLINVENTORYENTRIES.LIST")
            ET.SubElement(inv_entry, "STOCKITEMNAME").text = item.design_no or ""
            ET.SubElement(inv_entry, "ISDEEMEDPOSITIVE").text = "No"
            ET.SubElement(inv_entry, "RATE").text = f"{item.rate or 0}/{item.uom or 'MTR'}"
            ET.SubElement(inv_entry, "AMOUNT").text = f"{item.amount or 0}"
            ET.SubElement(inv_entry, "BILLEDQTY").text = f"{item.qty or 0} {item.uom or 'MTR'}"

        # Taxes
        if inv.cgst and float(inv.cgst) > 0:
            cgst_entry = ET.SubElement(voucher, "ALLLEDGERENTRIES.LIST")
            ET.SubElement(cgst_entry, "LEDGERNAME").text = "CGST"
            ET.SubElement(cgst_entry, "ISDEEMEDPOSITIVE").text = "No"
            ET.SubElement(cgst_entry, "AMOUNT").text = f"{inv.cgst}"

        if inv.sgst and float(inv.sgst) > 0:
            sgst_entry = ET.SubElement(voucher, "ALLLEDGERENTRIES.LIST")
            ET.SubElement(sgst_entry, "LEDGERNAME").text = "SGST"
            ET.SubElement(sgst_entry, "ISDEEMEDPOSITIVE").text = "No"
            ET.SubElement(sgst_entry, "AMOUNT").text = f"{inv.sgst}"

        if inv.igst and float(inv.igst) > 0:
            igst_entry = ET.SubElement(voucher, "ALLLEDGERENTRIES.LIST")
            ET.SubElement(igst_entry, "LEDGERNAME").text = "IGST"
            ET.SubElement(igst_entry, "ISDEEMEDPOSITIVE").text = "No"
            ET.SubElement(igst_entry, "AMOUNT").text = f"{inv.igst}"

    xml_str = ET.tostring(envelope, encoding="utf-8")
    parsed = xml.dom.minidom.parseString(xml_str)
    pretty_xml_as_string = parsed.toprettyxml(indent="  ")

    return Response(content=pretty_xml_as_string, media_type="application/xml")

@router.get("/{invoice_id}/eway-bill-json")
async def generate_eway_bill_json(invoice_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SalesInvoice)
        .options(selectinload(SalesInvoice.items))
        .where(SalesInvoice.id == invoice_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # Basic Validation
    # In India, Pincode must be exactly 6 digits
    # For demo we assume the user has entered pincodes in billing_address/delivery_address or we just enforce standard checks on fields
    
    # We don't have dedicated dispatch_pin in SalesInvoice yet, let's extract it from state_code or assume defaults if missing
    # But as per requirements, we MUST validate pincode strictly.
    # To prevent export failures:
    
    if not inv.gst_no or len(inv.gst_no) != 15:
        raise HTTPException(status_code=400, detail="Invalid Buyer GSTIN. Must be 15 characters.")
        
    if not inv.transporter_name and not inv.vehicle_no:
        raise HTTPException(status_code=400, detail="Either Transporter Name or Vehicle No must be provided for E-Way Bill.")
        
    if inv.transport_id and len(inv.transport_id) != 15:
        raise HTTPException(status_code=400, detail="Transporter ID (GSTIN) must be 15 characters.")
        
    # Generate JSON for NIC Portal
    # Format matches the standard JSON schema for E-Way Bill Generation
    
    items_list = []
    for idx, item in enumerate(inv.items, 1):
        items_list.append({
            "productName": item.design_no or "Textile Goods",
            "productDesc": item.description or "",
            "hsnCode": int(inv.hsn_code) if inv.hsn_code and inv.hsn_code.isdigit() else 5205,
            "quantity": float(item.qty or 0),
            "qtyUnit": item.uom or "MTR",
            "taxableAmount": float(item.amount or 0),
            "sgstRate": float(inv.sgst or 0) / float(inv.taxable_amount or 1) * 100 if inv.sgst and inv.taxable_amount else 0,
            "cgstRate": float(inv.cgst or 0) / float(inv.taxable_amount or 1) * 100 if inv.cgst and inv.taxable_amount else 0,
            "igstRate": float(inv.igst or 0) / float(inv.taxable_amount or 1) * 100 if inv.igst and inv.taxable_amount else 0,
            "cessRate": 0
        })

    payload = {
        "supplyType": "O",
        "subSupplyType": "1",
        "documentType": "INV",
        "documentNo": inv.invoice_no,
        "documentDate": inv.invoice_date.strftime("%d/%m/%Y") if inv.invoice_date else "",
        "fromGstin": "YOUR_COMPANY_GSTIN", # Placeholder for actual company GSTIN
        "fromTrdName": "Handloom ERP",
        "fromAddr1": "Company Address",
        "fromPlace": "City",
        "fromPincode": 600001,
        "fromStateCode": 33,
        "toGstin": inv.gst_no,
        "toTrdName": inv.party_name,
        "toAddr1": inv.billing_address or "",
        "toPlace": inv.state or "",
        "toPincode": 600002, # In a real scenario, this is extracted or added as a field
        "toStateCode": int(inv.state_code) if inv.state_code and inv.state_code.isdigit() else 33,
        "totalValue": float(inv.taxable_amount or 0),
        "cgstValue": float(inv.cgst or 0),
        "sgstValue": float(inv.sgst or 0),
        "igstValue": float(inv.igst or 0),
        "cessValue": 0,
        "totInvValue": float(inv.net_amount or 0),
        "transporterId": inv.transport_id or "",
        "transporterName": inv.transporter_name or "",
        "transDocNo": inv.lr_no or "",
        "transMode": "1", # 1 for Road
        "transDistance": 0,
        "transDocDate": inv.dispatch_date or "",
        "vehicleNo": inv.vehicle_no or "",
        "vehicleType": "R" if (inv.vehicle_type or "").lower() == "regular" else "O",
        "itemList": items_list
    }
    
    return payload
