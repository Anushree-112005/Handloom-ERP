import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)

async def check():
    async with engine.connect() as conn:
        print("--- stationary_items ---")
        result = await conn.execute(text("SELECT category, count(*) FROM stationary_items GROUP BY category;"))
        rows = result.fetchall()
        for row in rows:
            print(row)
            
        print("\n--- erp_current_stock (CON) ---")
        result = await conn.execute(text("SELECT item_id, location_type, quantity FROM erp_current_stock WHERE item_id LIKE 'CON%';"))
        rows = result.fetchall()
        for row in rows:
            print(row)

asyncio.run(check())
