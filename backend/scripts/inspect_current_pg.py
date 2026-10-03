import os
import sys
import asyncio
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

async def inspect():
    print(f"Connecting to: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"))
        tables = [r[0] for r in res.fetchall()]
        print(f"Total tables found: {len(tables)}")
        
        non_empty = []
        for t in tables:
            try:
                cnt_res = await conn.execute(text(f'SELECT count(*) FROM "{t}";'))
                cnt = cnt_res.scalar()
                if cnt > 0:
                    non_empty.append((t, cnt))
            except Exception as e:
                print(f"Error checking {t}: {e}")
        
        print("\nTables with data:")
        for t, cnt in sorted(non_empty, key=lambda x: x[0]):
            print(f"  {t}: {cnt} rows")
            if t in ['employees', 'party_master', 'buyer_orders', 'design_entry', 'cloth_deliveries']:
                res = await conn.execute(text(f'SELECT * FROM "{t}" LIMIT 5;'))
                cols = res.keys()
                print(f"    Columns: {list(cols)[:8]}")
                for row in res.fetchall():
                    row_dict = dict(row._mapping)
                    # print some identifying field
                    ident = {k: v for k, v in row_dict.items() if k in ['id', 'username', 'employee_code', 'company_name', 'order_no', 'design_no', 'delivery_no']}
                    print(f"      {ident}")

if __name__ == "__main__":
    asyncio.run(inspect())
