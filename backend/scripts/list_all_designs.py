# Print all design entries
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    url = "postgresql+asyncpg://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, design_no, total_ends, reed, pick_ot, selvage_waste FROM design_entry;"))
        rows = result.fetchall()
        print(f"Total entries: {len(rows)}")
        for r in rows:
            print(r)

if __name__ == "__main__":
    asyncio.run(main())
