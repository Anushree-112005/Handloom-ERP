import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from sqlalchemy import text
from app.core.database import engine

async def main():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN received_count VARCHAR(50);"))
            print("Successfully added received_count column to dyed_yarn_received_items table.")
        except Exception as e:
            print("Error: ", e)

if __name__ == '__main__':
    asyncio.run(main())
