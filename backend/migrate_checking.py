import asyncio
import asyncpg

async def run_migration():
    print("Connecting to the database...")
    # Read database URL from environment or configuration
    db_url = "postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    
    conn = await asyncpg.connect(db_url)
    print("Connected successfully!")
    
    # 1. Add table_no to on_table_checking
    print("Altering on_table_checking table...")
    await conn.execute("""
        ALTER TABLE on_table_checking 
        ADD COLUMN IF NOT EXISTS table_no VARCHAR(100);
    """)
    
    # 2. Add fields to on_table_checking_items
    print("Altering on_table_checking_items table...")
    fields = [
        ("vpc_no", "VARCHAR(100)"),
        ("inv_pin", "VARCHAR(100)"),
        ("checking_pin", "VARCHAR(100)"),
        ("pc_type", "VARCHAR(100)"),
        ("pc_1", "TEXT"),
        ("pc_2", "TEXT"),
        ("pc_3", "TEXT"),
        ("pc_4", "TEXT"),
        ("pc_5", "TEXT"),
        ("pc_6", "TEXT"),
        ("pc_7", "TEXT"),
        ("swex", "TEXT")
    ]
    
    for col_name, col_type in fields:
        await conn.execute(f"""
            ALTER TABLE on_table_checking_items 
            ADD COLUMN IF NOT EXISTS {col_name} {col_type};
        """)
        print(f"Added column {col_name} if it did not exist.")
        
    await conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
