import asyncio
from app.core.database import engine, Base
from app.models.buyer_order import BuyerOrderCompletion

async def drop_table():
    async with engine.begin() as conn:
        await conn.run_sync(BuyerOrderCompletion.__table__.drop)
    print("Table dropped.")

if __name__ == "__main__":
    asyncio.run(drop_table())
