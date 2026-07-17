import asyncio
import os
import sqlite3
import asyncpg
from dotenv import load_dotenv
from sqlalchemy import text
from app.core.database import engine, Base
import app.models

async def recreate_all():
    load_dotenv()
    
    # 1. Recreate Local SQLite database
    db_file = "textile_erp.db"
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("sqlite") or (not db_url and os.path.exists(db_file)):
        print("Recreating local SQLite tables...")
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
                print(f"Removed existing local SQLite database file '{db_file}'.")
            except Exception as e:
                print(f"Failed to remove SQLite file: {e}")
        
    # 2. Recreate PostgreSQL database tables
    is_sqlite = db_url.startswith("sqlite")
    
    if not is_sqlite:
        print("Connecting to PostgreSQL and dropping public schema CASCADE...")
        async with engine.begin() as conn:
            try:
                await conn.execute(text("DROP SCHEMA public CASCADE;"))
                await conn.execute(text("CREATE SCHEMA public;"))
                await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
                # In case the postgres user needs explicit grant
                try:
                    await conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
                except Exception:
                    pass
                print("PostgreSQL public schema dropped and recreated successfully.")
            except Exception as e:
                print(f"Failed to drop schema: {e}. Trying metadata drop_all...")
                try:
                    await conn.run_sync(Base.metadata.drop_all)
                except Exception as ex:
                    print(f"Metadata drop_all failed: {ex}")
                    
    print("Recreating all database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("All tables recreated empty and clean!")

if __name__ == "__main__":
    asyncio.run(recreate_all())
