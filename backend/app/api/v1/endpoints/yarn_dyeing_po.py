from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from app.core.database import get_db
from app.models.yarn_dyeing_po import YarnDyeingPO, YarnDyeingPOItem

router = APIRouter()

# --- Schemas ---

class YarnDyeingPOItemBase(BaseModel):
    sp_no: Optional[str] = None
    lot_no: Optional[str] = None
    stock_qty: Optional[float] = 0
    dsn_count: Optional[str] = None
    yarn_count: Optional[str] = None
    color: Optional[str] = None
    uom: Optional[str] = 'KGS'
    warp_qty: Optional[float] = 0
    weft_qty: Optional[float] = 0
    tot_qty: Optional[float] = 0
    tole_pct: Optional[float] = 0
    wrp_order: Optional[float] = 0
    wft_order: Optional[float] = 0
    rate: Optional[float] = 0
    amount: Optional[float] = 0

class YarnDyeingPOItemCreate(YarnDyeingPOItemBase):
    pass

class YarnDyeingPOItemResponse(YarnDyeingPOItemBase):
    id: int
    order_id: int
    class Config:
        orm_mode = True

class YarnDyeingPOCreate(BaseModel):
    po_no: str
    po_date: Optional[date] = None
    supplier_dyeing_unit: Optional[str] = None
    supplier_code: Optional[str] = None
    delivery_date: Optional[date] = None
    payment_terms: Optional[str] = None
    buyer_name: Optional[str] = None
    status: Optional[str] = "Active"
    remarks: Optional[str] = None

    ref_no_1: Optional[str] = None
    ref_no_2: Optional[str] = None
    order_type: Optional[str] = None
    azo_free: Optional[str] = None
    apeo_npeo: Optional[str] = None
    fastness_dry: Optional[str] = None
    fastness_wet: Optional[str] = None
    color_fastness: Optional[str] = None
    shade_change: Optional[str] = None
    deschargability: Optional[str] = None
    pcp_free: Optional[str] = None
    staining_on_cotton: Optional[str] = None
    design_no: Optional[str] = None
    lot_no: Optional[str] = None

    tax_type: Optional[str] = None
    certificate_type: Optional[str] = None
    gross_amt: Optional[float] = 0
    design_wise_details: Optional[str] = None
    color_wise_details: Optional[str] = None

    taxable_value: Optional[float] = 0
    dyeing_charge: Optional[float] = 0
    packing_charge: Optional[float] = 0
    transport_charge: Optional[float] = 0
    cgst_pct: Optional[float] = 0
    cgst_amount: Optional[float] = 0
    sgst_pct: Optional[float] = 0
    sgst_amount: Optional[float] = 0
    igst_pct: Optional[float] = 0
    igst_amount: Optional[float] = 0
    round_off: Optional[float] = 0
    net_amount: Optional[float] = 0

    delivery_location: Optional[str] = None
    dispatch_mode: Optional[str] = None
    transport_name: Optional[str] = None
    vehicle_type: Optional[str] = None
    delivery_instructions: Optional[str] = None
    terms_conditions: List[str] = []

    items: List[YarnDyeingPOItemCreate] = []

class YarnDyeingPOResponse(YarnDyeingPOCreate):
    id: int
    items: List[YarnDyeingPOItemResponse] = []
    class Config:
        orm_mode = True

# --- Endpoints ---

