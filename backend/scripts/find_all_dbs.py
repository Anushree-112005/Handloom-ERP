import os
import sqlite3

workspace = "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)"
for root, dirs, files in os.walk(workspace):
    for file in files:
        if file.endswith(".db"):
            db_path = os.path.join(root, file)
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [r[0] for r in cursor.fetchall()]
                print(f"\nDB File: {db_path}")
                for table in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM [{table}];")
                        cnt = cursor.fetchone()[0]
                        if cnt > 0:
                            print(f"  {table}: {cnt} rows")
                    except Exception as e:
                        pass
                conn.close()
            except Exception as e:
                print(f"Error {db_path}: {e}")
