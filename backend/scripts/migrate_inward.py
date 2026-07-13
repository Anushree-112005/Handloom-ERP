import asyncio
import asyncpg

async def run_migration():
    print("Connecting to the database...")
    db_url = "postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    
    conn = await asyncpg.connect(db_url)
    print("Connected successfully!")
    
    # 1. Alter cloth_inwards table
    print("Altering cloth_inwards table...")
    inward_columns = [
        ("inward_type", "VARCHAR(100)"),
        ("inw_date", "DATE"),
        ("vendor_order", "VARCHAR(100)"),
        ("vendor_order_mtr", "NUMERIC(10, 2) DEFAULT 0"),
        ("order_mtr_plus_10", "NUMERIC(10, 2) DEFAULT 0"),
        ("received_mtr", "NUMERIC(10, 2) DEFAULT 0"),
        ("balance_mtr", "NUMERIC(10, 2) DEFAULT 0"),
        ("ibpo", "VARCHAR(100)"),
        ("const_fabric_type", "VARCHAR(255)"),
        ("reed", "VARCHAR(100)"),
        ("pick", "VARCHAR(100)"),
        ("width", "VARCHAR(100)"),
        ("order_mtr", "NUMERIC(10, 2) DEFAULT 0"),
        ("warp_mtr", "NUMERIC(10, 2) DEFAULT 0"),
        ("inward_mtr", "NUMERIC(10, 2) DEFAULT 0"),
        ("shed_no", "VARCHAR(100)"),
        ("loom_no", "VARCHAR(100)"),
        ("attn_no", "VARCHAR(100)"),
        ("beam_no", "VARCHAR(100)"),
        ("szt_no", "VARCHAR(100)"),
        ("inspection_type", "VARCHAR(100)"),
        ("inv_pin", "VARCHAR(100)"),
        ("process_type", "VARCHAR(100)"),
        ("process_remarks", "TEXT"),
        ("our_delivery_ref", "VARCHAR(100)"),
        ("total_weight", "NUMERIC(10, 2) DEFAULT 0"),
        ("weaving_waste_kgs", "NUMERIC(10, 2) DEFAULT 0"),
        ("weaving_waste_pct", "NUMERIC(10, 2) DEFAULT 0"),
        ("warp_issued_kgs", "NUMERIC(10, 2) DEFAULT 0"),
        ("weft_issued_kgs", "NUMERIC(10, 2) DEFAULT 0"),
        ("weft_return_kgs", "NUMERIC(10, 2) DEFAULT 0"),
        ("beam_return_kgs", "NUMERIC(10, 2) DEFAULT 0")
    ]
    
    for col_name, col_type in inward_columns:
        await conn.execute(f"""
            ALTER TABLE cloth_inwards 
            ADD COLUMN IF NOT EXISTS {col_name} {col_type};
        """)
        print(f"Added column {col_name} to cloth_inwards if not exists.")

    # 2. Alter cloth_inward_items table
    print("Altering cloth_inward_items table...")
    item_columns = [
        ("piece_no", "VARCHAR(100)"),
        ("weight", "NUMERIC(10, 2) DEFAULT 0"),
        ("vloom", "VARCHAR(100)"),
        ("vpc_no", "VARCHAR(100)"),
        ("width", "VARCHAR(50)")
    ]
    
    for col_name, col_type in item_columns:
        await conn.execute(f"""
            ALTER TABLE cloth_inward_items 
            ADD COLUMN IF NOT EXISTS {col_name} {col_type};
        """)
        print(f"Added column {col_name} to cloth_inward_items if not exists.")
        
    await conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
