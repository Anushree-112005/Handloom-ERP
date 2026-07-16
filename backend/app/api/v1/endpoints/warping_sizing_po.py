from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import date, datetime
from app.core.database import get_db
from app.models.warping_sizing_po import WarpingSizingPO, WarpingSizingPOItem

router = APIRouter()

def parse_date(val):
    if not val:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(str(val).split("T")[0], "%Y-%m-%d").date()
    except Exception:
        return None

def parse_str(val):
    if val is None or val == "":
        return None
    return str(val)

def parse_float(val):
    if val is None or val == "":
        return 0.0
    try:
        return float(val)
    except Exception:
        return 0.0

class WarpingSizingPOItemCreate(BaseModel):
    yarn_code: Optional[Any] = None
    yarn_name: Optional[Any] = None
    yarn_count: Optional[Any] = None
    yarn_type: Optional[Any] = None
    mill_name: Optional[Any] = None
    lot_no: Optional[Any] = None
    shade: Optional[Any] = None
    uom: Optional[Any] = "KGS"
    qty_kg: Optional[Any] = 0
    rate_per_kg: Optional[Any] = 0
    amount: Optional[Any] = 0
    weaver_name: Optional[Any] = None
    no_of_beam: Optional[Any] = 0

class WarpingSizingPOCreate(BaseModel):
    po_no: Optional[Any] = None
    po_date: Optional[Any] = None
    supplier_job_worker: Optional[Any] = None
    supplier_code: Optional[Any] = None
    delivery_date: Optional[Any] = None
    payment_terms: Optional[Any] = None
    buyer_name: Optional[Any] = None
    status: Optional[Any] = "Active"
    remarks: Optional[Any] = None

    indent_no: Optional[Any] = None
    sales_order_no: Optional[Any] = None
    production_order_no: Optional[Any] = None
    buyer_order_no: Optional[Any] = None
    department: Optional[Any] = None

    taxable_value: Optional[Any] = 0
    warping_charge: Optional[Any] = 0
    sizing_charge: Optional[Any] = 0
    packing_charge: Optional[Any] = 0
    loading_charge: Optional[Any] = 0
    unloading_charge: Optional[Any] = 0
    transport_charge: Optional[Any] = 0
    other_charges: Optional[Any] = 0
    cgst_pct: Optional[Any] = 0
    cgst_amount: Optional[Any] = 0
    sgst_pct: Optional[Any] = 0
    sgst_amount: Optional[Any] = 0
    igst_pct: Optional[Any] = 0
    igst_amount: Optional[Any] = 0
    round_off: Optional[Any] = 0
    net_amount: Optional[Any] = 0

    delivery_location: Optional[Any] = None
    dispatch_mode: Optional[Any] = None
    transport_name: Optional[Any] = None
    vehicle_no: Optional[Any] = None
    delivery_instructions: Optional[Any] = None
    terms_conditions: List[Any] = []

    tax_type: Optional[Any] = None
    org_name: Optional[Any] = None
    ref_no_1: Optional[Any] = None
    ref_no_2: Optional[Any] = None
    order_no: Optional[Any] = None
    order_date: Optional[Any] = None
    completion_date: Optional[Any] = None
    order_type: Optional[Any] = None
    party_name: Optional[Any] = None
    design_no: Optional[Any] = None
    beam_type: Optional[Any] = None
    fabric: Optional[Any] = None
    reed: Optional[Any] = None
    pick: Optional[Any] = None
    warp_width: Optional[Any] = None
    warp_ends: Optional[Any] = None
    warp_meters: Optional[Any] = None
    weft_meters: Optional[Any] = None
    fabric_width: Optional[Any] = None
    finished_width: Optional[Any] = None
    wages_input: Optional[Any] = None
    wages_type: Optional[Any] = None
    selected_count: Optional[Any] = None
    merchandiser: Optional[Any] = None
    gross_amt: Optional[Any] = 0
    total_beam_kgs: Optional[Any] = None

    items: List[WarpingSizingPOItemCreate] = []

