import os
import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, distinct

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.models.buyer_order import BuyerOrder, BuyerOrderItem
from app.models.sub_master import SubMaster

DATABASE_URL = "postgresql+asyncpg://postgres:Karthi%401234@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def fix_sub_masters():
    async with AsyncSessionLocal() as session:
        mapping = {
            "order_type_master": (BuyerOrder, BuyerOrder.order_type),
            "certified_type": (BuyerOrder, BuyerOrder.certified_type),
            "commission_type_master": (BuyerOrder, BuyerOrder.commission_type),
            "regular_special_master": (BuyerOrder, BuyerOrder.regular_special),
            "status_master": (BuyerOrder, BuyerOrder.status),
            
            "hsn_code_master": (BuyerOrderItem, BuyerOrderItem.hsn_code),
            "short_no_master": (BuyerOrderItem, BuyerOrderItem.short_no),
            "gry_construction_master": (BuyerOrderItem, BuyerOrderItem.gry_construction),
            "fabric_type_master": (BuyerOrderItem, BuyerOrderItem.fabric_type),
            "color_master": (BuyerOrderItem, BuyerOrderItem.color),
            "weaving_type_master": (BuyerOrderItem, BuyerOrderItem.weaving_type),
            "loom_type_master": (BuyerOrderItem, BuyerOrderItem.loom_type),
            "end_use_master": (BuyerOrderItem, BuyerOrderItem.end_use),
            "season_master": (BuyerOrderItem, BuyerOrderItem.season),
            "pc_type_master": (BuyerOrderItem, BuyerOrderItem.pc_type),
            "development_id_master": (BuyerOrderItem, BuyerOrderItem.development_id),
        }
        
        inserted = 0
        for entity_name, (model, column) in mapping.items():
            result = await session.execute(select(distinct(column)).where(column != None))
            values = result.scalars().all()
            
            existing_result = await session.execute(select(SubMaster.name).where(SubMaster.entity == entity_name))
            existing = set(existing_result.scalars().all())
            
            for val in values:
                if val and val not in existing:
                    session.add(SubMaster(entity=entity_name, name=val, is_active=True))
                    inserted += 1
                    existing.add(val)
                    
        await session.commit()
        print(f"Successfully added {inserted} missing options to sub_master!")

if __name__ == "__main__":
    asyncio.run(fix_sub_masters())
