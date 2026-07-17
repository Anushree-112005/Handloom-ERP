import asyncio
import asyncpg

async def create_db():
    try:
        conn = await asyncpg.connect(user='postgres', password='Karthi@1234', database='postgres', host='localhost')
        await conn.execute('CREATE DATABASE dinesh_textile_erp')
        print("Database created successfully")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(create_db())
