import os
import sys
import asyncio
import random
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.party_master import PartyMaster
from app.models.buyer_order import BuyerOrder, BuyerOrderItem

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def seed_buyer_orders():
    async with AsyncSessionLocal() as session:
        # Fetch some realistic parties we generated
        result = await session.execute(
            select(PartyMaster).where(~PartyMaster.company_name.ilike('%Sample%')).limit(10)
        )
        parties = result.scalars().all()
        
        if not parties:
            print("No valid parties found to create buyer orders for.")
            return
            
        orders = []
        for i, party in enumerate(parties):
            # Generate a BuyerOrder
            bo = BuyerOrder(
                ibpo_number=f"IBPO-2026-{random.randint(1000, 9999)}_{i+1}",
                order_date=date.today() - timedelta(days=random.randint(1, 30)),
                party_name=party.company_name,
                party_id=party.id,
                agent_name=party.agent_name,
                order_type=random.choice(["Regular", "Export", "Special"]),
                certified_type="Standard",
                buyer_name=party.buyer_name,
                billing_address=party.address,
                delivery_address=party.delivery_address,
                state=party.state,
                state_code=party.state_code,
                gst_no=party.gst_no,
                pan_no=party.pan_no,
                commission_type="Percentage",
                commission_pct=2.5,
                order_taken_by="Admin",
                merchandiser=party.merchandiser,
                nomination_type="Direct",
                regular_special="Regular",
                status="Active",
                payment_terms=party.payment_terms,
                transport_mode="Road",
                transport_name=party.transport_name,
                party_terms="CIF",
                lr_type="To Pay",
                party_comp_date=date.today() + timedelta(days=45),
                exfactory_date=date.today() + timedelta(days=40),
                delivery_starting=date.today() + timedelta(days=35),
                delivery_at=party.city,
                process_sequence="Yarn Dyeing -> Weaving -> Processing",
                process_instruction="Ensure color fastness",
            )
            
            # Add some Items
            for j in range(random.randint(1, 3)):
                item = BuyerOrderItem(
                    party_po_no=f"PO-{random.randint(10000, 99999)}",
                    po_date=bo.order_date,
                    point_of_contact=party.contact_person,
                    order_mtrs=random.choice([1000, 2000, 5000, 10000]),
                    uom="MTR",
                    tolerance_pct=5.0,
                    hsn_code=random.choice(["5208", "5209", "5407", "5512"]),
                    buyer_style=f"Style-{random.choice(['A','B','C'])}{random.randint(10,99)}",
                    fabric_type=random.choice(["100% Cotton", "Polyester Cotton", "Viscose"]),
                    color=random.choice(["Navy Blue", "Crimson Red", "Jet Black", "Olive Green", "Optic White"]),
                    construction="40s X 40s / 120 X 80",
                    weaving_type="Plain",
                    finish_width=63.0,
                    cuttable_width=62.0,
                    packing_type="Bale",
                    loom_type=random.choice(["Airjet", "Rapier", "Waterjet"]),
                    end_use="Shirting",
                    season="Summer 26",
                    country=party.country,
                    currency=party.currency,
                    price=random.choice([150.0, 220.0, 310.0, 185.0]),
                    gst_pct=5.0,
                    amount=0, # Calculated via a formula typically, set to 0 for mock
                )
                item.amount = float(item.order_mtrs) * float(item.price)
                bo.items.append(item)
            
            orders.append(bo)
            
        session.add_all(orders)
        await session.commit()
        print(f"Successfully inserted {len(orders)} Buyer Orders linked to the generated parties!")

if __name__ == "__main__":
    asyncio.run(seed_buyer_orders())
