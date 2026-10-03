import sys
import os
import asyncio
from datetime import datetime, date

# Ensure backend path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.employee import Employee
from app.models.party_master import PartyMaster
from app.models.design_entry import DesignEntry
from app.models.buyer_order import BuyerOrder, BuyerOrderItem
from sqlalchemy import select

async def seed_full_enterprise_data():
    async with AsyncSessionLocal() as session:
        print("--- 1. SEEDING REALISTIC EMPLOYEES ACROSS DEPARTMENTS ---")
        employees_to_seed = [
            ("merch01", "Anita Krishnan", "Merchandising", "Senior Merchandiser", "anita@handloom-erp.com"),
            ("merch02", "Sanjay Verma", "Merchandising", "Assistant Merchandiser", "sanjay@handloom-erp.com"),
            ("merch03", "Divya Pillai", "Merchandising", "Export Merchandiser", "divya@handloom-erp.com"),
            ("des01", "Kavita Sundaram", "Design", "Chief Textile Designer", "kavita@handloom-erp.com"),
            ("ppc01", "G. Narayanan", "Production", "PPC Manager", "narayanan@handloom-erp.com"),
            ("weav01", "K. Ramanathan", "Weaving", "Master Weaver", "ramanathan@handloom-erp.com"),
            ("weav02", "M. Palaniswamy", "Weaving", "Senior Loom Technician", "palaniswamy@handloom-erp.com"),
            ("prod01", "P. Murugan", "Production", "Weaving Supervisor", "murugan@handloom-erp.com"),
            ("qc01", "Senthil Kumar", "Quality", "Senior Quality Inspector", "senthil@handloom-erp.com"),
            ("qc02", "Radha Mohan", "Quality", "Fabric Perching Inspector", "radha@handloom-erp.com"),
            ("store01", "R. Ramesh", "Stores", "Store Manager", "ramesh@handloom-erp.com"),
            ("disp01", "C. Suresh", "Dispatch", "Logistics & Dispatch Officer", "suresh@handloom-erp.com"),
            ("acc01", "V. Balaji", "Accounts", "Senior Accountant", "balaji@handloom-erp.com"),
            ("acc02", "Meenakshi Iyer", "Accounts", "Credit Control Manager", "meenakshi@handloom-erp.com"),
            ("mgmt01", "Rajendran K", "Management", "General Manager - Operations", "gm@handloom-erp.com"),
            ("mgmt02", "Sundar Rajan", "Management", "Managing Director", "md@handloom-erp.com")
        ]

        for code, name, dept, desg, email in employees_to_seed:
            res = await session.execute(select(Employee).where(Employee.employee_code == code))
            emp = res.scalar_one_or_none()
            if not emp:
                emp = Employee(
                    employee_code=code,
                    username=code,
                    name=name,
                    user_type="User" if "Manager" not in desg else "Admin",
                    email=email,
                    department=dept,
                    designation=desg,
                    status="Active",
                    web_access="Allow",
                    password_hash=get_password_hash("pass123"),
                    module_permissions={
                        "master": True, "buyer_order": True, "work_order": True,
                        "warping_sizing": True, "production": True, "processing": True,
                        "fabric": True, "yarn": True, "account": True, "report": True,
                    }
                )
                session.add(emp)
                print(f"Added Employee: {name} ({dept} - {desg})")
        await session.commit()

        print("\n--- 2. SEEDING MORE CLIENTS, BUYERS, SUPPLIERS & TRANSPORTERS ---")
        parties_to_seed = [
            # Buyers / Customers
            {
                "customer_code": "CUST-FAB-02", "party_type": "Sales", "company_name": "FabIndia Overseas Pvt Ltd",
                "party_group": "Buyer", "customer_grade": "A+", "status": "Active",
                "address": "Plot No. 14, Okhla Industrial Area Phase III", "city": "New Delhi", "district": "South Delhi",
                "state": "Delhi", "state_code": "07", "pin_code": "110020", "country": "India",
                "gst_no": "07AAACF1234F1Z8", "pan_no": "AAACF1234F", "contact_person": "Sunita Kapoor",
                "phone": "011-41618899", "email": "procurement@fabindia.net", "credit_days": 45, "credit_limit": 2500000.0,
                "payment_terms": "45 Days Net", "currency": "INR"
            },
            {
                "customer_code": "CUST-VOG-03", "party_type": "Sales", "company_name": "Vogue Fashions Export Corp",
                "party_group": "Buyer", "customer_grade": "A", "status": "Active",
                "address": "702, Peninsula Business Park, Lower Parel", "city": "Mumbai", "district": "Mumbai City",
                "state": "Maharashtra", "state_code": "27", "pin_code": "400013", "country": "India",
                "gst_no": "27AABCV5566G1Z2", "pan_no": "AABCV5566G", "contact_person": "Vikram Singhania",
                "phone": "022-66778899", "email": "orders@vogueexports.in", "credit_days": 30, "credit_limit": 3000000.0,
                "payment_terms": "30 Days Net", "currency": "INR"
            },
            {
                "customer_code": "CUST-ANO-04", "party_type": "Sales", "company_name": "Anokhi Handloom Retail Ltd",
                "party_group": "Buyer", "customer_grade": "A", "status": "Active",
                "address": "2, Tilak Marg, C-Scheme", "city": "Jaipur", "district": "Jaipur",
                "state": "Rajasthan", "state_code": "08", "pin_code": "302005", "country": "India",
                "gst_no": "08AABCA8899H1Z5", "pan_no": "AABCA8899H", "contact_person": "Pooja Rathore",
                "phone": "0141-2388112", "email": "sourcing@anokhirange.com", "credit_days": 30, "credit_limit": 1800000.0,
                "payment_terms": "30 Days Net", "currency": "INR"
            },
            {
                "customer_code": "CUST-RAY-05", "party_type": "Sales", "company_name": "Raymond Apparel Division",
                "party_group": "Buyer", "customer_grade": "A+", "status": "Active",
                "address": "Mahakali Caves Road, Andheri East", "city": "Mumbai", "district": "Mumbai Suburban",
                "state": "Maharashtra", "state_code": "27", "pin_code": "400093", "country": "India",
                "gst_no": "27AAACR9988K1Z3", "pan_no": "AAACR9988K", "contact_person": "Amit Chawla",
                "phone": "022-28251122", "email": "corporate.sales@raymond.in", "credit_days": 60, "credit_limit": 5000000.0,
                "payment_terms": "60 Days Net", "currency": "INR"
            },
            {
                "customer_code": "CUST-GLO-06", "party_type": "Sales", "company_name": "Global Textile Traders LLC",
                "party_group": "Buyer", "customer_grade": "A+", "status": "Active",
                "address": "Building 4, Al Quoz Industrial Area 3", "city": "Dubai", "district": "Dubai",
                "state": "Dubai", "state_code": "99", "pin_code": "00000", "country": "United Arab Emirates",
                "gst_no": "99AAAAG1122E1Z0", "pan_no": "AAAAG1122E", "contact_person": "Tariq Mansoor",
                "phone": "+971-4-3458899", "email": "imports@globaltextiles.ae", "credit_days": 60, "credit_limit": 10000000.0,
                "payment_terms": "Letter of Credit (LC 60 Days)", "currency": "USD"
            },

            # More Yarn Suppliers
            {
                "customer_code": "SUPP-VAR-02", "party_type": "Purchase", "company_name": "Vardhman Textiles Ltd",
                "party_group": "Yarn Supplier", "customer_grade": "A+", "status": "Active",
                "address": "Chandigarh Road, Focal Point", "city": "Ludhiana", "district": "Ludhiana",
                "state": "Punjab", "state_code": "03", "pin_code": "141010", "country": "India",
                "gst_no": "03AAACV8899L1Z1", "pan_no": "AAACV8899L", "contact_person": "Harpreet Singh",
                "phone": "0161-2228943", "email": "yarnsales@vardhman.com", "currency": "INR"
            },
            {
                "customer_code": "SUPP-PRE-03", "party_type": "Purchase", "company_name": "Precot Meridian Spinning Ltd",
                "party_group": "Yarn Supplier", "customer_grade": "A", "status": "Active",
                "address": "Supreme Building, Race Course", "city": "Coimbatore", "district": "Coimbatore",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "641018", "country": "India",
                "gst_no": "33AAACP7766N1Z7", "pan_no": "AAACP7766N", "contact_person": "V. Radhakrishnan",
                "phone": "0422-4321155", "email": "orders@precot.com", "currency": "INR"
            },
            {
                "customer_code": "SUPP-KPR-04", "party_type": "Purchase", "company_name": "KPR Mill Yarn Division",
                "party_group": "Yarn Supplier", "customer_grade": "A+", "status": "Active",
                "address": "Arasur, NH-47 Avinashi Road", "city": "Tiruppur", "district": "Tiruppur",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "641407", "country": "India",
                "gst_no": "33AAACK4455M1Z9", "pan_no": "AAACK4455M", "contact_person": "S. Murugesan",
                "phone": "0421-2207100", "email": "yarn@kprmill.com", "currency": "INR"
            },

            # More Job Workers
            {
                "customer_code": "JW-SIZ-02", "party_type": "Job Worker", "company_name": "Sri Krishna Sizing Works",
                "party_group": "Processor", "customer_grade": "A", "status": "Active",
                "address": "Ammapet Main Road", "city": "Salem", "district": "Salem",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "636003",
                "gst_no": "33AABCS4455P1Z8", "contact_person": "K. Govindaraj", "phone": "0427-2456789"
            },
            {
                "customer_code": "JW-FIN-03", "party_type": "Job Worker", "company_name": "Textech Stenter & Finishing Mills",
                "party_group": "Processor", "customer_grade": "A", "status": "Active",
                "address": "SIPCOT Industrial Complex, Perundurai", "city": "Erode", "district": "Erode",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "638052",
                "gst_no": "33AABCT9911Q1Z4", "contact_person": "P. Sakthivel", "phone": "04294-223344"
            },
            {
                "customer_code": "JW-PRN-04", "party_type": "Job Worker", "company_name": "Kaveri Rotary Screen Printers",
                "party_group": "Processor", "customer_grade": "A", "status": "Active",
                "address": "Komarapalayam Bypass Road", "city": "Namakkal", "district": "Namakkal",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "638183",
                "gst_no": "33AABCK8822R1Z6", "contact_person": "M. Thangavel", "phone": "04288-261234"
            },
            {
                "customer_code": "JW-TWI-05", "party_type": "Job Worker", "company_name": "Sri Murugan Twisting & Doubling",
                "party_group": "Processor", "customer_grade": "A", "status": "Active",
                "address": "Bhavani Road, Chithode", "city": "Erode", "district": "Erode",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "638102",
                "gst_no": "33AABCM3311S1Z3", "contact_person": "R. Selvam", "phone": "0424-2534567"
            },

            # Transporters & Logistics
            {
                "customer_code": "LOG-BLU-01", "party_type": "Logistics", "company_name": "Blue Dart Express Ltd",
                "party_group": "Transporter", "customer_grade": "A+", "status": "Active",
                "address": "Blue Dart Centre, Sahar Airport Road", "city": "Mumbai", "district": "Mumbai Suburban",
                "state": "Maharashtra", "state_code": "27", "pin_code": "400099", "country": "India",
                "gst_no": "27AAACB2233P1Z9", "pan_no": "AAACB2233P", "contact_person": "R. Ramanathan (Chennai Hub)",
                "phone": "044-22561122", "email": "dispatch@bluedart.com"
            },
            {
                "customer_code": "LOG-VRL-02", "party_type": "Logistics", "company_name": "VRL Logistics Ltd",
                "party_group": "Transporter", "customer_grade": "A", "status": "Active",
                "address": "Giriraj Annexe, Circuit House Road", "city": "Hubli", "district": "Dharwad",
                "state": "Karnataka", "state_code": "29", "pin_code": "580029", "country": "India",
                "gst_no": "29AAACV5566T1Z5", "pan_no": "AAACV5566T", "contact_person": "K. Shanmugam",
                "phone": "0836-2237511", "email": "customercare@vrllogistics.com"
            },
            {
                "customer_code": "LOG-SAF-03", "party_type": "Logistics", "company_name": "Safexpress Pvt Ltd",
                "party_group": "Transporter", "customer_grade": "A", "status": "Active",
                "address": "Safex Cargo Complex, NH-8, Mahipalpur", "city": "New Delhi", "district": "South West Delhi",
                "state": "Delhi", "state_code": "07", "pin_code": "110037", "country": "India",
                "gst_no": "07AAACS1188U1Z4", "pan_no": "AAACS1188U", "contact_person": "Manish Gupta",
                "phone": "011-26783281", "email": "delhi@safexpress.com"
            },
            {
                "customer_code": "LOG-ABT-04", "party_type": "Logistics", "company_name": "ABT Parcel Service",
                "party_group": "Transporter", "customer_grade": "A", "status": "Active",
                "address": "10/8, Kalingarayan Street, Ram Nagar", "city": "Coimbatore", "district": "Coimbatore",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "641009", "country": "India",
                "gst_no": "33AAACA3322V1Z7", "pan_no": "AAACA3322V", "contact_person": "N. Sivasubramanian",
                "phone": "0422-2231234", "email": "care@abtparcel.com"
            },

            # Agents & Buying Houses
            {
                "customer_code": "AGT-RAM-01", "party_type": "Agent", "company_name": "Direct Mill Agent - Ramesh",
                "party_group": "Commission Agent", "customer_grade": "A", "status": "Active",
                "address": "45, Brough Road", "city": "Erode", "district": "Erode",
                "state": "Tamil Nadu", "state_code": "33", "pin_code": "638001",
                "gst_no": "33AABCR1234W1Z2", "contact_person": "Ramesh Chander", "phone": "9842711223"
            },
            {
                "customer_code": "AGT-TEX-02", "party_type": "Agent", "company_name": "Textile Sourcing Hub India",
                "party_group": "Commission Agent", "customer_grade": "A", "status": "Active",
                "address": "12, 100 Feet Road, Indiranagar", "city": "Bengaluru", "district": "Bengaluru Urban",
                "state": "Karnataka", "state_code": "29", "pin_code": "560038",
                "gst_no": "29AABCT8899X1Z1", "contact_person": "Anand Mahindra", "phone": "080-25218899"
            },
            {
                "customer_code": "AGT-GLO-03", "party_type": "Agent", "company_name": "Global Fabric Buying Agency",
                "party_group": "Commission Agent", "customer_grade": "A", "status": "Active",
                "address": "501, Maker Chambers V, Nariman Point", "city": "Mumbai", "district": "Mumbai City",
                "state": "Maharashtra", "state_code": "27", "pin_code": "400021",
                "gst_no": "27AABCG4433Y1Z8", "contact_person": "Kishore Bajaj", "phone": "022-22884433"
            }
        ]

        for p_data in parties_to_seed:
            res = await session.execute(select(PartyMaster).where(PartyMaster.company_name == p_data["company_name"]))
            existing = res.scalar_one_or_none()
            if not existing:
                party = PartyMaster(**p_data)
                session.add(party)
                print(f"Added Party: {p_data['company_name']} ({p_data['party_type']} - {p_data['party_group']})")
        await session.commit()

        print("\n--- 3. SEEDING MORE FABRIC DESIGNS IN DESIGN ENTRY ---")
        designs_to_seed = [
            {
                "ds_ref_no": "DSR-2026-0090", "design_no": "DSG-LINEN-102", "buyer_name": "FabIndia Overseas Pvt Ltd",
                "fabric": "Pure Linen Fabric", "gry_const": "60 x 54 / 40s x 40s Linen", "reed": 60.0, "pick_ot": 54.0,
                "total_ends": 3480.0, "finish_width": 58.0, "order_mtr": 3500.0, "total_mtr": 3500.0,
                "crimp_pct": 4.0, "skg_pct": 3.0, "dyeing_loss_pct": 1.5, "warp_mtr": 3750.0, "weft_pro_mtr": 3500.0,
                "color": "Natural Flax / Oatmeal", "weaving": "Plain Weave (1/1)", "status": "Approved",
                "yarn_details": "Warp: 40s Pure Wet Spun Linen | Weft: 40s Pure Linen"
            },
            {
                "ds_ref_no": "DSR-2026-0091", "design_no": "DSG-TWILL-205", "buyer_name": "Vogue Fashions Export Corp",
                "fabric": "Cotton Twill 2/1", "gry_const": "84 x 64 / 2/30s x 20s", "reed": 84.0, "pick_ot": 64.0,
                "total_ends": 5040.0, "finish_width": 60.0, "order_mtr": 8000.0, "total_mtr": 8000.0,
                "crimp_pct": 5.0, "skg_pct": 2.5, "dyeing_loss_pct": 1.0, "warp_mtr": 8600.0, "weft_pro_mtr": 8000.0,
                "color": "Dark Olive / Khaki", "weaving": "Twill Weave (2/1)", "status": "Approved",
                "yarn_details": "Warp: 2/30s Combed Cotton | Weft: 20s Single Carded Cotton"
            },
            {
                "ds_ref_no": "DSR-2026-0092", "design_no": "DSG-SILK-304", "buyer_name": "Anokhi Handloom Retail Ltd",
                "fabric": "Cotton Silk Chanderi", "gry_const": "96 x 80 / 20/22D Silk x 2/100s Cotton", "reed": 96.0, "pick_ot": 80.0,
                "total_ends": 4224.0, "finish_width": 44.0, "order_mtr": 2000.0, "total_mtr": 2000.0,
                "crimp_pct": 2.5, "skg_pct": 1.5, "dyeing_loss_pct": 2.0, "warp_mtr": 2100.0, "weft_pro_mtr": 2000.0,
                "color": "Royal Crimson / Gold Zari", "weaving": "Plain Weave (1/1)", "status": "Approved",
                "yarn_details": "Warp: 20/22D Mulberry Silk | Weft: 2/100s Superfine Cotton"
            },
            {
                "ds_ref_no": "DSR-2026-0093", "design_no": "DSG-DOBBY-508", "buyer_name": "Raymond Apparel Division",
                "fabric": "Oxford Dobby Shirting", "gry_const": "88 x 72 / 2/60s x 2/60s", "reed": 88.0, "pick_ot": 72.0,
                "total_ends": 4928.0, "finish_width": 56.0, "order_mtr": 10000.0, "total_mtr": 10000.0,
                "crimp_pct": 4.5, "skg_pct": 2.0, "dyeing_loss_pct": 1.0, "warp_mtr": 10650.0, "weft_pro_mtr": 10000.0,
                "color": "Sky Blue & White Micro Check", "weaving": "Dobby Textured Weave", "status": "Approved",
                "yarn_details": "Warp: 2/60s Gassed Mercerized Cotton | Weft: 2/60s Gassed Mercerized Cotton"
            }
        ]

        for d_data in designs_to_seed:
            res = await session.execute(select(DesignEntry).where(DesignEntry.design_no == d_data["design_no"]))
            existing = res.scalar_one_or_none()
            if not existing:
                d = DesignEntry(
                    ds_date=date.today(),
                    **d_data
                )
                session.add(d)
                print(f"Added Design: {d_data['design_no']} ({d_data['fabric']})")
        await session.commit()

        print("\n--- 4. SEEDING MORE DIVERSE BUYER ORDERS ---")
        orders_to_seed = [
            {
                "ibpo_number": "IBPO-00106", "party_name": "FabIndia Overseas Pvt Ltd", "buyer_name": "FabIndia Overseas Pvt Ltd",
                "po_number": "FAB-PO-2026-114", "style": "FAB-LINEN-SUMMER", "design_no": "DSG-LINEN-102",
                "fabric_type": "Pure Linen", "color": "Natural Flax", "weaving_type": "Plain",
                "meters": 3500.0, "rate": 380.0, "gst_pct": 5.0, "merchandiser": "Anita Krishnan",
                "status": "In Production", "certified": "GOTS (Global Organic Textile Standard)",
                "transport": "VRL Logistics Ltd", "remarks": "Organic Linen tunic fabric for Spring/Summer."
            },
            {
                "ibpo_number": "IBPO-00107", "party_name": "Vogue Fashions Export Corp", "buyer_name": "Vogue Fashions Export Corp",
                "po_number": "VOG-PO-2026-55", "style": "VOG-TWILL-CHINO", "design_no": "DSG-TWILL-205",
                "fabric_type": "Cotton Twill", "color": "Dark Olive", "weaving_type": "Twill (2/1)",
                "meters": 8000.0, "rate": 210.0, "gst_pct": 5.0, "merchandiser": "Sanjay Verma",
                "status": "Approved", "certified": "BCI (Better Cotton Initiative)",
                "transport": "TCI Freight (Transport Corp of India)", "remarks": "Heavy Twill for Chino trousers."
            },
            {
                "ibpo_number": "IBPO-00108", "party_name": "Raymond Apparel Division", "buyer_name": "Raymond Apparel Division",
                "po_number": "RAY-PO-2026-880", "style": "RAY-OXFORD-PREMIUM", "design_no": "DSG-DOBBY-508",
                "fabric_type": "Oxford Dobby", "color": "Sky Blue Micro Check", "weaving_type": "Dobby",
                "meters": 10000.0, "rate": 320.0, "gst_pct": 5.0, "merchandiser": "Anita Krishnan",
                "status": "Active", "certified": "OEKO-TEX Standard 100",
                "transport": "Blue Dart Express Ltd", "remarks": "Premium formal shirting fabric."
            },
            {
                "ibpo_number": "IBPO-00109", "party_name": "Global Textile Traders LLC", "buyer_name": "Global Textile Traders LLC",
                "po_number": "GTT-EXP-2026-004", "style": "GTT-EXPORT-SHEETING", "design_no": "DSG-HERITAGE-401",
                "fabric_type": "Cotton Cambric", "color": "Bleached Optical White", "weaving_type": "Plain",
                "meters": 12000.0, "rate": 250.0, "gst_pct": 5.0, "merchandiser": "Divya Pillai",
                "status": "Pending Approval", "certified": "Fair Trade Certified",
                "transport": "Safexpress Pvt Ltd", "remarks": "Export container to Dubai Port."
            }
        ]

        for o in orders_to_seed:
            res = await session.execute(select(BuyerOrder).where(BuyerOrder.ibpo_number == o["ibpo_number"]))
            existing = res.scalar_one_or_none()
            if not existing:
                # Find party
                p_res = await session.execute(select(PartyMaster).where(PartyMaster.company_name == o["party_name"]))
                party = p_res.scalar_one_or_none()

                bo = BuyerOrder(
                    ibpo_number=o["ibpo_number"],
                    order_date=date.today(),
                    party_name=o["party_name"],
                    party_id=party.id if party else None,
                    buyer_name=o["buyer_name"],
                    billing_address=party.address if party else "Standard Mill Address",
                    delivery_address=party.address if party else "Standard Mill Address",
                    state=party.state if party else "Tamil Nadu",
                    state_code=party.state_code if party else "33",
                    gst_no=party.gst_no if party else "",
                    pan_no=party.pan_no if party else "",
                    order_type="Regular",
                    certified_type=o["certified"],
                    order_taken_by=o["merchandiser"],
                    merchandiser=o["merchandiser"],
                    status=o["status"],
                    payment_terms=party.payment_terms if party else "30 Days Net",
                    transport_name=o["transport"],
                    transport_mode="Road Transport",
                    remarks=o["remarks"]
                )
                session.add(bo)
                await session.flush()

                # Add item
                item_amount = o["meters"] * o["rate"]
                item = BuyerOrderItem(
                    order_id=bo.id,
                    party_po_no=o["po_number"],
                    po_date=date.today(),
                    point_of_contact=party.contact_person if party else "Contact Person",
                    design_no=o["design_no"],
                    buyer_style=o["style"],
                    fabric_type=o["fabric_type"],
                    color=o["color"],
                    weaving_type=o["weaving_type"],
                    order_mtrs=o["meters"],
                    total_mtr_yard=o["meters"],
                    uom="MTR",
                    finish_width=56.0,
                    hsn_code="5208",
                    price=o["rate"],
                    gst_pct=o["gst_pct"],
                    rate=o["rate"],
                    amount=item_amount
                )
                session.add(item)
                print(f"Added Buyer Order: {o['ibpo_number']} ({o['party_name']} - {o['meters']} Mtr)")
        await session.commit()
        print("\n=== ALL REALISTIC ENTERPRISE SEEDING COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(seed_full_enterprise_data())
