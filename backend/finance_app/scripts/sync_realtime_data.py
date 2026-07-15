"""
Real-time sync script to import PostgreSQL ERP transactions into Cubebook Finance SQLite database.
Maps:
  - party_master (PostgreSQL) -> ledgers (SQLite)
  - yarn_inwards (PostgreSQL) -> Purchase Vouchers (SQLite)
  - sales_invoices (PostgreSQL) -> Sales Vouchers (SQLite)
  - Simulates corresponding Cash/Bank Payments & Receipts to complete the financial ledger.
"""

import sys
import os
from datetime import date, timedelta
from decimal import Decimal
import sqlalchemy as sa

# Adjust sys.path to run from the backend directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from finance_app.database import SessionLocal, engine
from finance_app.models.company import Company, FinancialYear
from finance_app.models.ledger import Ledger
from finance_app.models.ledger_group import LedgerGroup
from finance_app.models.voucher import Voucher, VoucherEntry
from finance_app.models.inventory import Location
from finance_app.models.stock_item import StockItem

def sync_data():
    print("=== Syncing Real-Time ERP Data with Cubebook Finance ===")

    # 1. Establish SQLite DB Session
    db = SessionLocal()
    
    # 1.5 Auto-migrate missing columns in SQLite (prevents crash on startup)
    from sqlalchemy import text
    try:
        db.execute(text("SELECT cin FROM companies LIMIT 1"))
    except Exception:
        try:
            print("  → Adding missing cin and currency columns to SQLite database...")
            db.execute(text("ALTER TABLE companies ADD COLUMN cin TEXT"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_symbol TEXT DEFAULT '₹'"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_name TEXT DEFAULT 'INR'"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_iso_code TEXT DEFAULT 'INR'"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_decimal_places INTEGER DEFAULT 2"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_show_in_millions BOOLEAN DEFAULT 0"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_suffix_symbol BOOLEAN DEFAULT 0"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_space_between_amount_and_symbol BOOLEAN DEFAULT 0"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_amount_words_unit TEXT DEFAULT 'Rupees'"))
            db.execute(text("ALTER TABLE companies ADD COLUMN currency_amount_words_decimal TEXT DEFAULT 'Paise'"))
            db.commit()
            print("  → Successfully added missing columns.")
        except Exception as e:
            print(f"  → Migration warning: {e}")
            db.rollback()

    # 2. Establish PostgreSQL Connection
    from dotenv import load_dotenv
    load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")))
    pg_url = os.getenv("DATABASE_URL", "postgresql://postgres:bala2021@localhost:5432/dinesh_textile_erp")
    if "postgresql+asyncpg" in pg_url:
        pg_url = pg_url.replace("postgresql+asyncpg", "postgresql")
    try:
        pg_engine = sa.create_engine(pg_url)
        pg_conn = pg_engine.connect()
        print("  → Connected to PostgreSQL database successfully.")
    except Exception as e:
        print(f"  → ERROR: Could not connect to PostgreSQL. {e}")
        db.close()
        return

    try:
        # 3. Find or Create Company "Dinesh Exports"
        company = db.query(Company).filter(Company.name == "Dinesh Exports").first()
        if not company:
            company = Company(
                name="Dinesh Exports",
                legal_name="Dinesh Exports Private Limited",
                gstin="27AABCS1429B1ZB",
                pan="AABCS1429B",
                state_code="27",
                address="401-405, Cotton Exchange Building, Kalbadevi Road",
                city="Mumbai",
                pincode="400002",
                phone="022-22001122",
                email="accounts@shreetextiles.com",
                maintain_inventory=True
            )
            db.add(company)
            db.flush()
            print("  → Created 'Dinesh Exports' company in Finance database.")
        else:
            print("  → Found 'Dinesh Exports' company in Finance database.")

        # 4. Create standard groups & system ledgers if missing
        existing_groups = db.query(LedgerGroup).filter(LedgerGroup.company_id == company.id).count()
        if existing_groups == 0:
            from finance_app.routers.companies import _create_default_groups, _create_default_ledgers
            _create_default_groups(company.id, db)
            _create_default_ledgers(company.id, db)
            db.flush()
            print("  → Initialized default ledger groups and system ledgers.")

        # 5. Ensure Financial Years Exist
        # FY 2025-26
        fy25 = db.query(FinancialYear).filter(FinancialYear.company_id == company.id, FinancialYear.label == "FY 2025-26").first()
        if not fy25:
            fy25 = FinancialYear(
                company_id=company.id,
                label="FY 2025-26",
                start_date=date(2025, 4, 1),
                end_date=date(2026, 3, 31),
                is_current=False
            )
            db.add(fy25)
            db.flush()
            print("  → Created FY 2025-26.")
        
        # FY 2026-27
        fy26 = db.query(FinancialYear).filter(FinancialYear.company_id == company.id, FinancialYear.label == "FY 2026-27").first()
        if not fy26:
            fy26 = FinancialYear(
                company_id=company.id,
                label="FY 2026-27",
                start_date=date(2026, 4, 1),
                end_date=date(2027, 3, 31),
                is_current=True
            )
            db.add(fy26)
            db.flush()
            print("  → Created FY 2026-27.")

        # Ensure both are set up properly
        db.commit()

        # 6. Ensure Standard Accounts Exist
        standard_ledgers = [
            ("Textile Sales", "Sales Accounts", "Cr", 0.0, None),
            ("Yarn & Fibre Purchase", "Purchase Accounts", "Dr", 0.0, None),
            ("CGST Payable", "Duties & Taxes", "Cr", 0.0, None),
            ("SGST Payable", "Duties & Taxes", "Cr", 0.0, None),
            ("IGST Payable", "Duties & Taxes", "Cr", 0.0, None),
            ("CGST Input Credit", "Current Assets", "Dr", 0.0, None),
            ("SGST Input Credit", "Current Assets", "Dr", 0.0, None),
            ("IGST Input Credit", "Current Assets", "Dr", 0.0, None),
            ("HDFC Current Account", "Bank Accounts", "Dr", 0.0, None),
            ("ICICI Savings Account", "Bank Accounts", "Dr", 0.0, None),
            ("Weaving & Loom Charges", "Direct Expenses", "Dr", 0.0, None),
            ("Dyeing & Printing Charges", "Direct Expenses", "Dr", 0.0, None),
            ("Power & Fuel Expense", "Direct Expenses", "Dr", 0.0, None),
            ("Salary Expense", "Indirect Expenses", "Dr", 0.0, None),
            ("Rent Expense", "Indirect Expenses", "Dr", 0.0, None),
            ("Cotton Scrap Loss", "Indirect Expenses", "Dr", 0.0, None),
        ]
        
        ledger_map = {}
        for name, group, bt, bal, gstin in standard_ledgers:
            led = db.query(Ledger).filter(Ledger.company_id == company.id, Ledger.name == name).first()
            if not led:
                led = Ledger(
                    name=name, group=group, balance_type=bt,
                    opening_balance=bal, gstin=gstin, company_id=company.id
                )
                db.add(led)
                db.flush()
            ledger_map[name] = led.id

        # Also get default Cash
        cash_led = db.query(Ledger).filter(Ledger.company_id == company.id, Ledger.name == "Cash").first()
        if cash_led:
            ledger_map["Cash"] = cash_led.id

        # 7. Import Parties from PostgreSQL
        print("  → Syncing Party Ledgers from PostgreSQL...")
        parties = pg_conn.execute(sa.text("SELECT company_name, party_type, address, city, state, state_code, gst_no, pan_no, bank_name, bank_account, ifsc_code FROM party_master")).fetchall()
        for p in parties:
            if not p.company_name:
                continue
            # Map party_type
            if p.party_type == 'Sales':
                group_name = 'Sundry Debtors'
                bal_type = 'Dr'
            else:
                group_name = 'Sundry Creditors'
                bal_type = 'Cr'

            # Upsert Ledger
            led = db.query(Ledger).filter(Ledger.company_id == company.id, Ledger.name == p.company_name).first()
            if not led:
                led = Ledger(
                    name=p.company_name,
                    group=group_name,
                    balance_type=bal_type,
                    opening_balance=0.0,
                    gstin=p.gst_no,
                    pan=p.pan_no,
                    address=p.address,
                    state_code=p.state_code or "27",
                    bank_name=p.bank_name,
                    account_number=p.bank_account,
                    ifsc_code=p.ifsc_code,
                    company_id=company.id
                )
                db.add(led)
                db.flush()
            ledger_map[p.company_name] = led.id

        # 8. Clear Pre-Existing Vouchers to Prevent Duplicates
        print("  → Clearing pre-existing vouchers and entries in SQLite...")
        db.query(VoucherEntry).delete()
        db.query(Voucher).delete()
        db.commit()

        # Helper to ensure supplier ledger on the fly
        def ensure_party_ledger(party_name, party_grp):
            if party_name in ledger_map:
                return ledger_map[party_name]
            # Create on the fly
            led = Ledger(
                name=party_name,
                group=party_grp,
                balance_type="Cr" if party_grp == "Sundry Creditors" else "Dr",
                opening_balance=0.0,
                company_id=company.id
            )
            db.add(led)
            db.flush()
            ledger_map[party_name] = led.id
            return led.id

        # 9. Sync Yarn Inwards -> Purchase Vouchers (for BOTH FYs)
        print("  → Syncing Yarn Inward Entries into Purchase Vouchers...")
        inwards = pg_conn.execute(sa.text("SELECT id, inward_date, received_from, net_amount, cgst_pct, sgst_pct, igst_pct, gross_amount, ref_no FROM yarn_inwards")).fetchall()
        
        purchase_no_seq = 1
        for inw in inwards:
            if not inw.received_from:
                continue
            gross = float(inw.gross_amount or 0)
            net = float(inw.net_amount or 0)
            cgst = gross * float(inw.cgst_pct or 0) / 100.0
            sgst = gross * float(inw.sgst_pct or 0) / 100.0
            igst = gross * float(inw.igst_pct or 0) / 100.0
            ref_no = inw.ref_no or f"GRN-{inw.id}"

            # Ensure supplier ledger exists
            sup_id = ensure_party_ledger(inw.received_from, "Sundry Creditors")

            # Create voucher for both FYs
            for fy in [fy25, fy26]:
                # Calculate correct shifted date for FY 2025-26
                v_date = inw.inward_date
                if fy.label == "FY 2025-26":
                    # Shift back exactly one year
                    try:
                        v_date = date(v_date.year - 1, v_date.month, v_date.day)
                    except ValueError: # leap year edge case
                        v_date = date(v_date.year - 1, v_date.month, v_date.day - 1)

                v_num = f"PUR-{fy.label[-5:]}-{purchase_no_seq:04d}"

                v = Voucher(
                    voucher_number=v_num,
                    voucher_type="Purchase",
                    date=v_date,
                    narration=f"Purchase of Cotton/Textile Yarn from {inw.received_from} - Ref: {ref_no}",
                    reference_no=ref_no,
                    status="Posted",
                    total_amount=net,
                    company_id=company.id,
                    party_id=sup_id,
                    fy_id=fy.id
                )
                db.add(v)
                db.flush()

                # Add Entries
                # 1. Debit Purchase Account
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["Yarn & Fibre Purchase"], ledger_name="Yarn & Fibre Purchase", dr_amount=gross, cr_amount=0.0))
                # 2. Debit CGST/SGST/IGST Input Credit
                if cgst > 0:
                    db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["CGST Input Credit"], ledger_name="CGST Input Credit", dr_amount=cgst, cr_amount=0.0, gst_type="CGST", is_gst_entry=True))
                if sgst > 0:
                    db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["SGST Input Credit"], ledger_name="SGST Input Credit", dr_amount=sgst, cr_amount=0.0, gst_type="SGST", is_gst_entry=True))
                if igst > 0:
                    db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["IGST Input Credit"], ledger_name="IGST Input Credit", dr_amount=igst, cr_amount=0.0, gst_type="IGST", is_gst_entry=True))
                # 3. Credit Supplier
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=sup_id, ledger_name=inw.received_from, dr_amount=0.0, cr_amount=net))

            purchase_no_seq += 1

        print(f"  → Successfully imported {len(inwards)} purchase transactions.")

        # 10. Sync Sales Invoices -> Sales Vouchers (for BOTH FYs)
        print("  → Syncing Sales Invoices into Sales Vouchers...")
        sales = pg_conn.execute(sa.text("SELECT id, invoice_no, invoice_date, party_name, gross_amount, cgst, sgst, igst, net_amount FROM sales_invoices")).fetchall()
        
        sales_no_seq = 1
        for sal in sales:
            if not sal.party_name:
                continue
            gross = float(sal.gross_amount or 0)
            net = float(sal.net_amount or 0)
            cgst = float(sal.cgst or 0)
            sgst = float(sal.sgst or 0)
            igst = float(sal.igst or 0)
            inv_no = sal.invoice_no or f"INV-{sal.id}"

            # Ensure buyer ledger exists
            buy_id = ensure_party_ledger(sal.party_name, "Sundry Debtors")

            # Create voucher for both FYs
            for fy in [fy25, fy26]:
                # Calculate correct shifted date for FY 2025-26
                v_date = sal.invoice_date
                if fy.label == "FY 2025-26":
                    # Shift back exactly one year
                    try:
                        v_date = date(v_date.year - 1, v_date.month, v_date.day)
                    except ValueError:
                        v_date = date(v_date.year - 1, v_date.month, v_date.day - 1)

                v_num = f"SLS-{fy.label[-5:]}-{sales_no_seq:04d}"

                v = Voucher(
                    voucher_number=v_num,
                    voucher_type="Sales",
                    date=v_date,
                    narration=f"Sales of Finished Fabrics / Garments to {sal.party_name} - Invoice: {inv_no}",
                    reference_no=inv_no,
                    status="Posted",
                    total_amount=net,
                    company_id=company.id,
                    party_id=buy_id,
                    fy_id=fy.id
                )
                db.add(v)
                db.flush()

                # Add Entries
                # 1. Debit Buyer
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=buy_id, ledger_name=sal.party_name, dr_amount=net, cr_amount=0.0))
                # 2. Credit Sales Account
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["Textile Sales"], ledger_name="Textile Sales", dr_amount=0.0, cr_amount=gross))
                # 3. Credit CGST/SGST/IGST Payable
                if cgst > 0:
                    db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["CGST Payable"], ledger_name="CGST Payable", dr_amount=0.0, cr_amount=cgst, gst_type="CGST", is_gst_entry=True))
                if sgst > 0:
                    db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["SGST Payable"], ledger_name="SGST Payable", dr_amount=0.0, cr_amount=sgst, gst_type="SGST", is_gst_entry=True))
                if igst > 0:
                    db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["IGST Payable"], ledger_name="IGST Payable", dr_amount=0.0, cr_amount=igst, gst_type="IGST", is_gst_entry=True))

            sales_no_seq += 1

        print(f"  → Successfully imported {len(sales)} sales invoices.")

        # 11. Simulate Cash/Bank Payments & Receipts to complete the financial ledger
        print("  → Simulating Bank Receipts and Payments...")
        pmt_seq = 1
        rct_seq = 1
        
        for fy in [fy25, fy26]:
            # Simulate a bank payment for each Purchase to keep creditors balanced
            for inw in inwards:
                if not inw.received_from:
                    continue
                net = float(inw.net_amount or 0)
                sup_id = ledger_map[inw.received_from]
                
                # Shift dates
                v_date = inw.inward_date + timedelta(days=10) # 10 days credit
                if fy.label == "FY 2025-26":
                    try:
                        v_date = date(v_date.year - 1, v_date.month, v_date.day)
                    except ValueError:
                        v_date = date(v_date.year - 1, v_date.month, v_date.day - 1)

                v = Voucher(
                    voucher_number=f"PAY-{fy.label[-5:]}-{pmt_seq:04d}",
                    voucher_type="Payment",
                    date=v_date,
                    narration=f"Bank Payment to {inw.received_from} against Yarn Inward invoice",
                    reference_no=f"UTR-{inw.id:05d}",
                    status="Posted",
                    total_amount=net,
                    company_id=company.id,
                    party_id=sup_id,
                    fy_id=fy.id
                )
                db.add(v)
                db.flush()
                # Debit Supplier
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=sup_id, ledger_name=inw.received_from, dr_amount=net, cr_amount=0.0))
                # Credit Bank Account (HDFC)
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["HDFC Current Account"], ledger_name="HDFC Current Account", dr_amount=0.0, cr_amount=net))
                
                pmt_seq += 1

            # Simulate a bank receipt for each Sale to keep debtors balanced
            for sal in sales:
                if not sal.party_name:
                    continue
                net = float(sal.net_amount or 0)
                buy_id = ledger_map[sal.party_name]
                
                # Shift dates
                v_date = sal.invoice_date + timedelta(days=7) # 7 days credit
                if fy.label == "FY 2025-26":
                    try:
                        v_date = date(v_date.year - 1, v_date.month, v_date.day)
                    except ValueError:
                        v_date = date(v_date.year - 1, v_date.month, v_date.day - 1)

                v = Voucher(
                    voucher_number=f"RCT-{fy.label[-5:]}-{rct_seq:04d}",
                    voucher_type="Receipt",
                    date=v_date,
                    narration=f"Collection Received from {sal.party_name} against Invoice {sal.invoice_no}",
                    reference_no=f"REC-{sal.id:05d}",
                    status="Posted",
                    total_amount=net,
                    company_id=company.id,
                    party_id=buy_id,
                    fy_id=fy.id
                )
                db.add(v)
                db.flush()
                # Debit Bank Account (HDFC)
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=ledger_map["HDFC Current Account"], ledger_name="HDFC Current Account", dr_amount=net, cr_amount=0.0))
                # Credit Buyer
                db.add(VoucherEntry(voucher_id=v.id, ledger_id=buy_id, ledger_name=sal.party_name, dr_amount=0.0, cr_amount=net))
                
                rct_seq += 1

        db.commit()
        print("  → Bank Receipts and Payments generated successfully.")
        print("\n=== Real-Time Sync and Seeding Complete! ===")

    except Exception as e:
        db.rollback()
        print(f"  → ERROR during seeding transaction: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        pg_conn.close()

if __name__ == "__main__":
    sync_data()
