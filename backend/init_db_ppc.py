import asyncio
from app.core.database import engine
from app.models.ppc import LoomMaster, LoomAllocation, ProductionLog

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(LoomMaster.metadata.create_all)

asyncio.run(init_models())
