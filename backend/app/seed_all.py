import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy import select, text
from app.models.employee import Employee
from app.models.party_master import PartyMaster, PartyAddress
from app.models.buyer_order import BuyerOrder, BuyerOrderItem, BuyerOrderSchedule, BuyerOrderSequence, BuyerOrderAmendment, BuyerOrderCompletion, BuyerOrderDispatch, BuyerOrderExpense
from app.models.yarn_purchase import YarnPurchaseOrder, YarnPurchaseCountDetail, YarnPurchaseIndentDetail
from app.models.yarn_inward import YarnInward, YarnInwardItem
from app.models.grey_yarn_delivery import GreyYarnDelivery, GreyYarnDeliveryItem
from app.models.dyed_yarn import DyedYarnReceived, DyedYarnReceivedItem, DyedYarnDelivery, DyedYarnDeliveryItem
from app.models.warp import WarpBeamReceipt, WarpBeamDetail, WarpDelivery, WarpDeliveryItem
from app.models.cloth import ClothInward, ClothInwardItem, ClothDelivery, ClothDeliveryItem, OnTableChecking, OnTableCheckingItem
from app.models.finished_fabric import FinishedFabricInward, FinishedFabricItem
from app.models.packing_slip import PackingSlip, PackingSlipItem
from app.models.goods_release import GoodsRelease, GoodsReleaseItem
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem
from app.models.despatch_planning import DespatchPlanning
from app.models.eway_bill import EwayBill, EwayBillItem
from app.models.design_entry import DesignEntry
from app.models.sub_master import SubMaster
from app.models.work_order import WorkOrderTransaction
from app.models.textile_design import TextileDesign, WarpDesignItem, WeftDesignItem
from app.models.ppc import LoomMaster, LoomAllocation, ProductionLog, OperatorMaster
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.service_schedule import ServiceSchedule
from app.models.maintenance_log import MaintenanceLog
from app.models.breakdown_entry import BreakdownEntry
from app.models.fuel_entry import FuelEntry
from app.models.fleet_document import FleetDocument
from app.models.route_trip import Route, Trip
from app.modules.hr.models import HRItem
from app.modules.vehicle_management.models import FleetItem
from app.modules.stationary.models import StationaryItem, SwatchCard, FabricInspectionRoll, ReturnableDC

logger = logging.getLogger(__name__)

