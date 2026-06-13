import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.ppc import LoomMaster

async def seed():
    async with AsyncSessionLocal() as db:
        looms = [
            LoomMaster(loom_name="Loom L1", capacity_per_day=1200, running_speed_per_hr=50, efficiency_pct=85, status="Idle"),
            LoomMaster(loom_name="Loom L2", capacity_per_day=1000, running_speed_per_hr=42, efficiency_pct=80, status="Idle"),
            LoomMaster(loom_name="Loom L3", capacity_per_day=1500, running_speed_per_hr=62, efficiency_pct=90, status="Maintenance"),
            LoomMaster(loom_name="Loom L4", capacity_per_day=1200, running_speed_per_hr=50, efficiency_pct=82, status="Idle"),
            LoomMaster(loom_name="Loom L5", capacity_per_day=1000, running_speed_per_hr=42, efficiency_pct=78, status="Idle"),
        ]
        db.add_all(looms)
        await db.commit()

asyncio.run(seed())
print("Seeded looms.")
