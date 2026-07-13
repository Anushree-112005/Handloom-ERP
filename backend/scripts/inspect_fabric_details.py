# Print complete fabric design details
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def main():
    url = "postgresql+asyncpg://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT design_no, total_ends, reed, pick_ot, selvage_waste, total_mtr, crimp_pct, skg_pct, dyeing_loss_pct, warp_mtr, weft_pro_mtr, fabric_design_details FROM design_entry WHERE id=1214;"))
        row = result.fetchone()
        if row:
            print("Design:", row[0])
            print("total_ends:", row[1])
            print("reed:", row[2])
            print("pick_ot:", row[3])
            print("selvage_waste:", row[4])
            print("total_mtr:", row[5])
            print("crimp_pct:", row[6])
            print("skg_pct:", row[7])
            print("dyeing_loss_pct:", row[8])
            print("warp_mtr:", row[9])
            print("weft_pro_mtr:", row[10])
            details = json.loads(row[11])
            print("\nFabric Design Details:")
            for idx, item in enumerate(details):
                print(f"Row {idx+1}: {item.get('type')}, {item.get('yarn_count')}, {item.get('color')}, threads={item.get('threads')}")
                
if __name__ == "__main__":
    asyncio.run(main())
