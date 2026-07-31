from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from finance_app.database import engine, Base
from finance_app.routers import (
    auth, companies, financial_years, ledger_groups, ledgers,
    stock_items, vouchers, reports, gst, inventory_masters,
    users, audit_router, payroll, banking,
    currencies, voucher_types
)
from finance_app.routers.auth import migrate_default_passwords

# Import all models so SQLAlchemy registers every table before create_all
import finance_app.models  # noqa: F401

Base.metadata.create_all(bind=engine)

# ── Run startup migrations ────────────────────────────────────────────────
from finance_app.database import SessionLocal as _SessionLocal
_startup_db = _SessionLocal()
try:
    migrate_default_passwords(_startup_db)
finally:
    _startup_db.close()

# ── Auto-migrations: add columns to existing tables if missing ────────────
from sqlalchemy import text, inspect
with engine.begin() as conn:
    def sync_database_schema(connection):
        try:
            inspector = inspect(connection)
            for table_name, table in Base.metadata.tables.items():
                if not inspector.has_table(table_name):
                    continue
                db_columns = {col["name"].lower() for col in inspector.get_columns(table_name)}
                for col_name, column in table.columns.items():
                    if col_name.lower() not in db_columns:
                        type_str = str(column.type.compile(dialect=connection.dialect))
                        default_val = "NULL"
                        default_obj = column.default
                        default_arg = getattr(default_obj, "arg", None) if default_obj is not None else None
                        if default_arg is not None and not callable(default_arg):
                            val = default_arg
                            if isinstance(val, str):
                                escaped_val = val.replace("'", "''")
                                default_val = f"'{escaped_val}'"
                            elif isinstance(val, bool):
                                default_val = "TRUE" if val else "FALSE"
                            else:
                                default_val = str(val)
                        elif "float" in type_str.lower() or "numeric" in type_str.lower():
                            default_val = "0.0"
                        elif "integer" in type_str.lower():
                            default_val = "0"
                        elif "boolean" in type_str.lower():
                            default_val = "FALSE"
                        
                        alter_query = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {type_str}"
                        if default_val != "NULL":
                            alter_query += f" DEFAULT {default_val}"
                        
                        try:
                            connection.execute(text(alter_query))
                            print(f"Successfully added column {col_name} to table {table_name}.")
                        except Exception as ex:
                            print(f"Failed to add column {col_name} to table {table_name}: {ex}")
        except Exception as e:
            print(f"Error during schema synchronization: {e}")

    # Use run_sync-like manual call since we have a sync connection
    sync_database_schema(conn)

app = FastAPI(title="CubeBook API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,               prefix="/api/auth",            tags=["Auth"])
app.include_router(users.router,              prefix="/api/users",           tags=["Users"])
app.include_router(companies.router,          prefix="/api/companies",       tags=["Companies"])
app.include_router(financial_years.router,    prefix="/api/financial-years", tags=["Financial Years"])
app.include_router(ledger_groups.router,      prefix="/api/ledger-groups",   tags=["Ledger Groups"])
app.include_router(ledgers.router,            prefix="/api/ledgers",         tags=["Ledgers"])
app.include_router(stock_items.router,        prefix="/api/stock-items",     tags=["Stock Items"])
app.include_router(vouchers.router,           prefix="/api/vouchers",        tags=["Vouchers"])
app.include_router(currencies.router,         prefix="/api/currencies",      tags=["Currencies"])
app.include_router(voucher_types.router,      prefix="/api/voucher-types",   tags=["Voucher Types"])
app.include_router(reports.router,            prefix="/api/reports",         tags=["Reports"])
app.include_router(gst.router,               prefix="/api/gst",             tags=["GST"])
app.include_router(inventory_masters.router,  prefix="/api/inventory",       tags=["Inventory Masters"])
app.include_router(audit_router.router,       prefix="/api/audit",           tags=["Audit"])
app.include_router(payroll.router,            prefix="/api/payroll",         tags=["Payroll"])
app.include_router(banking.router,            prefix="/api/banking",         tags=["Banking"])

@app.get("/")
def root():
    return {"app": "CubeBook", "version": "2.0.0", "status": "running"}

