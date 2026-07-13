import asyncio
from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE design_entry ALTER COLUMN yarn_details TYPE TEXT;"))
            await conn.execute(text("ALTER TABLE design_entry ALTER COLUMN fabric_design_details TYPE TEXT;"))
            await conn.execute(text("ALTER TABLE design_entry ALTER COLUMN warp_summary TYPE TEXT;"))
            await conn.execute(text("ALTER TABLE design_entry ALTER COLUMN weft_summary TYPE TEXT;"))
            print("Successfully altered design_entry columns to TEXT")
        except Exception as e:
            print(f"Error altering columns: {e}")

if __name__ == '__main__':
    asyncio.run(main())
