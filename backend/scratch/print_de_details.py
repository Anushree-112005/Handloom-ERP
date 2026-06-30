import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.design_entry import DesignEntry

async def print_details():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(DesignEntry).where(DesignEntry.ds_ref_no == "REF-DE-00005"))
        de = res.scalars().first()
        if de:
            print("fabric_design_details:")
            print(de.fabric_design_details)

if __name__ == "__main__":
    asyncio.run(print_details())
