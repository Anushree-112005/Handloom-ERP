import asyncio
import asyncpg

async def main():
    try:
        conn = await asyncpg.connect(user='postgres', password='Karthi@1234', host='localhost', port=5432, database='postgres')
        await conn.execute('CREATE DATABASE dinesh_textile_erp')
        await conn.close()
        print("Database created successfully")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