@router.get("/")
async def get_warping_sizing_pos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarpingSizingPO).options(selectinload(WarpingSizingPO.items)).order_by(WarpingSizingPO.id.desc()))
    return result.scalars().all()

@router.post("/")
async def create_warping_sizing_po(data: WarpingSizingPOCreate, db: AsyncSession = Depends(get_db)):
    # Generate po_no if missing or empty
    po_no = parse_str(data.po_no)
    if not po_no:
        result = await db.execute(select(WarpingSizingPO.po_no))
        po_numbers = result.scalars().all()
        max_num = 0
        for p_no in po_numbers:
            if p_no and p_no.upper().startswith("WSPO-"):
                try:
                    num_part = int(p_no.split("-")[1])
                    if num_part > max_num:
                        max_num = num_part
                except (ValueError, IndexError):
                    pass
        po_no = f"WSPO-{max_num + 1:05d}"

    # Set po_date if missing
    po_date = parse_date(data.po_date) or date.today()

    # Determine supplier_job_worker from items list
    weaver_names = []
    for item in data.items:
        w_name = parse_str(item.weaver_name)
        if w_name and w_name not in weaver_names:
            weaver_names.append(w_name)
    supplier_job_worker = ", ".join(weaver_names) if weaver_names else parse_str(data.supplier_job_worker)

    new_po = WarpingSizingPO(
        po_no=po_no,
        po_date=po_date,
        supplier_job_worker=supplier_job_worker,
        supplier_code=parse_str(data.supplier_code),
        delivery_date=parse_date(data.delivery_date),
        payment_terms=parse_str(data.payment_terms),
        buyer_name=parse_str(data.buyer_name),
        status=parse_str(data.status) or "Active",
        remarks=parse_str(data.remarks),
        indent_no=parse_str(data.indent_no),
        sales_order_no=parse_str(data.sales_order_no),
        production_order_no=parse_str(data.production_order_no),
        buyer_order_no=parse_str(data.buyer_order_no),
        department=parse_str(data.department),
        taxable_value=parse_float(data.taxable_value),
        warping_charge=parse_float(data.warping_charge),
        sizing_charge=parse_float(data.sizing_charge),
        packing_charge=parse_float(data.packing_charge),
        loading_charge=parse_float(data.loading_charge),
        unloading_charge=parse_float(data.unloading_charge),
        transport_charge=parse_float(data.transport_charge),
        other_charges=parse_float(data.other_charges),
        cgst_pct=parse_float(data.cgst_pct),
        cgst_amount=parse_float(data.cgst_amount),
        sgst_pct=parse_float(data.sgst_pct),
        sgst_amount=parse_float(data.sgst_amount),
        igst_pct=parse_float(data.igst_pct),
        igst_amount=parse_float(data.igst_amount),
        round_off=parse_float(data.round_off),
        net_amount=parse_float(data.net_amount),
        delivery_location=parse_str(data.delivery_location),
        dispatch_mode=parse_str(data.dispatch_mode),
        transport_name=parse_str(data.transport_name),
        vehicle_no=parse_str(data.vehicle_no),
        delivery_instructions=parse_str(data.delivery_instructions),
        terms_conditions=[parse_str(t) for t in data.terms_conditions if t is not None],
        tax_type=parse_str(data.tax_type),
        org_name=parse_str(data.org_name),
        ref_no_1=parse_str(data.ref_no_1),
        ref_no_2=parse_str(data.ref_no_2),
        order_no=parse_str(data.order_no),
        order_date=parse_date(data.order_date),
        completion_date=parse_date(data.completion_date),
        order_type=parse_str(data.order_type),
        party_name=parse_str(data.party_name),
        design_no=parse_str(data.design_no),
        beam_type=parse_str(data.beam_type),
        fabric=parse_str(data.fabric),
        reed=parse_str(data.reed),
        pick=parse_str(data.pick),
        warp_width=parse_str(data.warp_width),
        warp_ends=parse_str(data.warp_ends),
        warp_meters=parse_str(data.warp_meters),
        weft_meters=parse_str(data.weft_meters),
        fabric_width=parse_str(data.fabric_width),
        finished_width=parse_str(data.finished_width),
        wages_input=parse_str(data.wages_input),
        wages_type=parse_str(data.wages_type),
        selected_count=parse_str(data.selected_count),
        merchandiser=parse_str(data.merchandiser),
        gross_amt=parse_float(data.gross_amt),
        total_beam_kgs=parse_str(data.total_beam_kgs)
    )
    db.add(new_po)
    await db.commit()
    await db.refresh(new_po)

    for item in data.items:
        db_item = WarpingSizingPOItem(
            yarn_code=parse_str(item.yarn_code),
            yarn_name=parse_str(item.yarn_name),
            yarn_count=parse_str(item.yarn_count),
            yarn_type=parse_str(item.yarn_type),
            mill_name=parse_str(item.mill_name),
            lot_no=parse_str(item.lot_no),
            shade=parse_str(item.shade),
            uom=parse_str(item.uom) or "KGS",
            qty_kg=parse_float(item.qty_kg),
            rate_per_kg=parse_float(item.rate_per_kg),
            amount=parse_float(item.amount),
            weaver_name=parse_str(item.weaver_name),
            no_of_beam=parse_float(item.no_of_beam),
            po_id=new_po.id
        )
        db.add(db_item)
    await db.commit()
    await db.commit()
    
    # Create Draft Voucher in Finance
    try:
        from finance_app.database import SessionLocal as FinanceSessionLocal
        from finance_app.models.voucher import Voucher
        from finance_app.models.ledger import Ledger
        
        fin_db = FinanceSessionLocal()
        # The supplier might be warping_name or sizing_name; typically it's the primary unit. Let's use warping_name.
        supplier_name = new_po.warping_name or new_po.sizing_name
        supplier_ledger = fin_db.query(Ledger).filter(Ledger.name == supplier_name).first() if supplier_name else None
        party_id = supplier_ledger.id if supplier_ledger else None
        
        v = Voucher(
            voucher_number=f"JV-DRAFT-{new_po.po_no}",
            voucher_type="Journal",
            date=new_po.po_date or date.today(),
            status="Draft",
            total_amount=new_po.gross_amt or 0.0,
            reference_no=new_po.po_no,
            company_id=1,
            party_id=party_id,
            narration=f"Draft Job Work Payable generated from Warping/Sizing PO: {new_po.po_no} for Unit: {supplier_name}"
        )
        fin_db.add(v)
        fin_db.commit()
        fin_db.close()
    except Exception as e:
        import logging
        logging.getLogger("finance_sync").error(f"Failed to create draft voucher: {e}")

    return new_po

