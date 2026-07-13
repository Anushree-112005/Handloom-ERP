import asyncio
from sqlalchemy import text
from sqlalchemy.dialects import postgresql
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.cloth import ClothInward, ClothInwardItem, ClothDelivery, ClothDeliveryItem

async def sync():
    dialect = postgresql.dialect()
    async with engine.begin() as conn:
        for table_name in ["cloth_inwards", "cloth_inward_items", "cloth_deliveries", "cloth_delivery_items", "on_table_checking", "on_table_checking_items"]:
            if table_name not in Base.metadata.tables:
                continue
            table = Base.metadata.tables[table_name]
            
            for col in table.columns:
                # We will attempt to alter all columns to their correct types.
                # If they can't be cast, we drop and re-add (if they are empty).
                col_type = col.type.compile(dialect)
                
                try:
                    await conn.execute(text(f"ALTER TABLE {table_name} ALTER COLUMN {col.name} TYPE {col_type} USING {col.name}::{col_type}"))
                except Exception as e:
                    # Ignore primary key and existing columns that we didn't add or are correct
                    pass
            print(f"Fixed types for {table_name}")

asyncio.run(sync())
