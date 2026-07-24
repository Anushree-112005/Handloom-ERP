import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp')
    async with engine.begin() as conn:
        res = await conn.execute(text('SELECT employee_code, username, password_hash FROM employee LIMIT 5;'))
        rows = res.fetchall()
        for row in rows:
            print(f"Code: {row[0]}, Username: {row[1]}")
    await engine.dispose()

asyncio.run(main())
