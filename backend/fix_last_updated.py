import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from datetime import datetime

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)

async def fix():
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE erp_current_stock SET last_updated = NOW() WHERE last_updated IS NULL"))
        print("last_updated fixed!")

asyncio.run(fix())
