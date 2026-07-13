import sqlite3

def run():
    conn = sqlite3.connect('erp.db')
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS operator_master (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operator_id VARCHAR NOT NULL UNIQUE,
        operator_name VARCHAR NOT NULL,
        department VARCHAR,
        designation VARCHAR,
        skill_level VARCHAR,
        assigned_loom VARCHAR,
        assigned_shift VARCHAR,
        join_date DATETIME,
        contact_number VARCHAR,
        status BOOLEAN DEFAULT 1
    );
    ''')
    cursor.execute('CREATE INDEX IF NOT EXISTS ix_operator_master_id ON operator_master (id);')
    cursor.execute('CREATE INDEX IF NOT EXISTS ix_operator_master_operator_id ON operator_master (operator_id);')
    conn.commit()
    conn.close()
    
    # Try PostgreSQL if exists
    import psycopg2
    from app.core.config import settings
    try:
        conn = psycopg2.connect(settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS operator_master (
            id SERIAL PRIMARY KEY,
            operator_id VARCHAR NOT NULL UNIQUE,
            operator_name VARCHAR NOT NULL,
            department VARCHAR,
            designation VARCHAR,
            skill_level VARCHAR,
            assigned_loom VARCHAR,
            assigned_shift VARCHAR,
            join_date TIMESTAMP,
            contact_number VARCHAR,
            status BOOLEAN DEFAULT TRUE
        );
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS ix_operator_master_id ON operator_master (id);')
        cursor.execute('CREATE INDEX IF NOT EXISTS ix_operator_master_operator_id ON operator_master (operator_id);')
        conn.commit()
        conn.close()
    except Exception as e:
        print("Postgres skip:", e)
        pass

run()
