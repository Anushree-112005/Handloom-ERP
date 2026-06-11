import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:hari123@localhost:5432/dinesh_textile_erp')
    await conn.execute('ALTER TABLE sales_invoices ALTER COLUMN state_code TYPE VARCHAR(50);')
    await conn.close()
    print("Database updated.")

asyncio.run(run())
