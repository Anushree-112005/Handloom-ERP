import sqlite3

def reset_db():
    conn = sqlite3.connect('cubebook.db')
    c = conn.cursor()
    
    # Get all tables
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in c.fetchall()]
    print("Found tables:", tables)
    
    # Tables to clear
    tables_to_clear = [
        'voucher_entries',
        'vouchers',
        'salary_records',
        'bank_reconciliations',
        'stock_items',
        'units_of_measure',
        'stock_groups',
        'stock_categories',
        'locations',
        'ledgers',
        'ledger_groups',
        'financial_years',
        'companies',
        'employees',
        'audit_logs'
    ]
    
    # Clear each table
    for table in tables_to_clear:
        if table in tables:
            try:
                c.execute(f"DELETE FROM {table}")
                print(f"Cleared table: {table}")
            except Exception as e:
                print(f"Error clearing table {table}: {e}")
                
    # Commit changes
    conn.commit()
    conn.close()
    print("cubebook.db tables successfully cleared!")

if __name__ == '__main__':
    reset_db()
