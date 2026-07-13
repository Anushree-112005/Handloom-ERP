import asyncio
from app.core.database import AsyncSessionLocal
from app.models.cloth import ClothInward
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def run():
    try:
        async with AsyncSessionLocal() as db:
            q = select(ClothInward).options(selectinload(ClothInward.items))
            result = await db.execute(q)
            rows = result.scalars().all()
            print(f"Found {len(rows)} records")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(run())