@router.post("", response_model=YarnDyeingPOResponse, status_code=status.HTTP_201_CREATED)
async def create_yarn_dyeing_po(data: YarnDyeingPOCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate PO No
    stmt = select(YarnDyeingPO).where(YarnDyeingPO.po_no == data.po_no)
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="PO Number already exists")

    new_po = YarnDyeingPO(
        po_no=data.po_no,
        po_date=data.po_date,
        supplier_dyeing_unit=data.supplier_dyeing_unit,
        supplier_code=data.supplier_code,
        delivery_date=data.delivery_date,
        payment_terms=data.payment_terms,
        buyer_name=data.buyer_name,
        status=data.status,
        remarks=data.remarks,

        ref_no_1=data.ref_no_1,
        ref_no_2=data.ref_no_2,
        order_type=data.order_type,
        azo_free=data.azo_free,
        apeo_npeo=data.apeo_npeo,
        fastness_dry=data.fastness_dry,
        fastness_wet=data.fastness_wet,
        color_fastness=data.color_fastness,
        shade_change=data.shade_change,
        deschargability=data.deschargability,
        pcp_free=data.pcp_free,
        staining_on_cotton=data.staining_on_cotton,
        design_no=data.design_no,
        lot_no=data.lot_no,

        tax_type=data.tax_type,
        certificate_type=data.certificate_type,
        gross_amt=data.gross_amt,
        design_wise_details=data.design_wise_details,
        color_wise_details=data.color_wise_details,

        taxable_value=data.taxable_value,
        dyeing_charge=data.dyeing_charge,
        packing_charge=data.packing_charge,
        transport_charge=data.transport_charge,
        cgst_pct=data.cgst_pct,
        cgst_amount=data.cgst_amount,
        sgst_pct=data.sgst_pct,
        sgst_amount=data.sgst_amount,
        igst_pct=data.igst_pct,
        igst_amount=data.igst_amount,
        round_off=data.round_off,
        net_amount=data.net_amount,

        delivery_location=data.delivery_location,
        dispatch_mode=data.dispatch_mode,
        transport_name=data.transport_name,
        vehicle_type=data.vehicle_type,
        delivery_instructions=data.delivery_instructions,
        terms_conditions=data.terms_conditions
    )
    db.add(new_po)
    await db.commit()
    await db.refresh(new_po)

    for item in data.items:
        new_item = YarnDyeingPOItem(
            order_id=new_po.id,
            **item.dict()
        )
        db.add(new_item)
    await db.commit()
    await db.refresh(new_po)

    stmt_out = select(YarnDyeingPO).options(selectinload(YarnDyeingPO.items)).where(YarnDyeingPO.id == new_po.id)
    res = await db.execute(stmt_out)
    return res.scalars().first()

@router.get("", response_model=List[YarnDyeingPOResponse])
async def get_all_yarn_dyeing_pos(db: AsyncSession = Depends(get_db)):
    stmt = select(YarnDyeingPO).options(selectinload(YarnDyeingPO.items)).order_by(YarnDyeingPO.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{po_id}", response_model=YarnDyeingPOResponse)
async def get_yarn_dyeing_po(po_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(YarnDyeingPO).options(selectinload(YarnDyeingPO.items)).where(YarnDyeingPO.id == po_id)
    result = await db.execute(stmt)
    db_po = result.scalars().first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_po

@router.put("/{po_id}", response_model=YarnDyeingPOResponse)
async def update_yarn_dyeing_po(po_id: int, data: YarnDyeingPOCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(YarnDyeingPO).options(selectinload(YarnDyeingPO.items)).where(YarnDyeingPO.id == po_id)
    result = await db.execute(stmt)
    db_po = result.scalars().first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_po.po_no != data.po_no:
        dup_stmt = select(YarnDyeingPO).where(YarnDyeingPO.po_no == data.po_no)
        dup_result = await db.execute(dup_stmt)
        if dup_result.scalars().first():
            raise HTTPException(status_code=400, detail="PO Number already exists")

    update_data = data.dict(exclude={'items'})
    for key, value in update_data.items():
        setattr(db_po, key, value)

    for item in db_po.items:
        await db.delete(item)
    await db.commit()

    for item in data.items:
        new_item = YarnDyeingPOItem(
            order_id=db_po.id,
            **item.dict()
        )
        db.add(new_item)
    await db.commit()

    stmt_out = select(YarnDyeingPO).options(selectinload(YarnDyeingPO.items)).where(YarnDyeingPO.id == po_id)
    res = await db.execute(stmt_out)
    return res.scalars().first()

@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_yarn_dyeing_po(po_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(YarnDyeingPO).where(YarnDyeingPO.id == po_id)
    result = await db.execute(stmt)
    db_po = result.scalars().first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.delete(db_po)
    await db.commit()
    return None
