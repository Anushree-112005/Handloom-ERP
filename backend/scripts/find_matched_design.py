# Find the design entry that matches the screenshot
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def main():
    url = "postgresql+asyncpg://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT id, design_no, total_ends, reed, pick_ot, selvage_waste, total_mtr, crimp_pct, skg_pct, dyeing_loss_pct, warp_mtr, weft_pro_mtr, warp_summary, weft_summary FROM design_entry;"))
        rows = result.fetchall()
        for row in rows:
            # Warp Subtotal in screenshot is 4174, Ends: 370, Extra: 104
            # Weft Subtotal in screenshot is 4656, Ends: 424
            # Let's search for a row with selvage_waste or total_ends matching
            try:
                warp_sum = json.loads(row[12]) if row[12] else []
                weft_sum = json.loads(row[13]) if row[13] else []
                total_warp_ends = sum(item.get('total_ends', 0) for item in warp_sum)
                total_weft_ends = sum(item.get('total_ends', 0) for item in weft_sum)
                if total_warp_ends == 4174 or total_weft_ends == 4656 or row[1] == 'DEPL-00001' or row[2] == 4714:
                    print(f"Matched Design: {row[1]} (ID: {row[0]})")
                    print(f"  total_ends={row[2]}, reed={row[3]}, pick_ot={row[4]}, selvage_waste={row[5]}")
                    print(f"  total_mtr={row[6]}, crimp_pct={row[7]}, skg_pct={row[8]}, dyeing_loss_pct={row[9]}")
                    print(f"  warp_mtr={row[10]}, weft_pro_mtr={row[11]}")
                    print(f"  warp_sum: {warp_sum}")
                    print(f"  weft_sum: {weft_sum}")
            except Exception as e:
                pass

if __name__ == "__main__":
    asyncio.run(main())
