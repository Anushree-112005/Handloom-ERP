import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    conn = psycopg2.connect(
        user="postgres",
        password="Karthi@1234",
        host="localhost",
        port="5432"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    cursor.execute('CREATE DATABASE cubebook')
    cursor.close()
    conn.close()
    print("Database 'cubebook' created successfully!")
except Exception as e:
    print(f"Error creating database: {e}")
