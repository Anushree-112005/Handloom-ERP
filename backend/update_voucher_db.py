import sqlite3
import os

def update_db():
    db_path = os.path.join(os.path.dirname(__file__), 'cubebook.db')
    print(f"Checking DB: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # --- Update Vouchers Table ---
        cur.execute("PRAGMA table_info(vouchers)")
        v_cols = [c[1] for c in cur.fetchall()]
        
        new_v_cols = [
            "category TEXT DEFAULT 'Financial'",
            "billing_address TEXT",
            "shipping_address TEXT",
            "transport_name TEXT",
            "transport_id TEXT",
            "vehicle_number TEXT",
            "vehicle_type TEXT DEFAULT 'Road'",
            "work_order_number TEXT",
            "job_order_number TEXT"
        ]
        
        for nc in new_v_cols:
            cname = nc.split(' ')[0]
            if cname not in v_cols:
                print(f"Adding column {cname} to vouchers...")
                cur.execute(f"ALTER TABLE vouchers ADD COLUMN {nc}")
        
        # --- Update Ledgers Table ---
        cur.execute("PRAGMA table_info(ledgers)")
        l_cols = [c[1] for c in cur.fetchall()]
        
        new_l_cols = [
            "pin_code TEXT",
            "contact_number TEXT"
        ]
        
        for nc in new_l_cols:
            cname = nc.split(' ')[0]
            if cname not in l_cols:
                print(f"Adding column {cname} to ledgers...")
                cur.execute(f"ALTER TABLE ledgers ADD COLUMN {nc}")
                
        conn.commit()
        conn.close()
        print("Done checking/updating DB tables.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_db()
