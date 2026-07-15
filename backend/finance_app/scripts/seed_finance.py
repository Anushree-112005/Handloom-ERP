import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

# Ensure we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from finance_app.database import SessionLocal, engine, Base
from finance_app.models.company import Company
from finance_app.models.ledger_group import LedgerGroup
from finance_app.models.currency import Currency
from finance_app.models.voucher_type import VoucherType
from finance_app.models.gst_models import GSTRegistration, GSTClassification

def seed_defaults(db: Session):
    print("Starting finance data seeding...")

    # 1. Get or create a default company
    company = db.query(Company).first()
    if not company:
        company = Company(
            name="Default Company",
            cin="U17111TZ2026PTC123456",
            pan="ABCDE1234F",
            gstin="33ABCDE1234F1Z5",
            state_code="33",
            currency_iso_code="INR"
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        print(f"Created Default Company: {company.name}")
    else:
        # Update missing fields if needed
        if not company.cin:
            company.cin = "U17111TZ2026PTC123456"
        if not company.pan:
            company.pan = "ABCDE1234F"
        db.commit()
        print(f"Using existing company: {company.name}")

    # 2. Ledger Groups
    groups = [
        {"name": "Sundry Debtors", "nature": "Asset", "is_system": True},
        {"name": "Sundry Creditors", "nature": "Liability", "is_system": True},
        {"name": "Purchase A/c", "nature": "Expense", "is_system": True},
        {"name": "Sales A/c", "nature": "Income", "is_system": True},
        {"name": "Job Work Charges", "nature": "Expense", "is_system": True},
        {"name": "TDS Payable", "nature": "Liability", "is_system": True},
        {"name": "Bank/Cash", "nature": "Asset", "is_system": True},
    ]
    for g in groups:
        exists = db.query(LedgerGroup).filter_by(company_id=company.id, name=g["name"]).first()
        if not exists:
            lg = LedgerGroup(company_id=company.id, **g)
            db.add(lg)
    
    # 3. Currencies
    currencies = [
        {"symbol": "₹", "name": "Indian Rupee", "iso_code": "INR", "exchange_rate": 1.0, "is_base": True},
        {"symbol": "$", "name": "US Dollar", "iso_code": "USD", "exchange_rate": 83.5, "is_base": False},
        {"symbol": "€", "name": "Euro", "iso_code": "EUR", "exchange_rate": 89.2, "is_base": False},
    ]
    for c in currencies:
        exists = db.query(Currency).filter_by(company_id=company.id, iso_code=c["iso_code"]).first()
        if not exists:
            curr = Currency(company_id=company.id, **c)
            db.add(curr)

    # 4. Voucher Types
    voucher_types = [
        {"name": "Purchase", "parent_type": "Purchase", "inventory_affected": True, "prefix": "PUR-", "starting_number": 1},
        {"name": "Sales", "parent_type": "Sales", "inventory_affected": True, "prefix": "SAL-", "starting_number": 1},
        {"name": "Payment", "parent_type": "Payment", "inventory_affected": False, "prefix": "PAY-", "starting_number": 1},
        {"name": "Receipt", "parent_type": "Receipt", "inventory_affected": False, "prefix": "REC-", "starting_number": 1},
        {"name": "Debit Note", "parent_type": "Debit Note", "inventory_affected": True, "prefix": "DN-", "starting_number": 1},
        {"name": "Credit Note", "parent_type": "Credit Note", "inventory_affected": True, "prefix": "CN-", "starting_number": 1},
    ]
    for vt in voucher_types:
        exists = db.query(VoucherType).filter_by(company_id=company.id, name=vt["name"]).first()
        if not exists:
            v_type = VoucherType(company_id=company.id, **vt)
            db.add(v_type)

    # 5. GST Settings
    gst_reg = db.query(GSTRegistration).filter_by(company_id=company.id).first()
    if not gst_reg:
        reg = GSTRegistration(
            company_id=company.id,
            state_code="33",
            state_name="Tamil Nadu",
            gstin="33ABCDE1234F1Z5",
            registration_type="Regular",
            is_primary=True
        )
        db.add(reg)
    
    gst_class = db.query(GSTClassification).filter_by(company_id=company.id, hsn_sac="5208").first()
    if not gst_class:
        cls = GSTClassification(
            company_id=company.id,
            name="Textile Fabric",
            hsn_sac="5208",
            description="Woven fabrics of cotton",
            cgst_rate=2.5,
            sgst_rate=2.5,
            igst_rate=5.0  # As per standard GST rates for 5% slab
        )
        db.add(cls)

    db.commit()
    print("Finance data seeding completed successfully!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        # Create tables just in case they don't exist yet
        Base.metadata.create_all(bind=engine)
        seed_defaults(db)
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()
