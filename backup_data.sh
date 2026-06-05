#!/bin/bash
# This script exports the entire database (schema + data) into a SQL seed file.
# Run this before sharing the code with your friend!

export PGPASSWORD="hari123"
pg_dump -U postgres -h localhost -d dinesh_textile_erp --clean --if-exists > seed_database.sql

echo "✅ Database successfully backed up to seed_database.sql!"
echo "Now you can commit this file to Git, and your friend can load it using restore_data.sh."
