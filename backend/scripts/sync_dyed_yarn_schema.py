import asyncio
from sqlalchemy import text
from sqlalchemy.dialects import postgresql
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.dyed_yarn import DyedYarnReceived, DyedYarnReceivedItem

async def sync():
    dialect = postgresql.dialect()
    async with engine.begin() as conn:
        for table_name in ["dyed_yarn_received", "dyed_yarn_received_items"]:
            if table_name not in Base.metadata.tables:
                continue
            table = Base.metadata.tables[table_name]
            
            # get existing columns
            result = await conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}'"))
            existing_cols = {row[0] for row in result.fetchall()}
            
            # find missing
            for col in table.columns:
                if col.name not in existing_cols:
                    print(f"Adding {col.name} to {table_name}")
                    col_type = col.type.compile(dialect)
                    try:
                        await conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type}"))
                    except Exception as e:
                        print(f"Error adding {col.name}: {e}")

asyncio.run(sync())