@router.put("/{id}")
async def update_warping_sizing_po(id: int, data: WarpingSizingPOCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarpingSizingPO).options(selectinload(WarpingSizingPO.items)).where(WarpingSizingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")

    # Determine supplier_job_worker from items list
    weaver_names = []
    for item in data.items:
        w_name = parse_str(item.weaver_name)
        if w_name and w_name not in weaver_names:
            weaver_names.append(w_name)
    supplier_job_worker = ", ".join(weaver_names) if weaver_names else parse_str(data.supplier_job_worker)
        
    po.po_no = parse_str(data.po_no) or po.po_no
    po.po_date = parse_date(data.po_date) or po.po_date
    po.supplier_job_worker = supplier_job_worker
    po.supplier_code = parse_str(data.supplier_code)
    po.delivery_date = parse_date(data.delivery_date)
    po.payment_terms = parse_str(data.payment_terms)
    po.buyer_name = parse_str(data.buyer_name)
    po.status = parse_str(data.status) or "Active"
    po.remarks = parse_str(data.remarks)
    po.indent_no = parse_str(data.indent_no)
    po.sales_order_no = parse_str(data.sales_order_no)
    po.production_order_no = parse_str(data.production_order_no)
    po.buyer_order_no = parse_str(data.buyer_order_no)
    po.department = parse_str(data.department)
    po.taxable_value = parse_float(data.taxable_value)
    po.warping_charge = parse_float(data.warping_charge)
    po.sizing_charge = parse_float(data.sizing_charge)
    po.packing_charge = parse_float(data.packing_charge)
    po.loading_charge = parse_float(data.loading_charge)
    po.unloading_charge = parse_float(data.unloading_charge)
    po.transport_charge = parse_float(data.transport_charge)
    po.other_charges = parse_float(data.other_charges)
    po.cgst_pct = parse_float(data.cgst_pct)
    po.cgst_amount = parse_float(data.cgst_amount)
    po.sgst_pct = parse_float(data.sgst_pct)
    po.sgst_amount = parse_float(data.sgst_amount)
    po.igst_pct = parse_float(data.igst_pct)
    po.igst_amount = parse_float(data.igst_amount)
    po.round_off = parse_float(data.round_off)
    po.net_amount = parse_float(data.net_amount)
    po.delivery_location = parse_str(data.delivery_location)
    po.dispatch_mode = parse_str(data.dispatch_mode)
    po.transport_name = parse_str(data.transport_name)
    po.vehicle_no = parse_str(data.vehicle_no)
    po.delivery_instructions = parse_str(data.delivery_instructions)
    po.terms_conditions = [parse_str(t) for t in data.terms_conditions if t is not None]

    po.tax_type = parse_str(data.tax_type)
    po.org_name = parse_str(data.org_name)
    po.ref_no_1 = parse_str(data.ref_no_1)
    po.ref_no_2 = parse_str(data.ref_no_2)
    po.order_no = parse_str(data.order_no)
    po.order_date = parse_date(data.order_date)
    po.completion_date = parse_date(data.completion_date)
    po.order_type = parse_str(data.order_type)
    po.party_name = parse_str(data.party_name)
    po.design_no = parse_str(data.design_no)
    po.beam_type = parse_str(data.beam_type)
    po.fabric = parse_str(data.fabric)
    po.reed = parse_str(data.reed)
    po.pick = parse_str(data.pick)
    po.warp_width = parse_str(data.warp_width)
    po.warp_ends = parse_str(data.warp_ends)
    po.warp_meters = parse_str(data.warp_meters)
    po.weft_meters = parse_str(data.weft_meters)
    po.fabric_width = parse_str(data.fabric_width)
    po.finished_width = parse_str(data.finished_width)
    po.wages_input = parse_str(data.wages_input)
    po.wages_type = parse_str(data.wages_type)
    po.selected_count = parse_str(data.selected_count)
    po.merchandiser = parse_str(data.merchandiser)
    po.gross_amt = parse_float(data.gross_amt)
    po.total_beam_kgs = parse_str(data.total_beam_kgs)

    await db.execute(WarpingSizingPOItem.__table__.delete().where(WarpingSizingPOItem.po_id == id))
    
    for item in data.items:
        db_item = WarpingSizingPOItem(
            yarn_code=parse_str(item.yarn_code),
            yarn_name=parse_str(item.yarn_name),
            yarn_count=parse_str(item.yarn_count),
            yarn_type=parse_str(item.yarn_type),
            mill_name=parse_str(item.mill_name),
            lot_no=parse_str(item.lot_no),
            shade=parse_str(item.shade),
            uom=parse_str(item.uom) or "KGS",
            qty_kg=parse_float(item.qty_kg),
            rate_per_kg=parse_float(item.rate_per_kg),
            amount=parse_float(item.amount),
            weaver_name=parse_str(item.weaver_name),
            no_of_beam=parse_float(item.no_of_beam),
            po_id=id
        )
        db.add(db_item)
        
    await db.commit()
    await db.refresh(po)
    return po

@router.delete("/{id}")
async def delete_warping_sizing_po(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WarpingSizingPO).where(WarpingSizingPO.id == id))
    po = result.scalars().first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    await db.delete(po)
    await db.commit()
    return {"status": "success"}
