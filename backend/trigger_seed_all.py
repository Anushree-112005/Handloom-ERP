import asyncio
from app.core.database import AsyncSessionLocal
from app.seed_all import seed_all_data
from app.modules.hr.models import HRItem
from sqlalchemy import delete

async def main():
    async with AsyncSessionLocal() as session:
        # First delete all HRItem records so that the check in seed_all_data is bypassed
        print("Clearing HRItem to force trigger seed_all_data...")
        await session.execute(delete(HRItem))
        await session.commit()
        
        print("Executing seed_all_data...")
        await seed_all_data(session)
        print("Successfully seeded all data!")

if __name__ == "__main__":
    asyncio.run(main())
