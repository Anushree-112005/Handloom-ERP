"""
Full seed script using antigravity HTTP client.
Creates company → financial year → ledger groups → ledgers → stock items → vouchers
Run: python -m backend.scripts.seed_data
"""
import requests
from datetime import date

BASE = "http://localhost:8000/api"

def post(path, data):
    r = requests.post(f"{BASE}{path}", json=data)
    print(f"  POST {path} [{r.status_code}]")
    if r.status_code >= 400:
        print(f"  ERROR: {r.text}")
    return r.json()

def get(path, params=None):
    r = requests.get(f"{BASE}{path}", params=params or {})
    return r.json()

def main():
    print("=== CubeBook Full Seed (Textile Focused) ===\n")

    # 1. Create company
    print("[1] Creating company...")
    company = post("/companies/", {
        "name": "Shree Textiles Pvt. Ltd.",
        "legal_name": "Shree Textiles Private Limited",
        "gstin": "27AABCS1429B1ZB",
        "pan": "AABCS1429B",
        "state_code": "27",
        "address": "401-405, Cotton Exchange Building, Kalbadevi Road",
        "city": "Mumbai",
        "pincode": "400002",
        "phone": "022-22001122",
        "email": "accounts@shreetextiles.com",
        "maintain_inventory": True,
        "maintain_inventory_by_default": True,
        "fy_start": "2025-04-01"
    })
    
    if "id" not in company:
        print("Failed to create company, already exists? Fetching companies...")
        comps = get("/companies/")
        if not comps: return
        company = comps[-1]
        
    cid = company["id"]
    print(f"  → Company ID: {cid}, FY auto-created\n")

    # 2. Get ledger groups (auto-created)
    print("[2] Getting ledger groups (auto-created by company setup)...")
    groups = get("/ledger-groups/", {"company_id": cid})
    group_map = {g["name"]: g["id"] for g in groups}
    print(f"  → {len(groups)} groups available\n")

    # 3. Create ledgers
    print("[3] Creating ledgers...")
    LEDGERS = [
        # Banks
        {"name":"HDFC Current Account","group":"Bank Accounts","opening_balance":750000,"balance_type":"Dr"},
        {"name":"ICICI Savings Account","group":"Bank Accounts","opening_balance":250000,"balance_type":"Dr"},
        
        # Debtors (Textile Buyers)
        {"name":"FabIndia Retail Ltd.","group":"Sundry Debtors","opening_balance":140000,"balance_type":"Dr","gstin":"27AAFCK1234B1ZC","state_code":"27"},
        {"name":"Bombay Dyeing & Mfg.","group":"Sundry Debtors","opening_balance":95000,"balance_type":"Dr","gstin":"27AABCB5678P1Z0","state_code":"27"},
        {"name":"Sunrise Garments","group":"Sundry Debtors","opening_balance":0,"balance_type":"Dr"},
        
        # Creditors (Yarn/Fabric Suppliers)
        {"name":"Arvind Mills Ltd.","group":"Sundry Creditors","opening_balance":180000,"balance_type":"Cr","gstin":"24AABCA8910F1Z4","state_code":"24"},
        {"name":"Raymond Fabrics Co.","group":"Sundry Creditors","opening_balance":120000,"balance_type":"Cr","gstin":"27AAFCR5678C1ZD","state_code":"27"},
        {"name":"Vardhman Threads","group":"Sundry Creditors","opening_balance":45000,"balance_type":"Cr"},
        
        # Sales & Purchase
        {"name":"Textile Sales","group":"Sales Accounts","opening_balance":0,"balance_type":"Cr"},
        {"name":"Yarn & Fibre Purchase","group":"Purchase Accounts","opening_balance":0,"balance_type":"Dr"},
        
        # GST
        {"name":"CGST Payable","group":"Duties & Taxes","opening_balance":0,"balance_type":"Cr"},
        {"name":"SGST Payable","group":"Duties & Taxes","opening_balance":0,"balance_type":"Cr"},
        {"name":"IGST Payable","group":"Duties & Taxes","opening_balance":0,"balance_type":"Cr"},
        {"name":"CGST Input Credit","group":"Current Assets","opening_balance":0,"balance_type":"Dr"},
        {"name":"SGST Input Credit","group":"Current Assets","opening_balance":0,"balance_type":"Dr"},
        {"name":"IGST Input Credit","group":"Current Assets","opening_balance":0,"balance_type":"Dr"},
        
        # Expenses (Direct & Indirect)
        {"name":"Weaving & Loom Charges","group":"Direct Expenses","opening_balance":0,"balance_type":"Dr"},
        {"name":"Dyeing & Printing Charges","group":"Direct Expenses","opening_balance":0,"balance_type":"Dr"},
        {"name":"Power & Fuel Expense","group":"Direct Expenses","opening_balance":0,"balance_type":"Dr"},
        {"name":"Salary Expense","group":"Indirect Expenses","opening_balance":0,"balance_type":"Dr"},
        {"name":"Rent Expense","group":"Indirect Expenses","opening_balance":0,"balance_type":"Dr"},
        {"name":"Cotton Scrap Loss","group":"Indirect Expenses","opening_balance":0,"balance_type":"Dr"},
    ]
    ledger_map = {}
    for l in LEDGERS:
        resp = post("/ledgers/", {**l, "company_id": cid})
        ledger_map[l["name"]] = resp.get("id")
    print(f"  → {len(LEDGERS)} ledgers created\n")

    # Get FY id
    fys = get("/financial-years/", {"company_id": cid})
    fy_id = fys[0]["id"] if fys else None

    # 4. Create stock items (Textile specific)
    print("[4] Creating stock items...")
    ITEMS = [
        {"name":"Cotton Yarn 40s Count","unit":"Kgs","hsn_code":"5205","gst_rate":5,"purchase_rate":240,"selling_rate":310},
        {"name":"Indigo Denim Fabric 12oz","unit":"Mtrs","hsn_code":"5209","gst_rate":5,"purchase_rate":150,"selling_rate":210},
        {"name":"Premium Silk Weave","unit":"Mtrs","hsn_code":"5007","gst_rate":12,"purchase_rate":850,"selling_rate":1200},
        {"name":"Polyester Sewing Thread","unit":"Cones","hsn_code":"5401","gst_rate":12,"purchase_rate":45,"selling_rate":65},
    ]
    for item in ITEMS:
        post("/stock-items/", {**item, "company_id": cid})
    print(f"  → {len(ITEMS)} stock items created\n")

    # 5. Create vouchers
    print("[5] Creating vouchers...\n")
    L = ledger_map  # shorthand

    def cash_id():
        leds = get("/ledgers/", {"company_id": cid, "search": "Cash"})
        return leds[0]["id"] if leds else None

    cash = cash_id()

    # 1. Sales Voucher (Interstate sale with IGST)
    # Selling Silk Weave to FabIndia (IGST at 12%)
    post("/vouchers/", {
        "voucher_type": "Sales", "date": "2025-04-02",
        "narration": "Sales of Premium Silk Fabric to FabIndia Retail - Invoice #ST/001",
        "reference_no": "ST/001", "company_id": cid, "fy_id": fy_id,
        "entries": [
            {"ledger_id": L["FabIndia Retail Ltd."], "ledger_name": "FabIndia Retail Ltd.",
             "dr_amount": 224000, "cr_amount": 0},
            {"ledger_id": L["Textile Sales"], "ledger_name": "Textile Sales",
             "dr_amount": 0, "cr_amount": 200000},
            {"ledger_id": L["IGST Payable"], "ledger_name": "IGST Payable",
             "dr_amount": 0, "cr_amount": 24000, "gst_type": "IGST", "is_gst_entry": True},
        ]
    })
    print("  → Sales voucher ST/001 created (IGST Interstate)")

    # 2. Purchase Voucher (Intrastate purchase with CGST/SGST Input Credit)
    # Buying Cotton Yarn from Arvind Mills (GST at 5% total)
    post("/vouchers/", {
        "voucher_type": "Purchase", "date": "2025-04-05",
        "narration": "Purchase of Cotton Yarn from Arvind Mills - Bill #AM-9912",
        "reference_no": "AM-9912", "company_id": cid, "fy_id": fy_id,
        "entries": [
            {"ledger_id": L["Yarn & Fibre Purchase"], "ledger_name": "Yarn & Fibre Purchase",
             "dr_amount": 100000, "cr_amount": 0},
            {"ledger_id": L["CGST Input Credit"], "ledger_name": "CGST Input Credit",
             "dr_amount": 2500, "cr_amount": 0, "gst_type": "CGST", "is_gst_entry": True},
            {"ledger_id": L["SGST Input Credit"], "ledger_name": "SGST Input Credit",
             "dr_amount": 2500, "cr_amount": 0, "gst_type": "SGST", "is_gst_entry": True},
            {"ledger_id": L["Arvind Mills Ltd."], "ledger_name": "Arvind Mills Ltd.",
             "dr_amount": 0, "cr_amount": 105000},
        ]
    })
    print("  → Purchase voucher AM-9912 created (CGST/SGST Input)")

    # 3. Receipt Voucher
    # Receiving outstanding collection from Bombay Dyeing via HDFC Bank
    post("/vouchers/", {
        "voucher_type": "Receipt", "date": "2025-04-08",
        "narration": "Receipt from Bombay Dyeing & Mfg. against outstanding bill - UTR HDFCR52025",
        "reference_no": "UTR-HDFCR520", "company_id": cid, "fy_id": fy_id,
        "entries": [
            {"ledger_id": L["HDFC Current Account"], "ledger_name": "HDFC Current Account",
             "dr_amount": 95000, "cr_amount": 0},
            {"ledger_id": L["Bombay Dyeing & Mfg."], "ledger_name": "Bombay Dyeing & Mfg.",
             "dr_amount": 0, "cr_amount": 95000},
        ]
    })
    print("  → Receipt voucher RCT-0001 created")

    # 4. Payment Voucher
    # Paying Raymond Fabrics Co. via HDFC Bank
    post("/vouchers/", {
        "voucher_type": "Payment", "date": "2025-04-12",
        "narration": "Payment to Raymond Fabrics Co. for fabric processing services",
        "reference_no": "TX-PAY-882", "company_id": cid, "fy_id": fy_id,
        "entries": [
            {"ledger_id": L["Raymond Fabrics Co."], "ledger_name": "Raymond Fabrics Co.",
             "dr_amount": 80000, "cr_amount": 0},
            {"ledger_id": L["HDFC Current Account"], "ledger_name": "HDFC Current Account",
             "dr_amount": 0, "cr_amount": 80000},
        ]
    })
    print("  → Payment voucher PAY-0001 created")

    # 5. Payment Voucher (Loom wages/charges)
    # Paying Weaving Loom charges in cash
    if cash:
        post("/vouchers/", {
            "voucher_type": "Payment", "date": "2025-04-15",
            "narration": "Cash payment for loom operators and weaving wages",
            "reference_no": "CSH-WAGES-09", "company_id": cid, "fy_id": fy_id,
            "entries": [
                {"ledger_id": L["Weaving & Loom Charges"], "ledger_name": "Weaving & Loom Charges",
                 "dr_amount": 25000, "cr_amount": 0},
                {"ledger_id": cash, "ledger_name": "Cash",
                 "dr_amount": 0, "cr_amount": 25000},
            ]
        })
        print("  → Payment voucher PAY-0002 created (Cash Loom Charges)")

    # 6. Contra Voucher
    # Withdrawing cash from ICICI Bank for factory pocket-money expenses
    if cash:
        post("/vouchers/", {
            "voucher_type": "Contra", "date": "2025-04-18",
            "narration": "Cash withdrawn from ICICI bank for office/factory floor use",
            "reference_no": "WDL-0012", "company_id": cid, "fy_id": fy_id,
            "entries": [
                {"ledger_id": cash, "ledger_name": "Cash",
                 "dr_amount": 15000, "cr_amount": 0},
                {"ledger_id": L["ICICI Savings Account"], "ledger_name": "ICICI Savings Account",
                 "dr_amount": 0, "cr_amount": 15000},
            ]
        })
        print("  → Contra voucher CON-0001 created")

    # 7. Journal Voucher
    # Adjusting yarn/fabric scrap or wastage adjustment (non-cash)
    post("/vouchers/", {
        "voucher_type": "Journal", "date": "2025-04-20",
        "narration": "Adjusting loom-floor cotton scrap wastage loss",
        "reference_no": "JV-WASTAGE-01", "company_id": cid, "fy_id": fy_id,
        "entries": [
            {"ledger_id": L["Cotton Scrap Loss"], "ledger_name": "Cotton Scrap Loss",
             "dr_amount": 8000, "cr_amount": 0},
            {"ledger_id": L["Yarn & Fibre Purchase"], "ledger_name": "Yarn & Fibre Purchase",
             "dr_amount": 0, "cr_amount": 8000},
        ]
    })
    print("  → Journal voucher JRL-0001 created (scrap wastage adjust)")

    print("\n=== Seed complete! ===")

if __name__ == "__main__":
    main()
