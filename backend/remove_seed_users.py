import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)

emp_codes = [f"EMP{str(i).zfill(3)}" for i in range(1, 11)]

async def remove_seeded_users():
    async with engine.begin() as conn:
        print(f"Removing seeded users: {emp_codes}...")
        
        # We use a tuple for the IN clause
        await conn.execute(
            text("DELETE FROM employees WHERE employee_code = ANY(:codes)"),
            {"codes": emp_codes}
        )
        
    print("Seeded users removed successfully!")

if __name__ == "__main__":
    asyncio.run(remove_seeded_users())
