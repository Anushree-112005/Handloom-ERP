import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)

async def update():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE company_setting ADD COLUMN gstin VARCHAR(50);"))
            print("Added gstin column")
        except Exception as e:
            print("gstin column might already exist:", e)
            
        try:
            await conn.execute(text("ALTER TABLE company_setting ADD COLUMN pan VARCHAR(50);"))
            print("Added pan column")
        except Exception as e:
            print("pan column might already exist:", e)
            
        try:
            await conn.execute(text("ALTER TABLE company_setting ADD COLUMN financial_year VARCHAR(50);"))
            print("Added financial_year column")
        except Exception as e:
            print("financial_year column might already exist:", e)
            
    print("Database update complete.")

if __name__ == "__main__":
    asyncio.run(update())
