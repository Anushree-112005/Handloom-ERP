import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)

async def migrate():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN receipt_no VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN receipt_date DATE;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN yarn_dyeing_po_no VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN processor_name VARCHAR(150);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN buyer_name VARCHAR(150);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN party_invoice_no VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN driver_mobile VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN checked_by VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN qc_status VARCHAR(50) DEFAULT 'Pending';"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN receipt_status VARCHAR(50) DEFAULT 'Pending';"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_taken_qty NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_received_qty NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_short_qty NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_excess_qty NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_bags INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_cones INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_gross_weight NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received ADD COLUMN total_net_weight NUMERIC(10, 2) DEFAULT 0;"))

            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN yarn_type VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN ply VARCHAR(20);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN batch_no VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN gross_weight NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN tare_weight NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN net_weight NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN excess_qty NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN accepted_qty NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN rejected_qty NUMERIC(10, 2) DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE dyed_yarn_received_items ADD COLUMN qc_remarks TEXT;"))
            print("Migration successful")
        except Exception as e:
            print("Error:", e)

asyncio.run(migrate())
