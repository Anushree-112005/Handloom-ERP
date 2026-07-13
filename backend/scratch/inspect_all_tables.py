import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    url = "postgresql+asyncpg://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        # Get all table names
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [r[0] for r in res.fetchall()]
        print(f"Total tables: {len(tables)}")
        for t in sorted(tables):
            try:
                count_res = await conn.execute(text(f"SELECT COUNT(*) FROM {t}"))
                count = count_res.scalar()
                print(f"  {t}: {count} rows")
            except Exception as e:
                print(f"  Error reading {t}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
