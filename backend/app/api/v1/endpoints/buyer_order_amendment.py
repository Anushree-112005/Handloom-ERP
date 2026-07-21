from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.buyer_order_amendment import BuyerOrderAmendment, BuyerOrderAmendmentDetail
from app.schemas.buyer_order_amendment import BuyerOrderAmendmentCreate, BuyerOrderAmendmentResponse, BuyerOrderAmendmentUpdate

router = APIRouter(prefix="/buyer-order-amendments", tags=["Buyer Order Amendments"])

@router.post("/", response_model=BuyerOrderAmendmentResponse)
async def create_amendment(amendment: BuyerOrderAmendmentCreate, db: AsyncSession = Depends(get_db)):
    db_amendment = BuyerOrderAmendment(
        amendment_no=amendment.amendment_no,
        amendment_date=amendment.amendment_date,
        last_amendment_date=amendment.last_amendment_date,
        ibpo_ref_no=amendment.ibpo_ref_no,
        po_date=amendment.po_date,
        party_name=amendment.party_name,
        design_no=amendment.design_no,
        quality_print_name=amendment.quality_print_name,
        order_mtr=amendment.order_mtr,
        tolerance_pct=amendment.tolerance_pct,
        delivery_starting=amendment.delivery_starting,
        party_completion_date=amendment.party_completion_date,
        company_completion_date=amendment.company_completion_date,
        last_dispatch_date=amendment.last_dispatch_date,
        total_dispatch_mtr=amendment.total_dispatch_mtr,
        party_rate=amendment.party_rate,
        amendment_mtr=amendment.amendment_mtr,
        total_mtr=amendment.total_mtr,
        status=amendment.status
    )
    db.add(db_amendment)
    await db.flush()

    for detail in amendment.details:
        db_detail = BuyerOrderAmendmentDetail(
            amendment_id=db_amendment.id,
            order_date=detail.order_date,
            completion_date=detail.completion_date,
            amendment_order_mtr=detail.amendment_order_mtr,
            amendment_type=detail.amendment_type,
            reason=detail.reason
        )
        db.add(db_detail)
    
    await db.commit()
    await db.refresh(db_amendment, ['details'])
    return db_amendment

@router.get("/", response_model=List[BuyerOrderAmendmentResponse])
async def list_amendments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderAmendment).options(selectinload(BuyerOrderAmendment.details)).order_by(BuyerOrderAmendment.id.desc()))
    return result.scalars().all()

@router.get("/{amendment_id}", response_model=BuyerOrderAmendmentResponse)
async def get_amendment(amendment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrderAmendment)
        .options(selectinload(BuyerOrderAmendment.details))
        .where(BuyerOrderAmendment.id == amendment_id)
    )
    amendment = result.scalar_one_or_none()
    if not amendment:
        raise HTTPException(status_code=404, detail="Amendment not found")
    return amendment

@router.put("/{amendment_id}", response_model=BuyerOrderAmendmentResponse)
async def update_amendment(amendment_id: int, amendment_update: BuyerOrderAmendmentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrderAmendment)
        .options(selectinload(BuyerOrderAmendment.details))
        .where(BuyerOrderAmendment.id == amendment_id)
    )
    db_amendment = result.scalar_one_or_none()
    if not db_amendment:
        raise HTTPException(status_code=404, detail="Amendment not found")

    update_data = amendment_update.dict(exclude_unset=True, exclude={'details'})
    for key, value in update_data.items():
        setattr(db_amendment, key, value)
    
    if amendment_update.details is not None:
        # Delete existing details
        for detail in db_amendment.details:
            await db.delete(detail)
        await db.flush()
        
        # Add new details
        for detail in amendment_update.details:
            db_detail = BuyerOrderAmendmentDetail(
                amendment_id=db_amendment.id,
                **detail.dict()
            )
            db.add(db_detail)
            
    await db.commit()
    await db.refresh(db_amendment, ['details'])
    return db_amendment

@router.delete("/{amendment_id}")
async def delete_amendment(amendment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderAmendment).where(BuyerOrderAmendment.id == amendment_id))
    db_amendment = result.scalar_one_or_none()
    if not db_amendment:
        raise HTTPException(status_code=404, detail="Amendment not found")
    
    await db.delete(db_amendment)
    await db.commit()
    return {"message": "Amendment deleted successfully"}
