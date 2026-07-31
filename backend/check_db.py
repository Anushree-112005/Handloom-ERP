import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect("postgresql://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp")
    rows = await conn.fetch("SELECT vendor_id, vendor_name, contact_info FROM vendors ORDER BY vendor_id DESC LIMIT 5")
    for r in rows:
        print(dict(r))
    await conn.close()

asyncio.run(main())
