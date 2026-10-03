import os
import sys
import asyncio
import sqlite3
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")

async def clear_database():
    print(f"Connecting to PostgreSQL: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # Tables to truncate with cascade and restart identity
        tables_to_truncate = [
            "cloth_delivery_items",
            "cloth_deliveries",
            "buyer_order_schedules",
            "buyer_order_items",
            "buyer_orders",
            "design_entry",
            "party_master",
            "log_reports",
        ]
        
        for tbl in tables_to_truncate:
            try:
                print(f"Truncating {tbl}...")
                await conn.execute(text(f'TRUNCATE TABLE "{tbl}" RESTART IDENTITY CASCADE;'))
                print(f"  -> Successfully truncated {tbl}")
            except Exception as e:
                print(f"  -> Warning on {tbl}: {e}")

        # Clean employees except admin (id=1)
        print("Cleaning non-admin seeded employees...")
        try:
            res = await conn.execute(text("DELETE FROM employees WHERE id > 1;"))
            print(f"  -> Removed {res.rowcount} non-admin employees.")
        except Exception as e:
            print(f"  -> Warning removing non-admin employees: {e}")

    await engine.dispose()
    print("PostgreSQL cleanup completed.")

    # Clean cubebook.db (SQLite)
    cubebook_path = os.path.join(os.path.dirname(__file__), "..", "cubebook.db")
    if os.path.exists(cubebook_path):
        print(f"Cleaning SQLite at {cubebook_path}...")
        try:
            conn = sqlite3.connect(cubebook_path)
            cur = conn.cursor()
            # Remove party ledgers (synced from party_master)
            cur.execute("DELETE FROM ledgers WHERE party_type IS NOT NULL OR name IN ('Heritage Handloom Creations Pvt Ltd', 'FabIndia Overseas Pvt Ltd', 'Vogue Fashions Export Corp', 'Raymond Apparel Division', 'Global Textile Traders LLC', 'Test Party 123', 'Premier Mills Pvt Ltd', 'ABC Twisting Works', 'Rainbow Yarn Dyeing', 'Sri Warping Centre', 'Vijay Sizing Mills', 'ABC Exports', 'Sri Ram Spinners', 'Sri Lakshmi Textiles Pvt Ltd', 'Sunrise Fashion House', 'Fashion Exports Pvt Ltd', 'Cauvery Textile Buyers Pvt Ltd', 'bdk', '.  SAI CREATIONS', 'A.J.POLY YARN SPINNER', 'A.S.CREATIONS', 'ADITYA COLOURS');")
            deleted_ledgers = cur.rowcount
            print(f"  -> Deleted {deleted_ledgers} synced party ledgers.")
            
            # Remove any vouchers if any
            cur.execute("DELETE FROM vouchers;")
            cur.execute("DELETE FROM voucher_entries;")
            
            # Clean non-default locations
            cur.execute("DELETE FROM locations WHERE name NOT IN ('Main Warehouse', 'Default Location');")
            
            conn.commit()
            conn.close()
            print("SQLite cleanup completed.")
        except Exception as e:
            print(f"Error cleaning SQLite: {e}")

if __name__ == "__main__":
    asyncio.run(clear_database())
