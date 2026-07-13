import sqlite3
import json

conn = sqlite3.connect("/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/textile_erp.db")
cursor = conn.cursor()

try:
    cursor.execute("""
        SELECT id, design_no, total_ends, reed, pick_ot, selvage_waste, total_mtr, 
               crimp_pct, skg_pct, dyeing_loss_pct, warp_mtr, weft_pro_mtr, 
               yarn_details, fabric_design_details
        FROM design_entry 
        ORDER BY id DESC LIMIT 3;
    """)
    rows = cursor.fetchall()
    for row in rows:
        print(f"\n======================================")
        print(f"ID: {row[0]}, Design No: {row[1]}")
        print(f"total_ends: {row[2]}, reed: {row[3]}, pick_ot: {row[4]}, selvage_waste: {row[5]}")
        print(f"total_mtr: {row[6]}, crimp_pct: {row[7]}, skg_pct: {row[8]}, dyeing_loss_pct: {row[9]}")
        print(f"warp_mtr: {row[10]}, weft_pro_mtr: {row[11]}")
        print(f"yarn_details: {row[12]}")
        print(f"fabric_design_details: {row[13][:500]}...")
except Exception as e:
    print(f"Error: {e}")

conn.close()
