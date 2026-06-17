import asyncio
from datetime import datetime
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.ppc import LoomMaster
from sqlalchemy import text

async def seed():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(text("SELECT count(*) FROM loom_master"))
        count = result.scalar()
        if count > 0:
            print(f"Found {count} looms already in the database. Seeding additional looms might cause duplicates, but we'll try with different names if needed, or just clear and seed.")
            # Clear existing for fresh seed or just append
            pass
            
        print("Seeding 20 looms into LoomMaster...")
        for i in range(1, 21):
            # Create unique loom names even if re-run
            loom_name = f"LM-1{i:03d}" 
            loom = LoomMaster(
                loom_name=loom_name,
                loom_type="Air Jet" if i % 2 == 0 else "Rapier",
                manufacturer="Tsudakoma" if i % 2 == 0 else "Picanol",
                model_number="ZA103" if i % 2 == 0 else "OMNIplus",
                installation_date=datetime(2020, 1, 1),
                capacity_per_day=300.0,
                running_speed_per_hr=800.0 if i % 2 == 0 else 600.0,
                efficiency_pct=85.0 + (i % 10),
                reed_width=190.0,
                total_ends=10000 + (i * 100),
                status="Running" if i % 3 != 0 else "Idle",
                location="Shed A" if i <= 10 else "Shed B",
                remarks="Seeded loom"
            )
            db.add(loom)
        
        try:
            await db.commit()
            print("Successfully seeded 20 looms!")
        except Exception as e:
            await db.rollback()
            print(f"Error seeding looms: {e}")

if __name__ == "__main__":
    asyncio.run(seed())
