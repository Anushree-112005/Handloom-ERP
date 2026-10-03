import sqlite3

conn = sqlite3.connect('backend/cubebook.db')
cur = conn.cursor()
cur.execute("SELECT id, name, ledger_group_id FROM ledgers;")
rows = cur.fetchall()
print(f"Total ledgers: {len(rows)}")
for r in rows:
    print(r)
conn.close()
