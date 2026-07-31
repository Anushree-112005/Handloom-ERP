import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)

async def fix():
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE erp_current_stock SET reserved_quantity = 0.0 WHERE reserved_quantity IS NULL"))
        print("reserved_quantity fixed!")

asyncio.run(fix())
