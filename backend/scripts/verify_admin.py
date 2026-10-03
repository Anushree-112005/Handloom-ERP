import os
import sys
import asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.core.security import verify_password, get_password_hash

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
DATABASE_URL = os.getenv("DATABASE_URL")

async def test_admin():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, username, password_hash FROM employees WHERE username='admin';"))
        row = res.fetchone()
        if row:
            print(f"Admin user found: id={row[0]}, username={row[1]}")
            for p in ['admin123', 'admin', 'password123', 'pass123']:
                print(f"  Testing password '{p}': {verify_password(p, row[2])}")
        else:
            print("Admin user NOT found!")

if __name__ == "__main__":
    asyncio.run(test_admin())
