import sys
import os
import asyncio
from datetime import datetime, date

# Ensure backend path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.party_master import PartyMaster
from app.models.design_entry import DesignEntry
from app.models.buyer_order import BuyerOrder, BuyerOrderItem
from sqlalchemy import select

async def seed_hr_demo():
    async with AsyncSessionLocal() as session:
        print("Seeding demonstration records for HR scenario...")

        # 1. Customer: Heritage Handloom Creations Pvt Ltd
        res = await session.execute(select(PartyMaster).where(PartyMaster.company_name == "Heritage Handloom Creations Pvt Ltd"))
        customer = res.scalar_one_or_none()
        if not customer:
            customer = PartyMaster(
                customer_code="CUST-HER-01",
                party_type="Sales",
                company_name="Heritage Handloom Creations Pvt Ltd",
                party_group="Buyer",
                customer_grade="A",
                status="Active",
                address_type="Bill",
                address="No. 45, Weaver's Colony, Gandhi Road",
                city="Chennai",
                district="Chennai",
                state="Tamil Nadu",
                state_code="33",
                pin_code="600028",
                country="India",
                sales_region="South",
                currency="INR",
                phone="044-24981122",
                mobile="9841012345",
                email="orders@heritagehandlooms.com",
                contact_person="Mr. Rajesh Varma",
                gst_no="33AABCH1234F1Z9",
                gst_type="Regular",
                pan_no="AABCH1234F",
                credit_days=30,
                credit_limit=1500000.0,
                payment_terms="30 Days Net"
            )
            session.add(customer)
            await session.flush()
            print(f"Created Customer: {customer.company_name} (ID: {customer.id})")
        else:
            print(f"Customer already exists (ID: {customer.id})")

        # 2. Yarn Supplier: Lakshmi Spinning Mills Ltd
        res = await session.execute(select(PartyMaster).where(PartyMaster.company_name == "Lakshmi Spinning Mills Ltd"))
        supplier = res.scalar_one_or_none()
        if not supplier:
            supplier = PartyMaster(
                customer_code="SUPP-LAKSHMI-01",
                party_type="Purchase",
                company_name="Lakshmi Spinning Mills Ltd",
                party_group="Yarn Supplier",
                customer_grade="A",
                status="Active",
                address_type="Bill",
                address="12, Mill Road, Peelamedu",
                city="Coimbatore",
                district="Coimbatore",
                state="Tamil Nadu",
                state_code="33",
                pin_code="641004",
                country="India",
                currency="INR",
                phone="0422-2567890",
                contact_person="K. Balakrishnan",
                email="sales@lakshmispinning.com",
                gst_no="33AABCL9876E1Z4",
                pan_no="AABCL9876E"
            )
            session.add(supplier)
            await session.flush()
            print(f"Created Supplier: {supplier.company_name}")

        # 3. Dyeing Processor: Rainbow Dyeing Mills
        res = await session.execute(select(PartyMaster).where(PartyMaster.company_name == "Rainbow Dyeing Mills"))
        dyeing = res.scalar_one_or_none()
        if not dyeing:
            dyeing = PartyMaster(
                customer_code="JW-RAINBOW-01",
                party_type="Job Worker",
                company_name="Rainbow Dyeing Mills",
                party_group="Processor",
                customer_grade="A",
                status="Active",
                address="Perundurai Industrial Estate",
                city="Erode",
                state="Tamil Nadu",
                state_code="33",
                pin_code="638052",
                gst_no="33AABCR5544K1Z1",
                contact_person="M. Senthil"
            )
            session.add(dyeing)
            await session.flush()
            print(f"Created Job Worker: {dyeing.company_name}")

        # 4. Design Entry: DSG-HERITAGE-401
        res = await session.execute(select(DesignEntry).where(DesignEntry.design_no == "DSG-HERITAGE-401"))
        design = res.scalar_one_or_none()
        if not design:
            design = DesignEntry(
                ds_ref_no="DSR-2026-0089",
                ds_date=date.today(),
                design_no="DSG-HERITAGE-401",
                buyer_name="Heritage Handloom Creations Pvt Ltd",
                color="Navy Blue / Natural White",
                fabric="Pure Cotton Cambric",
                gry_const="72 x 68 / 2/40s x 40s",
                reed=72.0,
                pick_ot=68.0,
                total_ends=3888.0,
                finish_width=54.0,
                order_mtr=5000.0,
                total_mtr=5000.0,
                crimp_pct=3.5,
                skg_pct=2.0,
                dyeing_loss_pct=1.0,
                warp_mtr=5300.0,
                weft_pro_mtr=5000.0,
                weaving="Plain",
                status="Approved",
                yarn_details="Warp: 2/40s Combed Cotton (620.5 Kg) | Weft: 40s Single Combed Cotton (548.2 Kg)"
            )
            session.add(design)
            await session.flush()
            print(f"Created Design: {design.design_no}")

        # 5. Buyer Order: IBPO-00105
        res = await session.execute(select(BuyerOrder).where(BuyerOrder.ibpo_number == "IBPO-00105"))
        b_order = res.scalar_one_or_none()
        if not b_order:
            b_order = BuyerOrder(
                ibpo_number="IBPO-00105",
                order_date=date.today(),
                party_name="Heritage Handloom Creations Pvt Ltd",
                party_id=customer.id,
                buyer_name="Heritage Handloom Creations Pvt Ltd",
                billing_address=customer.address,
                delivery_address=customer.address,
                state=customer.state,
                state_code=customer.state_code,
                gst_no=customer.gst_no,
                pan_no=customer.pan_no,
                order_type="Regular",
                order_taken_by="Anita Krishnan",
                merchandiser="Anita Krishnan",
                status="Approved",
                payment_terms=customer.payment_terms,
                max_crd_days=30,
                transport_mode="Road Transport",
                transport_name="Blue Dart Logistics",
                delivery_place="Chennai Warehouse",
                remarks="5,000 MTR Pure Cotton Cambric Fabric for Spring/Summer 2026 collection."
            )
            session.add(b_order)
            await session.flush()

            # Line item
            item = BuyerOrderItem(
                order_id=b_order.id,
                party_po_no="HHC-PO-2026-99",
                po_date=date.today(),
                point_of_contact="Mr. Rajesh Varma",
                design_no="DSG-HERITAGE-401",
                buyer_style="HER-SS26",
                fabric_type="Cotton",
                color="Navy Blue / Natural White",
                weaving_type="Plain",
                order_mtrs=5000.0,
                total_mtr_yard=5000.0,
                uom="MTR",
                finish_width=54.0,
                hsn_code="5208",
                price=240.0,
                gst_pct=5.0,
                gst_rate=12.0,
                rate=240.0,
                amount=1200000.0
            )
            session.add(item)
            print(f"Created Buyer Order: {b_order.ibpo_number} with Item (Total: Rs. 12,00,000 + 5% GST)")

        await session.commit()
        print("Demo scenario records committed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_hr_demo())
