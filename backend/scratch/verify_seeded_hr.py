import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.modules.hr.models import HRItem

async def verify():
    async with AsyncSessionLocal() as session:
        # Check counts of categories
        for cat in ["expense_claims", "loans", "assets", "goals"]:
            result = await session.execute(select(HRItem).where(HRItem.category == cat))
            items = result.scalars().all()
            print(f"\nCategory: {cat} - Total: {len(items)}")
            if items:
                first = items[0]
                print(f"  First Item ID: {first.id}, Employee ID Column: {first.employee_id}")
                print(f"  First Item Data: {first.data}")

if __name__ == "__main__":
    asyncio.run(verify())
