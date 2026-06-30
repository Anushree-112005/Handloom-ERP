import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import engine, AsyncSessionLocal
from app.models.yarn_inward import YarnInward, YarnInwardItem
from app.models.design_entry import DesignEntry
from app.models.yarn_dyeing_po import YarnDyeingPO, YarnDyeingPOItem

async def test_integration():
    async with AsyncSessionLocal() as session:
        # Check design entries
        res = await session.execute(select(DesignEntry).limit(5))
        de_list = res.scalars().all()
        print("Found design entries count:", len(de_list))
        for de in de_list:
            print(f"DE Ref: {de.ds_ref_no}, IBPO No: {de.ibpo_no}")

        # Check yarn inwards
        res_inward = await session.execute(select(YarnInward).options(selectinload(YarnInward.items)).limit(5))
        inward_list = res_inward.scalars().all()
        print("Found Yarn Inward count:", len(inward_list))
        for yi in inward_list:
            print(f"Inward Ref: {yi.ref_no}, Items count: {len(yi.items)}")
            for item in yi.items:
                print(f"  Item - Yarn Count: {item.yarn_count}, Color: {item.colour}, Lot No: {item.lot_no}, Kgs: {item.kgs}")

if __name__ == "__main__":
    asyncio.run(test_integration())