async def seed_all_data(session):
    """Seed the database with 10 records per page of connected real-time data across all workflow steps including Finance."""
    try:
        # Check if already seeded to avoid redundant operations on standard startups
        check_res = await session.execute(select(HRItem).where(HRItem.category == 'requisitions'))
        
        # Check if finance DB is also seeded
        from finance_app.database import SessionLocal as FinanceSessionLocal
        from finance_app.models.company import Company as FinanceCompany
        finance_seeded = False
        try:
            finance_db = FinanceSessionLocal()
            fc = finance_db.query(FinanceCompany).filter(FinanceCompany.name == "Dinesh Exports").first()
            if fc:
                finance_seeded = True
            finance_db.close()
        except Exception:
            pass

        # if check_res.scalars().first() and finance_seeded:
        #     logger.info("Database already seeded with workflow data. Skipping...")
        #     return

        logger.info("Clearing existing workflow data for clean seeding...")
        
        # Deleting all records from relevant tables in reverse order of dependency
        tables_to_clear = [
            SalesInvoiceItem, SalesInvoice,
            EwayBillItem, EwayBill,
            DespatchPlanning,
            GoodsReleaseItem, GoodsRelease,
            PackingSlipItem, PackingSlip,
            FinishedFabricItem, FinishedFabricInward,
            OnTableCheckingItem, OnTableChecking,
            FabricInspectionRoll,
            ClothDeliveryItem, ClothDelivery,
            ClothInwardItem, ClothInward,
            WarpDeliveryItem, WarpDelivery,
            WarpBeamDetail, WarpBeamReceipt,
            DyedYarnDeliveryItem, DyedYarnDelivery,
            DyedYarnReceivedItem, DyedYarnReceived,
            GreyYarnDeliveryItem, GreyYarnDelivery,
            YarnInwardItem, YarnInward,
            YarnPurchaseCountDetail, YarnPurchaseIndentDetail, YarnPurchaseOrder,
            ProductionLog, LoomAllocation, LoomMaster, OperatorMaster,
            WarpDesignItem, WeftDesignItem, TextileDesign, DesignEntry,
            WorkOrderTransaction,
            BuyerOrderItem, BuyerOrder, BuyerOrderSchedule, BuyerOrderSequence, BuyerOrderAmendment, BuyerOrderCompletion, BuyerOrderDispatch, BuyerOrderExpense,
            PartyAddress, PartyMaster,
            Driver, Vehicle, ServiceSchedule, MaintenanceLog, BreakdownEntry, FuelEntry, FleetDocument, Route, Trip,
            HRItem, FleetItem, StationaryItem, SwatchCard, ReturnableDC
        ]
        
        # Clear legacy table yarn_purchase_items to avoid foreign key references on yarn_purchase_orders
        try:
            await session.execute(text("DELETE FROM yarn_purchase_items"))
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.warning(f"Error clearing legacy yarn_purchase_items: {e}")

        for table in tables_to_clear:
            try:
                await session.execute(table.__table__.delete())
                await session.commit()
            except Exception as e:
                await session.rollback()
                print(f"  [CLEAR FAILED] Table {table.__name__}: {e}")
                logger.warning(f"Error clearing table {table.__name__}: {e}")
        
        # Clear Employees except 'admin'
        try:
            await session.execute(Employee.__table__.delete().where(Employee.employee_code != "admin"))
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.warning(f"Error clearing Employee: {e}")

        logger.info("Seeding new connected workflow data (10 records per table)...")

        # ── 1. Seed Sub-Masters (Supporting Configurations) ──
        submasters_data = [
            # Godowns
            ("godown_master", "Main Store", "GD001", "Primary central warehouse"),
            ("godown_master", "Yarn Godown A", "GD002", "Storage for raw yarn"),
            ("godown_master", "Yarn Godown B", "GD003", "Storage for dyed yarn"),
            ("godown_master", "Grey Fabric Yard", "GD004", "Storage for grey fabric rolls"),
            ("godown_master", "Finished Fabric Godown", "GD005", "Storage for approved finished goods"),
            # UOM
            ("uom_master", "Meters", "MTR", "Linear meters"),
            ("uom_master", "Kilograms", "KGS", "Weight in kg"),
            ("uom_master", "Bags", "BAGS", "Yarn bags"),
            ("uom_master", "Pieces", "PCS", "Fabric pieces"),
            ("uom_master", "Bales", "BALES", "Packed bales"),
            # Loom Types
            ("loom_type_master", "Air Jet", "AJ", "High-speed air insertion"),
            ("loom_type_master", "Rapier", "RP", "Flexible insertion rapier"),
            ("loom_type_master", "Water Jet", "WJ", "Synthetic yarn weaving"),
            ("loom_type_master", "Sulzer", "SZ", "Projectile weaving"),
            ("loom_type_master", "Jacquard", "JQ", "Complex pattern weaving"),
            # Yarn Types
            ("yarn_type_master", "Cotton", "CTN", "Natural cotton yarn"),
            ("yarn_type_master", "Polyester", "POLY", "Synthetic polyester yarn"),
            ("yarn_type_master", "Viscose", "VISC", "Semi-synthetic viscose yarn"),
            ("yarn_type_master", "Linen", "LIN", "Flax fiber yarn"),
            ("yarn_type_master", "Blended", "BLND", "Poly-Cotton blend yarn"),
            # HSN Codes
            ("hsn_code_master", "5205", "HSN5205", "Cotton yarn containing 85% or more"),
            ("hsn_code_master", "5206", "HSN5206", "Cotton yarn containing less than 85%"),
            ("hsn_code_master", "5208", "HSN5208", "Woven fabrics of cotton"),
            ("hsn_code_master", "5402", "HSN5402", "Synthetic filament yarn"),
            ("hsn_code_master", "5512", "HSN5512", "Woven fabrics of synthetic staple fibers"),
            # Currencies
            ("currency_master", "INR", "Rs", "Indian Rupee"),
            ("currency_master", "USD", "$", "US Dollar"),
            ("currency_master", "EUR", "€", "Euro"),
            ("currency_master", "GBP", "£", "British Pound"),
            ("currency_master", "JPY", "¥", "Japanese Yen"),
            # Transport Modes
            ("transport_mode_master", "Road", "ROAD", "Truck/Lorry transport"),
            ("transport_mode_master", "Rail", "RAIL", "Train freight"),
            ("transport_mode_master", "Air", "AIR", "Air cargo"),
            ("transport_mode_master", "Sea", "SEA", "Ocean freight"),
            # Colors
            ("color_master", "Navy Blue", "NAVY", "Dark blue shade"),
            ("color_master", "Scarlet Red", "RED", "Scarlet red shade"),
            ("color_master", "Olive Green", "OLIVE", "Olive green shade"),
            ("color_master", "Charcoal Grey", "GREY", "Charcoal grey shade"),
            ("color_master", "Jet Black", "BLACK", "Deep black shade"),
            ("color_master", "Off White", "WHITE", "Natural off-white"),
            ("color_master", "Royal Blue", "RBLU", "Bright royal blue"),
            ("color_master", "Emerald Green", "EMRL", "Rich emerald shade"),
            ("color_master", "Mustard Yellow", "YELW", "Mustard yellow shade"),
            ("color_master", "Coral Pink", "PNK", "Coral pink shade"),
        ]

        for entity, name, code, desc in submasters_data:
            # Check if this submaster exists first to preserve customization if any
            sm_res = await session.execute(
                select(SubMaster).where(SubMaster.entity == entity, SubMaster.code == code)
            )
            if not sm_res.scalars().first():
                session.add(SubMaster(entity=entity, name=name, code=code, description=desc, is_active=True))
        await session.commit()

        # ── 2. Seed Party Master (Buyers, Vendors, Transporters) ──
        # 10 Buyers
        buyers = [
            ("HM Sweden", "CUST001", "Active", "HM-01"),
            ("Zara Spain", "CUST002", "Active", "ZR-02"),
            ("IKEA Netherlands", "CUST003", "Active", "IK-03"),
            ("Target US", "CUST004", "Active", "TG-04"),
            ("Gap Inc", "CUST005", "Active", "GP-05"),
            ("Levi Strauss", "CUST006", "Active", "LV-06"),
            ("Adidas AG", "CUST007", "Active", "AD-07"),
            ("Nike Inc", "CUST008", "Active", "NK-08"),
            ("Uniqlo Japan", "CUST009", "Active", "UQ-09"),
            ("Marks & Spencer", "CUST010", "Active", "MS-10")
        ]
        
        # 10 Vendors/Suppliers
        vendors = [
            ("Vardhman Yarns Ltd", "VEND001", "Active"),
            ("Arvind Mills Ltd", "VEND002", "Active"),
            ("Trident Group", "VEND003", "Active"),
            ("Welspun India", "VEND004", "Active"),
            ("Sutlej Textiles", "VEND005", "Active"),
            ("Raymond Cotton", "VEND006", "Active"),
            ("Siyaram Silks", "VEND007", "Active"),
            ("Sangam India", "VEND008", "Active"),
            ("Nahar Spinning", "VEND009", "Active"),
            ("Banswara Syntex", "VEND010", "Active")
        ]
        
        # 10 Transporters
        transporters = [
            ("SafeExpress Logistics", "TRANS001", "Active"),
            ("DHL Global Forwarding", "TRANS002", "Active"),
            ("VRL Logistics", "TRANS003", "Active"),
            ("TCI Freight", "TRANS004", "Active"),
            ("BlueDart Express", "TRANS005", "Active"),
            ("Gati KWE", "TRANS006", "Active"),
            ("ARC Carriers", "TRANS007", "Active"),
            ("Patel Roadways", "TRANS008", "Active"),
            ("Southern Roadways", "TRANS009", "Active"),
            ("Om Logistics", "TRANS010", "Active")
        ]

        party_objects = []
        for name, code, status, *extra in buyers:
            p = PartyMaster(
                customer_code=code, party_type="Sales", company_name=name, party_group="Retail Buyers",
                customer_grade="A", status=status, address=f"101 Fashion Blvd, Block {code[-1]}", city="Mumbai",
                state="Maharashtra", state_code="27", pin_code="400001", currency="USD", phone="022-245678",
                mobile="9876543210", email=f"info@{name.lower().replace(' ', '')}.com", contact_person="John Doe",
                gst_no=f"27AAAAB{code[-3:]}C1Z0", pan_no=f"AAAAB{code[-3:]}C", credit_days=60, credit_limit=50000.0,
                payment_terms="Net 60 Days", transport_name="SafeExpress Logistics"
            )
            party_objects.append(p)
            
        for name, code, status in vendors:
            p = PartyMaster(
                customer_code=code, party_type="Purchase", company_name=name, party_group="Yarn Suppliers",
                status=status, address=f"Yarn Plaza, Industrial Sector {code[-1]}", city="Coimbatore",
                state="Tamil Nadu", state_code="33", pin_code="641001", currency="INR", phone="0422-234567",
                mobile="9876501234", email=f"sales@{name.lower().replace(' ', '')}.com", contact_person="K. Ramasamy",
                gst_no=f"33VNDAA{code[-3:]}F1Z5", pan_no=f"VNDAA{code[-3:]}F", credit_days=45, credit_limit=100000.0,
                payment_terms="Net 45 Days"
            )
            party_objects.append(p)
            
        for name, code, status in transporters:
            p = PartyMaster(
                customer_code=code, party_type="Logistics", company_name=name, party_group="Logistics Partners",
                status=status, address=f"Terminal Hub {code[-1]}", city="Chennai",
                state="Tamil Nadu", state_code="33", pin_code="600001", currency="INR", phone="044-256789",
                mobile="9876598765", email=f"logistics@{name.lower().replace(' ', '')}.com", contact_person="S. Kumar",
                gst_no=f"33TRAAA{code[-3:]}K1Z9", pan_no=f"TRAAA{code[-3:]}K"
            )
            party_objects.append(p)
            
        session.add_all(party_objects)
        await session.commit()
        
        # Refresh to get IDs
        for p in party_objects:
            await session.refresh(p)
            # Add a billing address
            addr = PartyAddress(party_id=p.id, address=p.address, city=p.city, state=p.state, state_code=p.state_code, pin_code=p.pin_code, address_type="Bill")
            session.add(addr)
        await session.commit()

        # ── 3. Seed Employee Master (HR Portal & Operators) ──
        # 10 Employees
        employees_list = [
            ("EMP001", "Amit Sharma", "Management", "General Manager", "Staff", "9876500001"),
            ("EMP002", "Priya Nair", "Merchandising", "Senior Executive", "Staff", "9876500002"),
            ("EMP003", "Rajesh Kumar", "Design", "Supervisor", "Staff", "9876500003"),
            ("EMP004", "Senthil Balan", "Production", "Incharge", "Staff", "9876500004"),
            ("EMP005", "Manoj Patil", "Weaving", "Operator", "Operator", "9876500005"),
            ("EMP006", "Vijay Prasad", "Quality", "Supervisor", "Staff", "9876500006"),
            ("EMP007", "Karthik Raja", "Logistics", "Officer", "Staff", "9876500007"),
            ("EMP008", "Ramesh Selvam", "Logistics", "Driver", "Operator", "9876500008"),
            ("EMP009", "Arun Kumar", "Logistics", "Driver", "Operator", "9876500009"),
            ("EMP010", "Dinesh Karthik", "Accounts", "Executive", "Staff", "9876500010")
        ]

        emp_objects = []
        for code, name, dept, desg, cat, mobile in employees_list:
            emp = Employee(
                employee_code=code, name=name, dob="1990-05-15", gender="Male" if "Amit" in name or "Rajesh" in name or "Senthil" in name or "Manoj" in name or "Vijay" in name or "Karthik" in name or "Ramesh" in name or "Arun" in name else "Female",
                mobile=mobile, email=f"{code.lower()}@dineshexports.com", address=f"Staff Quarter Block {code[-1]}", department=dept, designation=desg, category=cat, unit="Unit 1",
                shift="General Shift" if cat == "Staff" else "A Shift", status="Active", basic_salary=25000.0 if cat == "Staff" else 15000.0, date_of_joining="2022-01-10", employment_type="Permanent"
            )
            emp_objects.append(emp)
        session.add_all(emp_objects)
        await session.commit()

        # Seed Operators in operator_master table too
        operator_objects = []
        for i, emp in enumerate(emp_objects[4:9]):  # operators & drivers
            op = OperatorMaster(
                operator_id=emp.employee_code, operator_name=emp.name, department=emp.department,
                designation=emp.designation, skill_level="Senior", assigned_loom=f"LM-00{i+1}", assigned_shift="Day Shift"
            )
            operator_objects.append(op)
        session.add_all(operator_objects)
        await session.commit()

        # ── 4. Seed Vehicles & Drivers (Fleet Management) ──
        vehicle_nos = [f"TN-33-AA-100{i}" for i in range(1, 11)]
        vehicle_objects = []
        for i, v_no in enumerate(vehicle_nos):
            v = Vehicle(
                vehicle_number=v_no, vehicle_type="YARN_CARRIER" if i < 5 else "FABRIC_TRUCK",
                make="Tata Motors" if i % 2 == 0 else "Leyland", model="LPT 1613" if i % 2 == 0 else "Ecomet 1214",
                year_of_manufacture=2020 + (i % 4), capacity_tons=10.0 + i, status="ACTIVE", current_mileage=15000.0 + (i * 2000)
            )
            vehicle_objects.append(v)
        session.add_all(vehicle_objects)
        await session.commit()

        # Seed 10 Drivers
        driver_names = ["Ram Singh", "Shyam Lal", "Vijay Kumar", "Mohan Lal", "Gopal Singh", "Hari Prasad", "Sita Ram", "Krishna Yadav", "Deva Patel", "Suraj Sharma"]
        driver_objects = []
        for i, d_name in enumerate(driver_names):
            d = Driver(
                driver_name=d_name, driver_license=f"DL-33-2020-{1000+i}", license_expiry_date="2030-12-31",
                phone_number=f"9876543{100+i}", years_of_experience=5 + i, status="Active", qualification="HMV",
                assigned_vehicle_id=vehicle_objects[i].id
            )
            driver_objects.append(d)
        session.add_all(driver_objects)
        await session.commit()

        # ── 5. Seed Textile Designs & Design Entries ──
        design_nos = [f"DES-2026-00{i}" for i in range(1, 11)]
        design_objects = []
        design_entries = []
        for i, d_no in enumerate(design_nos):
            # TextileDesign
            td = TextileDesign(
                design_no=d_no, design_name=f"Standard Cotton Weave {i+1}", status="Approved",
                weave_type="Plain" if i % 2 == 0 else "Twill", loom_width=165.0, finished_width=147.0,
                reed=68.0, pick=60.0, total_ends=4400.0, total_picks=3880.0, ppi=60.0, epi=68.0, fabric_length=100.0,
                warp_kg=12.5, weft_kg=11.2, total_kg=23.7, created_by="EMP002"
            )
            design_objects.append(td)
            
            # DesignEntry (Phase 2 Specifications)
            de = DesignEntry(
                ds_ref_no=f"REF-DE-2026-{100+i}", ds_date=date.today() - timedelta(days=20), design_no=d_no,
                color="Navy Blue" if i % 3 == 0 else ("Scarlet Red" if i % 3 == 1 else "Charcoal Grey"), created_by="EMP003",
                gry_const="40S Cotton x 40S Cotton / 68 x 60", count_rxpxw="40/40/68/60", buyer_name=buyers[i][0],
                ibpo_no=f"IBPO-26-00{i+1}", order_mtr=10000.0, total_mtr=10500.0, crimp_pct=5.0, skg_pct=2.0,
                warp_mtr=10500.0, gray_width=165.0, finish_width=147.0, reed=68.0, pick_ot=60.0, fabric="Cotton",
                weaving="Loom A", design_type="Solid Piece Dye"
            )
            design_entries.append(de)

        session.add_all(design_objects)
        session.add_all(design_entries)
        await session.commit()

        # Seed design items
        for td in design_objects:
            await session.refresh(td)
            session.add(WarpDesignItem(design_id=td.id, sno=1, yarn_count="40S CTN", color="Off White", threads=4400, ratio_pct=100.0, req_kg=12.5))
            session.add(WeftDesignItem(design_id=td.id, sno=1, yarn_count="40S CTN", color="Off White", threads=3880, ratio_pct=100.0, req_kg=11.2))
        await session.commit()

        # ── 6. Seed Buyer Orders (Phase 2 Sales) ──
        buyer_order_objects = []
        for i in range(10):
            buyer_party = party_objects[i] # First 10 are Buyers
            bo = BuyerOrder(
                ibpo_number=f"IBPO-26-00{i+1}", order_date=date.today() - timedelta(days=15),
                party_name=buyer_party.company_name, party_id=buyer_party.id, agent_name="Standard Agent Ltd",
                order_type="Regular" if i % 2 == 0 else "Export", certified_type="BCI Cotton", buyer_name=buyer_party.company_name,
                billing_address=buyer_party.address, delivery_address=buyer_party.address, state=buyer_party.state,
                state_code=buyer_party.state_code, gst_no=buyer_party.gst_no, pan_no=buyer_party.pan_no,
                order_taken_by="EMP002", regular_special="Regular", status="Active", payment_terms=buyer_party.payment_terms,
                transport_mode="Road", transport_name="SafeExpress Logistics", party_comp_date=date.today() + timedelta(days=30),
                exfactory_date=date.today() + timedelta(days=25), delivery_starting=date.today() + timedelta(days=20),
                delivery_place=buyer_party.city, desp_mtr_min=9500.0, desp_mtr_max=10500.0, process_sequence="Sizing -> Weaving -> Inspection -> Packing -> Despatch"
            )
            buyer_order_objects.append(bo)
        session.add_all(buyer_order_objects)
        await session.commit()

        # Seed Buyer Order Items & Schedule
        for i, bo in enumerate(buyer_order_objects):
            await session.refresh(bo)
            item = BuyerOrderItem(
                order_id=bo.id, party_po_no=f"PO-{bo.ibpo_number}", po_date=bo.order_date,
                point_of_contact="Buyer Representative", order_mtrs=Decimal("10000.0"), uom="MTR", tolerance_pct=Decimal("5.0"),
                total_mtr_yard=Decimal("10500.0"), hsn_code="5208", design_no=design_nos[i], buyer_style="Style A",
                short_no=f"ST-{100+i}", fabric_type="Cotton Poplin", color="Navy Blue" if i % 3 == 0 else "Scarlet Red",
                construction="40 x 40 / 68 x 60", weaving_type="Plain", finish_width=Decimal("147.0"), price=Decimal("120.0"),
                gst_pct=Decimal("5.0"), gst_rate=Decimal("6.0"), rate=Decimal("126.0"), amount=Decimal("1260000.0")
            )
            session.add(item)
            
            # Seed Schedule
            sched = BuyerOrderSchedule(
                schedule_id=f"SCH-{bo.ibpo_number}", order_id_ref=bo.ibpo_number, buyer_ref=f"REF-{bo.ibpo_number}",
                shipment_date=bo.exfactory_date, delivery_place=bo.delivery_place, transporter_name=bo.transport_name,
                transport_mode=bo.transport_mode, qty="10000 MTR", fabric_type="Cotton Poplin", shade="Standard", status="Scheduled"
            )
            session.add(sched)
            
            # Seed running number sequence
            seq = BuyerOrderSequence(
                sequence_id=f"SEQ-{bo.ibpo_number}", order_id_ref=bo.ibpo_number, prefix="DEX", fin_year="2026-27",
                running_no=i+1, buyer_name=bo.party_name, party_name=bo.party_name, order_type=bo.order_type,
                generated_order_no=bo.ibpo_number, created_by="EMP002"
            )
            session.add(seq)
            
            # Seed Amendment
            amd = BuyerOrderAmendment(
                amendment_id=f"AMD-{bo.ibpo_number}", order_id_ref=bo.ibpo_number, amd_date=bo.order_date + timedelta(days=2),
                field_changed="tolerance_pct", old_value="0.0", new_value="5.0", remarks="Standard tolerance adjustment", approved_by="EMP001"
            )
            session.add(amd)
            
            # Seed Expense
            exp = BuyerOrderExpense(
                expense_id=f"EXP-{bo.ibpo_number}", order_id_ref=bo.ibpo_number, expense_type="Design Pattern Setup",
                amount=Decimal("5000.00"), currency="INR", payment_mode="Bank Transfer", vendor_name="Design Studio Partner"
            )
            session.add(exp)
            
        await session.commit()

        # ── 7. Seed Yarn Purchase Orders (Phase 3 Procurement) ──
        yarn_po_objects = []
        for i in range(10):
            vendor_party = party_objects[10 + i] # Next 10 are vendors
            ypo = YarnPurchaseOrder(
                po_number=f"YPO-26-00{i+1}", po_date=date.today() - timedelta(days=12), org_name="Dinesh Exports",
                internal_po_no=f"IPO-26-00{i+1}", used_for="Warp & Weft Yarn", against_ref=f"IBPO-26-00{i+1}",
                agent_name="Yarn Broker Agent", supplier_name=vendor_party.company_name, delivery_at="Unit 1 Godown A",
                freight_type="Paid", freight_chg=1500.0, insurance_chg=500.0, total_order_kgs=5000.0,
                transport="VRL Logistics", tax_type="GST 5%", taxable_amount=250000.0, dispatch_date=date.today() - timedelta(days=8),
                packing_type="Bags", sgst_pct=2.5, cgst_pct=2.5, net_amount=262500.0, due_days=45, status="Open"
            )
            yarn_po_objects.append(ypo)
        session.add_all(yarn_po_objects)
        await session.commit()

        # Seed Yarn PO details
        for i, ypo in enumerate(yarn_po_objects):
            await session.refresh(ypo)
            # Count Detail
            cnt_det = YarnPurchaseCountDetail(
                po_id=ypo.id, supplier_name=ypo.supplier_name, fibre_group="Cotton", yarn_count="40S CTN",
                yarn_csp=2800.0, min_cone_wgt=1.89, order_kgs=5000.0, mill_name="Nahar Spinning Mills", tolerance_pct=5.0
            )
            session.add(cnt_det)
            
            # Indent Detail
            ind_det = YarnPurchaseIndentDetail(
                po_id=ypo.id, req_ind_no=f"IND-26-00{i+1}", design_no=design_nos[i], ibpo_no=f"IBPO-26-00{i+1}",
                party_name=buyer_order_objects[i].party_name, fabric_name="Cotton Poplin", yarn_count="40S CTN",
                order_mtrs=10000.0, warp_qty=2500.0, weft_qty=2500.0, tot_reqd_qty=5000.0, appd_qty=5000.0, order_qty=5000.0
            )
            session.add(ind_det)
        await session.commit()

        # ── 8. Seed Yarn Inward (Phase 3 Inward) ──
        yarn_inward_objects = []
        for i in range(10):
            vendor_party = party_objects[10 + i]
            yi = YarnInward(
                ref_no=f"GRN-Y-00{i+1}", entry_date=date.today() - timedelta(days=7), inward_date=date.today() - timedelta(days=7),
                status="Received", received_type="Purchase Inward", received_from=vendor_party.company_name, po_no_dt=f"YPO-26-00{i+1}",
                agent_name="Yarn Broker Agent", stock_godown="Yarn Godown A", godown_id=2, cone_type="Paper Cone",
                order_kgs=5000.0, received_kgs=5020.0, balance_kgs=0.0, bill_no=f"BILL-{1000+i}", bill_amount=262500.0,
                gross_kgs=5100.0, net_kgs=5020.0, due_days=45, transport="VRL Logistics", veh_no=vehicle_nos[i],
                total_bags=100, eway_bill=f"EWB-{8000+i}", gate_no=f"GATE-{i+1}", wbridge_no=f"WB-{i+1}", w_weight=5100.0,
                gross_amount=250000.0, tax_type="GST 5%", cgst_pct=2.5, sgst_pct=2.5, tax_value=12500.0, net_amount=262500.0
            )
            yarn_inward_objects.append(yi)
        session.add_all(yarn_inward_objects)
        await session.commit()

        # Seed Yarn Inward Items
        for i, yi in enumerate(yarn_inward_objects):
            await session.refresh(yi)
            item = YarnInwardItem(
                inward_id=yi.id, yarn_count="40S CTN", mill_name="Nahar Spinning Mills", colour="Off White",
                lot_no=f"LOT-40CTN-{200+i}", our_id=f"YID-{100+i}", bags=100, kgs=5020.0, rate=50.0, amount=250000.0
            )
            session.add(item)
        await session.commit()

        # ── 9. Seed PPC Looms & Allocations (Phase 4 Production Planning) ──
        loom_objects = []
        for i in range(10):
            lm = LoomMaster(
                loom_name=f"LM-00{i+1}", loom_type="Air Jet" if i < 5 else "Rapier",
                manufacturer="Toyota" if i < 5 else "Picanol", model_number="JAT810" if i < 5 else "OmniPlus-i",
                capacity_per_day=450.0, running_speed_per_hr=20.0, efficiency_pct=85.0 + i,
                status="Running" if i < 8 else ("Idle" if i == 8 else "Maintenance"), location="Shed A" if i < 5 else "Shed B"
            )
            loom_objects.append(lm)
        session.add_all(loom_objects)
        await session.commit()

        loom_allocations = []
        for i, lm in enumerate(loom_objects):
            await session.refresh(lm)
            la = LoomAllocation(
                loom_id=lm.id, order_id=f"IBPO-26-00{i+1}", warp_ends=4400, weft_density=60, fabric_type="Cotton Poplin",
                assigned_meters=10000.0, completed_meters=2000.0 + (i * 500.0), allocation_status="Active" if i < 8 else "Pending"
            )
            loom_allocations.append(la)
        session.add_all(loom_allocations)
        await session.commit()

        # Seed Production Logs (Phase 4 Daily Production Monitor)
        production_logs = []
        for i, la in enumerate(loom_allocations):
            await session.refresh(la)
            if la.allocation_status == "Active":
                pl = ProductionLog(
                    allocation_id=la.id,
                    meters_produced=la.completed_meters,
                    timestamp=datetime.utcnow() - timedelta(days=1),
                    downtime_minutes=15 * i,
                    remarks=f"Daily production on Loom {la.loom_id}"
                )
                production_logs.append(pl)
        session.add_all(production_logs)
        await session.commit()

        # Add Daily Production Monitor submasters for ppc_target_actual
        for i, lm in enumerate(loom_objects):
            t = SubMaster(
                entity="ppc_target_actual", name=f"{date.today() - timedelta(days=1)}-{lm.loom_name}", code=lm.loom_name,
                extra_field_1=f"{380 + (i * 10)}.0 / 400.0 m", extra_field_2="On Track" if i % 2 == 0 else "Delayed",
                description=f"Shortfall: {-20 + (i * 10)}.0 m | Eff: {85 + i}%", is_active=True
            )
            session.add(t)
        await session.commit()

        # ── 10. Seed Yarn Deliveries to Looms (Phase 4 In-Process Yarn) ──
        # Grey Yarn Deliveries (10)
        grey_delivery_objects = []
        for i in range(10):
            gd = GreyYarnDelivery(
                dc_no=f"GYD-DC-00{i+1}", dc_date=date.today() - timedelta(days=6), ref_date=date.today() - timedelta(days=6),
                stock_godown="Yarn Godown A", delivery_type="Weaver Issue", party_name=buyers[i][0], delivery_mode="Internal Lorry",
                delivery_address="Weaving Unit 1", design_no=design_nos[i], order_no=f"IBPO-26-00{i+1}",
                transport="SafeExpress Logistics", vehicle_no=vehicle_nos[i], delivery_name="EMP004", delivery_time="10:00 AM",
                certificate_type="BCI Cotton", design_count="40S CTN", order_kgs=2500.0, total_dely_kgs=2500.0, balance_kgs=0.0, status="Delivered"
            )
            grey_delivery_objects.append(gd)
        session.add_all(grey_delivery_objects)
        await session.commit()

        for i, gd in enumerate(grey_delivery_objects):
            await session.refresh(gd)
            item = GreyYarnDeliveryItem(
                delivery_id=gd.id, cone_type="Paper Cone", count="40S CTN", our_lot_no=f"LOT-40CTN-{200+i}",
                color="Off White", stock=5020.0, bags=50, cones=1000, total_kgs=2500.0, rate=50.0, amount=125000.0
            )
            session.add(item)
        await session.commit()

        # Dyed Yarn Received & Deliveries (10 each)
        dyed_received_objects = []
        dyed_delivery_objects = []
        for i in range(10):
            # Received from Dyehouse
            dyr = DyedYarnReceived(
                inv_no=f"DYR-INV-00{i+1}", inv_date=date.today() - timedelta(days=4), received_type="Dyed Receipt",
                receive_mode="Vehicle", party_name=party_objects[10+i].company_name, design_no=design_nos[i],
                design_count="40S CTN", order_no=f"IBPO-26-00{i+1}", our_dc_no=f"DYD-DC-00{i+1}", party_dc_no=f"PDC-00{i+1}",
                dc_date=date.today() - timedelta(days=4), remarks="Received in good condition", status="Received"
            )
            dyed_received_objects.append(dyr)

            # Issue Dyed Yarn to Looms
            dyd = DyedYarnDelivery(
                dc_no=f"DYD-DC-00{i+1}", dc_date=date.today() - timedelta(days=4), add_date=date.today() - timedelta(days=4),
                delivery_type="Weaver Issue", delivery_mode="Internal Lorry", party_name=buyers[i][0], delivery_address="Weaving Unit 1",
                design_no=design_nos[i], order_no=f"IBPO-26-00{i+1}", design_type="Checks", transport="SafeExpress Logistics",
                certificate_type="BCI Cotton", driver_name=driver_names[i], delivery_time="02:00 PM",
                total_delv_kgs=Decimal("2500.00"), total_rin_kgs=Decimal("0.00"), balance_kgs=Decimal("0.00"),
                cost=Decimal("130000.00"), gross_amount=Decimal("130000.00"), sgst=Decimal("3250.00"), total_gst=Decimal("6500.00"),
                net_amount=Decimal("136500.00"), remarks="Dyed yarn issued", status="Delivered"
            )
            dyed_delivery_objects.append(dyd)

        session.add_all(dyed_received_objects)
        session.add_all(dyed_delivery_objects)
        await session.commit()

        for i in range(10):
            dyr = dyed_received_objects[i]
            dyd = dyed_delivery_objects[i]
            await session.refresh(dyr)
            await session.refresh(dyd)

            session.add(DyedYarnReceivedItem(
                receipt_id=dyr.id, cone_type="Plastic Cone", delivery_count=1000, received_count=1000,
                our_lot_no=f"LOT-DYED-{300+i}", color="Navy Blue" if i % 2 == 0 else "Scarlet Red",
                taken_kgs=Decimal("2500.00"), dyed_lot_no=f"D-LOT-{i+1}", bags=50, cones=1000, rcvd_kgs=Decimal("2500.00")
            ))

            session.add(DyedYarnDeliveryItem(
                delivery_id=dyd.id, yarn_type="Dyed Cotton", count="40S CTN", color="Navy Blue" if i % 2 == 0 else "Scarlet Red",
                lot_no=f"LOT-DYED-{300+i}", stock="2500 KGS", bags=50, cones=1000, total_kgs=Decimal("2500.00"),
                rate=Decimal("52.00"), amount=Decimal("130000.00")
            ))
        await session.commit()

        # ── 11. Seed Warping Beam Receipts & Deliveries (Phase 4 Warping Sizing) ──
        warp_receipt_objects = []
        warp_delivery_objects = []
        for i in range(10):
            # Sizing unit sends beam back
            wbr = WarpBeamReceipt(
                ref_no=f"WBR-SET-00{i+1}", rcvd_date=date.today() - timedelta(days=5), rcvd_type="Sizing Receipt",
                beam_type="Weaver Beam", party_name=party_objects[10+i].company_name, design_no=design_nos[i],
                order_no=f"IBPO-26-00{i+1}", color="Off White", warp_count="40S CTN", warp_ends=4400,
                warp_meters=Decimal("10500.00"), set_no=f"SET-26-{400+i}", siz_dc_no=f"SIZ-DC-00{i+1}",
                siz_dc_date=date.today() - timedelta(days=5), status="Received"
            )
            warp_receipt_objects.append(wbr)

            # Issue yarn to Sizing unit
            wd = WarpDelivery(
                dc_no=f"WD-DC-00{i+1}", ref_no=f"REF-WD-00{i+1}", dc_date=date.today() - timedelta(days=10),
                delivery_type="Sizing Issue", sizing_name=party_objects[10+i].company_name, party_name=party_objects[10+i].company_name,
                entry_type="Warp Issue", bpo_no=f"BPO-26-00{i+1}", design_no=design_nos[i], order_no=f"IBPO-26-00{i+1}",
                address="Sizing Block B", set_id=f"SET-26-{400+i}", warp_ends=4400, yarn_count="40S CTN",
                vendor_po_no=f"VPO-26-00{i+1}", po_date=date.today() - timedelta(days=12), order_mtrs=Decimal("10000.00"),
                with_crimp="Yes", delivered_mtrs=Decimal("10500.00"), transport="SafeExpress Logistics", vehicle_no=vehicle_nos[i],
                total_beams=2, total_meters=Decimal("10500.00"), total_exptd_mtrs=Decimal("10000.00"), balance_meters=Decimal("0.00"),
                remarks="Sent for sizing & warping", status="Delivered"
            )
            warp_delivery_objects.append(wd)

        session.add_all(warp_receipt_objects)
        session.add_all(warp_delivery_objects)
        await session.commit()

        for i in range(10):
            wbr = warp_receipt_objects[i]
            wd = warp_delivery_objects[i]
            await session.refresh(wbr)
            await session.refresh(wd)

            session.add(WarpBeamDetail(
                receipt_id=wbr.id, beam_no=f"BM-00{i+1}A", warp_mtrs=Decimal("5250.00"), beam_type="Weaver Beam",
                delivery_to_weaver="Weaving Unit 1", order_no=wbr.order_no, dc_no=wbr.siz_dc_no, dc_date=wbr.rcvd_date,
                loom_no=f"LM-00{i+1}", loading_date=wbr.rcvd_date, total_meters=Decimal("5250.00")
            ))
            session.add(WarpBeamDetail(
                receipt_id=wbr.id, beam_no=f"BM-00{i+1}B", warp_mtrs=Decimal("5250.00"), beam_type="Weaver Beam",
                delivery_to_weaver="Weaving Unit 1", order_no=wbr.order_no, dc_no=wbr.siz_dc_no, dc_date=wbr.rcvd_date,
                loom_no=f"LM-00{i+1}", loading_date=wbr.rcvd_date, total_meters=Decimal("5250.00")
            ))

            session.add(WarpDeliveryItem(
                delivery_id=wd.id, beam_no=f"BM-00{i+1}A", warp_mtrs=Decimal("5250.00"), beam_type="Sizing Beam", loom_no=f"LM-00{i+1}"
            ))
            session.add(WarpDeliveryItem(
                delivery_id=wd.id, beam_no=f"BM-00{i+1}B", warp_mtrs=Decimal("5250.00"), beam_type="Sizing Beam", loom_no=f"LM-00{i+1}"
            ))
        await session.commit()

        # ── 12. Seed Cloth Inward & Checking (Phase 5 Quality Control) ──
        cloth_inward_objects = []
        checking_objects = []
        for i in range(10):
            # Cloth Inward from weaving
            ci = ClothInward(
                ref_no=f"CI-REF-00{i+1}", inward_type="Weaving Inward", inw_date=date.today() - timedelta(days=3),
                vendor_order=f"VORD-26-00{i+1}", party_name="Internal Weaving Unit 1", dc_no=f"WDC-00{i+1}",
                dc_date=date.today() - timedelta(days=3), vendor_order_mtr=Decimal("10000.00"), order_mtr_plus_10=Decimal("11000.00"),
                received_mtr=Decimal("10100.00"), balance_mtr=Decimal("0.00"), ibpo=f"IBPO-26-00{i+1}", design_no=design_nos[i],
                const_fabric_type="Cotton Poplin", reed="68", pick="60", width="147", order_mtr=Decimal("10000.00"),
                warp_mtr=Decimal("10500.00"), inward_mtr=Decimal("10100.00"), shed_no="Shed A", loom_no=f"LM-00{i+1}",
                attn_no="EMP004", beam_no=f"BM-00{i+1}A", szt_no=f"SET-26-{400+i}", total_pieces=10, total_meters=Decimal("10100.00"),
                inspection_type="Table Inspection", inv_pin="PIN-123", remarks="Cloth inward completed", process_type="Solid Dyeing"
            )
            cloth_inward_objects.append(ci)

            # On Table Checking
            otc = OnTableChecking(
                ref_no=f"OTC-REF-00{i+1}", checking_date=date.today() - timedelta(days=2), table_no=f"TBL-0{i+1}",
                design_no=design_nos[i], order_no=f"IBPO-26-00{i+1}", party_name=buyers[i][0], lot_no=f"LOT-{i+1}",
                total_meters=Decimal("10100.00"), total_pieces=10, pass_meters=Decimal("10050.00"), reject_meters=Decimal("50.00"),
                remarks="Grade A fabric verified", status="Checked"
            )
            checking_objects.append(otc)

        session.add_all(cloth_inward_objects)
        session.add_all(checking_objects)
        await session.commit()

        for i in range(10):
            ci = cloth_inward_objects[i]
            otc = checking_objects[i]
            await session.refresh(ci)
            await session.refresh(otc)

            # Inward Items
            for j in range(1, 11):
                session.add(ClothInwardItem(
                    inward_id=ci.id, piece_no=f"PC-{ci.ref_no}-{j}", weight=Decimal("25.5"),
                    vloom=f"LM-00{i+1}", vpc_no=f"VPC-{i+1}-{j}", meters=Decimal("1010.0")
                ))

            # Checking Items
            for j in range(1, 11):
                session.add(OnTableCheckingItem(
                    checking_id=otc.id, piece_no=f"PC-{otc.ref_no}-{j}", vpc_no=f"VPC-{i+1}-{j}",
                    inv_pin="PIN-123", checking_pin="PIN-CHK", pc_type="Pass" if j < 10 else "Reject",
                    meters=Decimal("1005.0") if j < 10 else Decimal("50.0"), defect_type="None" if j < 10 else "Weft Bar",
                    grade="A" if j < 10 else "C", remarks="Passed QC" if j < 10 else "Rejected due to fabric defect"
                ))
        await session.commit()

        # ── 13. Seed Finished Fabrics & Packing Slips (Phase 5 Packing) ──
        finished_inward_objects = []
        packing_slip_objects = []
        for i in range(10):
            # Finished fabric from dyehouse
            ffi = FinishedFabricInward(
                ref_no=f"FFI-REF-00{i+1}", inv_no=f"FF-INV-00{i+1}", inv_date=date.today() - timedelta(days=2),
                received_type="Finished Fabric Inward", party_name="Associated Dyehouse Ltd", design_no=design_nos[i],
                order_no=f"IBPO-26-00{i+1}", dc_no=f"DDC-00{i+1}", dc_date=date.today() - timedelta(days=2),
                process_type="Dyed", total_meters=Decimal("10000.00"), total_pieces=10, remarks="Dyeing finish verified", status="Received"
            )
            finished_inward_objects.append(ffi)

            # Packing Slip (Bale packaging)
            ps = PackingSlip(
                slip_no=f"PS-26-00{i+1}", slip_date=date.today() - timedelta(days=1), party_name=buyers[i][0],
                design_no=design_nos[i], order_no=f"IBPO-26-00{i+1}", ibpo=f"IBPO-26-00{i+1}", godown="Finished Fabric Godown",
                total_meters=Decimal("10000.00"), total_pieces=10, total_bales=2, gross_weight=Decimal("2100.0"),
                net_weight=Decimal("2000.0"), remarks="Standard exports packing", status="Packed"
            )
            packing_slip_objects.append(ps)

        session.add_all(finished_inward_objects)
        session.add_all(packing_slip_objects)
        await session.commit()

        for i in range(10):
            ffi = finished_inward_objects[i]
            ps = packing_slip_objects[i]
            await session.refresh(ffi)
            await session.refresh(ps)

            for j in range(1, 11):
                session.add(FinishedFabricItem(
                    inward_id=ffi.id, design_no=ffi.design_no, color="Navy Blue" if i % 2 == 0 else "Scarlet Red",
                    lot_no=f"LOT-{i+1}", meters=Decimal("1000.00"), pieces=1, width=Decimal("147.0"),
                    weight=Decimal("200.0"), grade="A", v_loom=f"LM-00{i+1}", v_pc_no=f"VPC-{i+1}-{j}", piece_no=f"PC-FF-{i+1}-{j}"
                ))

            # Bales of 5 pieces each (total 2 bales)
            for j in range(1, 11):
                session.add(PackingSlipItem(
                    slip_id=ps.id, bale_no=f"BALE-{ps.slip_no}-01" if j <= 5 else f"BALE-{ps.slip_no}-02",
                    piece_no=f"PC-FF-{i+1}-{j}", design_no=ps.design_no, color="Navy Blue" if i % 2 == 0 else "Scarlet Red",
                    meters=Decimal("1000.00"), weight=Decimal("200.0"), grade="A", lot_no=f"LOT-{i+1}",
                    loom_no=f"LM-00{i+1}", pass_mtr=Decimal("1000.00")
                ))
        await session.commit()

        # ── 14. Seed Goods Release, Despatch Planning, Fleet & E-Way Bills (Phase 6 Dispatch) ──
        gra_objects = []
        dp_objects = []
        eway_objects = []
        for i in range(10):
            transporter_party = party_objects[20 + i] # Logistics partners
            # Goods Release Advice (GRA)
            gra = GoodsRelease(
                gra_no=f"GRA-26-00{i+1}", gra_date=date.today() - timedelta(days=1), party_name=buyers[i][0],
                ibpo=f"IBPO-26-00{i+1}", design_no=design_nos[i], order_no=f"IBPO-26-00{i+1}", transport_mode="Road",
                transport_name=transporter_party.company_name, vehicle_no=vehicle_nos[i], lr_no=f"LR-{7000+i}",
                lr_date=date.today() - timedelta(days=1), delivery_address=buyers[i][0] + " Warehouse",
                total_meters=Decimal("10000.00"), total_bales=2, gross_weight=Decimal("2100.00"), net_weight=Decimal("2000.00"),
                approval_status="Approved", approved_by="EMP001", status="Released"
            )
            gra_objects.append(gra)

            # Despatch Planning
            dp = DespatchPlanning(
                ibpo=f"IBPO-26-00{i+1}", po_date=date.today() - timedelta(days=15), ref_no=f"DP-REF-00{i+1}",
                planning_date=date.today() - timedelta(days=2), billing_party=buyers[i][0], delivery_party=buyers[i][0],
                billing_address=buyers[i][0] + " Main Office", delivery_address=buyers[i][0] + " Delivery Docks",
                state_code=buyers[i][2], design_no=design_nos[i], pino=f"PI-{3000+i}", order_qty=Decimal("10000.00"),
                amd_foc_mtr=Decimal("0.0"), total_qty=Decimal("10000.00"), uom="MTR", delivery_start=date.today() + timedelta(days=20),
                party_comp_date=date.today() + timedelta(days=30), comp_date=date.today() + timedelta(days=25),
                lc_no=f"LC-{9000+i}", lc_date=date.today() - timedelta(days=10), ibpo_rate=Decimal("120.00"),
                currency="USD", certificate_type="BCI Cotton", fabric_type="Cotton Poplin", planned_mtrs=Decimal("10000.00"),
                tolerance_pct=Decimal("5.0"), max_dispatch_qty=Decimal("10500.00"), stock=Decimal("10000.00"),
                tot_desp_mtrs=Decimal("10000.00"), balance_mtrs=Decimal("0.00"), last_desp_date=date.today(),
                hsn_code="5208", merchant="EMP002", city=buyers[i][3], point_of_contact="Buyer Logistics Contact",
                status="Planned"
            )
            dp_objects.append(dp)

            # E-Way Bill
            ewb = EwayBill(
                eway_bill_no=f"EWB-26-00{i+1}", eway_date=date.today(), supply_type="Outward", sub_type="Supply",
                document_type="Tax Invoice", document_no=f"SI-26-00{i+1}", document_date=date.today(),
                invoice_type="Regular", token_ex_date="2026-06-25", org_name="Dinesh Exports", dc_no_date=f"GRA-26-00{i+1}",
                bill_from_name="Dinesh Exports", bill_from_address="1 Textile Park, Erode", bill_from_gstin="33DEXPA1234F1Z0",
                bill_from_pin="638001", bill_from_state="Tamil Nadu", bill_from_state_code="33",
                dispatch_from_name="Dinesh Exports Unit 1", dispatch_from_address="1 Textile Park, Erode", dispatch_from_pin="638001",
                dispatch_from_place="Erode", dispatch_from_state="Tamil Nadu", dispatch_from_state_code="33",
                bill_to_name=buyers[i][0], bill_to_address=buyers[i][0] + " Main Street", bill_to_gstin=party_objects[i].gst_no,
                bill_to_pin="400001", bill_to_state="Maharashtra", bill_to_state_code="27",
                dispatch_to_name=buyers[i][0] + " warehouse", dispatch_to_address=buyers[i][0] + " Warehouse",
                dispatch_to_pin="400001", dispatch_to_place="Mumbai", dispatch_to_state="Maharashtra", dispatch_to_state_code="27",
                distance=Decimal("1200.0"), total_value=Decimal("1260000.0"), sgst=Decimal("31500.0"), cgst=Decimal("31500.0"),
                igst=Decimal("0.0"), remarks="Goods dispatched via road", status="Active"
            )
            eway_objects.append(ewb)

        session.add_all(gra_objects)
        session.add_all(dp_objects)
        session.add_all(eway_objects)
        await session.commit()

        for i in range(10):
            gra = gra_objects[i]
            ewb = eway_objects[i]
            await session.refresh(gra)
            await session.refresh(ewb)

            session.add(GoodsReleaseItem(
                release_id=gra.id, packing_slip_no=f"PS-26-00{i+1}", bale_no=f"BALE-PS-26-00{i+1}-01",
                design_no=gra.design_no, color="Navy Blue" if i % 2 == 0 else "Scarlet Red",
                meters=Decimal("5000.00"), pieces=5, weight=Decimal("1000.00"), rate=Decimal("120.00"), amount=Decimal("600000.00")
            ))
            session.add(GoodsReleaseItem(
                release_id=gra.id, packing_slip_no=f"PS-26-00{i+1}", bale_no=f"BALE-PS-26-00{i+1}-02",
                design_no=gra.design_no, color="Navy Blue" if i % 2 == 0 else "Scarlet Red",
                meters=Decimal("5000.00"), pieces=5, weight=Decimal("1000.00"), rate=Decimal("120.00"), amount=Decimal("600000.00")
            ))

            session.add(EwayBillItem(
                bill_id=ewb.id, product_name="Woven Fabrics of Cotton Poplin", hsn_code="5208", unit="MTR",
                qty=Decimal("10000.00"), taxable_value=Decimal("1200000.00"), tax_rate=Decimal("5.0")
            ))
            
            # Seed dispatch completion info
            comp = BuyerOrderCompletion(
                cmp_id=f"CMP-{i+1}", order_id_ref=f"IBPO-26-00{i+1}", completion_date=date.today(), status="Closed",
                final_dispatch_qty="10000 MTR", balance_qty="0 MTR", fabric_type="Cotton Poplin", shade="Standard",
                lot_no=f"LOT-{i+1}", packing_type="Bales", delivery_place=buyers[i][0] + " docks",
                transporter_name=gra.transport_name, buyer_ref=f"REF-{i+1}", remarks="Completed"
            )
            session.add(comp)
            
            disp = BuyerOrderDispatch(
                indent_id=f"IND-DISP-{i+1}", order_id_ref=f"IBPO-26-00{i+1}", transporter_name=gra.transport_name,
                lr_no=gra.lr_no, vehicle_no=gra.vehicle_no, delivery_place=gra.delivery_address, packing_type="Bales",
                dispatch_date=date.today(), shade="Standard", lot_no=f"LOT-{i+1}", quantity="10000 MTR", remarks="Dispatched successfully"
            )
            session.add(disp)

        await session.commit()

        # ── 15. Seed Sales Invoices (Phase 7 Invoicing) ──
        invoice_objects = []
        for i in range(10):
            buyer_party = party_objects[i]
            si = SalesInvoice(
                invoice_no=f"SI-26-00{i+1}", invoice_date=date.today(), invoice_type="Regular Commercial Invoice",
                party_name=buyer_party.company_name, party_id=buyer_party.id, ibpo=f"IBPO-26-00{i+1}", design_no=design_nos[i],
                billing_address=buyer_party.address, delivery_address=buyer_party.address, state=buyer_party.state,
                state_code=buyer_party.state_code, gst_no=buyer_party.gst_no, hsn_code="5208", total_qty=Decimal("10000.00"),
                gross_weight=Decimal("2100.00"), gross_amount=Decimal("1200000.00"), discount_pct=Decimal("0.00"),
                discount_amount=Decimal("0.00"), taxable_amount=Decimal("1200000.00"), sgst=Decimal("30000.00"),
                cgst=Decimal("30000.00"), igst=Decimal("0.00"), other_charges=Decimal("0.00"), round_off=Decimal("0.00"),
                net_amount=Decimal("1260000.00"), remarks="Bill cleared and sent to buyer", status="Dispatched",
                currency="INR", exchange_rate=Decimal("1.0"), buyer_po_no=f"PO-IBPO-26-00{i+1}", dispatch_date=str(date.today()),
                transporter_name=gra_objects[i].transport_name, lr_no=gra_objects[i].lr_no, vehicle_no=gra_objects[i].vehicle_no,
                payment_terms=buyer_party.payment_terms
            )
            invoice_objects.append(si)
        session.add_all(invoice_objects)
        await session.commit()

        for i, si in enumerate(invoice_objects):
            await session.refresh(si)
            session.add(SalesInvoiceItem(
                invoice_id=si.id, design_no=si.design_no, color="Navy Blue" if i % 2 == 0 else "Scarlet Red",
                uom="MTR", qty=Decimal("10000.00"), rate=Decimal("120.00"), amount=Decimal("1200000.00"),
                description="Woven Finished Cotton Poplin Fabric", total_bale=2
            ))
            
            # Seed cloth delivery (Phase 6 link)
            cd = ClothDelivery(
                dc_no=f"CD-DC-00{i+1}", dc_date=date.today(), delivery_type="Customer Delivery", delivery_mode="Road Lorry",
                party_name=si.party_name, design_no=si.design_no, order_no=si.ibpo, transport=si.transporter_name,
                total_meters=Decimal("10000.00"), total_pieces=10, gross_amount=Decimal("1200000.00"),
                sgst=Decimal("30000.00"), igst=Decimal("0.00"), net_amount=Decimal("1260000.00"), remarks="Customer delivery",
                po_no=si.buyer_po_no, process_type="Finished", ibpo=si.ibpo, fabric_detail="Cotton Poplin 40x40",
                ibpo_order_mtr=Decimal("10000.00"), delivery_mtr=Decimal("10000.00"), balance=Decimal("0.00"),
                buyer_name=si.party_name, lot_no=f"LOT-{i+1}", transport_name=si.transporter_name, vehicle_no=si.vehicle_no,
                driver_name=driver_names[i], mobile_no="9876543210"
            )
            session.add(cd)
            
        await session.commit()

        # ── 16. Seed HR Module Items (Phase 8 HR Module) ──
        # Seed 10 connected rows for every single HR subpage/category
        hr_objects = []
        departments_list = ["HR", "Engineering", "Sales", "Finance", "Weaving", "Processing", "Logistics", "Purchase", "Design", "Quality"]
        designations_list = ["Manager", "Lead", "Specialist", "Engineer", "Executive", "Operator", "Supervisor", "Clerk", "Assistant", "Director"]
        
        for i in range(10):
            emp = emp_objects[i]
            
            # 1. Attendance
            hr_objects.append(HRItem(
                category="attendance", employee_id=str(emp.id),
                data={
                    "date": str(date.today() - timedelta(days=i)),
                    "check_in": "09:00",
                    "check_out": "18:00",
                    "status": "Present",
                    "total_hours": 9.0,
                    "hours": 9.0,
                    "ot_hours": 1.0,
                    "shift": emp.shift or "General",
                    "employee": emp.employee_code,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id),
                    "source": "Biometric"
                }
            ))

            # 2. Claims / Expense Claims
            hr_objects.append(HRItem(
                category="expense_claims", employee_id=str(emp.id),
                data={
                    "claim_id": f"CLM-00{i+1}",
                    "date": str(date.today() - timedelta(days=2)),
                    "expense_date": str(date.today() - timedelta(days=2)),
                    "expense_type": "Travel Expense" if i % 2 == 0 else "Medical Reimbursement",
                    "category": "Travel" if i % 2 == 0 else "Medical",
                    "description": f"Travel Expense {i+1}",
                    "amount": 2500.0 + (i * 500.0),
                    "status": "Approved" if i < 8 else "Pending",
                    "remarks": "Verified by Manager",
                    "title": f"Travel Expense {i+1}",
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id)
                }
            ))
            hr_objects.append(HRItem(
                category="claims", employee_id=str(emp.id),
                data={
                    "claim_id": f"CLM-00{i+1}",
                    "date": str(date.today() - timedelta(days=2)),
                    "expense_date": str(date.today() - timedelta(days=2)),
                    "expense_type": "Travel Expense" if i % 2 == 0 else "Medical Reimbursement",
                    "amount": 2500.0 + (i * 500.0),
                    "status": "Approved" if i < 8 else "Pending",
                    "remarks": "Verified by Manager",
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id)
                }
            ))

            # 3. Requisitions
            hr_objects.append(HRItem(
                category="requisitions",
                data={
                    "title": f"{designations_list[i]} Required",
                    "department": departments_list[i],
                    "location": "Dharapuram Factory",
                    "employment_type": "Full-time",
                    "work_mode": "On-site",
                    "skills": "Operations, Management",
                    "experience_min": 2,
                    "experience_max": 8,
                    "headcount": 1,
                    "salary_min": 25000 + (i * 5000),
                    "salary_max": 45000 + (i * 5000),
                    "requested_by": "HR Team",
                    "reporting_to": "Factory Manager",
                    "priority": "High" if i % 2 == 0 else "Medium",
                    "status": "Approved" if i < 7 else "Pending Approval",
                    "budget_ok": True
                }
            ))

            # 4. Candidates
            hr_objects.append(HRItem(
                category="candidates",
                data={
                    "name": f"Candidate {i+1}",
                    "email": f"candidate{i+1}@example.com",
                    "phone": f"98765432{i:02d}",
                    "position": f"{designations_list[i]}",
                    "status": "Interview" if i % 2 == 0 else "Hired",
                    "stage": "Technical Round" if i % 2 == 0 else "Offered",
                    "rating": {"technical": 4, "communication": 4, "domain": 4, "culture": 4}
                }
            ))

            # 5. Tasks (Onboarding tasks)
            hr_objects.append(HRItem(
                category="tasks", employee_id=str(emp.id),
                data={
                    "title": f"Complete Onboarding Checklist for Emp {i+1}",
                    "owner": "HR Dept",
                    "due_date": str(date.today() + timedelta(days=3)),
                    "due": str(date.today() + timedelta(days=3)),
                    "status": "Pending" if i % 2 == 0 else "Completed",
                    "priority": "High",
                    "comments": [],
                    "employeeName": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id),
                    "category": "Documentation"
                }
            ))

            # 6. Offers
            hr_objects.append(HRItem(
                category="offers",
                data={
                    "candidate_name": f"Candidate Offer {i+1}",
                    "position": designations_list[i],
                    "salary_offered": 35000 + (i * 3000),
                    "gross": 35000 + (i * 3000),
                    "allowances": 2000,
                    "deductions": 1500,
                    "joining_date": str(date.today() + timedelta(days=15)),
                    "joiningDate": str(date.today() + timedelta(days=15)),
                    "status": "Sent" if i % 2 == 0 else "Accepted"
                }
            ))

            # 7. Performance
            hr_objects.append(HRItem(
                category="performance", employee_id=str(emp.id),
                data={
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id),
                    "final_score": 3.8 + (i * 0.1),
                    "status": "Completed" if i % 2 == 0 else "In Progress",
                    "review_period": "Q1 Performance Review",
                    "reviewer": "Admin Supervisor",
                    "goals": [
                        {"title": "Improve Loom Efficiency", "weight": 0.5, "score": 4.0},
                        {"title": "Minimize Yarn Waste", "weight": 0.5, "score": 3.6}
                    ]
                }
            ))

            # 8. Offboarding
            hr_objects.append(HRItem(
                category="offboarding", employee_id=str(emp.id),
                data={
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id),
                    "step": "Asset Return" if i % 2 == 0 else "Exit Interview",
                    "status": "Pending" if i % 2 == 0 else "Completed",
                    "notice_period": "30 Days",
                    "last_working_day": str(date.today() + timedelta(days=30))
                }
            ))

            # 9. Payroll
            hr_objects.append(HRItem(
                category="payroll", employee_id=str(emp.id),
                data={
                    "employee_id": str(emp.id),
                    "employee_code": emp.employee_code,
                    "employee_name": emp.name,
                    "employee": emp.name,
                    "basic": 18000.0 + (i * 2000),
                    "hra": 6000.0 + (i * 500),
                    "allowance": 4000.0 + (i * 500),
                    "deductions": 2000.0,
                    "net_salary": 26000.0 + (i * 3000),
                    "month": "June",
                    "year": 2026,
                    "status": "Processed" if i < 8 else "Draft"
                }
            ))

            # 10. Leaves
            hr_objects.append(HRItem(
                category="leaves", employee_id=str(emp.id),
                data={
                    "leave_type": "Casual Leave" if i % 2 == 0 else "Sick Leave",
                    "start_date": str(date.today() - timedelta(days=5)),
                    "end_date": str(date.today() - timedelta(days=4)),
                    "from_date": str(date.today() - timedelta(days=5)),
                    "to_date": str(date.today() - timedelta(days=4)),
                    "total_days": 1,
                    "days": 1,
                    "status": "Approved" if i < 8 else "Pending",
                    "reason": "Family function" if i % 2 == 0 else "Fever",
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id)
                }
            ))

            # 11. Loans
            hr_objects.append(HRItem(
                category="loans", employee_id=str(emp.id),
                data={
                    "loan_type": "Personal Loan",
                    "amount": 50000.0 + (i * 10000.0),
                    "interest_rate": 10.5,
                    "tenure_months": 12,
                    "status": "Approved" if i < 8 else "Pending",
                    "monthly_installment": 4500.0 + (i * 900.0),
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id),
                    "applied_date": str(date.today() - timedelta(days=5)),
                    "purpose": "Personal needs"
                }
            ))

            # 12. Benefits
            hr_objects.append(HRItem(
                category="benefits", employee_id=str(emp.id),
                data={
                    "benefit_type": "Health Insurance",
                    "provider": "Star Health",
                    "coverage_amount": 300000.0,
                    "premium": 5000.0,
                    "status": "Active",
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id)
                }
            ))

            # 13. Helpdesk
            hr_objects.append(HRItem(
                category="helpdesk", employee_id=str(emp.id),
                data={
                    "ticket_no": f"TKT-00{i+1}",
                    "subject": "System setup required" if i % 2 == 0 else "ID Card reprint",
                    "priority": "High" if i % 2 == 0 else "Medium",
                    "status": "Open" if i % 2 == 0 else "Resolved",
                    "assigned_to": "IT Support",
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id)
                }
            ))

            # 14. Timesheets
            hr_objects.append(HRItem(
                category="timesheets", employee_id=str(emp.id),
                data={
                    "date": str(date.today() - timedelta(days=i)),
                    "task_name": "Fabric Quality Inspection",
                    "hours_worked": 8,
                    "status": "Approved",
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id)
                }
            ))

            # 15. Documents
            hr_objects.append(HRItem(
                category="documents", employee_id=str(emp.id),
                data={
                    "doc_name": f"Aadhaar_Card_Emp{i+1}.pdf",
                    "doc_type": "KYC Document",
                    "file_size": "1.2 MB",
                    "uploaded_by": emp.name,
                    "upload_date": str(date.today() - timedelta(days=10)),
                    "employee": emp.name,
                    "employee_name": emp.name,
                    "employee_id": str(emp.id)
                }
            ))

            # 16. Holidays
            hr_objects.append(HRItem(
                category="holidays",
                data={
                    "name": f"Festival Holiday {i+1}",
                    "date": str(date.today() + timedelta(days=30 + i)),
                    "day": "Monday",
                    "type": "National Holiday"
                }
            ))

            # 17. Announcements
            hr_objects.append(HRItem(
                category="announcements",
                data={
                    "title": f"Company Announcement {i+1}",
                    "content": "Please review new policies.",
                    "date": str(date.today() - timedelta(days=i)),
                    "priority": "High" if i % 3 == 0 else "Normal"
                }
            ))

            # 18. Travel Requests
            hr_objects.append(HRItem(
                category="travel_requests", employee_id=str(emp.id),
                data={
                    "request_id": f"TRV-00{i+1}",
                    "employee_id": str(emp.id),
                    "employee_name": emp.name,
                    "employee": emp.name,
                    "from_location": "Coimbatore",
                    "to_location": "Chennai" if i % 2 == 0 else "Bangalore",
                    "departure_date": str(date.today() + timedelta(days=5)),
                    "return_date": str(date.today() + timedelta(days=7)),
                    "purpose": f"Client Meeting {i+1}",
                    "transport_mode": "Train" if i % 2 == 0 else "Flight",
                    "transport_class": "AC Tier 3" if i % 2 == 0 else "Economy",
                    "hotel_required": True if i % 3 == 0 else False,
                    "hotel_name": "Taj Connemara" if i % 3 == 0 else "",
                    "estimated_cost": 8000.0 + (i * 1000.0),
                    "status": "Manager Approved" if i < 8 else "Pending",
                    "co_travelers": []
                }
            ))

            # 19. Training Programs
            hr_objects.append(HRItem(
                category="training_programs",
                data={
                    "program_name": f"Training Program {i+1}",
                    "trainer": "Safety Officer",
                    "start_date": str(date.today() + timedelta(days=10)),
                    "duration_hours": 4,
                    "status": "Scheduled"
                }
            ))

            # 20. Certifications
            hr_objects.append(HRItem(
                category="certifications",
                data={
                    "cert_name": f"ISO 9001 Compliance {i+1}",
                    "authority": "TUV",
                    "expiry_date": str(date.today() + timedelta(days=365)),
                    "status": "Active"
                }
            ))

            # 21. Assets
            hr_objects.append(HRItem(
                category="assets", employee_id=str(emp.id),
                data={
                    "asset_id": f"AST-00{i+1}",
                    "asset_name": "MacBook Pro" if i % 2 == 0 else "ThinkPad L14",
                    "asset_type": "Laptop",
                    "brand": "Apple" if i % 2 == 0 else "Lenovo",
                    "model": "M3 Pro" if i % 2 == 0 else "Gen 4",
                    "serial_number": f"SN-{1000+i}",
                    "employee_id": str(emp.id),
                    "employee_name": emp.name,
                    "employee": emp.name,
                    "assigned_date": str(date.today() - timedelta(days=100)),
                    "purchase_date": str(date.today() - timedelta(days=365)),
                    "purchase_value": 120000.0 if i % 2 == 0 else 75000.0,
                    "purchase_cost": 120000.0 if i % 2 == 0 else 75000.0,
                    "condition": "Excellent" if i % 2 == 0 else "Good",
                    "status": "Assigned",
                    "notes": "Company laptop"
                }
            ))

            # 22. Goals
            hr_objects.append(HRItem(
                category="goals", employee_id=str(emp.id),
                data={
                    "title": f"Complete Phase 2 Weaving Target {i+1}",
                    "description": "Achieve designated production efficiency.",
                    "category": "Production",
                    "target_value": 10000,
                    "current_value": 8500,
                    "unit": "Meters",
                    "start_date": str(date.today() - timedelta(days=30)),
                    "due_date": str(date.today() + timedelta(days=30)),
                    "weight": 100,
                    "status": "On Track",
                    "employee_id": str(emp.id),
                    "employee_name": emp.name,
                    "employee": emp.name
                }
            ))

        session.add_all(hr_objects)
        await session.commit()

        # ── 17. Seed Vehicle logs & Trips (Phase 6 Logistics / Fleet) ──
        # Seed 10 Routes
        route_objects = []
        for i in range(10):
            r = Route(
                route_name=f"Route Coimbatore to Mumbai {i+1}" if i < 5 else f"Route Coimbatore to Chennai {i+1}",
                origin="Coimbatore",
                destination="Mumbai" if i < 5 else "Chennai",
                distance_km=450.0 + (i * 50.0),
                estimated_duration_hours=9.0 + i,
                route_type="Regular",
                status="Active",
                fuel_cost_estimate=11460.0,
                fuel_date=str(date.today() - timedelta(days=1)),
                fuel_station_id=1,
                fuel_type="Diesel",
                fuel_quantity_liters=120.0,
                fuel_rate_per_liter=95.5,
                fuel_odometer_reading=15000.0 + (i * 2000),
                fuel_payment_mode="Cash",
                fuel_vehicle_number=vehicle_nos[i],
                fuel_station_name="HP Bunk Coimbatore"
            )
            route_objects.append(r)
        session.add_all(route_objects)
        await session.commit()

        fleet_objects = []
        for i in range(10):
            # Trip Logs
            ft = FleetItem(
                category="trips",
                data={
                    "trip_no": f"TRIP-00{i+1}",
                    "date": str(date.today()),
                    "vehicle_no": vehicle_nos[i],
                    "driver_name": driver_names[i],
                    "route": "Coimbatore to Mumbai" if i < 5 else "Coimbatore to Chennai Port",
                    "start_km": 15000.0 + (i * 2000),
                    "end_km": 15000.0 + (i * 2000) + 450.0,
                    "fuel_filled_liters": 120.0,
                    "status": "Completed"
                }
            )
            fleet_objects.append(ft)
            
            # Seed real SQL Trip
            t = Trip(
                vehicle_id=vehicle_objects[i].id,
                driver_id=driver_objects[i].id,
                route_id=route_objects[i].id,
                trip_date=str(date.today()),
                start_location="Coimbatore",
                end_location="Mumbai" if i < 5 else "Chennai",
                start_time="08:00",
                end_time="17:00",
                odometer_start=15000.0 + (i * 2000),
                odometer_end=15000.0 + (i * 2000) + 450.0,
                fuel_used=120.0,
                status="Completed",
                revenue=25000.0 + (i * 1000.0),
                expenses=15000.0 + (i * 500.0),
                notes=f"Yarn | Customer_{i+1} | Qty: {10.0 + i} Tons | Rate: {2500.0 + (i * 100)}"
            )
            session.add(t)
            
            # Service Schedule
            schedule = ServiceSchedule(
                vehicle_id=vehicle_objects[i].id,
                scheduled_date=str(date.today() + timedelta(days=10 + i)),
                service_type="Scheduled Maintenance" if i % 2 == 0 else "Major Overhaul",
                status="Pending" if i % 2 == 0 else "Completed",
                service_provider="Authorized Service Center" if i % 2 == 0 else "Local Garage",
                estimated_cost=5000.0 + (i * 1000),
                notes=f"Periodic check at {15000.0 + (i * 2000)} km"
            )
            session.add(schedule)
            
            # Fleet Document
            doc = FleetDocument(
                vehicle_id=vehicle_objects[i].id,
                document_type="Insurance" if i % 3 == 0 else "Fitness Certificate" if i % 3 == 1 else "Permit",
                document_name="Insurance Policy" if i % 3 == 0 else "Fitness Certificate" if i % 3 == 1 else "National Permit",
                document_path=f"/uploads/docs/doc_{i+1}.pdf",
                expiry_date=str(date.today() + timedelta(days=90 + i * 30)),
                issued_date=str(date.today() - timedelta(days=270 - i * 30)),
                authority="RTO Tamil Nadu",
                reference_number=f"REF-DOC-2026-{1000+i}",
                notes="Verified original uploaded"
            )
            session.add(doc)
            
            # Fuel entries
            fuel = FuelEntry(
                vehicle_id=vehicle_objects[i].id,
                entry_date=str(date.today() - timedelta(days=1)),
                odometer_reading=15000.0 + (i * 2000),
                fuel_quantity=120.0,
                fuel_cost=11460.0,
                fuel_type="Diesel",
                fuel_station="HP Bunk Coimbatore",
                notes=f"Fueled by driver {driver_names[i]}"
            )
            session.add(fuel)
            
            # Maintenance Log
            m_log = MaintenanceLog(
                vehicle_id=vehicle_objects[i].id,
                service_date=str(date.today() - timedelta(days=15)),
                maintenance_type="General Service" if i % 2 == 0 else "Tire Replacement",
                work_description="Replaced engine oil and filters" if i % 2 == 0 else "Replaced front tyres",
                labor_cost=2000.0 + (i * 100),
                parts_cost=10000.0 + (i * 900),
                status="Completed"
            )
            session.add(m_log)
            
            # Breakdown Entry
            breakdown = BreakdownEntry(
                vehicle_id=vehicle_objects[i].id,
                breakdown_date=str(date.today() - timedelta(days=30)),
                location="National Highway 544",
                issue_description="Radiator hose leakage",
                repair_required="Replace hose and coolant refill",
                status="Resolved",
                resolution_time_hours=2.5,
                assistance_type="Towing & Repair"
            )
            session.add(breakdown)

        session.add_all(fleet_objects)
        await session.commit()

        # ── 18. Seed Swatch Cards & Returnable DCs (Phase 3 Consumables/Lab/General Service) ──
        for i in range(10):
            # Swatch Card
            sc = SwatchCard(
                swatch_type="Fabric", digital_id=f"SW-26-00{i+1}", count_spec="40S Cotton Warp",
                construction_spec="40S Cotton Weft / 68x60", design_no=design_nos[i],
                color="Navy Blue" if i % 2 == 0 else "Scarlet Red", party_name=buyers[i][0],
                buyer_comments="Shade approved, hand-feel is good"
            )
            session.add(sc)

            # Returnable DC for machine repairs
            rdc = ReturnableDC(
                dc_no=f"RDC-26-00{i+1}", dc_stream="Fabric Unit", date=date.today() - timedelta(days=15),
                asset_name="Weft Yarn Selector Motor" if i % 2 == 0 else "Air Jet Compressor Valve",
                serial_no=f"SN-9988{i}", fault_description="Winding burnt out" if i % 2 == 0 else "Pressure drop detected",
                service_vendor="Loom Spares Service Corp", quotation_no=f"QUO-{500+i}", quotation_amount=8500.0 + (i * 500.0),
                service_po_no=f"SPO-{800+i}", advance_payment=2000.0, status="Returned" if i < 8 else "Outward"
            )
            session.add(rdc)
            
            # Seed Stationary/Consumables items
            pass

        # ── 18b. Seed All Stationery & Consumables Datasets ──
        # Seed UOMs
        default_uoms = [
            { "id": "UOM001", "name": "Nos", "description": "Number of units", "active": "Yes" },
            { "id": "UOM002", "name": "Box", "description": "Box package", "active": "Yes" },
            { "id": "UOM003", "name": "Packet", "description": "Packets", "active": "Yes" },
            { "id": "UOM004", "name": "Roll", "description": "Rolls of tape or sticker", "active": "Yes" },
            { "id": "UOM005", "name": "Kg", "description": "Kilograms", "active": "Yes" },
            { "id": "UOM006", "name": "Litre", "description": "Litres", "active": "Yes" },
            { "id": "UOM007", "name": "Ream", "description": "Reams of paper", "active": "Yes" }
        ]
        for uom_data in default_uoms:
            session.add(StationaryItem(category="consumables_uoms", data=uom_data))

        # Seed Departments
        default_departments = [
            { "id": "DEP001", "name": "HR & Admin", "code": "HRD", "active": "Yes" },
            { "id": "DEP002", "name": "Accounts & Finance", "code": "ACF", "active": "Yes" },
            { "id": "DEP003", "name": "Production", "code": "PRD", "active": "Yes" },
            { "id": "DEP004", "name": "Quality Assurance", "code": "QAC", "active": "Yes" },
            { "id": "DEP005", "name": "Stores & Warehouse", "code": "STW", "active": "Yes" }
        ]
        for dept_data in default_departments:
            session.add(StationaryItem(category="consumables_departments", data=dept_data))

        # Seed Vendors
        default_vendors = [
            { "id": "VEN001", "name": "Apex Supplies Ltd", "code": "APX", "gst": "33AAAAA1111A1Z1", "phone": "9876543210", "email": "sales@apex.com", "rating": 4.5 },
            { "id": "VEN002", "name": "Prime Packers", "code": "PRM", "gst": "33BBBBB2222B2Z2", "phone": "9876543211", "email": "orders@primepack.com", "rating": 4.2 },
            { "id": "VEN003", "name": "SafeWork Safety Goods", "code": "SFW", "gst": "33CCCCC3333C3Z3", "phone": "9876543212", "email": "info@safework.com", "rating": 4.8 },
            { "id": "VEN004", "name": "Metro Stationery Hub", "code": "MTR", "gst": "33DDDDD4444D4Z4", "phone": "9876543213", "email": "contact@metrostationery.com", "rating": 4.0 }
        ]
        for vendor_data in default_vendors:
            session.add(StationaryItem(category="consumables_vendors", data=vendor_data))

        # Seed Categories
        default_cats = [
            { "id": "CAT001", "name": "Office Stationery", "description": "Pens, papers, folders, binders, office tools", "active": "Yes" },
            { "id": "CAT002", "name": "Printing Consumables", "description": "Ink cartridges, toner, drum units", "active": "Yes" },
            { "id": "CAT003", "name": "Computer Accessories", "description": "USB drives, keyboards, mouse, cables", "active": "Yes" },
            { "id": "CAT004", "name": "Packing Materials", "description": "Cartons, tapes, bubble wrap, poly bags", "active": "Yes" },
            { "id": "CAT005", "name": "Housekeeping", "description": "Phenyl, detergents, mops, cleaning clothes", "active": "Yes" },
            { "id": "CAT006", "name": "Safety Items", "description": "Gloves, masks, helmets, ear plugs, jackets", "active": "Yes" },
            { "id": "CAT007", "name": "Production Consumables", "description": "Shade cards, lot stickers, design sheets", "active": "Yes" }
        ]
        for cat_data in default_cats:
            session.add(StationaryItem(category="consumables_categories", data=cat_data))

        # Seed Items
        default_items = [
            { "id": "ITM001", "name": "A4 Paper", "code": "A4P", "category": "Office Stationery", "uom": "Ream", "minStock": 20, "maxStock": 200, "safetyStock": 10, "currentStock": 45, "rate": 280, "vendor": "Metro Stationery Hub" },
            { "id": "ITM002", "name": "Ball Pen Blue", "code": "BPB", "category": "Office Stationery", "uom": "Box", "minStock": 10, "maxStock": 50, "safetyStock": 5, "currentStock": 15, "rate": 150, "vendor": "Metro Stationery Hub" },
            { "id": "ITM003", "name": "HP Laser Toner", "code": "HPT", "category": "Printing Consumables", "uom": "Nos", "minStock": 2, "maxStock": 10, "safetyStock": 1, "currentStock": 3, "rate": 3200, "vendor": "Apex Supplies Ltd" },
            { "id": "ITM004", "name": "Carton Box 5-Ply", "code": "CB5", "category": "Packing Materials", "uom": "Nos", "minStock": 500, "maxStock": 5000, "safetyStock": 100, "currentStock": 1200, "rate": 45, "vendor": "Prime Packers" },
            { "id": "ITM005", "name": "BOPP Packing Tape 2\"", "code": "BOP", "category": "Packing Materials", "uom": "Roll", "minStock": 50, "maxStock": 500, "safetyStock": 10, "currentStock": 80, "rate": 65, "vendor": "Prime Packers" },
            { "id": "ITM006", "name": "Safety Gloves Latex", "code": "SGL", "category": "Safety Items", "uom": "Box", "minStock": 15, "maxStock": 100, "safetyStock": 5, "currentStock": 35, "rate": 450, "vendor": "SafeWork Safety Goods" },
            { "id": "ITM007", "name": "Floor Cleaner Phenyl", "code": "FCP", "category": "Housekeeping", "uom": "Litre", "minStock": 10, "maxStock": 50, "safetyStock": 2, "currentStock": 25, "rate": 85, "vendor": "Apex Supplies Ltd" }
        ]
        for item_data in default_items:
            session.add(StationaryItem(category="consumables_items", data=item_data))

        # Seed Requests
        default_requests = [
            { "id": "REQ001", "date": "2026-06-10", "department": "HR & Admin", "requestedBy": "Dinesh Kumar", "priority": "Medium", "status": "Approved", "remarks": "For new joiners setup", "items": [{ "itemId": "ITM001", "qty": 5, "approvedQty": 5 }, { "itemId": "ITM002", "qty": 2, "approvedQty": 2 }] },
            { "id": "REQ002", "date": "2026-06-12", "department": "Production", "requestedBy": "M. Selvam", "priority": "High", "status": "Pending", "remarks": "Urgent packing material replenishment", "items": [{ "itemId": "ITM004", "qty": 500, "approvedQty": 0 }] }
        ]
        for req_data in default_requests:
            session.add(StationaryItem(category="consumables_requests", data=req_data))

        # Seed POs
        default_pos = [
            { "id": "PO001", "date": "2026-06-08", "vendor": "Prime Packers", "paymentTerms": "30 Days Credit", "expectedDate": "2026-06-15", "status": "Ordered", "items": [{ "itemId": "ITM004", "qty": 1000, "rate": 45, "total": 45000 }] }
        ]
        for po_data in default_pos:
            session.add(StationaryItem(category="consumables_pos", data=po_data))

        # Seed GRNs
        default_grns = [
            { "id": "GRN001", "date": "2026-06-09", "vendor": "Prime Packers", "poId": "PO001", "invoiceNo": "INV-9921", "status": "Accepted", "items": [{ "itemId": "ITM004", "orderedQty": 1000, "receivedQty": 1000, "acceptedQty": 1000, "rejectedQty": 0, "rate": 45 }] }
        ]
        for grn_data in default_grns:
            session.add(StationaryItem(category="consumables_grns", data=grn_data))

        # Seed Issues
        default_issues = [
            { "id": "ISS001", "date": "2026-06-11", "department": "HR & Admin", "employee": "Dinesh Kumar", "purpose": "Office Stationery Setup", "items": [{ "itemId": "ITM001", "qty": 3, "rate": 280 }, { "itemId": "ITM002", "qty": 1, "rate": 150 }] }
        ]
        for issue_data in default_issues:
            session.add(StationaryItem(category="consumables_issues", data=issue_data))

        # Seed Ledger
        default_ledger = [
            { "id": "LED001", "date": "2026-06-01", "itemId": "ITM001", "refType": "Opening", "refId": "-", "inQty": 48, "outQty": 0, "balance": 48 },
            { "id": "LED002", "date": "2026-06-11", "itemId": "ITM001", "refType": "Issue", "refId": "ISS001", "inQty": 0, "outQty": 3, "balance": 45 }
        ]
        for ledger_data in default_ledger:
            session.add(StationaryItem(category="consumables_ledger", data=ledger_data))

        # Seed Quotations
        default_quotations = [
            { "id": "QTN001", "date": "2026-06-05", "vendor": "Apex Supplies Ltd", "validityDate": "2026-07-05", "paymentTerms": "30 Days Credit", "status": "Approved", "items": [{ "itemId": "ITM001", "qty": 10, "rate": 270, "total": 2700 }], "quotation_file_path": "" }
        ]
        for qtn_data in default_quotations:
            session.add(StationaryItem(category="consumables_quotations", data=qtn_data))

        # Seed Requisitions
        default_requisitions = [
            { "id": "PRQ001", "date": "2026-06-11", "requestedBy": "M. Selvam", "status": "Pending", "items": [{ "itemId": "ITM004", "qty": 200, "currentStock": 1200, "minStock": 500 }] },
            { "id": "PRQ002", "date": "2026-06-12", "requestedBy": "Dinesh Kumar", "status": "Approved", "items": [{ "itemId": "ITM001", "qty": 50, "currentStock": 45, "minStock": 20 }] }
        ]
        for req_data in default_requisitions:
            session.add(StationaryItem(category="consumables_requisitions", data=req_data))

        # Seed Returns
        default_returns = [
            { "id": "RET001", "date": "2026-06-12", "department": "Production", "employee": "K. Ramasamy", "itemId": "ITM006", "qty": 5, "reason": "Excess quantity returned from floor" },
            { "id": "RET002", "date": "2026-06-13", "department": "HR & Admin", "employee": "P. Sudha", "itemId": "ITM002", "qty": 10, "reason": "Unused pens returned to store" }
        ]
        for ret_data in default_returns:
            session.add(StationaryItem(category="consumables_returns", data=ret_data))

        # Seed Transfers
        default_transfers = [
            { "id": "TRF001", "date": "2026-06-14", "fromStore": "Main Store", "toStore": "Weaving Section Store", "itemId": "ITM005", "qty": 20, "transferBy": "M. Selvam" },
            { "id": "TRF002", "date": "2026-06-15", "fromStore": "Main Store", "toStore": "Garment Store", "itemId": "ITM004", "qty": 100, "transferBy": "Dinesh Kumar" }
        ]
        for trf_data in default_transfers:
            session.add(StationaryItem(category="consumables_transfers", data=trf_data))

        # Seed Adjustments
        default_adjustments = [
            { "id": "ADJ001", "date": "2026-06-15", "itemId": "ITM001", "qty": 2, "type": "Addition", "reason": "Found extra during pre-audit", "adjustedBy": "M. Selvam" },
            { "id": "ADJ002", "date": "2026-06-16", "itemId": "ITM003", "qty": 1, "type": "Deduction", "reason": "Damaged in storage", "adjustedBy": "Dinesh Kumar" }
        ]
        for adj_data in default_adjustments:
            session.add(StationaryItem(category="consumables_adjustments", data=adj_data))

        # Seed Verifications
        default_verifications = [
            { "id": "PV001", "date": "2026-06-17", "verifiedBy": "Audit Team A", "status": "Completed", "items": [{ "itemId": "ITM001", "name": "A4 Paper", "systemQty": 45, "physicalQty": 45, "variance": 0 }, { "itemId": "ITM002", "name": "Ball Pen Blue", "systemQty": 15, "physicalQty": 14, "variance": -1 }] }
        ]
        for ver_data in default_verifications:
            session.add(StationaryItem(category="consumables_verifications", data=ver_data))

        await session.commit()

        # ── 19. Seed Finance Module (Phase 9 Finance) ──
        # Seed company and vouchers to complete start-to-end workflow data add
        from finance_app.database import SessionLocal as FinanceSessionLocal
        from finance_app.routers.companies import seed_textile_company
        
        finance_db = FinanceSessionLocal()
        try:
            logger.info("Seeding Finance Module...")
            seed_textile_company(db=finance_db)
            logger.info("Successfully seeded finance module with textile company and vouchers.")
        except Exception as e:
            logger.error(f"Error seeding finance module: {e}")
        finally:
            finance_db.close()

        logger.info("Successfully seeded all 10 connected records per ERP page workflow.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [SEED FAILED] Error: {e}")
        logger.error(f"Error seeding workflow database: {e}")
        await session.rollback()
