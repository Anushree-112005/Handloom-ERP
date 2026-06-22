import asyncio
from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'yarn_purchase_indent_details';"))
        columns = result.fetchall()
        print("Columns in yarn_purchase_indent_details:")
        for col in columns:
            print(f"  {col[0]}: {col[1]}")

if __name__ == '__main__':
    asyncio.run(main())
