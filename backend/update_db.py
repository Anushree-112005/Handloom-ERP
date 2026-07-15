import sqlite3
import os

try:
    db_path = 'dinesh_tex.db'
    if not os.path.exists(db_path):
        print('DB not found at', db_path)
    else:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        try:
            cursor.execute('ALTER TABLE twisting_doubling_pos ADD COLUMN buyer_order_no VARCHAR(100);')
            print('Added buyer_order_no')
        except Exception as e:
            print('buyer_order_no:', e)
            
        try:
            cursor.execute('ALTER TABLE twisting_doubling_pos ADD COLUMN design_no VARCHAR(100);')
            print('Added design_no')
        except Exception as e:
            print('design_no:', e)
            
        conn.commit()
        conn.close()
        print('Finished DB update')
except Exception as e:
    print('Error:', e)
