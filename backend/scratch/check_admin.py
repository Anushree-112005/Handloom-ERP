import asyncio
from app.core.database import AsyncSessionLocal
from app.models.employee import Employee
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Employee))
        print('Employees in DB:', [e.employee_code for e in res.scalars().all()])

if __name__ == "__main__":
    asyncio.run(check())
