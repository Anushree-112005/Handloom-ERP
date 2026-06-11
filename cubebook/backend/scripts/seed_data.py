"""
CubeBook Complete Seed Data Script
Uses antigravity HTTP client to populate database with realistic accounting data.

Run: python -m backend.scripts.seed_data
(ensure FastAPI backend is running on http://localhost:8000)
"""

import requests
from datetime import date, timedelta
import json

BASE_URL = "http://localhost:8000/api"
HEADERS = {"Content-Type": "application/json"}

def post(path, data):
    """POST request with error handling"""
    url = f"{BASE_URL}{path}"
    try:
        r = requests.post(url, json=data, headers=HEADERS)
        if r.status_code >= 400:
            print(f"  ❌ POST {path} [{r.status_code}]")
            print(f"     Error: {r.text}")
            return None
        print(f"  ✓ POST {path} [{r.status_code}]")
        return r.json()
    except Exception as e:
        print(f"  ❌ POST {path} - Exception: {e}")
        return None

def get(path, params=None):
    """GET request with error handling"""
    url = f"{BASE_URL}{path}"
    try:
        r = requests.get(url, params=params or {}, headers=HEADERS)
        if r.status_code >= 400:
            print(f"  ❌ GET {path} [{r.status_code}]")
            return None
        return r.json()
    except Exception as e:
        print(f"  ❌ GET {path} - Exception: {e}")
        return None

