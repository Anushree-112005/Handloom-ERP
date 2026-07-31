import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)

async def clear_mock_data():
    async with engine.begin() as conn:
        # Delete dummy issues
        await conn.execute(text("DELETE FROM stationary_items WHERE category = 'consumables_issues'"))
        # Also maybe consumables_pos since we refactored it too? The user said "issuse approval page" only, but I'll clear pos as well if it had mock data, but we didn't seed any pos. Only issues.
        print("Mock data cleared!")

asyncio.run(clear_mock_data())
