import asyncio
from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE design_entry ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'"))
            print("Successfully added status column.")
        except Exception as e:
            print(f"Error (maybe column already exists): {e}")

if __name__ == "__main__":
    asyncio.run(main())
