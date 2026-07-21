from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.buyer_order_completion import BuyerOrderCompletion, BuyerOrderCompletionDetail
from app.schemas.buyer_order_completion import BuyerOrderCompletionCreate, BuyerOrderCompletionResponse, BuyerOrderCompletionUpdate

router = APIRouter(prefix="/buyer-order-completions", tags=["Buyer Order Completions"])

@router.post("/", response_model=BuyerOrderCompletionResponse)
async def create_completion(completion: BuyerOrderCompletionCreate, db: AsyncSession = Depends(get_db)):
    db_completion = BuyerOrderCompletion(
        completion_date=completion.completion_date,
        party_name=completion.party_name,
        updated_to=completion.updated_to,
        records_updated=completion.records_updated,
        remarks=completion.remarks
    )
    db.add(db_completion)
    await db.flush()

    for detail in completion.details:
        db_detail = BuyerOrderCompletionDetail(
            completion_id=db_completion.id,
            ibpo_no=detail.ibpo_no,
            po_no=detail.po_no,
            design_no=detail.design_no,
            quality=detail.quality,
            order_mtr=detail.order_mtr,
            dispatch_mtr=detail.dispatch_mtr,
            return_mtr=detail.return_mtr,
            balance_mtr=detail.balance_mtr,
            row_remarks=detail.row_remarks
        )
        db.add(db_detail)
    
    await db.commit()
    await db.refresh(db_completion, ['details'])
    return db_completion

@router.get("/", response_model=List[BuyerOrderCompletionResponse])
async def list_completions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderCompletion).options(selectinload(BuyerOrderCompletion.details)).order_by(BuyerOrderCompletion.id.desc()))
    return result.scalars().all()

@router.get("/{completion_id}", response_model=BuyerOrderCompletionResponse)
async def get_completion(completion_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrderCompletion)
        .options(selectinload(BuyerOrderCompletion.details))
        .where(BuyerOrderCompletion.id == completion_id)
    )
    completion = result.scalar_one_or_none()
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    return completion

@router.put("/{completion_id}", response_model=BuyerOrderCompletionResponse)
async def update_completion(completion_id: int, completion_update: BuyerOrderCompletionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BuyerOrderCompletion)
        .options(selectinload(BuyerOrderCompletion.details))
        .where(BuyerOrderCompletion.id == completion_id)
    )
    db_completion = result.scalar_one_or_none()
    if not db_completion:
        raise HTTPException(status_code=404, detail="Completion not found")

    update_data = completion_update.dict(exclude_unset=True, exclude={'details'})
    for key, value in update_data.items():
        setattr(db_completion, key, value)
    
    if completion_update.details is not None:
        for detail in db_completion.details:
            await db.delete(detail)
        await db.flush()
        
        for detail in completion_update.details:
            db_detail = BuyerOrderCompletionDetail(
                completion_id=db_completion.id,
                **detail.dict()
            )
            db.add(db_detail)
            
    await db.commit()
    await db.refresh(db_completion, ['details'])
    return db_completion

@router.delete("/{completion_id}")
async def delete_completion(completion_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BuyerOrderCompletion).where(BuyerOrderCompletion.id == completion_id))
    db_completion = result.scalar_one_or_none()
    if not db_completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    
    await db.delete(db_completion)
    await db.commit()
    return {"message": "Completion deleted successfully"}
