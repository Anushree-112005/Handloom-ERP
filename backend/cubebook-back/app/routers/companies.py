from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, timedelta
from pydantic import BaseModel
from app.database import get_db
from app.models.company import Company, FinancialYear
from app.models.ledger_group import LedgerGroup
from app.models.ledger import Ledger

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────
class CompanyCreate(BaseModel):
    name:               str
    legal_name:         Optional[str] = None
    gstin:              Optional[str] = None
    pan:                Optional[str] = None
    state_code:         Optional[str] = None
    address:            Optional[str] = None
    city:               Optional[str] = None
    pincode:            Optional[str] = None
    phone:              Optional[str] = None
    email:              Optional[str] = None
    maintain_inventory: bool = False
    fy_start:           date = date(2026, 4, 1)

class CompanyUpdate(BaseModel):
    name:        Optional[str] = None
    legal_name:  Optional[str] = None
    gstin:       Optional[str] = None
    pan:         Optional[str] = None
    state_code:  Optional[str] = None
    address:     Optional[str] = None
    city:        Optional[str] = None
    pincode:     Optional[str] = None
    phone:       Optional[str] = None
    email:       Optional[str] = None

# ── Helpers ────────────────────────────────────────────────────────────────
TALLY_GROUPS = [
    ("Capital Account",          None,                      "liability"),
    ("Reserves & Surplus",       "Capital Account",         "liability"),
    ("Loans (Liability)",        None,                      "liability"),
    ("Bank OD Accounts",         "Loans (Liability)",       "liability"),
    ("Current Liabilities",      None,                      "liability"),
    ("Duties & Taxes",           "Current Liabilities",     "liability"),
    ("Provisions",               "Current Liabilities",     "liability"),
    ("Sundry Creditors",         "Current Liabilities",     "liability"),
    ("Suspense Account",         None,                      "liability"),
    ("Fixed Assets",             None,                      "asset"),
    ("Investments",              None,                      "asset"),
    ("Current Assets",           None,                      "asset"),
    ("Bank Accounts",            "Current Assets",          "asset"),
    ("Cash-in-Hand",             "Current Assets",          "asset"),
    ("Deposits (Asset)",         "Current Assets",          "asset"),
    ("Loans & Advances (Asset)", "Current Assets",          "asset"),
    ("Stock-in-Hand",            "Current Assets",          "asset"),
    ("Sundry Debtors",           "Current Assets",          "asset"),
    ("Miscellaneous Expenses",   None,                      "asset"),
    ("Sales Accounts",           None,                      "income"),
    ("Direct Incomes",           None,                      "income"),
    ("Indirect Incomes",         None,                      "income"),
    ("Income",                   None,                      "income"),
    ("Purchase Accounts",        None,                      "expense"),
    ("Direct Expenses",          None,                      "expense"),
    ("Indirect Expenses",        None,                      "expense"),
]

def _create_default_groups(company_id: int, db: Session):
    group_map = {}
    for name, parent, nature in TALLY_GROUPS:
        parent_id = group_map.get(parent)
        g = LedgerGroup(
            name=name, parent_group=parent,
            parent_id=parent_id, nature=nature,
            company_id=company_id, is_system=True
        )
        db.add(g)
        db.flush()
        group_map[name] = g.id
    return group_map

def _create_default_ledgers(company_id: int, db: Session):
    defaults = [
        ("Cash",              "Cash-in-Hand",       "Dr"),
        ("Profit & Loss A/c", "Reserves & Surplus", "Cr"),
        ("Capital Account",   "Capital Account",    "Cr"),
    ]
    for name, group, bt in defaults:
        db.add(Ledger(
            name=name, group=group,
            balance_type=bt, opening_balance=0,
            company_id=company_id, is_system=True
        ))

