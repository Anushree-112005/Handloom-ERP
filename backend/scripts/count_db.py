import sqlite3

conn = sqlite3.connect("/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/textile_erp.db")
cursor = conn.cursor()

try:
    cursor.execute("SELECT COUNT(*) FROM design_entry;")
    print("design_entry count:", cursor.fetchone()[0])
    
    cursor.execute("SELECT COUNT(*) FROM textile_designs;")
    print("textile_designs count:", cursor.fetchone()[0])
except Exception as e:
    print("Error:", e)

conn.close()
