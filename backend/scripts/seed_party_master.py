import os
import sys
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.party_master import PartyMaster
from finance_app.models.ledger import Ledger
from finance_app.models.ledger_group import LedgerGroup
from finance_app.models.inventory import Location
from app.models.log_report import LogReport

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def seed_data():
    async with AsyncSessionLocal() as session:
        parties_data = [
            {
                "customer_code": "CUST_9421",
                "party_type": "Sales",
                "company_name": "Zenith Retail Networks",
                "party_group": "Sundry Debtors",
                "customer_grade": "A",
                "status": "Active",
                "address_type": "Bill",
                "address": "452, Brigade Road, Phase 1",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "state_code": "29",
                "pin_code": "560001",
                "country": "India",
                "sales_region": "South",
                "currency": "INR",
                "phone": "080-25589123",
                "mobile": "9845012345",
                "email": "procurement@zenithretail.in",
                "contact_person": "Ramesh Kumar",
                "gst_no": "29ABCDE1234F1Z5",
                "gst_type": "Regular",
                "pan_no": "ABCDE1234F",
                "tin_no": "TIN892341",
                "cst_no": "CST892341",
                "tally_no": "Tally_ZN",
                "address_sno": "1",
                "tcs_applicable": "Yes",
                "tds": "194Q",
                "tds_percent": 0.1,
                "pc_id": "PC_BLR_01",
                "merchandiser": "Sanjay Singh",
                "manager": "Anita Desai",
                "account_incharge": "Vikram Sethi",
                "agent_name": "Direct",
                "buyer_name": "Zenith Central",
                "bank_name": "HDFC Bank",
                "bank_account": "50200012345678",
                "ifsc_code": "HDFC0000053",
                "credit_days": 45,
                "credit_limit": 2500000.0,
                "deliver_party_name": "Zenith Retail Warehouse",
                "payment_terms": "Net 45 Days",
                "transport_name": "VRL Logistics",
                "delivery_address": "Plot 12, KIADB Industrial Area, Peenya, Bengaluru"
            },
            {
                "customer_code": "VEND_4192",
                "party_type": "Purchase",
                "company_name": "Sri Krishna Mills",
                "party_group": "Sundry Creditors",
                "customer_grade": "B",
                "status": "Active",
                "address_type": "Bill",
                "address": "15, Avinashi Road, Peelamedu",
                "city": "Coimbatore",
                "district": "Coimbatore",
                "state": "Tamil Nadu",
                "state_code": "33",
                "pin_code": "641004",
                "country": "India",
                "sales_region": "South",
                "currency": "INR",
                "phone": "0422-2578901",
                "mobile": "9443210987",
                "email": "sales@srikrishnamills.com",
                "contact_person": "Natarajan S",
                "gst_no": "33AACCS1234M1Z2",
                "gst_type": "Regular",
                "pan_no": "AACCS1234M",
                "tin_no": "TIN541290",
                "cst_no": "CST541290",
                "tally_no": "Tally_SKM",
                "address_sno": "1",
                "tcs_applicable": "No",
                "tds": "194C",
                "tds_percent": 2.0,
                "pc_id": "PC_CBE_02",
                "merchandiser": "Karthik Raj",
                "manager": "Meena Kumari",
                "account_incharge": "Sundaram",
                "agent_name": "Textile Brokers Co",
                "buyer_name": "Internal Production",
                "bank_name": "State Bank of India",
                "bank_account": "30100098765412",
                "ifsc_code": "SBIN0000827",
                "credit_days": 30,
                "credit_limit": 5000000.0,
                "deliver_party_name": "Sri Krishna Godown",
                "payment_terms": "Net 30 Days",
                "transport_name": "KPN Speed Parcel",
                "delivery_address": "Godown 4, SIDCO Industrial Estate, Coimbatore"
            },
            {
                "customer_code": "LOG_1055",
                "party_type": "Logistics",
                "company_name": "Blue Dart Express Services",
                "party_group": "Sundry Creditors",
                "customer_grade": "A",
                "status": "Active",
                "address_type": "Bill",
                "address": "B-21, Okhla Industrial Area, Phase II",
                "city": "New Delhi",
                "district": "South East Delhi",
                "state": "Delhi",
                "state_code": "07",
                "pin_code": "110020",
                "country": "India",
                "sales_region": "North",
                "currency": "INR",
                "phone": "011-41234567",
                "mobile": "9811122334",
                "email": "billing.delhi@bluedart.co.in",
                "contact_person": "Amit Sharma",
                "gst_no": "07AABCB2345Q1Z7",
                "gst_type": "Regular",
                "pan_no": "AABCB2345Q",
                "tin_no": "TIN112233",
                "cst_no": "CST112233",
                "tally_no": "Tally_BDART",
                "address_sno": "1",
                "tcs_applicable": "Yes",
                "tds": "194C",
                "tds_percent": 1.0,
                "pc_id": "PC_DEL_03",
                "merchandiser": "Not Applicable",
                "manager": "Rohit Verma",
                "account_incharge": "Pooja Das",
                "agent_name": "Direct",
                "buyer_name": "Not Applicable",
                "bank_name": "ICICI Bank",
                "bank_account": "000705012345",
                "ifsc_code": "ICIC0000007",
                "credit_days": 15,
                "credit_limit": 1000000.0,
                "deliver_party_name": "Blue Dart Hub",
                "payment_terms": "15 Days cycle",
                "transport_name": "Self",
                "delivery_address": "Hub Center, Okhla, New Delhi"
            },
            {
                "customer_code": "AGT_8802",
                "party_type": "Agent",
                "company_name": "Global Textile Brokers",
                "party_group": "Sundry Creditors",
                "customer_grade": "B",
                "status": "Active",
                "address_type": "Bill",
                "address": "Shop No 45, Ring Road Textile Market",
                "city": "Surat",
                "district": "Surat",
                "state": "Gujarat",
                "state_code": "24",
                "pin_code": "395002",
                "country": "India",
                "sales_region": "West",
                "currency": "INR",
                "phone": "0261-2345678",
                "mobile": "9825011223",
                "email": "commission@globaltextile.in",
                "contact_person": "Jignesh Patel",
                "gst_no": "24AAECG9876R1Z3",
                "gst_type": "Regular",
                "pan_no": "AAECG9876R",
                "tin_no": "TIN776655",
                "cst_no": "CST776655",
                "tally_no": "Tally_GTB",
                "address_sno": "1",
                "tcs_applicable": "No",
                "tds": "194H",
                "tds_percent": 5.0,
                "pc_id": "PC_SUR_04",
                "merchandiser": "Suresh Raina",
                "manager": "Hardik Shah",
                "account_incharge": "Bhavin Desai",
                "agent_name": "Self",
                "buyer_name": "Multiple",
                "bank_name": "Axis Bank",
                "bank_account": "912010045678912",
                "ifsc_code": "UTIB0000047",
                "credit_days": 60,
                "credit_limit": 500000.0,
                "deliver_party_name": "Not Applicable",
                "payment_terms": "Commission on Realization",
                "transport_name": "Not Applicable",
                "delivery_address": "Not Applicable"
            }
        ]

        DEFAULT_COMPANY_ID = 1
        
        from sqlalchemy import delete
        codes = [d["customer_code"] for d in parties_data]
        await session.execute(delete(PartyMaster).where(PartyMaster.customer_code.in_(codes)))
        await session.commit()
        
        from finance_app.database import SessionLocal
        sqlite_db = SessionLocal()
        
        for data in parties_data:
            # 1. Create PartyMaster (Postgres)
            party = PartyMaster(**data)
            session.add(party)
            
            # 5. Auto-create Log Report (Postgres)
            new_log = LogReport(
                user_name="System Seed",
                user_id="seed",
                mode="Save",
                module="Party Master",
                remarks=f"New Party Added: {data['company_name']} ({data['party_type']})"
            )
            session.add(new_log)

            # --- Finance & Inventory (SQLite) ---
            ptype = data.get("party_type", "").lower()
            pgroup = data.get("party_group", "").lower()
            
            ledger_group_name = "Sundry Creditors"
            if "sales" in ptype or "buyer" in ptype or "debtor" in pgroup:
                ledger_group_name = "Sundry Debtors"
            
            ledger_group_obj = sqlite_db.query(LedgerGroup).filter(LedgerGroup.name == ledger_group_name, LedgerGroup.company_id == DEFAULT_COMPANY_ID).first()
            group_id = ledger_group_obj.id if ledger_group_obj else None

            # 3. Auto-create Ledger (SQLite)
            existing_ledger = sqlite_db.query(Ledger).filter(Ledger.name == data["company_name"], Ledger.company_id == DEFAULT_COMPANY_ID).first()
            if not existing_ledger:
                new_ledger = Ledger(
                    name=data["company_name"],
                    group=ledger_group_name,
                    group_id=group_id,
                    party_type=data["party_type"],
                    gstin=data.get("gst_no"),
                    pan=data.get("pan_no"),
                    address=data.get("address"),
                    state_code=data.get("state_code"),
                    company_id=DEFAULT_COMPANY_ID
                )
                sqlite_db.add(new_ledger)

            # 4. Auto-create Inventory Location (SQLite)
            existing_loc = sqlite_db.query(Location).filter(Location.name == data["company_name"], Location.company_id == DEFAULT_COMPANY_ID).first()
            if not existing_loc:
                new_location = Location(
                    name=data["company_name"],
                    company_id=DEFAULT_COMPANY_ID
                )
                sqlite_db.add(new_location)

        await session.commit()
        sqlite_db.commit()
        sqlite_db.close()
        print(f"Successfully inserted {len(parties_data)} party master records along with corresponding Ledgers, Locations, and Logs!")
        
        # Add test Buyer Orders for workflow verification
        from app.models.buyer_order import BuyerOrder, BuyerOrderItem
        from datetime import date
        
        # Test Domestic Order
        bo_domestic = BuyerOrder(
            ibpo_number="IBPO-99991",
            order_date=date.today(),
            party_name="Zenith Retail Networks",
            order_type="Domestic",
            status="Active",
            items=[
                BuyerOrderItem(
                    design_no="D-101",
                    color="Red",
                    fabric_type="Cotton",
                    order_mtrs=1000,
                    rate=150.00
                )
            ]
        )
        
        # Test Export Order
        bo_export = BuyerOrder(
            ibpo_number="IBPO-99992",
            order_date=date.today(),
            party_name="Global Textile Brokers",
            order_type="Export",
            status="Active",
            items=[
                BuyerOrderItem(
                    design_no="D-202",
                    color="Blue",
                    fabric_type="Linen",
                    order_mtrs=2000,
                    rate=250.00
                )
            ]
        )
        
        # Let's insert them if they don't exist
        from app.models.notification import Notification
        from sqlalchemy import delete
        
        # Cleanup existing test orders to refresh them
        await session.execute(delete(BuyerOrder).where(BuyerOrder.ibpo_number.in_(["IBPO-99991", "IBPO-99992"])))
        await session.commit()
        
        for bo in [bo_domestic, bo_export]:
            session.add(bo)
            await session.flush() # get id
            
            if bo.order_type == "Domestic":
                notif = Notification(user_role="Design Team", message=f"New Order Domestic — Design Required for {bo.ibpo_number}", related_ibpo=bo.ibpo_number)
                session.add(notif)
            elif bo.order_type == "Export":
                notif1 = Notification(user_role="Design Team", message=f"New Order Export — Design Required for {bo.ibpo_number}", related_ibpo=bo.ibpo_number)
                notif2 = Notification(user_role="Export Documentation Staff", message=f"New Export Order received for {bo.ibpo_number}", related_ibpo=bo.ibpo_number)
                session.add_all([notif1, notif2])
                
        await session.commit()
        print("Successfully inserted test Buyer Orders (Domestic & Export) and their Notifications!")

if __name__ == "__main__":
    asyncio.run(seed_data())
