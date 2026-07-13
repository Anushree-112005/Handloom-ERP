import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    url = "postgresql+asyncpg://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        print("Existing po_no in warping_sizing_pos:")
        result = await conn.execute(text("SELECT po_no FROM warping_sizing_pos ORDER BY id DESC LIMIT 10;"))
        for row in result.fetchall():
            print(row[0])

if __name__ == "__main__":
    asyncio.run(main())
