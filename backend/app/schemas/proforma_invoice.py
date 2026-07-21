from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from decimal import Decimal

class ProformaInvoiceItemBase(BaseModel):
    ibpo_no: Optional[str] = None
    style: Optional[str] = None
    description: Optional[str] = None
    pattern: Optional[str] = None
    composition: Optional[str] = None
    po_number: Optional[str] = None
    delivery_date: Optional[date] = None
    quantity: Decimal = Decimal('0.0')
    rate: Decimal = Decimal('0.0')
    amount: Decimal = Decimal('0.0')

class ProformaInvoiceItemCreate(ProformaInvoiceItemBase):
    pass

class ProformaInvoiceItemResponse(ProformaInvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True

class ProformaInvoiceBase(BaseModel):
    pi_number: str
    pi_date: date
    payment_mode: Optional[str] = None
    revised_on: Optional[date] = None
    consignee: Optional[str] = None
    delivery_at: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    revision_notes: Optional[str] = None
    special_instructions: Optional[str] = None
    
    total_quantity: Decimal = Decimal('0.0')
    total_bale: int = 0
    other_charges: Decimal = Decimal('0.0')
    less_pct: Decimal = Decimal('0.0')
    freight_charges: Decimal = Decimal('0.0')
    packing_charges: Decimal = Decimal('0.0')
    insurance_charges: Decimal = Decimal('0.0')
    
    tax_type: str = 'GST'
    cgst_pct: Decimal = Decimal('0.0')
    sgst_pct: Decimal = Decimal('0.0')
    igst_pct: Decimal = Decimal('0.0')
    tcs_amount: Decimal = Decimal('0.0')
    discount_pct: Decimal = Decimal('0.0')
    
    taxable_amount: Decimal = Decimal('0.0')
    tax_amount: Decimal = Decimal('0.0')
    gst_amount: Decimal = Decimal('0.0')
    gross_amount: Decimal = Decimal('0.0')
    rounded_off: Decimal = Decimal('0.0')
    net_amount: Decimal = Decimal('0.0')
    
    terms_conditions: List[str] = []
    approval_status: str = 'Pending'

class ProformaInvoiceCreate(ProformaInvoiceBase):
    items: List[ProformaInvoiceItemCreate] = []

class ProformaInvoiceUpdate(BaseModel):
    payment_mode: Optional[str] = None
    revised_on: Optional[date] = None
    consignee: Optional[str] = None
    delivery_at: Optional[str] = None
    billing_address: Optional[str] = None
    delivery_address: Optional[str] = None
    revision_notes: Optional[str] = None
    special_instructions: Optional[str] = None
    total_quantity: Optional[Decimal] = None
    total_bale: Optional[int] = None
    other_charges: Optional[Decimal] = None
    less_pct: Optional[Decimal] = None
    freight_charges: Optional[Decimal] = None
    packing_charges: Optional[Decimal] = None
    insurance_charges: Optional[Decimal] = None
    tax_type: Optional[str] = None
    cgst_pct: Optional[Decimal] = None
    sgst_pct: Optional[Decimal] = None
    igst_pct: Optional[Decimal] = None
    tcs_amount: Optional[Decimal] = None
    discount_pct: Optional[Decimal] = None
    taxable_amount: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    gst_amount: Optional[Decimal] = None
    gross_amount: Optional[Decimal] = None
    rounded_off: Optional[Decimal] = None
    net_amount: Optional[Decimal] = None
    terms_conditions: Optional[List[str]] = None
    approval_status: Optional[str] = None
    items: Optional[List[ProformaInvoiceItemCreate]] = None

class ProformaInvoiceResponse(ProformaInvoiceBase):
    id: int
    items: List[ProformaInvoiceItemResponse] = []

    class Config:
        from_attributes = True
