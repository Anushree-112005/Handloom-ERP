import asyncio
import sys
import os

# Add backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import all models so tables are registered with Base.metadata
import app.models
from app.core.database import engine, Base

async def reset_db():
    async with engine.begin() as conn:
        print("Starting manual database clean...")
        for table in reversed(Base.metadata.sorted_tables):
            try:
                # Do not delete alembic_version if it exists
                if table.name == "alembic_version":
                    continue
                await conn.execute(table.delete())
                print(f"Cleared table: {table.name}")
            except Exception as e:
                print(f"Error clearing {table.name}: {e}")
        print("Database manual clean completed successfully.")

if __name__ == "__main__":
    asyncio.run(reset_db())
