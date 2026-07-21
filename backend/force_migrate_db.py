import sys
import os
import sqlite3

db_path = os.path.join(os.path.dirname(__file__), 'finance_app.db')
print(f"Checking DB: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Let's get the schema for companies
    cur.execute("PRAGMA table_info(companies)")
    cols = cur.fetchall()
    print("Columns in companies table:")
    for col in cols:
        print(f" - {col[1]}")
        
    # Try manually adding the columns if missing
    new_cols = [
        "cin TEXT",
        "currency_symbol TEXT DEFAULT '₹'",
        "currency_name TEXT DEFAULT 'INR'",
        "currency_iso_code TEXT DEFAULT 'INR'",
        "currency_decimal_places INTEGER DEFAULT 2",
        "currency_show_in_millions BOOLEAN DEFAULT 0",
        "currency_suffix_symbol BOOLEAN DEFAULT 0",
        "currency_space_between_amount_and_symbol BOOLEAN DEFAULT 0",
        "currency_amount_words_unit TEXT DEFAULT 'Rupees'",
        "currency_amount_words_decimal TEXT DEFAULT 'Paise'"
    ]
    
    col_names = [c[1] for c in cols]
    for nc in new_cols:
        cname = nc.split(' ')[0]
        if cname not in col_names:
            print(f"Adding column {cname}...")
            cur.execute(f"ALTER TABLE companies ADD COLUMN {nc}")
            conn.commit()
            
    print("Done checking/updating companies table.")
    
except Exception as e:
    print(f"Error: {e}")
