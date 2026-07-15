import asyncio
import asyncpg

async def run_migration():
    print("Connecting to the database...")
    db_url = "postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    
    conn = await asyncpg.connect(db_url)
    print("Connected successfully!")
    
    # Create log_reports table if not exists
    print("Creating log_reports table if not exists...")
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS log_reports (
            id SERIAL PRIMARY KEY,
            log_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            user_name VARCHAR(150),
            user_id VARCHAR(50),
            mode VARCHAR(30),
            module VARCHAR(100),
            remarks TEXT
        );
    """)
    print("Table log_reports created successfully!")
    
    await conn.close()
    print("Log migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
