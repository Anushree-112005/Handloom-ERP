import logging
from sqlalchemy import select
from datetime import datetime, date

from app.models.ppc import LoomMaster, LoomAllocation
from app.models.buyer_order import BuyerOrder
from app.models.sub_master import SubMaster

logger = logging.getLogger(__name__)

async def seed_ppc_data(session):
    """Seed the database with initial Production Management (PPC) data."""
    try:
        # 1. Check if Looms exist
        loom_res = await session.execute(select(LoomMaster).limit(1))
        if not loom_res.scalar_one_or_none():
            logger.info("Seeding PPC Looms...")
            l1 = LoomMaster(loom_name="LM-001", loom_type="Air Jet", manufacturer="Toyota", capacity_per_day=450, running_speed_per_hr=20, efficiency_pct=92.5, status="Running", location="Shed A")
            l2 = LoomMaster(loom_name="LM-002", loom_type="Air Jet", manufacturer="Toyota", capacity_per_day=450, running_speed_per_hr=20, efficiency_pct=88.0, status="Running", location="Shed A")
            l3 = LoomMaster(loom_name="LM-003", loom_type="Rapier", manufacturer="Picanol", capacity_per_day=380, running_speed_per_hr=16, efficiency_pct=85.0, status="Idle", location="Shed B")
            l4 = LoomMaster(loom_name="LM-004", loom_type="Rapier", manufacturer="Picanol", capacity_per_day=380, running_speed_per_hr=16, efficiency_pct=81.5, status="Maintenance", location="Shed B")
            l5 = LoomMaster(loom_name="LM-005", loom_type="Water Jet", manufacturer="Tsudakoma", capacity_per_day=500, running_speed_per_hr=22, efficiency_pct=95.0, status="Running", location="Shed C")
            session.add_all([l1, l2, l3, l4, l5])
            await session.commit()
            
            # Refresh to get DB-generated IDs
            await session.refresh(l1)
            await session.refresh(l2)
            await session.refresh(l3)

            # 2. Seed Buyer Orders
            order_res = await session.execute(select(BuyerOrder).limit(1))
            if not order_res.scalar_one_or_none():
                logger.info("Seeding PPC Buyer Orders...")
                o1 = BuyerOrder(ibpo_number="ORD-2026-001", order_date=date.today(), party_name="H&M Sweden", status="Active")
                o2 = BuyerOrder(ibpo_number="ORD-2026-002", order_date=date.today(), party_name="Zara Spain", status="Active")
                o3 = BuyerOrder(ibpo_number="ORD-2026-003", order_date=date.today(), party_name="IKEA Netherlands", status="Active")
                session.add_all([o1, o2, o3])
                await session.commit()

            # 3. Seed Allocations
            logger.info("Seeding PPC Loom Allocations...")
            a1 = LoomAllocation(loom_id=l1.id, order_id="ORD-2026-001", fabric_type="Cotton Poplin", assigned_meters=15000, completed_meters=12500, allocation_status="Active")
            a2 = LoomAllocation(loom_id=l2.id, order_id="ORD-2026-002", fabric_type="Polyester Twill", assigned_meters=10000, completed_meters=3400, allocation_status="Active")
            a3 = LoomAllocation(loom_id=l3.id, order_id="ORD-2026-003", fabric_type="Cotton Canvas", assigned_meters=20000, completed_meters=0, allocation_status="Pending")
            session.add_all([a1, a2, a3])
            await session.commit()

            # 4. Seed Target vs Actual Data (Daily Monitor)
            logger.info("Seeding Target vs Actual records...")
            t1 = SubMaster(category="ppc_target_actual", name="2026-06-17-LM-001", code="LM-001", extra_field_1="415.0 / 400.0 m", extra_field_2="On Track", description="Shortfall: -15.0 m | Eff: 103.8%", is_active=True)
            t2 = SubMaster(category="ppc_target_actual", name="2026-06-17-LM-002", code="LM-002", extra_field_1="380.0 / 400.0 m", extra_field_2="Delayed", description="Shortfall: 20.0 m | Eff: 95.0%", is_active=True)
            t3 = SubMaster(category="ppc_target_actual", name="2026-06-17-LM-003", code="LM-003", extra_field_1="0.0 / 380.0 m", extra_field_2="Delayed", description="Shortfall: 380.0 m | Eff: 0.0%", is_active=True)
            t4 = SubMaster(category="ppc_target_actual", name="2026-06-17-LM-005", code="LM-005", extra_field_1="500.0 / 490.0 m", extra_field_2="On Track", description="Shortfall: -10.0 m | Eff: 102.0%", is_active=True)
            session.add_all([t1, t2, t3, t4])
            await session.commit()
            
    except Exception as e:
        logger.error(f"Error seeding PPC data: {e}")
        await session.rollback()
