import psycopg2
conn = psycopg2.connect('postgresql://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp')
cur = conn.cursor()
try:
    cur.execute("SELECT id FROM stores_cost_centers;")
    cost_centers = cur.fetchall()
    
    if cost_centers:
        for idx, cc in enumerate(cost_centers):
            cur.execute(f"INSERT INTO stores_budgets (budget_code, project_code, cost_center_id, budget_available, budget_used, is_deleted) VALUES ('BGT-00{idx+1}', 'PRJ-X', {cc[0]}, 500000.0, 0.0, false) ON CONFLICT DO NOTHING;")
        conn.commit()
        print("Budgets seeded successfully")
    else:
        print("No cost centers found to map budgets")
except Exception as e:
    print("Error:", e)
    conn.rollback()
