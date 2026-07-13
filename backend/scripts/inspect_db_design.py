import sqlite3

conn = sqlite3.connect("/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/textile_erp.db")
cursor = conn.cursor()

for table in ["textile_designs", "design_entry"]:
    try:
        cursor.execute(f"SELECT * FROM {table} LIMIT 1;")
        col_names = [description[0] for description in cursor.description]
        print(f"\nTable: {table}")
        print(f"Columns: {col_names}")
        
        cursor.execute(f"SELECT design_no, id FROM {table} ORDER BY id DESC LIMIT 5;")
        print("Recent entries:")
        for row in cursor.fetchall():
            print(row)
    except Exception as e:
        print(f"Error reading {table}: {e}")

conn.close()
