import asyncio
import asyncpg
from app.core.config import settings

async def main():
    conn = await asyncpg.connect(str(settings.DATABASE_URL).replace('postgresql+asyncpg', 'postgresql'))
    await conn.execute("UPDATE employees SET user_type = 'Super Admin' WHERE name = 'superadmin' OR username = 'superadmin'")
    await conn.execute("UPDATE employees SET user_type = 'Admin' WHERE name = 'karthika' OR username = 'admin' OR employee_code = 'admin'")
    rows = await conn.fetch("SELECT employee_code, name, user_type FROM employees WHERE user_type IN ('Super Admin', 'Admin')")
    for row in rows:
        print(dict(row))
    await conn.close()

asyncio.run(main())
