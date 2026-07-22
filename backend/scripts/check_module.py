import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

async def check_and_insert():
    load_dotenv()
    engine = create_async_engine(os.getenv('DATABASE_URL'))
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, name, key FROM modules WHERE key = 'status_update'"))
        rows = res.fetchall()
        print('Modules:', rows)
        if not rows:
            print("Inserting status_update module...")
            await conn.execute(text("INSERT INTO modules (name, key, sort_order) VALUES ('Status Update Module', 'status_update', 15)"))
            print("Done")

asyncio.run(check_and_insert())
