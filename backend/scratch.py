import asyncio
from app.core.database import AsyncSessionLocal
from app.models.party_master import PartyMaster
from sqlalchemy import select, func

async def run():
    try:
        async with AsyncSessionLocal() as db:
            count_q = await db.execute(select(func.count(PartyMaster.id)))
            count = count_q.scalar() or 0
            customer_code = f"{(count + 1) + 2400}"
            party = PartyMaster(party_type="Sales", company_name="Test Company", customer_code=customer_code)
            db.add(party)
            await db.commit()
            await db.refresh(party)
            print("Success:", party.id)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(run())