# ── Endpoints ──────────────────────────────────────────────────────────────
@router.post("/")
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    if db.query(Company).filter(Company.name == payload.name).first():
        raise HTTPException(400, "Company name already exists")
    data = payload.model_dump()
    fy_start = data.pop("fy_start")
    company = Company(**data)
    db.add(company)
    db.flush()

    # Auto-create financial year
    fy = FinancialYear(
        company_id=company.id,
        label=f"FY {fy_start.year}-{str(fy_start.year + 1)[2:]}",
        start_date=fy_start,
        end_date=date(fy_start.year + 1, 3, 31),
        is_current=True,
    )
    db.add(fy)

    # Auto-create default ledger groups and ledgers
    _create_default_groups(company.id, db)  # pyrefly: ignore[bad-argument-type]
    _create_default_ledgers(company.id, db)  # pyrefly: ignore[bad-argument-type]

    db.commit()
    db.refresh(company)
    return _company_out(company, db)


@router.post("/seed-textile")
def seed_textile_company(db: Session = Depends(get_db)):
    # Remove existing Shree Textiles company to allow clean re-seeding
    existing = db.query(Company).filter(Company.name == "Shree Textiles Pvt. Ltd.").first()
    if existing:
        db.delete(existing)
        db.commit()
    
    # 1. Create company
    company = Company(
        name="Shree Textiles Pvt. Ltd.",
        legal_name="Shree Textiles Private Limited",
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

    # Create FY
    fy = FinancialYear(
        company_id=company.id,
        label="FY 2026-27",
        start_date=date(2026, 4, 1),
        end_date=date(2027, 3, 31),
        is_current=True,
    )
    db.add(fy)
    db.flush()

    # Create groups
    _create_default_groups(company.id, db)  # pyrefly: ignore[bad-argument-type]
    _create_default_ledgers(company.id, db)  # pyrefly: ignore[bad-argument-type]
    db.flush()


    # Create textile ledgers
    ledgers_to_create = [
        ("HDFC Current Account", "Bank Accounts", "Dr", 0.0, None),
        ("ICICI Savings Account", "Bank Accounts", "Dr", 0.0, None),
        ("FabIndia Retail Ltd.", "Sundry Debtors", "Dr", 0.0, "27AAFCK1234B1ZC"),
        ("Bombay Dyeing & Mfg.", "Sundry Debtors", "Dr", 0.0, "27AABCB5678P1Z0"),
        ("Sunrise Garments", "Sundry Debtors", "Dr", 0.0, None),
        ("Arvind Mills Ltd.", "Sundry Creditors", "Cr", 0.0, "24AABCA8910F1Z4"),
        ("Raymond Fabrics Co.", "Sundry Creditors", "Cr", 0.0, "27AAFCR5678C1ZD"),
        ("Vardhman Threads", "Sundry Creditors", "Cr", 0.0, None),
        ("Textile Sales", "Sales Accounts", "Cr", 0.0, None),
        ("Yarn & Fibre Purchase", "Purchase Accounts", "Dr", 0.0, None),
        ("CGST Payable", "Duties & Taxes", "Cr", 0.0, None),
        ("SGST Payable", "Duties & Taxes", "Cr", 0.0, None),
        ("IGST Payable", "Duties & Taxes", "Cr", 0.0, None),
        ("CGST Input Credit", "Current Assets", "Dr", 0.0, None),
        ("SGST Input Credit", "Current Assets", "Dr", 0.0, None),
        ("IGST Input Credit", "Current Assets", "Dr", 0.0, None),
        ("Weaving & Loom Charges", "Direct Expenses", "Dr", 0.0, None),
        ("Dyeing & Printing Charges", "Direct Expenses", "Dr", 0.0, None),
        ("Power & Fuel Expense", "Direct Expenses", "Dr", 0.0, None),
        ("Salary Expense", "Indirect Expenses", "Dr", 0.0, None),
        ("Rent Expense", "Indirect Expenses", "Dr", 0.0, None),
        ("Cotton Scrap Loss", "Indirect Expenses", "Dr", 0.0, None),
    ]

    ledger_map = {}
    for name, group, bt, bal, gstin in ledgers_to_create:
        ledger = Ledger(
            name=name, group=group, balance_type=bt,
            opening_balance=bal, gstin=gstin, state_code="27" if gstin else None,
            company_id=company.id
        )
        db.add(ledger)
        db.flush()
        ledger_map[name] = ledger.id

    # Add default Cash id
    cash_ledger = db.query(Ledger).filter(Ledger.company_id == company.id, Ledger.name == "Cash").first()
    if cash_ledger:
        ledger_map["Cash"] = cash_ledger.id

    # Create locations / godowns
    from app.models.inventory import Location
    locs_to_create = [
        ("Main Godown", None),
        ("Factory Warehouse", None),
        ("Spinning Unit Godown", None),
    ]
    location_map = {}
    for name, parent in locs_to_create:
        loc = Location(name=name, parent_id=parent, company_id=company.id)
        db.add(loc)
        db.flush()
        location_map[name] = loc.id

    # Stock Items
    from app.models.stock_item import StockItem
    stock_items_to_create = [
        ("Cotton Yarn 40s Count", "Kgs", "5205", 5.0, 240.0, 310.0),
        ("Indigo Denim Fabric 12oz", "Mtrs", "5209", 5.0, 150.0, 210.0),
        ("Premium Silk Weave", "Mtrs", "5007", 12.0, 850.0, 1200.0),
        ("Polyester Sewing Thread", "Cones", "5401", 12.0, 45.0, 65.0),
    ]
    stock_item_map = {}
    for name, unit, hsn, gst_r, pr, sr in stock_items_to_create:
        item = StockItem(
            name=name, unit=unit, hsn_code=hsn, gst_rate=gst_r,
            purchase_rate=pr, selling_rate=sr, company_id=company.id,
            opening_qty=100.0, opening_rate=pr
        )
        db.add(item)
        db.flush()
        stock_item_map[name] = item.id

    # Vouchers
    from app.models.voucher import Voucher, VoucherEntry
    start = fy.start_date
    
    # 1. Sales Voucher (Interstate sale with IGST)
    v1 = Voucher(
        voucher_number="SLS-0001", voucher_type="Sales", date=start + timedelta(days=1),
        narration="Sales of Premium Silk Fabric to FabIndia Retail - Invoice #ST/001",
        reference_no="ST/001", status="Posted", total_amount=224000.0,
        company_id=company.id, fy_id=fy.id
    )
    db.add(v1)
    db.flush()
    db.add(VoucherEntry(voucher_id=v1.id, ledger_id=ledger_map["FabIndia Retail Ltd."], ledger_name="FabIndia Retail Ltd.", dr_amount=224000.0, cr_amount=0.0))
    db.add(VoucherEntry(
        voucher_id=v1.id, ledger_id=ledger_map["Textile Sales"], ledger_name="Textile Sales",
        dr_amount=0.0, cr_amount=200000.0,
        stock_item_id=stock_item_map["Premium Silk Weave"], stock_item_name="Premium Silk Weave",
        qty=200.0, rate=1000.0,
        location_id=location_map["Main Godown"], location_name="Main Godown"
    ))
    db.add(VoucherEntry(voucher_id=v1.id, ledger_id=ledger_map["IGST Payable"], ledger_name="IGST Payable", dr_amount=0.0, cr_amount=24000.0, gst_type="IGST", is_gst_entry=True))

    # 2. Purchase Voucher (Intrastate purchase with CGST/SGST Input Credit)
    v2 = Voucher(
        voucher_number="PUR-0001", voucher_type="Purchase", date=start + timedelta(days=4),
        narration="Purchase of Cotton Yarn from Arvind Mills - Bill #AM-9912",
        reference_no="AM-9912", status="Posted", total_amount=105000.0,
        company_id=company.id, fy_id=fy.id
    )
    db.add(v2)
    db.flush()
    db.add(VoucherEntry(
        voucher_id=v2.id, ledger_id=ledger_map["Yarn & Fibre Purchase"], ledger_name="Yarn & Fibre Purchase",
        dr_amount=100000.0, cr_amount=0.0,
        stock_item_id=stock_item_map["Cotton Yarn 40s Count"], stock_item_name="Cotton Yarn 40s Count",
        qty=400.0, rate=250.0,
        location_id=location_map["Factory Warehouse"], location_name="Factory Warehouse"
    ))
    db.add(VoucherEntry(voucher_id=v2.id, ledger_id=ledger_map["CGST Input Credit"], ledger_name="CGST Input Credit", dr_amount=2500.0, cr_amount=0.0, gst_type="CGST", is_gst_entry=True))
    db.add(VoucherEntry(voucher_id=v2.id, ledger_id=ledger_map["SGST Input Credit"], ledger_name="SGST Input Credit", dr_amount=2500.0, cr_amount=0.0, gst_type="SGST", is_gst_entry=True))
    db.add(VoucherEntry(voucher_id=v2.id, ledger_id=ledger_map["Arvind Mills Ltd."], ledger_name="Arvind Mills Ltd.", dr_amount=0.0, cr_amount=105000.0))

    # 3. Receipt Voucher
    v3 = Voucher(
        voucher_number="RCT-0001", voucher_type="Receipt", date=start + timedelta(days=7),
        narration="Receipt from Bombay Dyeing & Mfg. against outstanding bill - UTR HDFCR52025",
        reference_no="UTR-HDFCR520", status="Posted", total_amount=95000.0,
        company_id=company.id, fy_id=fy.id
    )
    db.add(v3)
    db.flush()
    db.add(VoucherEntry(voucher_id=v3.id, ledger_id=ledger_map["HDFC Current Account"], ledger_name="HDFC Current Account", dr_amount=95000.0, cr_amount=0.0))
    db.add(VoucherEntry(voucher_id=v3.id, ledger_id=ledger_map["Bombay Dyeing & Mfg."], ledger_name="Bombay Dyeing & Mfg.", dr_amount=0.0, cr_amount=95000.0))

    # 4. Payment Voucher
    v4 = Voucher(
        voucher_number="PMT-0001", voucher_type="Payment", date=start + timedelta(days=11),
        narration="Payment to Raymond Fabrics Co. for fabric processing services",
        reference_no="TX-PAY-882", status="Posted", total_amount=80000.0,
        company_id=company.id, fy_id=fy.id
    )
    db.add(v4)
    db.flush()
    db.add(VoucherEntry(voucher_id=v4.id, ledger_id=ledger_map["Raymond Fabrics Co."], ledger_name="Raymond Fabrics Co.", dr_amount=80000.0, cr_amount=0.0))
    db.add(VoucherEntry(voucher_id=v4.id, ledger_id=ledger_map["HDFC Current Account"], ledger_name="HDFC Current Account", dr_amount=0.0, cr_amount=80000.0))

    # 5. Payment Voucher (Loom wages/charges)
    if "Cash" in ledger_map:
        v5 = Voucher(
            voucher_number="PMT-0002", voucher_type="Payment", date=start + timedelta(days=14),
            narration="Cash payment for loom operators and weaving wages",
            reference_no="CSH-WAGES-09", status="Posted", total_amount=25000.0,
            company_id=company.id, fy_id=fy.id
        )
        db.add(v5)
        db.flush()
        db.add(VoucherEntry(voucher_id=v5.id, ledger_id=ledger_map["Weaving & Loom Charges"], ledger_name="Weaving & Loom Charges", dr_amount=25000.0, cr_amount=0.0))
        db.add(VoucherEntry(voucher_id=v5.id, ledger_id=ledger_map["Cash"], ledger_name="Cash", dr_amount=0.0, cr_amount=25000.0))

    # 6. Contra Voucher
    v6 = Voucher(
        voucher_number="CTR-0001", voucher_type="Contra", date=start + timedelta(days=17),
        narration="Cash withdrawn from ICICI bank for office/factory floor use",
        reference_no="WDL-0012", status="Posted", total_amount=15000.0,
        company_id=company.id, fy_id=fy.id
    )
    db.add(v6)
    db.flush()
    db.add(VoucherEntry(voucher_id=v6.id, ledger_id=ledger_map["Cash"], ledger_name="Cash", dr_amount=15000.0, cr_amount=0.0))
    db.add(VoucherEntry(voucher_id=v6.id, ledger_id=ledger_map["ICICI Savings Account"], ledger_name="ICICI Savings Account", dr_amount=0.0, cr_amount=15000.0))

    # 7. Journal Voucher
    v7 = Voucher(
        voucher_number="JRN-0001", voucher_type="Journal", date=start + timedelta(days=19),
        narration="Adjusting loom-floor cotton scrap wastage loss",
        reference_no="JV-WASTAGE-01", status="Posted", total_amount=8000.0,
        company_id=company.id, fy_id=fy.id
    )
    db.add(v7)
    db.flush()
    db.add(VoucherEntry(voucher_id=v7.id, ledger_id=ledger_map["Cotton Scrap Loss"], ledger_name="Cotton Scrap Loss", dr_amount=8000.0, cr_amount=0.0))
    db.add(VoucherEntry(
        voucher_id=v7.id, ledger_id=ledger_map["Yarn & Fibre Purchase"], ledger_name="Yarn & Fibre Purchase",
        dr_amount=0.0, cr_amount=8000.0,
        stock_item_id=stock_item_map["Cotton Yarn 40s Count"], stock_item_name="Cotton Yarn 40s Count",
        qty=32.0, rate=250.0,
        location_id=location_map["Factory Warehouse"], location_name="Factory Warehouse"
    ))

    db.commit()
    db.refresh(company)
    return {"status": "success", "message": "Textile demo company seeded successfully!"}


@router.get("/")
def list_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).filter(Company.is_active == True).all()
    return [_company_out(c, db) for c in companies]


