import asyncio
import asyncpg

async def run_migration():
    print("Connecting to the database...")
    db_url = "postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    
    conn = await asyncpg.connect(db_url)
    print("Connected successfully!")
    
    # Drop existing tables to ensure perfect matching schema synchronization
    print("Dropping existing eway_bill tables if they exist...")
    await conn.execute("DROP TABLE IF EXISTS eway_bill_items;")
    await conn.execute("DROP TABLE IF EXISTS eway_bills;")
    
    print("Creating table eway_bills...")
    await conn.execute("""
        CREATE TABLE eway_bills (
            id SERIAL PRIMARY KEY,
            eway_bill_no VARCHAR(50) UNIQUE,
            eway_date DATE,
            supply_type VARCHAR(50),
            sub_type VARCHAR(50),
            document_type VARCHAR(50),
            document_no VARCHAR(50),
            document_date DATE,
            invoice_type VARCHAR(50),
            token_ex_date VARCHAR(50),
            org_name VARCHAR(100),
            dc_no_date VARCHAR(100),
            token_no TEXT,
            result TEXT,
            error TEXT,
            
            bill_from_name VARCHAR(255),
            bill_from_address TEXT,
            bill_from_gstin VARCHAR(20),
            bill_from_pin VARCHAR(10),
            bill_from_state VARCHAR(100),
            bill_from_state_code VARCHAR(10),
            
            dispatch_from_name VARCHAR(255),
            dispatch_from_address TEXT,
            dispatch_from_pin VARCHAR(10),
            dispatch_from_place VARCHAR(150),
            dispatch_from_state VARCHAR(100),
            dispatch_from_state_code VARCHAR(10),
            
            bill_to_name VARCHAR(255),
            bill_to_address TEXT,
            bill_to_gstin VARCHAR(20),
            bill_to_pin VARCHAR(10),
            bill_to_state VARCHAR(100),
            bill_to_state_code VARCHAR(10),
            
            dispatch_to_name VARCHAR(255),
            dispatch_to_address TEXT,
            dispatch_to_pin VARCHAR(10),
            dispatch_to_place VARCHAR(150),
            dispatch_to_state VARCHAR(100),
            dispatch_to_state_code VARCHAR(10),
            
            distance NUMERIC(10, 2) DEFAULT 0,
            total_value NUMERIC(14, 2) DEFAULT 0,
            sgst NUMERIC(10, 2) DEFAULT 0,
            cgst NUMERIC(10, 2) DEFAULT 0,
            igst NUMERIC(10, 2) DEFAULT 0,
            remarks TEXT,
            status VARCHAR(30) DEFAULT 'Draft',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    print("Table eway_bills created!")

    print("Creating table eway_bill_items...")
    await conn.execute("""
        CREATE TABLE eway_bill_items (
            id SERIAL PRIMARY KEY,
            bill_id INTEGER REFERENCES eway_bills(id) ON DELETE CASCADE,
            product_name VARCHAR(255),
            hsn_code VARCHAR(20),
            unit VARCHAR(20),
            qty NUMERIC(10, 2) DEFAULT 0,
            taxable_value NUMERIC(12, 2) DEFAULT 0,
            tax_rate NUMERIC(5, 2) DEFAULT 0
        );
    """)
    print("Table eway_bill_items created!")
    
    await conn.close()
    print("Eway bill schema migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
