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
from sqlalchemy import text
with engine.begin() as conn:
    # location columns on voucher_entries
    try:
        conn.execute(text("SELECT location_id FROM voucher_entries LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE voucher_entries ADD COLUMN location_id INTEGER"))
            conn.execute(text("ALTER TABLE voucher_entries ADD COLUMN location_name VARCHAR"))
            print("Migrated: added location_id/location_name to voucher_entries.")
        except Exception as e:
            print(f"Migration warning: {e}")

    # base_currency column on companies (and new cin/currency columns)
    try:
        conn.execute(text("SELECT cin FROM companies LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN cin TEXT"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_symbol TEXT DEFAULT '₹'"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_name TEXT DEFAULT 'INR'"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_iso_code TEXT DEFAULT 'INR'"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_decimal_places INTEGER DEFAULT 2"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_show_in_millions BOOLEAN DEFAULT 0"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_suffix_symbol BOOLEAN DEFAULT 0"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_space_between_amount_and_symbol BOOLEAN DEFAULT 0"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_amount_words_unit TEXT DEFAULT 'Rupees'"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN currency_amount_words_decimal TEXT DEFAULT 'Paise'"))
            print("Migrated: added cin and currency configs to companies.")
        except Exception as e:
            print(f"Migration warning: {e}")

    # party_id column on vouchers
    try:
        conn.execute(text("SELECT party_id FROM vouchers LIMIT 1"))
    except Exception:
        try:
            conn.execute(text("ALTER TABLE vouchers ADD COLUMN party_id INTEGER"))
            print("Migrated: added party_id to vouchers.")
        except Exception as e:
            print(f"Migration warning: {e}")

app = FastAPI(title="CubeBook API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
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

