import sys
import os
import asyncio
import site

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
site.addsitedir(backend_dir)

from app.core.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
import app.models

from sqlalchemy import text

async def update_tables():
    print("Updating existing DDD tables with new columns (if they don't exist)...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE erp_current_stock ADD COLUMN status VARCHAR(50) DEFAULT 'AVAILABLE';"))
            print("Added 'status' to erp_current_stock")
        except Exception:
            pass # Column likely exists
            
        try:
            await conn.execute(text("ALTER TABLE erp_stock_movements ADD COLUMN status VARCHAR(50) DEFAULT 'AVAILABLE';"))
            print("Added 'status' to erp_stock_movements")
        except Exception:
            pass # Column likely exists

        try:
            await conn.execute(text("ALTER TABLE erp_stores ADD COLUMN store_type VARCHAR(50) DEFAULT 'MAIN';"))
            print("Added 'store_type' to erp_stores")
        except Exception:
            pass
            
        try:
            await conn.execute(text("ALTER TABLE erp_stores ADD COLUMN parent_store_id INTEGER NULL;"))
            print("Added 'parent_store_id' to erp_stores")
        except Exception:
            pass

async def create_tables():
    print("Creating new DDD tables in the database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")
    await update_tables()

if __name__ == "__main__":
    asyncio.run(create_tables())
