import os
import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

# Assuming standard pg url based on sync script
DATABASE_URL = "postgresql+asyncpg://postgres:bala2021@localhost:5432/dinesh_textile_erp"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def cleanup():
    async with AsyncSessionLocal() as session:
        try:
            print("Clearing data from requested tables...")
            
            # Using CASCADE because these tables are referenced by items, schedules, etc.
            print("1. Emptying Buyer Orders...")
            await session.execute(text("TRUNCATE TABLE buyer_orders CASCADE;"))
            
            print("2. Emptying Design Entries / Textile Designs...")
            await session.execute(text("TRUNCATE TABLE design_entry CASCADE;"))
            await session.execute(text("TRUNCATE TABLE textile_designs CASCADE;"))
            
            print("3. Emptying Party Master...")
            # Note: CASCADE will also clear out tables that reference Party Master (like invoices, deliveries, inwards)
            await session.execute(text("TRUNCATE TABLE party_master CASCADE;"))

            await session.commit()
            print("\nSuccessfully removed data from all requested tables!")
        except Exception as e:
            await session.rollback()
            print(f"\nError during cleanup: {e}")

if __name__ == "__main__":
    # If the password is wrong, fallback to checking .env
    from dotenv import load_dotenv
    load_dotenv()
    env_url = os.getenv("DATABASE_URL")
    if env_url and "asyncpg" in env_url:
        engine = create_async_engine(env_url, echo=False)
        AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
        
    asyncio.run(cleanup())
