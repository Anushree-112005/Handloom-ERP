# Let's inspect the design entries in the database to see what data exists.
import sqlite3
import json

db_paths = [
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/textile_erp.db",
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/textile_erp.db",
    "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/dinesh_textile.db"
]

for path in db_paths:
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Database: {path}")
        print(f"Tables: {tables}")
        if "design_entries" in tables:
            cursor.execute("SELECT design_no, total_ends, reed, pick_ot, selvage_waste, total_mtr, crimp_pct, skg_pct, dyeing_loss_pct, warp_mtr, weft_pro_mtr, warp_summary, weft_summary FROM design_entries ORDER BY id DESC LIMIT 5;")
            rows = cursor.fetchall()
            for row in rows:
                print(f"Design: {row[0]}")
                print(f"  total_ends={row[1]}, reed={row[2]}, pick_ot={row[3]}, selvage_waste={row[4]}")
                print(f"  total_mtr={row[5]}, crimp_pct={row[6]}, skg_pct={row[7]}, dyeing_loss_pct={row[8]}")
                print(f"  warp_mtr={row[9]}, weft_pro_mtr={row[10]}")
                print(f"  warp_summary={row[11][:100] if row[11] else None}")
                print(f"  weft_summary={row[12][:100] if row[12] else None}")
        conn.close()
    except Exception as e:
        print(f"Error reading {path}: {e}")
