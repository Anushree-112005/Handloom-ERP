import asyncio
import os
import sqlite3
import asyncpg
from dotenv import load_dotenv

async def run_migration():
    load_dotenv()
    
    # 1. Migrate Local SQLite (if exists)
    db_file = "textile_erp.db"
    if os.path.exists(db_file):
        print(f"Migrating local SQLite database '{db_file}'...")
        try:
            sconn = sqlite3.connect(db_file)
            scur = sconn.cursor()
            
            # Delete data
            scur.execute("DELETE FROM on_table_checking_items;")
            scur.execute("DELETE FROM on_table_checking;")
            sconn.commit()
            print("Local SQLite table data cleared successfully!")
            
            # Drop columns (SQLite 3.35.0+)
            columns_to_drop = ["pc_1", "pc_2", "pc_3", "pc_4", "pc_5", "pc_6", "pc_7", "swex"]
            for col in columns_to_drop:
                try:
                    scur.execute(f"ALTER TABLE on_table_checking_items DROP COLUMN {col};")
                    sconn.commit()
                    print(f"Dropped column {col} from local SQLite table.")
                except Exception as e:
                    print(f"Skip dropping {col} on SQLite (possibly already dropped or unsupported version): {e}")
            sconn.close()
        except Exception as e:
            print(f"SQLite migration error: {e}")

    # 2. Migrate Deployment PostgreSQL
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    else:
        db_url = "postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp"
        
    print(f"Connecting to PostgreSQL database...")
    try:
        conn = await asyncpg.connect(db_url)
        print("Connected to PostgreSQL successfully!")
        
        # Delete data
        print("Deleting data from on_table_checking_items and on_table_checking...")
        await conn.execute("DELETE FROM on_table_checking_items;")
        await conn.execute("DELETE FROM on_table_checking;")
        print("PostgreSQL table data cleared successfully!")
        
        # Drop columns
        print("Dropping pc_1 to pc_7 and swex columns from on_table_checking_items...")
        columns_to_drop = ["pc_1", "pc_2", "pc_3", "pc_4", "pc_5", "pc_6", "pc_7", "swex"]
        for col in columns_to_drop:
            try:
                await conn.execute(f"ALTER TABLE on_table_checking_items DROP COLUMN IF EXISTS {col};")
                print(f"Dropped column {col} from PostgreSQL table.")
            except Exception as e:
                print(f"Failed to drop column {col} from PostgreSQL: {e}")
                
        await conn.close()
        print("PostgreSQL database migration completed!")
    except Exception as e:
        print(f"PostgreSQL migration connection/execution failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
