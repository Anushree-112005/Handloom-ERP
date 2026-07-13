import os
import sys
import asyncio
import random
import string
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.party_master import PartyMaster

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

def rstr(chars, length):
    return ''.join(random.choice(chars) for _ in range(length))

async def seed_data():
    async with AsyncSessionLocal() as session:
        parties = []
        party_types = ["Sales", "Purchase", "Logistics", "Agent"]
        groups = ["Sundry Debtors", "Sundry Creditors"]
        grades = ["A", "B", "C"]
        cities = ["Mumbai", "Delhi", "Chennai", "Kolkata", "Coimbatore", "Tiruppur", "Surat"]
        states = ["Maharashtra", "Delhi", "Tamil Nadu", "West Bengal", "Tamil Nadu", "Tamil Nadu", "Gujarat"]
        names = ["Tex", "Fabrics", "Garments", "Weavers", "Spinners", "Enterprises", "Traders", "Logistics", "Mills"]
        person_names = ["Ramesh", "Suresh", "Arun", "Karthik", "Dinesh", "Rahul", "Priya", "Anjali"]
        
        for i in range(1, 21):
            ptype = random.choice(party_types)
            cname = f"{random.choice(names)} {random.randint(100, 999)} Pvt Ltd"
            city_idx = random.randint(0, len(cities) - 1)
            
            p = PartyMaster(
                customer_code=f"CUST_{random.randint(1000,9999)}_{i}",
                party_type=ptype,
                company_name=cname,
                party_group=random.choice(groups),
                customer_grade=random.choice(grades),
                status="Active",
                address_type="Bill",
                address=f"{random.randint(1, 100)}, Main Street, Phase {random.randint(1,3)}",
                city=cities[city_idx],
                district=cities[city_idx],
                state=states[city_idx],
                state_code=str(random.randint(10, 37)),
                pin_code=f"641{random.randint(100, 999)}",
                country="India",
                sales_region=random.choice(["North", "South", "East", "West"]),
                currency="INR",
                phone=f"0422-{random.randint(1000000, 9999999)}",
                mobile=f"9{random.randint(100000000, 999999999)}",
                email=f"contact@company{i}.com",
                contact_person=f"{random.choice(person_names)}",
                gst_no=f"{random.randint(10,37)}{rstr(string.ascii_uppercase, 5)}{random.randint(1000,9999)}{rstr(string.ascii_uppercase, 1)}1Z{rstr(string.ascii_uppercase, 1)}",
                gst_type="Regular",
                pan_no=f"{rstr(string.ascii_uppercase, 5)}{random.randint(1000,9999)}{rstr(string.ascii_uppercase, 1)}",
                tin_no=f"TIN{random.randint(100000,999999)}",
                cst_no=f"CST{random.randint(100000,999999)}",
                tally_no=f"Tally_{i}",
                address_sno=str(i),
                tcs_applicable=random.choice(["Yes", "No"]),
                tds="194Q",
                tds_percent=random.choice([0.1, 1.0, 2.0]),
                pc_id=f"PC{i}",
                merchandiser=f"{random.choice(person_names)}",
                manager=f"{random.choice(person_names)}",
                account_incharge=f"{random.choice(person_names)}",
                agent_name=f"Agent {i}",
                buyer_name=f"Buyer {i}",
                bank_name="HDFC Bank",
                bank_account=str(random.randint(10000000000, 99999999999)),
                ifsc_code=f"HDFC{random.randint(1000000,9999999)}",
                credit_days=random.choice([15, 30, 45, 60]),
                credit_limit=float(random.randint(100000, 5000000)),
                deliver_party_name=cname,
                payment_terms=f"Net {random.choice([15, 30, 45, 60])} Days",
                transport_name="Express Transport",
                delivery_address=f"Delivery Addr, {cities[city_idx]}"
            )
            parties.append(p)
            
        session.add_all(parties)
        await session.commit()
        print(f"Successfully inserted {len(parties)} sample party master records!")

if __name__ == "__main__":
    asyncio.run(seed_data())