@router.get("/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(404, "Company not found")
    return _company_out(c, db)


@router.put("/{company_id}")
def update_company(company_id: int, payload: CompanyUpdate, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(404, "Company not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    db.commit()
    return _company_out(c, db)


def _company_out(c: Company, db: Session):
    fy = db.query(FinancialYear).filter(
        FinancialYear.company_id == c.id,
        FinancialYear.is_current == True
    ).first()
    return {
        "id": c.id, "name": c.name, "legal_name": c.legal_name,
        "gstin": c.gstin, "pan": c.pan, "state_code": c.state_code,
        "address": c.address, "city": c.city, "pincode": c.pincode,
        "phone": c.phone, "email": c.email,
        "maintain_inventory": c.maintain_inventory,
        "is_active": c.is_active, "created_at": str(c.created_at),
        "current_fy": {
            "id": fy.id, "label": fy.label,
            "start_date": str(fy.start_date),
            "end_date": str(fy.end_date),
        } if fy else None
    }


@router.post("/{company_id}/seed-vouchers")
def seed_company_vouchers(company_id: int, db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == company_id).first()
    if not c:
        raise HTTPException(404, "Company not found")
        
    fy = db.query(FinancialYear).filter(
        FinancialYear.company_id == company_id,
        FinancialYear.is_current == True
    ).first()
    if not fy:
        fy = FinancialYear(
            company_id=company_id,
            label="FY 2026-27",
            start_date=date(2026, 4, 1),
            end_date=date(2027, 3, 31),
            is_current=True,
        )
        db.add(fy)
        db.flush()

    # We need a ledger map
    ledger_map = {}
    
    # Check what ledgers exist or create them
    ledgers_to_ensure = [
        ("HDFC Current Account", "Bank Accounts", "Dr", 0.0, None),
        ("ICICI Savings Account", "Bank Accounts", "Dr", 0.0, None),
        ("FabIndia Retail Ltd.", "Sundry Debtors", "Dr", 0.0, "27AAFCK1234B1ZC"),
        ("Bombay Dyeing & Mfg.", "Sundry Debtors", "Dr", 0.0, "27AABCB5678P1Z0"),
        ("Sunrise Garments", "Sundry Debtors", "Dr", 0.0, None),
        ("Arvind Mills Ltd.", "Sundry Creditors", "Cr", 0.0, "24AABCA8910F1Z4"),
        ("Raymond Fabrics Co.", "Sundry Creditors", "Cr", 0.0, "27AAFCR5678C1ZD"),
        ("Vardhman Threads", "Sundry Creditors", "Cr", 0.0, None),
        ("Textile Sales", "Sales Accounts", "Cr", 0.0, None),
        ("Yarn & Fibre Purchase", "Purchase Accounts", "Dr", 0.0, None),
        ("CGST Payable", "Duties & Taxes", "Cr", 0.0, None),
        ("SGST Payable", "Duties & Taxes", "Cr", 0.0, None),
        ("IGST Payable", "Duties & Taxes", "Cr", 0.0, None),
        ("CGST Input Credit", "Current Assets", "Dr", 0.0, None),
        ("SGST Input Credit", "Current Assets", "Dr", 0.0, None),
        ("IGST Input Credit", "Current Assets", "Dr", 0.0, None),
        ("Weaving & Loom Charges", "Direct Expenses", "Dr", 0.0, None),
        ("Dyeing & Printing Charges", "Direct Expenses", "Dr", 0.0, None),
        ("Power & Fuel Expense", "Direct Expenses", "Dr", 0.0, None),
        ("Salary Expense", "Indirect Expenses", "Dr", 0.0, None),
        ("Rent Expense", "Indirect Expenses", "Dr", 0.0, None),
        ("Cotton Scrap Loss", "Indirect Expenses", "Dr", 0.0, None),
    ]

    for name, group, bt, bal, gstin in ledgers_to_ensure:
        ledger = db.query(Ledger).filter(Ledger.company_id == company_id, Ledger.name == name).first()
        if not ledger:
            ledger = Ledger(
                name=name, group=group, balance_type=bt,
                opening_balance=bal, gstin=gstin, state_code="27" if gstin else None,
                company_id=company_id
            )
            db.add(ledger)
            db.flush()
        ledger_map[name] = ledger.id

    cash_ledger = db.query(Ledger).filter(Ledger.company_id == company_id, Ledger.name == "Cash").first()
    if not cash_ledger:
        cash_ledger = Ledger(
            name="Cash", group="Cash-in-Hand", balance_type="Dr",
            opening_balance=0.0, company_id=company_id
        )
        db.add(cash_ledger)
        db.flush()
    ledger_map["Cash"] = cash_ledger.id

    # Create/ensure locations / godowns
    from app.models.inventory import Location
    locs_to_ensure = [
        "Main Godown",
        "Factory Warehouse",
        "Spinning Unit Godown"
    ]
    location_map = {}
    for name in locs_to_ensure:
        loc = db.query(Location).filter(Location.company_id == company_id, Location.name == name).first()
        if not loc:
            loc = Location(name=name, company_id=company_id)
            db.add(loc)
            db.flush()
        location_map[name] = loc.id

    # Stock Items
    from app.models.stock_item import StockItem
    stock_items_to_ensure = [
        ("Cotton Yarn 40s Count", "Kgs", "5205", 5.0, 240.0, 310.0),
        ("Indigo Denim Fabric 12oz", "Mtrs", "5209", 5.0, 150.0, 210.0),
        ("Premium Silk Weave", "Mtrs", "5007", 12.0, 850.0, 1200.0),
        ("Polyester Sewing Thread", "Cones", "5401", 12.0, 45.0, 65.0),
    ]
    stock_item_map = {}
    for name, unit, hsn, gst_r, pr, sr in stock_items_to_ensure:
        item = db.query(StockItem).filter(StockItem.company_id == company_id, StockItem.name == name).first()
        if not item:
            item = StockItem(
                name=name, unit=unit, hsn_code=hsn, gst_rate=gst_r,
                purchase_rate=pr, selling_rate=sr, company_id=company_id,
                opening_qty=100.0, opening_rate=pr
            )
            db.add(item)
            db.flush()
        stock_item_map[name] = item.id

    # Vouchers
    from app.models.voucher import Voucher, VoucherEntry
    from app.routers.vouchers import _next_number
    start = fy.start_date
    
    # 1. Sales Voucher (Interstate sale with IGST)
    v1 = Voucher(
        voucher_number=_next_number(db, "Sales", company_id), voucher_type="Sales", date=start + timedelta(days=1),
        narration="Sales of Premium Silk Fabric to FabIndia Retail - Invoice #ST/001",
        reference_no="ST/001", status="Posted", total_amount=224000.0,
        company_id=company_id, fy_id=fy.id
    )
    db.add(v1)
    db.flush()
    db.add(VoucherEntry(voucher_id=v1.id, ledger_id=ledger_map["FabIndia Retail Ltd."], ledger_name="FabIndia Retail Ltd.", dr_amount=224000.0, cr_amount=0.0))
    db.add(VoucherEntry(
        voucher_id=v1.id, ledger_id=ledger_map["Textile Sales"], ledger_name="Textile Sales",
        dr_amount=0.0, cr_amount=200000.0,
        stock_item_id=stock_item_map["Premium Silk Weave"], stock_item_name="Premium Silk Weave",
        qty=200.0, rate=1000.0,
        location_id=location_map["Main Godown"], location_name="Main Godown"
    ))
    db.add(VoucherEntry(voucher_id=v1.id, ledger_id=ledger_map["IGST Payable"], ledger_name="IGST Payable", dr_amount=0.0, cr_amount=24000.0, gst_type="IGST", is_gst_entry=True))

    # 2. Purchase Voucher (Intrastate purchase with CGST/SGST Input Credit)
    v2 = Voucher(
        voucher_number=_next_number(db, "Purchase", company_id), voucher_type="Purchase", date=start + timedelta(days=4),
        narration="Purchase of Cotton Yarn from Arvind Mills - Bill #AM-9912",
        reference_no="AM-9912", status="Posted", total_amount=105000.0,
        company_id=company_id, fy_id=fy.id
    )
    db.add(v2)
    db.flush()
    db.add(VoucherEntry(
        voucher_id=v2.id, ledger_id=ledger_map["Yarn & Fibre Purchase"], ledger_name="Yarn & Fibre Purchase",
        dr_amount=100000.0, cr_amount=0.0,
        stock_item_id=stock_item_map["Cotton Yarn 40s Count"], stock_item_name="Cotton Yarn 40s Count",
        qty=400.0, rate=250.0,
        location_id=location_map["Factory Warehouse"], location_name="Factory Warehouse"
    ))
    db.add(VoucherEntry(voucher_id=v2.id, ledger_id=ledger_map["CGST Input Credit"], ledger_name="CGST Input Credit", dr_amount=2500.0, cr_amount=0.0, gst_type="CGST", is_gst_entry=True))
    db.add(VoucherEntry(voucher_id=v2.id, ledger_id=ledger_map["SGST Input Credit"], ledger_name="SGST Input Credit", dr_amount=2500.0, cr_amount=0.0, gst_type="SGST", is_gst_entry=True))
    db.add(VoucherEntry(voucher_id=v2.id, ledger_id=ledger_map["Arvind Mills Ltd."], ledger_name="Arvind Mills Ltd.", dr_amount=0.0, cr_amount=105000.0))

    # 3. Receipt Voucher
    v3 = Voucher(
        voucher_number=_next_number(db, "Receipt", company_id), voucher_type="Receipt", date=start + timedelta(days=7),
        narration="Receipt from Bombay Dyeing & Mfg. against outstanding bill - UTR HDFCR52025",
        reference_no="UTR-HDFCR520", status="Posted", total_amount=95000.0,
        company_id=company_id, fy_id=fy.id
    )
    db.add(v3)
    db.flush()
    db.add(VoucherEntry(voucher_id=v3.id, ledger_id=ledger_map["HDFC Current Account"], ledger_name="HDFC Current Account", dr_amount=95000.0, cr_amount=0.0))
    db.add(VoucherEntry(voucher_id=v3.id, ledger_id=ledger_map["Bombay Dyeing & Mfg."], ledger_name="Bombay Dyeing & Mfg.", dr_amount=0.0, cr_amount=95000.0))

    # 4. Payment Voucher
    v4 = Voucher(
        voucher_number=_next_number(db, "Payment", company_id), voucher_type="Payment", date=start + timedelta(days=11),
        narration="Payment to Raymond Fabrics Co. for fabric processing services",
        reference_no="TX-PAY-882", status="Posted", total_amount=80000.0,
        company_id=company_id, fy_id=fy.id
    )
    db.add(v4)
    db.flush()
    db.add(VoucherEntry(voucher_id=v4.id, ledger_id=ledger_map["Raymond Fabrics Co."], ledger_name="Raymond Fabrics Co.", dr_amount=80000.0, cr_amount=0.0))
    db.add(VoucherEntry(voucher_id=v4.id, ledger_id=ledger_map["HDFC Current Account"], ledger_name="HDFC Current Account", dr_amount=0.0, cr_amount=80000.0))

    # 5. Payment Voucher (Loom wages/charges)
    if "Cash" in ledger_map:
        v5 = Voucher(
            voucher_number=_next_number(db, "Payment", company_id), voucher_type="Payment", date=start + timedelta(days=14),
            narration="Cash payment for loom operators and weaving wages",
            reference_no="CSH-WAGES-09", status="Posted", total_amount=25000.0,
            company_id=company_id, fy_id=fy.id
        )
        db.add(v5)
        db.flush()
        db.add(VoucherEntry(voucher_id=v5.id, ledger_id=ledger_map["Weaving & Loom Charges"], ledger_name="Weaving & Loom Charges", dr_amount=25000.0, cr_amount=0.0))
        db.add(VoucherEntry(voucher_id=v5.id, ledger_id=ledger_map["Cash"], ledger_name="Cash", dr_amount=0.0, cr_amount=25000.0))

    # 6. Contra Voucher
    v6 = Voucher(
        voucher_number=_next_number(db, "Contra", company_id), voucher_type="Contra", date=start + timedelta(days=17),
        narration="Cash withdrawn from ICICI bank for office/factory floor use",
        reference_no="WDL-0012", status="Posted", total_amount=15000.0,
        company_id=company_id, fy_id=fy.id
    )
    db.add(v6)
    db.flush()
    db.add(VoucherEntry(voucher_id=v6.id, ledger_id=ledger_map["Cash"], ledger_name="Cash", dr_amount=15000.0, cr_amount=0.0))
    db.add(VoucherEntry(voucher_id=v6.id, ledger_id=ledger_map["ICICI Savings Account"], ledger_name="ICICI Savings Account", dr_amount=0.0, cr_amount=15000.0))

    # 7. Journal Voucher
    v7 = Voucher(
        voucher_number=_next_number(db, "Journal", company_id), voucher_type="Journal", date=start + timedelta(days=19),
        narration="Adjusting loom-floor cotton scrap wastage loss",
        reference_no="JV-WASTAGE-01", status="Posted", total_amount=8000.0,
        company_id=company_id, fy_id=fy.id
    )
    db.add(v7)
    db.flush()
    db.add(VoucherEntry(voucher_id=v7.id, ledger_id=ledger_map["Cotton Scrap Loss"], ledger_name="Cotton Scrap Loss", dr_amount=8000.0, cr_amount=0.0))
    db.add(VoucherEntry(
        voucher_id=v7.id, ledger_id=ledger_map["Yarn & Fibre Purchase"], ledger_name="Yarn & Fibre Purchase",
        dr_amount=0.0, cr_amount=8000.0,
        stock_item_id=stock_item_map["Cotton Yarn 40s Count"], stock_item_name="Cotton Yarn 40s Count",
        qty=32.0, rate=250.0,
        location_id=location_map["Factory Warehouse"], location_name="Factory Warehouse"
    ))

    db.commit()
    return {"status": "success", "message": "Textile vouchers seeded to active company successfully!"}
