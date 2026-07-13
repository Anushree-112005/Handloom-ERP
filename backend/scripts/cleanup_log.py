import asyncio
import asyncpg

async def run_cleanup():
    print("Connecting to the database...")
    db_url = "postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp"
    
    conn = await asyncpg.connect(db_url)
    print("Connected successfully!")
    
    print("Truncating log_reports table...")
    await conn.execute("TRUNCATE TABLE log_reports RESTART IDENTITY;")
    print("Table log_reports cleared completely!")
    
    await conn.close()
    print("Cleanup complete!")

if __name__ == "__main__":
    asyncio.run(run_cleanup())
