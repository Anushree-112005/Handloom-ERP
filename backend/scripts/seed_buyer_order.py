import os
import sys
import asyncio
import random
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

# Setup environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.models.party_master import PartyMaster
from app.models.buyer_order import BuyerOrder, BuyerOrderItem

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def seed_buyer_orders():
    async with AsyncSessionLocal() as session:
        # Fetch some realistic parties we generated
        result = await session.execute(
            select(PartyMaster).limit(10)
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
                status_remark="Regularly paying customer",
                max_crd_days=90,
                po_credit=30,
                po_max_crd=60,
                bill_credit=45,
                payment_detail="Standard bank transfer",
                payment_terms=party.payment_terms,
                outstanding=150000.0,
                overdue=0.0,
                due_30_days=50000.0,
                transport_mode="Road",
                transport_name=party.transport_name,
                party_terms="CIF",
                lr_type="To Pay",
                lr_terms="Delivery against payment",
                party_comp_date=date.today() + timedelta(days=45),
                exfactory_date=date.today() + timedelta(days=40),
                delivery_starting=date.today() + timedelta(days=35),
                delivery_at=party.city,
                delivery_place=party.city + " Warehouse",
                desp_mtr_min=100.0,
                desp_mtr_max=5000.0,
                process_sequence="Yarn Dyeing -> Weaving -> Processing",
                process_instruction="Ensure color fastness",
                email_to=party.email,
                email_cc="sales@dineshtex.com",
                yarn_instruction="Use combed yarn only",
                prod_instruction="Double check weaving defects",
                delivery_instruction="Handle with care, avoid moisture",
                remarks="Priority order for upcoming season"
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
                    sample_mtr=50.0,
                    buyer_style=f"Style-{random.choice(['A','B','C'])}{random.randint(10,99)}",
                    short_no=f"SN-{random.randint(100, 999)}",
                    design_no=f"D-{random.randint(1000, 9999)}",
                    gry_construction="40s X 40s / 120 X 80",
                    fabric_type=random.choice(["100% Cotton", "Polyester Cotton", "Viscose"]),
                    color=random.choice(["Navy Blue", "Crimson Red", "Jet Black", "Olive Green", "Optic White"]),
                    construction="40s X 40s / 120 X 80",
                    weaving_type="Plain",
                    pick_on_table=80,
                    print_name=random.choice(["Floral Print", "Geometric Lines", "Solid Base", "Stripes"]),
                    finish_reed=120,
                    finish_pick=80,
                    finish_width=63.0,
                    cuttable_width=62.0,
                    pattern=random.choice(["Check", "Stripe", "Solid", "Printed"]),
                    packing_type="Bale",
                    loom_type=random.choice(["Airjet", "Rapier", "Waterjet"]),
                    insurance="Yes",
                    packing_charge=250.0,
                    end_use="Shirting",
                    season="Summer 26",
                    party_comment="Ensure the selvedge is clean",
                    fabric_content=random.choice(["100% Cotton", "65% Poly 35% Cotton"]),
                    development_id=f"DEV-{random.randint(100, 999)}",
                    country=party.country,
                    combo="Base Combo",
                    currency=party.currency,
                    pc_type="Piece",
                    gsm=145.0,
                    price=random.choice([150.0, 220.0, 310.0, 185.0]),
                    gst_pct=5.0,
                    gst_rate=0.0,
                    rate=0.0,
                    amount=0.0,
                )
                item.gst_rate = float(item.price) * (float(item.gst_pct) / 100)
                item.rate = float(item.price) + float(item.gst_rate)
                item.amount = float(item.order_mtrs) * float(item.rate)
                item.total_mtr_yard = float(item.order_mtrs)
                bo.items.append(item)
            
            orders.append(bo)
            
        session.add_all(orders)
        await session.commit()
        print(f"Successfully inserted {len(orders)} Buyer Orders linked to the generated parties!")

if __name__ == "__main__":
    asyncio.run(seed_buyer_orders())
