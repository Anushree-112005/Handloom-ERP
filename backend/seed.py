import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.sub_master import SubMaster
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed():
    async with AsyncSessionLocal() as db:
        for val in ['Satin Cotton', 'Poplin', 'Twill', 'Grey Satin']:
            db.add(SubMaster(entity='fabric_type_master', name=val, is_active=True))
        await db.commit()
        
asyncio.run(seed())
