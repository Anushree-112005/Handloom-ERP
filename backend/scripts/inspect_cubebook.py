import sqlite3
import os

for path in ['cubebook.db', 'backend/cubebook.db']:
    if os.path.exists(path):
        print(f"\n--- Checking {path} ---")
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cur.fetchall()]
        for t in tables:
            cur.execute(f'SELECT count(*) FROM "{t}";')
            cnt = cur.fetchone()[0]
            if cnt > 0:
                print(f"  {t}: {cnt} rows")
        conn.close()
