# Query PostgreSQL for design entry
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    url = "postgresql+asyncpg://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, design_no, total_ends, reed, pick_ot, selvage_waste, total_mtr, crimp_pct, skg_pct, dyeing_loss_pct, warp_mtr, weft_pro_mtr, yarn_details, fabric_design_details FROM design_entry ORDER BY id DESC LIMIT 5;"))
        rows = result.fetchall()
        print(f"Found {len(rows)} design entries.")
        for row in rows:
            print(f"\n======================================")
            print(f"ID: {row[0]}, Design No: {row[1]}")
            print(f"total_ends: {row[2]}, reed: {row[3]}, pick_ot: {row[4]}, selvage_waste: {row[5]}")
            print(f"total_mtr: {row[6]}, crimp_pct: {row[7]}, skg_pct: {row[8]}, dyeing_loss_pct: {row[9]}")
            print(f"warp_mtr: {row[10]}, weft_pro_mtr: {row[11]}")
            print(f"yarn_details: {row[12]}")
            print(f"fabric_design_details: {row[13][:500]}...")

if __name__ == "__main__":
    asyncio.run(main())
