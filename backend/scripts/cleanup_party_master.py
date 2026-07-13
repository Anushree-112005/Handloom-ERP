import os
import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, delete

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.party_master import PartyMaster

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def cleanup():
    async with AsyncSessionLocal() as session:
        # Find records that have 'Sample' or 'Mock' in their names
        result = await session.execute(
            select(PartyMaster).where(
                PartyMaster.company_name.ilike('%Sample%') | 
                PartyMaster.agent_name.ilike('%Mock%') | 
                PartyMaster.customer_code.ilike('%SMPL%')
            )
        )
        to_delete = result.scalars().all()
        count = len(to_delete)
        
        if count > 0:
            await session.execute(
                delete(PartyMaster).where(
                    PartyMaster.company_name.ilike('%Sample%') | 
                    PartyMaster.agent_name.ilike('%Mock%') | 
                    PartyMaster.customer_code.ilike('%SMPL%')
                )
            )
            await session.commit()
            print(f"Successfully deleted {count} old records containing 'Sample' or 'Mock'!")
        else:
            print("No records with 'Sample' or 'Mock' were found.")

if __name__ == "__main__":
    asyncio.run(cleanup())
