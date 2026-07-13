import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def run():
    try:
        import asyncpg
        conn = await asyncpg.connect('postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp')
        await conn.execute('ALTER TABLE sales_invoices ALTER COLUMN state_code TYPE VARCHAR(50);')
        await conn.close()
        print("Database updated.")
    except Exception as e:
        print("pg update error:", e)

async def main():
    async with AsyncSessionLocal() as db:
        columns = [
            "loom_type VARCHAR",
            "manufacturer VARCHAR",
            "model_number VARCHAR",
            "installation_date TIMESTAMP",
            "reed_width FLOAT",
            "total_ends INTEGER",
            "location VARCHAR",
            "last_service_date TIMESTAMP",
            "next_service_date TIMESTAMP",
            "remarks VARCHAR"
        ]
        for col in columns:
            try:
                await db.execute(text(f"ALTER TABLE loom_master ADD COLUMN {col};"))
            except Exception as e:
                print(f"Column {col} exists or error:", e)
        await db.commit()

asyncio.run(main())
