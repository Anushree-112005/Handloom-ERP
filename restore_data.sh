#!/bin/bash
# This script restores the database from the SQL seed file.
# Your friend should run this to get all the data!

export PGPASSWORD="hari123"

# Check if file exists
if [ ! -f "seed_database.sql" ]; then
    echo "❌ Error: seed_database.sql not found! Make sure your friend committed and pushed the file."
    exit 1
fi

echo "Loading seed data into the database..."
# Run psql silently to avoid huge log output, only show errors
psql -U postgres -h localhost -d dinesh_textile_erp -q -f seed_database.sql

echo "✅ Database successfully restored! You now have all the data."
