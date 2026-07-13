import os
import sys
import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import update

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.design_entry import DesignEntry

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def fix():
    async with AsyncSessionLocal() as session:
        valid_json = json.dumps([
            {"type": "Warp", "yarn": "40s CW", "threads": 120, "color": "Bleached"},
            {"type": "Weft", "yarn": "40s CW", "threads": 80, "color": "Navy Blue"}
        ])
        
        await session.execute(
            update(DesignEntry).values(fabric_design_details=valid_json)
        )
        await session.commit()
        print("Fixed fabric_design_details format for all entries!")

if __name__ == "__main__":
    asyncio.run(fix())
