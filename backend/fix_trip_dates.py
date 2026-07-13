import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import AsyncSessionLocal
from app.models.route_trip import Trip
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        trips = (await session.execute(select(Trip))).scalars().all()
        for t in trips:
            original_date = t.trip_date
            if t.trip_date and "/" in t.trip_date:
                parts = t.trip_date.split("/")
                if len(parts) == 3 and len(parts[2]) == 4:
                    new_date = f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
                    t.trip_date = new_date
                    print(f"Updated Trip ID {t.id}: {original_date} -> {new_date}")
        await session.commit()
        print("Done updating trip dates!")

if __name__ == "__main__":
    asyncio.run(main())