def main():
    print("\n" + "="*70)
    print("🎯 CubeBook Full Seed Data Setup")
    print("="*70 + "\n")

    # ── STEP 1: CREATE COMPANY ──────────────────────────────────────────
    print("[1/6] Creating company...")
    company = post("/companies", {
        "name": "Shree Traders Pvt. Ltd.",
        "legal_name": "Shree Traders Private Limited",
        "gstin": "27AABCS1429B1ZB",
        "pan": "AABCS1429B",
        "state_code": "27",
        "address": "101, Marwadi House, Masjid Bunder",
        "city": "Mumbai",
        "pincode": "400009",
        "phone": "022-23456789",
        "email": "accounts@shreetraders.com",
        "maintain_inventory": True,
        "fy_start": "2025-04-01"
    })
    if not company:
        print("❌ Failed to create company. Exiting.\n")
        return
    
    cid = company["id"]
    print(f"   → Company ID: {cid}")
    print(f"   → Name: {company['name']}")
    print(f"   → FY: {company['current_fy']['label']}\n")

    # ── STEP 2: GET LEDGER GROUPS (auto-created) ────────────────────────
    print("[2/6] Fetching ledger groups (auto-created by company setup)...")
    groups = get("/ledger-groups", {"company_id": cid})
    if not groups:
        print("❌ Failed to fetch ledger groups. Exiting.\n")
        return
    
    group_map = {g["name"]: g["id"] for g in groups}
    print(f"   → {len(groups)} ledger groups available\n")

    # Get current FY
    fys = get("/financial-years", {"company_id": cid})
    fy_id = fys[0]["id"] if fys else None

    # ── STEP 3: CREATE ADDITIONAL LEDGERS ───────────────────────────────
    print("[3/6] Creating ledgers (with opening balances)...")
    
    ledgers_data = [
        # Banks
        {"name": "HDFC Current Account", "group": "Bank Accounts", "opening_balance": 320000, 
         "balance_type": "Dr", "bank_name": "HDFC Bank", "account_number": "50200012345678"},
        {"name": "ICICI Savings Account", "group": "Bank Accounts", "opening_balance": 165000,
         "balance_type": "Dr", "bank_name": "ICICI Bank", "account_number": "60020234567890"},
        
        # Debtors (customers)
        {"name": "Kumar Enterprises", "group": "Sundry Debtors", "opening_balance": 85000,
         "balance_type": "Dr", "party_type": "customer", "gstin": "27AAFCK1234B1ZC", "state_code": "27"},
        {"name": "Mehta & Sons", "group": "Sundry Debtors", "opening_balance": 45000,
         "balance_type": "Dr", "party_type": "customer", "state_code": "27"},
        {"name": "Sunrise Trading Co.", "group": "Sundry Debtors", "opening_balance": 0,
         "balance_type": "Dr", "party_type": "customer"},
        
        # Creditors (vendors)
        {"name": "Raj Traders", "group": "Sundry Creditors", "opening_balance": 60000,
         "balance_type": "Cr", "party_type": "vendor", "gstin": "27AAFCR5678C1ZD", "state_code": "27"},
        {"name": "Global Supplies Ltd.", "group": "Sundry Creditors", "opening_balance": 30000,
         "balance_type": "Cr", "party_type": "vendor", "state_code": "29"},  # Karnataka
        
        # Sales & Purchase
        {"name": "Sales - Goods", "group": "Sales Accounts", "opening_balance": 0, "balance_type": "Cr"},
        {"name": "Purchase - Goods", "group": "Purchase Accounts", "opening_balance": 0, "balance_type": "Dr"},
        
        # GST Payables
        {"name": "CGST Payable", "group": "Duties & Taxes", "opening_balance": 0, "balance_type": "Cr"},
        {"name": "SGST Payable", "group": "Duties & Taxes", "opening_balance": 0, "balance_type": "Cr"},
        {"name": "IGST Payable", "group": "Duties & Taxes", "opening_balance": 0, "balance_type": "Cr"},
        
        # GST Input Credit
        {"name": "CGST Input Credit", "group": "Current Assets", "opening_balance": 0, "balance_type": "Dr"},
        {"name": "SGST Input Credit", "group": "Current Assets", "opening_balance": 0, "balance_type": "Dr"},
        {"name": "IGST Input Credit", "group": "Current Assets", "opening_balance": 0, "balance_type": "Dr"},
        
        # Expenses
        {"name": "Salary Expense", "group": "Indirect Expenses", "opening_balance": 0, "balance_type": "Dr"},
        {"name": "Rent Expense", "group": "Indirect Expenses", "opening_balance": 0, "balance_type": "Dr"},
        {"name": "Electricity Charges", "group": "Indirect Expenses", "opening_balance": 0, "balance_type": "Dr"},
        {"name": "Transportation", "group": "Direct Expenses", "opening_balance": 0, "balance_type": "Dr"},
        {"name": "Packaging Materials", "group": "Direct Expenses", "opening_balance": 0, "balance_type": "Dr"},
    ]
    
    ledger_map = {}
    for l_data in ledgers_data:
        l_data["company_id"] = cid
        resp = post("/ledgers", l_data)
        if resp:
            ledger_map[l_data["name"]] = resp.get("id")
    print(f"   → {len(ledger_map)} ledgers created\n")

    # ── STEP 4: CREATE STOCK ITEMS ──────────────────────────────────────
    print("[4/6] Creating stock items...")
    
    stock_items = [
        {"name": "Product A - Widgets", "unit": "Nos", "hsn_code": "8473.30", 
         "gst_rate": 18, "purchase_rate": 500, "selling_rate": 700, "company_id": cid},
        {"name": "Product B - Cables 2mm", "unit": "Mtrs", "hsn_code": "8544.30",
         "gst_rate": 18, "purchase_rate": 120, "selling_rate": 180, "company_id": cid},
        {"name": "Product C - Components Kit", "unit": "Box", "hsn_code": "8473.30",
         "gst_rate": 12, "purchase_rate": 2000, "selling_rate": 2800, "company_id": cid},
        {"name": "Raw Material - PVC", "unit": "Kg", "hsn_code": "3915.90",
         "gst_rate": 18, "purchase_rate": 150, "selling_rate": 0, "company_id": cid},
    ]
    
    for item in stock_items:
        post("/stock-items", item)
    print(f"   → {len(stock_items)} stock items created\n")

    # ── STEP 5: CREATE VOUCHERS ─────────────────────────────────────────
    print("[5/6] Creating sample vouchers...")
    
    L = ledger_map  # Shorthand reference
    
    # Helper to get Cash ledger
    all_ledgers = get("/ledgers", {"company_id": cid})
    cash_ledger = next((l for l in (all_ledgers or []) if "Cash" in l["name"]), None)
    cash_id = cash_ledger["id"] if cash_ledger else None

    # --- Sales Invoice (with GST) ---
    if L.get("Kumar Enterprises") and L.get("Sales - Goods"):
        post("/vouchers", {
            "voucher_type": "Sales",
            "date": "2025-04-01",
            "narration": "Sales to Kumar Enterprises - Invoice SLS-001",
            "reference_no": "INV-2025-001",
            "company_id": cid,
            "fy_id": fy_id,
            "status": "Posted",
            "entries": [
                {"ledger_id": L["Kumar Enterprises"], "ledger_name": "Kumar Enterprises",
                 "dr_amount": 118000, "cr_amount": 0},
                {"ledger_id": L["Sales - Goods"], "ledger_name": "Sales - Goods",
                 "dr_amount": 0, "cr_amount": 100000},
                {"ledger_id": L["CGST Payable"], "ledger_name": "CGST @9%",
                 "dr_amount": 0, "cr_amount": 9000, "gst_type": "CGST", "is_gst_entry": True},
                {"ledger_id": L["SGST Payable"], "ledger_name": "SGST @9%",
                 "dr_amount": 0, "cr_amount": 9000, "gst_type": "SGST", "is_gst_entry": True},
            ]
        })

    # --- Receipt Voucher ---
    if L.get("HDFC Current Account") and L.get("Mehta & Sons"):
        post("/vouchers", {
            "voucher_type": "Receipt",
            "date": "2025-04-03",
            "narration": "Collection from Mehta & Sons - part payment",
            "reference_no": "UTR-20250403-001",
            "company_id": cid,
            "fy_id": fy_id,
            "status": "Posted",
            "entries": [
                {"ledger_id": L["HDFC Current Account"], "ledger_name": "HDFC Current Account",
                 "dr_amount": 45000, "cr_amount": 0},
                {"ledger_id": L["Mehta & Sons"], "ledger_name": "Mehta & Sons",
                 "dr_amount": 0, "cr_amount": 45000},
            ]
        })

    # --- Purchase Invoice (with GST) ---
    if L.get("Raj Traders") and L.get("Purchase - Goods"):
        post("/vouchers", {
            "voucher_type": "Purchase",
            "date": "2025-04-05",
            "narration": "Purchase from Raj Traders - raw material batch",
            "reference_no": "PO-2025-001",
            "company_id": cid,
            "fy_id": fy_id,
            "status": "Posted",
            "entries": [
                {"ledger_id": L["Purchase - Goods"], "ledger_name": "Purchase - Goods",
                 "dr_amount": 50000, "cr_amount": 0},
                {"ledger_id": L["CGST Input Credit"], "ledger_name": "CGST Input @9%",
                 "dr_amount": 4500, "cr_amount": 0, "gst_type": "CGST", "is_gst_entry": True},
                {"ledger_id": L["SGST Input Credit"], "ledger_name": "SGST Input @9%",
                 "dr_amount": 4500, "cr_amount": 0, "gst_type": "SGST", "is_gst_entry": True},
                {"ledger_id": L["Raj Traders"], "ledger_name": "Raj Traders",
                 "dr_amount": 0, "cr_amount": 59000},
            ]
        })

    # --- Payment Voucher ---
    if L.get("Raj Traders") and L.get("HDFC Current Account"):
        post("/vouchers", {
            "voucher_type": "Payment",
            "date": "2025-04-07",
            "narration": "Payment to Raj Traders - cheque against PO-2025-001",
            "reference_no": "CHQ-0042",
            "company_id": cid,
            "fy_id": fy_id,
            "status": "Posted",
            "entries": [
                {"ledger_id": L["Raj Traders"], "ledger_name": "Raj Traders",
                 "dr_amount": 59000, "cr_amount": 0},
                {"ledger_id": L["HDFC Current Account"], "ledger_name": "HDFC Current Account",
                 "dr_amount": 0, "cr_amount": 59000},
            ]
        })

    # --- Journal Voucher (Salary provision) ---
    if L.get("Salary Expense") and cash_id:
        post("/vouchers", {
            "voucher_type": "Journal",
            "date": "2025-04-30",
            "narration": "April salary provision - 5 employees @ 19,000",
            "company_id": cid,
            "fy_id": fy_id,
            "status": "Posted",
            "entries": [
                {"ledger_id": L["Salary Expense"], "ledger_name": "Salary Expense",
                 "dr_amount": 95000, "cr_amount": 0},
                {"ledger_id": cash_id, "ledger_name": "Cash",
                 "dr_amount": 0, "cr_amount": 95000},
            ]
        })

    # --- Contra Voucher (Bank to Cash transfer) ---
    if L.get("HDFC Current Account") and cash_id:
        post("/vouchers", {
            "voucher_type": "Contra",
            "date": "2025-04-10",
            "narration": "Transfer from HDFC to Cash for petty cash",
            "company_id": cid,
            "fy_id": fy_id,
            "status": "Posted",
            "entries": [
                {"ledger_id": cash_id, "ledger_name": "Cash",
                 "dr_amount": 10000, "cr_amount": 0},
                {"ledger_id": L["HDFC Current Account"], "ledger_name": "HDFC Current Account",
                 "dr_amount": 0, "cr_amount": 10000},
            ]
        })

    # --- Rent Expense (cash payment) ---
    if L.get("Rent Expense") and cash_id:
        post("/vouchers", {
            "voucher_type": "Journal",
            "date": "2025-04-15",
            "narration": "Rent for April 2025 - paid in cash",
            "company_id": cid,
            "fy_id": fy_id,
            "status": "Posted",
            "entries": [
                {"ledger_id": L["Rent Expense"], "ledger_name": "Rent Expense",
                 "dr_amount": 25000, "cr_amount": 0},
                {"ledger_id": cash_id, "ledger_name": "Cash",
                 "dr_amount": 0, "cr_amount": 25000},
            ]
        })

    print("   → 7 sample vouchers created\n")

    # ── STEP 6: GENERATE REPORTS ───────────────────────────────────────
    print("[6/6] Generating reports...")
    
    # Day Book
    day_book = get("/reports/day-book", {
        "company_id": cid,
        "from_date": "2025-04-01",
        "to_date": "2025-04-30"
    })
    if day_book:
        print(f"   ✓ Day Book: {len(day_book.get('vouchers', []))} vouchers")
    
    # Trial Balance
    trial_bal = get("/reports/trial-balance", {
        "company_id": cid,
        "as_of": "2025-04-30"
    })
    if trial_bal:
        print(f"   ✓ Trial Balance: {len(trial_bal.get('rows', []))} accounts")
        print(f"      Dr Total: ₹{trial_bal.get('total_dr', 0):,.2f}")
        print(f"      Cr Total: ₹{trial_bal.get('total_cr', 0):,.2f}")
        print(f"      Balanced: {trial_bal.get('is_balanced', False)}")
    
    # P&L Account
    pl = get("/reports/profit-loss", {
        "company_id": cid,
        "from_date": "2025-04-01",
        "to_date": "2025-04-30"
    })
    if pl:
        print(f"   ✓ Profit & Loss: Net Profit = ₹{pl.get('net_profit', 0):,.2f}")
    
    # Balance Sheet
    bs = get("/reports/balance-sheet", {
        "company_id": cid,
        "as_of": "2025-04-30"
    })
    if bs:
        print(f"   ✓ Balance Sheet: Assets = ₹{bs.get('assets', {}).get('total', 0):,.2f}")
    
    print("\n" + "="*70)
    print("✅ Seed Data Setup Complete!")
    print("="*70)
    print(f"\n📊 Company Details:")
    print(f"   ID: {cid}")
    print(f"   Name: Shree Traders Pvt. Ltd.")
    print(f"   GSTIN: 27AABCS1429B1ZB")
    print(f"   Location: Mumbai (State Code: 27)")
    print(f"\n🔗 Access Points:")
    print(f"   API Docs:    http://localhost:8000/docs")
    print(f"   ReDoc:       http://localhost:8000/redoc")
    print(f"   Frontend:    http://localhost:5173")
    print(f"\n📋 Database Created:")
    print(f"   Location: cubebook.db")
    print(f"   Tables: companies, ledgers, vouchers, stock_items, etc.")
    print(f"\n🚀 Next Steps:")
    print(f"   1. Open http://localhost:5173 in browser")
    print(f"   2. Start entering more vouchers (F5-F9 shortcuts)")
    print(f"   3. View reports: Trial Balance, P&L, Balance Sheet")
    print(f"   4. Check GST summary")
    print("\n")

if __name__ == "__main__":
    main()
