import sqlite3

try:
    conn = sqlite3.connect("c:\\Users\\User\\Desktop\\dinesh-tex\\dinesh-tex1\\dinesh-tex\\backend\\cubebook.db")
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM companies")
    print("Companies in DB:", cur.fetchall())
except Exception as e:
    print(f"Error: {e}")
