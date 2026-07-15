import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models.notification import Notification

async def create_table():
    async with engine.begin() as conn:
        await conn.run_sync(Notification.metadata.create_all)
    print("Notification table created")

if __name__ == "__main__":
    asyncio.run(create_table())
