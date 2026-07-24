import psycopg2
conn = psycopg2.connect('postgresql://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp')
cur = conn.cursor()
try:
    cur.execute("INSERT INTO stores_cost_centers (code, name, is_deleted) VALUES ('CC-001', 'Production Dept', false), ('CC-002', 'Maintenance', false), ('CC-003', 'Admin', false), ('CC-004', 'Logistics', false) ON CONFLICT DO NOTHING;")
    conn.commit()
    print("Seeded successfully")
except Exception as e:
    print("Error:", e)
    conn.rollback()
