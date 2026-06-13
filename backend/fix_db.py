import asyncio
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

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
