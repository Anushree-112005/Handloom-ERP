import os
import sys
import asyncio
import random
import json
from datetime import date
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, delete

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.models.buyer_order import BuyerOrder
from app.models.design_entry import DesignEntry

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def reseed():
    async with AsyncSessionLocal() as session:
        # Delete existing design entries to avoid duplicates and clear bad data
        await session.execute(delete(DesignEntry))
        await session.commit()
        
        # Fetch some recently created BuyerOrders
        result = await session.execute(
            select(BuyerOrder).limit(10)
        )
        orders = result.scalars().all()
        
        if not orders:
            print("No Buyer Orders found to create Design Entries for.")
            return
            
        designs = []
        for i, order in enumerate(orders):
            ds_ref = f"DS-{random.randint(1000, 9999)}_{i+1}"
            
            # Create a mock yarn detail JSON array
            yarn_details = [
                {"type": "Warp", "count": "40s CW", "mill": "Super Mills", "color": "Bleached", "blend": "100% Cotton"},
                {"type": "Weft", "count": "40s CW", "mill": "Super Mills", "color": "Navy Blue", "blend": "100% Cotton"}
            ]
            
            # Create a valid fabric design details JSON array
            fabric_details = [
                {"type": "Warp", "yarn": "40s CW", "threads": 120, "color": "Bleached"}, 
                {"type": "Weft", "yarn": "40s CW", "threads": 80, "color": "Navy Blue"}
            ]
            
            d = DesignEntry(
                ds_ref_no=ds_ref,
                ds_date=date.today(),
                design_no=f"DN-{random.randint(1000, 9999)}",
                color=random.choice(["Navy Blue", "Crimson Red", "Jet Black", "Olive Green", "Optic White"]),
                created_by="Admin",
                gry_const="40s X 40s / 120 X 80",
                count_rxpxw="120X80X63",
                buyer_name=order.buyer_name,
                ibpo_no=order.ibpo_number,
                order_mtr=random.choice([1000.0, 2000.0, 5000.0]),
                ex_mtr=100.0,
                total_mtr=2100.0,
                crimp_pct=4.5,
                skg_pct=2.0,
                warp_mtr=2200.0,
                weft_pro_mtr=2150.0,
                gray_width=63.0,
                finish_width=61.5,
                reed_ol=120.0,
                pick_ot=80.0,
                reed=118.0,
                fabric="100% Cotton Poplin",
                total_ends=7560.0,
                warp_width=63.5,
                qlm=140.5,
                toie_pct=1.5,
                selvage_waste=2.0,
                weaving="Airjet",
                design_type="Solid Dyed",
                packing_less=0.5,
                weight_grm=135.0,
                dyeing_loss_pct=3.0,
                yarn_details=json.dumps(yarn_details),
                fabric_design_details=json.dumps(fabric_details),
                warp_summary='{"total_weight": 150.0, "ends_per_inch": 120}',
                weft_summary='{"total_weight": 140.0, "picks_per_inch": 80}',
                image_path="",
                book_no=f"B-{random.randint(10, 99)}",
                page_no=f"P-{random.randint(1, 100)}"
            )
            designs.append(d)
            
        session.add_all(designs)
        await session.commit()
        print(f"Successfully cleared old entries and inserted {len(designs)} new Design Entries!")

if __name__ == "__main__":
    asyncio.run(reseed())
