import sqlite3
import traceback

try:
    conn = sqlite3.connect("cubebook.db")
    cur = conn.cursor()
    cur.execute("SELECT pin_code, contact_number FROM ledgers LIMIT 1")
    print("Database has the new columns!")
except Exception as e:
    print(f"Database error: {e}")
