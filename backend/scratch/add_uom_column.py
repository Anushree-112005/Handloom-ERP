import asyncio
from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE yarn_purchase_indent_details ADD COLUMN uom VARCHAR(50) DEFAULT 'KGS';"))
            print("Successfully added uom column to yarn_purchase_indent_details")
        except Exception as e:
            print(f"Error or already exists: {e}")

if __name__ == '__main__':
    asyncio.run(main())
