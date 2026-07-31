import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)

async def delete_mock():
    async with engine.begin() as conn:
        # Delete dummy current stock for consumables
        await conn.execute(text("DELETE FROM erp_current_stock WHERE item_id LIKE 'CON-%'"))
        
        # Delete dummy consumable items from stationary_items
        await conn.execute(text("DELETE FROM stationary_items WHERE category = 'consumables_items'"))
        
        print("Mock stock data completely wiped!")

asyncio.run(delete_mock())
