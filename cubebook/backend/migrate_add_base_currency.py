import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "cubebook.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if the column already exists
    cursor.execute("PRAGMA table_info(companies)")
    columns = [row[1] for row in cursor.fetchall()]

    if "base_currency" in columns:
        print("Column 'base_currency' already exists. Nothing to do.")
    else:
        cursor.execute("ALTER TABLE companies ADD COLUMN base_currency TEXT NOT NULL DEFAULT 'INR'")
        conn.commit()
        print("Migration successful: 'base_currency' column added to companies table with default value 'INR'.")

    conn.close()

if __name__ == "__main__":
    migrate()
