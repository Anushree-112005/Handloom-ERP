from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.models.order_expense import OrderExpense, OrderExpenseEntry
from app.schemas.order_expense import OrderExpenseCreate, OrderExpenseResponse, OrderExpenseUpdate

router = APIRouter(prefix="/order-expenses", tags=["Order Expenses"])

@router.post("/", response_model=OrderExpenseResponse)
async def create_expense(expense: OrderExpenseCreate, db: AsyncSession = Depends(get_db)):
    db_expense = OrderExpense(
        reference_no=expense.reference_no,
        date=expense.date,
        ibpo_number=expense.ibpo_number,
        ibpo_date=expense.ibpo_date,
        party_name=expense.party_name,
        quality=expense.quality,
        order_mtr=expense.order_mtr,
        fabric_type=expense.fabric_type,
        order_type=expense.order_type,
        merchandiser=expense.merchandiser,
        net_amount=expense.net_amount
    )
    db.add(db_expense)
    await db.flush()

    for entry in expense.entries:
        db_entry = OrderExpenseEntry(
            expense_id=db_expense.id,
            expense_type=entry.expense_type,
            remarks=entry.remarks,
            quantity=entry.quantity,
            unit=entry.unit,
            rate=entry.rate,
            amount=entry.amount
        )
        db.add(db_entry)
    
    await db.commit()
    await db.refresh(db_expense, ['entries'])
    return db_expense

@router.get("/", response_model=List[OrderExpenseResponse])
async def list_expenses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OrderExpense).options(selectinload(OrderExpense.entries)).order_by(OrderExpense.id.desc()))
    return result.scalars().all()

@router.get("/{expense_id}", response_model=OrderExpenseResponse)
async def get_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OrderExpense)
        .options(selectinload(OrderExpense.entries))
        .where(OrderExpense.id == expense_id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=OrderExpenseResponse)
async def update_expense(expense_id: int, expense_update: OrderExpenseUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OrderExpense)
        .options(selectinload(OrderExpense.entries))
        .where(OrderExpense.id == expense_id)
    )
    db_expense = result.scalar_one_or_none()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = expense_update.dict(exclude_unset=True, exclude={'entries'})
    for key, value in update_data.items():
        setattr(db_expense, key, value)
    
    if expense_update.entries is not None:
        for entry in db_expense.entries:
            await db.delete(entry)
        await db.flush()
        
        for entry in expense_update.entries:
            db_entry = OrderExpenseEntry(
                expense_id=db_expense.id,
                **entry.dict()
            )
            db.add(db_entry)
            
    await db.commit()
    await db.refresh(db_expense, ['entries'])
    return db_expense

@router.delete("/{expense_id}")
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OrderExpense).where(OrderExpense.id == expense_id))
    db_expense = result.scalar_one_or_none()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    await db.delete(db_expense)
    await db.commit()
    return {"message": "Expense deleted successfully"}
