import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.party_master import PartyMaster
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(PartyMaster))
        parties = res.scalars().all()
        print(f"Parties count: {len(parties)}")
        
asyncio.run(test())
