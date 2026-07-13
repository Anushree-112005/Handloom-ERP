import asyncio
from app.core.database import engine, Base
from app.models.ppc import LoomMaster, LoomAllocation, ProductionLog, OperatorMaster

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("PPC tables successfully created!")

asyncio.run(init_models())
