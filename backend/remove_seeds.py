import os
import sys
import asyncio
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.party_master import PartyMaster
from app.models.buyer_order import BuyerOrder, BuyerOrderItem
from finance_app.database import SessionLocal
from finance_app.models.ledger import Ledger
from finance_app.models.inventory import Location
from app.models.notification import Notification

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def remove_seeds():
    seed_codes = ["CUST_9421", "VEND_4192", "LOG_1055", "AGT_8802"]
    seed_names = ["Zenith Retail Networks", "Sri Krishna Mills", "Blue Dart Express Services", "Global Textile Brokers"]
    seed_ibpos = ["IBPO-99991", "IBPO-99992"]

    async with AsyncSessionLocal() as session:
        # Get matching BuyerOrder IDs to delete items first
        res = await session.execute(select(BuyerOrder.id).where(BuyerOrder.ibpo_number.in_(seed_ibpos)))
        order_ids = [row[0] for row in res.fetchall()]
        
        if order_ids:
            # Delete items first due to foreign key constraint
            await session.execute(delete(BuyerOrderItem).where(BuyerOrderItem.order_id.in_(order_ids)))
        
        # Remove from Buyer Orders
        await session.execute(delete(BuyerOrder).where(BuyerOrder.ibpo_number.in_(seed_ibpos)))
        
        # Remove Notifications for those orders
        await session.execute(delete(Notification).where(Notification.related_ibpo.in_(seed_ibpos)))
        
        # Remove from Party Master
        await session.execute(delete(PartyMaster).where(PartyMaster.customer_code.in_(seed_codes)))
        
        await session.commit()
        print("Removed Seeded Party Master, Buyer Orders, and Items from Postgres.")

    # Remove from Finance/Inventory SQLite
    try:
        sqlite_db = SessionLocal()
        sqlite_db.query(Ledger).filter(Ledger.name.in_(seed_names)).delete(synchronize_session=False)
        sqlite_db.query(Location).filter(Location.name.in_(seed_names)).delete(synchronize_session=False)
        sqlite_db.commit()
        sqlite_db.close()
        print("Removed corresponding Ledgers and Locations from SQLite.")
    except Exception as e:
        print(f"Error in SQLite cleanup: {e}")

if __name__ == "__main__":
    asyncio.run(remove_seeds())
