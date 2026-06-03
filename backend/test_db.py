import sqlite3
conn = sqlite3.connect('erp.db')
cursor = conn.cursor()
cursor.execute("SELECT entity, name FROM sub_master WHERE entity LIKE '%order%';")
rows = cursor.fetchall()
for r in rows:
    print(r)
