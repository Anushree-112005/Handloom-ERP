import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import AsyncSessionLocal
from app.models.route_trip import Trip
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        trips = (await session.execute(select(Trip).limit(4))).scalars().all()
        for t in trips:
            t.status = 'In Progress'
        await session.commit()
        print('Updated 4 trips to In Progress')

if __name__ == '__main__':
    asyncio.run(main())
