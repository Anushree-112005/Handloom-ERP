import asyncio
from sqlalchemy import text
from sqlalchemy.dialects import postgresql
from app.core.database import AsyncSessionLocal, engine, Base
import importlib
import pkgutil
import app.models

async def sync():
    # Load all models to ensure they are registered in Base.metadata
    for _, module_name, _ in pkgutil.iter_modules(app.models.__path__):
        importlib.import_module(f"app.models.{module_name}")

    dialect = postgresql.dialect()
    async with engine.begin() as conn:
        for table_name, table in Base.metadata.tables.items():
            # Check if table exists
            result = await conn.execute(text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '{table_name}')"))
            exists = result.scalar()
            if not exists:
                print(f"Table {table_name} does not exist. Please run alembic or create_all.")
                continue

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
