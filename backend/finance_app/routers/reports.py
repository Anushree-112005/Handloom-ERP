from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from collections import defaultdict
from finance_app.database import get_db
from finance_app.models.voucher import Voucher, VoucherEntry
from finance_app.models.ledger import Ledger
from finance_app.models.ledger_group import LedgerGroup

router = APIRouter()

# ── CASH & BANK GROUP NAMES ──────────────────────────────────────────────────
CASH_GROUPS  = ["Cash-in-Hand"]
BANK_GROUPS  = ["Bank Accounts", "Bank OD Accounts"]

INCOME_GROUPS  = ["Sales Accounts", "Direct Incomes", "Indirect Incomes", "Income"]
EXPENSE_GROUPS = ["Purchase Accounts", "Direct Expenses", "Indirect Expenses", "Expenses"]
ASSET_GROUPS   = [
    "Fixed Assets", "Investments", "Current Assets", "Bank Accounts",
    "Cash-in-Hand", "Sundry Debtors", "Stock-in-Hand",
    "Loans & Advances (Asset)", "Deposits (Asset)", "Miscellaneous Expenses",
]
LIABILITY_GROUPS = [
    "Capital Account", "Reserves & Surplus", "Loans (Liability)",
    "Bank OD Accounts", "Current Liabilities", "Sundry Creditors",
    "Duties & Taxes", "Provisions", "Suspense Account",
]


def _ledger_net(ledger: Ledger, entries) -> tuple[float, str]:
    """Return (net_amount, Dr/Cr) for a ledger given its transaction entries."""
    dr = (ledger.opening_balance if ledger.balance_type == "Dr" else 0) + sum(e.dr_amount for e in entries)
    cr = (ledger.opening_balance if ledger.balance_type == "Cr" else 0) + sum(e.cr_amount for e in entries)
    net = dr - cr
    return abs(net), ("Dr" if net >= 0 else "Cr")


# ── DAY BOOK ─────────────────────────────────────────────────────────────────
@router.get("/day-book")
def day_book(
    company_id:   int,
    from_date:    date,
    to_date:      date,
    voucher_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Voucher).filter(
        Voucher.company_id == company_id,
        Voucher.date >= from_date,
        Voucher.date <= to_date,
        Voucher.status == "Posted",
    )
    if voucher_type:
        q = q.filter(Voucher.voucher_type == voucher_type)
    vouchers = q.order_by(Voucher.date, Voucher.voucher_number).all()

    result = []
    grand_dr = grand_cr = 0.0
    for v in vouchers:
        dr = sum(e.dr_amount for e in v.entries)
        cr = sum(e.cr_amount for e in v.entries)
        grand_dr += dr
        grand_cr += cr
        result.append({
            "id": v.id, "date": str(v.date),
            "voucher_number": v.voucher_number,
            "voucher_type": v.voucher_type,
            "narration": v.narration,
            "reference_no": v.reference_no,
            "total_dr": round(dr, 2),
            "total_cr": round(cr, 2),
            "entries": [
                {"ledger_name": e.ledger_name, "dr_amount": e.dr_amount, "cr_amount": e.cr_amount}
                for e in v.entries
            ],
        })
    return {
        "from_date": str(from_date), "to_date": str(to_date),
        "vouchers": result,
        "grand_total_dr": round(grand_dr, 2),
        "grand_total_cr": round(grand_cr, 2),
    }


# ── LEDGER STATEMENT ─────────────────────────────────────────────────────────
@router.get("/ledger-statement")
def ledger_statement(
    company_id: int,
    ledger_id:  int,
    from_date:  date,
    to_date:    date,
    db: Session = Depends(get_db),
):
    ledger = db.query(Ledger).filter(Ledger.id == ledger_id, Ledger.company_id == company_id).first()
    if not ledger:
        return {"error": "Ledger not found"}

    # Opening balance = OB + all transactions before from_date
    pre_entries = (
        db.query(VoucherEntry).filter(VoucherEntry.ledger_id == ledger_id)
        .join(Voucher).filter(Voucher.status == "Posted", Voucher.date < from_date).all()
    )
    ob_dr = (ledger.opening_balance if ledger.balance_type == "Dr" else 0) + sum(e.dr_amount for e in pre_entries)
    ob_cr = (ledger.opening_balance if ledger.balance_type == "Cr" else 0) + sum(e.cr_amount for e in pre_entries)
    opening_net = ob_dr - ob_cr
    opening_type = "Dr" if opening_net >= 0 else "Cr"

    # Period entries
    period_entries = (
        db.query(VoucherEntry).filter(VoucherEntry.ledger_id == ledger_id)
        .join(Voucher).filter(
            Voucher.status == "Posted",
            Voucher.date >= from_date,
            Voucher.date <= to_date,
        ).all()
    )

    running = opening_net
    rows = []
    for e in period_entries:
        v = e.voucher
        running += e.dr_amount - e.cr_amount
        rows.append({
            "date": str(v.date),
            "voucher_number": v.voucher_number,
            "voucher_type": v.voucher_type,
            "narration": v.narration or "",
            "dr_amount": round(e.dr_amount, 2),
            "cr_amount": round(e.cr_amount, 2),
            "balance": round(abs(running), 2),
            "balance_type": "Dr" if running >= 0 else "Cr",
        })

    period_dr = sum(e.dr_amount for e in period_entries)
    period_cr = sum(e.cr_amount for e in period_entries)
    closing_net = opening_net + period_dr - period_cr

    return {
        "ledger_id": ledger_id,
        "ledger_name": ledger.name,
        "group": ledger.group,
        "from_date": str(from_date),
        "to_date": str(to_date),
        "opening_balance": round(abs(opening_net), 2),
        "opening_type": opening_type,
        "transactions": rows,
        "period_dr": round(period_dr, 2),
        "period_cr": round(period_cr, 2),
        "closing_balance": round(abs(closing_net), 2),
        "closing_type": "Dr" if closing_net >= 0 else "Cr",
    }


# ── GROUP SUMMARY ─────────────────────────────────────────────────────────────
@router.get("/group-summary")
def group_summary(company_id: int, as_of: date, db: Session = Depends(get_db)):
    groups = db.query(LedgerGroup).filter(LedgerGroup.company_id == company_id).all()
    result = []
    for g in groups:
        ledgers = db.query(Ledger).filter(
            Ledger.group_id == g.id, Ledger.company_id == company_id, Ledger.is_active == True
        ).all()
        total_dr = total_cr = 0.0
        for l in ledgers:
            entries = (
                db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
                .join(Voucher).filter(Voucher.status == "Posted", Voucher.date <= as_of).all()
            )
            dr = (l.opening_balance if l.balance_type == "Dr" else 0) + sum(e.dr_amount for e in entries)
            cr = (l.opening_balance if l.balance_type == "Cr" else 0) + sum(e.cr_amount for e in entries)
            total_dr += dr
            total_cr += cr
        net = total_dr - total_cr
        result.append({
            "group_id": g.id,
            "group_name": g.name,
            "nature": g.nature,
            "parent": g.parent_group,
            "balance": round(abs(net), 2),
            "balance_type": "Dr" if net >= 0 else "Cr",
        })
    return result


# ── TRIAL BALANCE ────────────────────────────────────────────────────────────
@router.get("/trial-balance")
def trial_balance(company_id: int, as_of: date, db: Session = Depends(get_db)):
    ledgers = db.query(Ledger).filter(
        Ledger.company_id == company_id, Ledger.is_active == True
    ).all()

    rows = []
    total_dr = total_cr = 0.0
    for l in ledgers:
        entries = (
            db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
            .join(Voucher).filter(Voucher.status == "Posted", Voucher.date <= as_of).all()
        )
        ob_dr = l.opening_balance if l.balance_type == "Dr" else 0
        ob_cr = l.opening_balance if l.balance_type == "Cr" else 0
        per_dr = sum(e.dr_amount for e in entries)
        per_cr = sum(e.cr_amount for e in entries)
        dr = ob_dr + per_dr
        cr = ob_cr + per_cr
        net = dr - cr
        bt = "Dr" if net >= 0 else "Cr"
        if abs(net) < 0.001:
            continue
        rows.append({
            "ledger": l.name, "group": l.group,
            "opening_dr": round(ob_dr, 2), "opening_cr": round(ob_cr, 2),
            "period_dr": round(per_dr, 2), "period_cr": round(per_cr, 2),
            "closing": round(abs(net), 2), "closing_type": bt,
        })
        if net >= 0:
            total_dr += abs(net)
        else:
            total_cr += abs(net)

    diff = total_dr - total_cr
    is_bal = abs(diff) < 1.0
    
    if not is_bal:
        bt = "Dr" if diff < 0 else "Cr"
        amt = abs(diff)
        rows.append({
            "ledger": "Difference", 
            "group": "Difference in Opening Balances",
            "opening_dr": 0, "opening_cr": 0,
            "period_dr": 0, "period_cr": 0,
            "closing": round(amt, 2), "closing_type": bt,
        })
        if bt == "Dr":
            total_dr += amt
        else:
            total_cr += amt

    return {
        "as_of": str(as_of), "rows": rows,
        "total_dr": round(total_dr, 2),
        "total_cr": round(total_cr, 2),
        "is_balanced": is_bal,
    }


# ── PROFIT & LOSS ─────────────────────────────────────────────────────────────
@router.get("/profit-loss")
def profit_loss(company_id: int, from_date: date, to_date: date, db: Session = Depends(get_db)):
    def _group_data(group_names):
        rows = []
        total = 0.0
        grouped = defaultdict(list)
        ledger_list = db.query(Ledger).filter(
            Ledger.company_id == company_id, Ledger.group.in_(group_names)
        ).all()
        for l in ledger_list:
            entries = (
                db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
                .join(Voucher).filter(
                    Voucher.status == "Posted",
                    Voucher.date >= from_date,
                    Voucher.date <= to_date,
                ).all()
            )
            dr = sum(e.dr_amount for e in entries)
            cr = sum(e.cr_amount for e in entries)
            amt = cr - dr
            if abs(amt) > 0.001:
                item = {"ledger": l.name, "group": l.group, "amount": round(abs(amt), 2)}
                rows.append(item)
                grouped[l.group].append(item)
                total += amt
        return rows, grouped, round(total, 2)

    income_rows, income_grouped, total_income   = _group_data(INCOME_GROUPS)
    expense_rows, expense_grouped, total_expenses = _group_data(EXPENSE_GROUPS)
    net_profit = total_income + total_expenses

    return {
        "from_date": str(from_date), "to_date": str(to_date),
        "income":   {"rows": income_rows,  "groups": dict(income_grouped),  "total": round(total_income, 2)},
        "expenses": {"rows": expense_rows, "groups": dict(expense_grouped), "total": round(abs(total_expenses), 2)},
        "net_profit": round(net_profit, 2),
        "is_profit": net_profit >= 0,
    }


# ── BALANCE SHEET ────────────────────────────────────────────────────────────
@router.get("/balance-sheet")
def balance_sheet(company_id: int, as_of: date, db: Session = Depends(get_db)):
    def _compute(group_names):
        grouped = defaultdict(list)
        total = 0.0
        ledger_list = db.query(Ledger).filter(
            Ledger.company_id == company_id, Ledger.group.in_(group_names)
        ).all()
        for l in ledger_list:
            entries = (
                db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
                .join(Voucher).filter(Voucher.status == "Posted", Voucher.date <= as_of).all()
            )
            dr = (l.opening_balance if l.balance_type == "Dr" else 0) + sum(e.dr_amount for e in entries)
            cr = (l.opening_balance if l.balance_type == "Cr" else 0) + sum(e.cr_amount for e in entries)
            net = abs(dr - cr)
            if net > 0.001:
                grouped[l.group].append({"ledger": l.name, "amount": round(net, 2)})
                total += net
        return dict(grouped), round(total, 2)

    asset_groups, total_assets = _compute(ASSET_GROUPS)
    liab_groups,  total_liab   = _compute(LIABILITY_GROUPS)

    # Calculate Net Profit & Difference in Opening Balances
    income_ledgers = db.query(Ledger).filter(Ledger.company_id == company_id, Ledger.group.in_(INCOME_GROUPS)).all()
    expense_ledgers = db.query(Ledger).filter(Ledger.company_id == company_id, Ledger.group.in_(EXPENSE_GROUPS)).all()
    
    net_profit = 0.0
    for l in income_ledgers + expense_ledgers:
        entries = (
            db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
            .join(Voucher).filter(Voucher.status == "Posted", Voucher.date <= as_of).all()
        )
        dr = (l.opening_balance if l.balance_type == "Dr" else 0) + sum(e.dr_amount for e in entries)
        cr = (l.opening_balance if l.balance_type == "Cr" else 0) + sum(e.cr_amount for e in entries)
        if l.group in INCOME_GROUPS:
            net_profit += (cr - dr)
        else:
            net_profit -= (dr - cr)

    diff_ob_cr = (total_assets - total_liab) - net_profit

    if abs(net_profit) > 0.001:
        if net_profit > 0:
            liab_groups["Profit & Loss A/c"] = [{"ledger": "Profit for the period", "amount": round(net_profit, 2)}]
            total_liab += net_profit
        else:
            asset_groups["Profit & Loss A/c"] = [{"ledger": "Loss for the period", "amount": round(abs(net_profit), 2)}]
            total_assets += abs(net_profit)
            
    if abs(diff_ob_cr) > 0.001:
        if diff_ob_cr > 0:
            liab_groups["Difference in Opening Balances"] = [{"ledger": "Difference", "amount": round(diff_ob_cr, 2)}]
            total_liab += diff_ob_cr
        else:
            asset_groups["Difference in Opening Balances"] = [{"ledger": "Difference", "amount": round(abs(diff_ob_cr), 2)}]
            total_assets += abs(diff_ob_cr)

    return {
        "as_of": str(as_of),
        "assets":      {"groups": asset_groups, "total": round(total_assets, 2)},
        "liabilities": {"groups": liab_groups,  "total": round(total_liab, 2)},
        "is_balanced": abs(total_assets - total_liab) < 1.0,
    }


# ── CASH BOOK ─────────────────────────────────────────────────────────────────
@router.get("/cash-book")
def cash_book(company_id: int, from_date: date, to_date: date, db: Session = Depends(get_db)):
    cash_ledgers = db.query(Ledger).filter(
        Ledger.company_id == company_id, Ledger.group.in_(CASH_GROUPS)
    ).all()
    cash_ids = {l.id for l in cash_ledgers}

    vouchers = (
        db.query(Voucher).filter(
            Voucher.company_id == company_id,
            Voucher.date >= from_date,
            Voucher.date <= to_date,
            Voucher.status == "Posted",
        ).order_by(Voucher.date, Voucher.id).all()
    )

    rows = []
    total_receipts = total_payments = 0.0
    for v in vouchers:
        for e in v.entries:
            if e.ledger_id in cash_ids:
                rows.append({
                    "date": str(v.date),
                    "voucher_number": v.voucher_number,
                    "voucher_type": v.voucher_type,
                    "narration": v.narration or "",
                    "receipts": round(e.dr_amount, 2),
                    "payments": round(e.cr_amount, 2),
                    "ledger_name": e.ledger_name,
                })
                total_receipts  += e.dr_amount
                total_payments  += e.cr_amount

    # Opening balance
    ob_total = 0.0
    for l in cash_ledgers:
        pre = (
            db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
            .join(Voucher).filter(Voucher.status == "Posted", Voucher.date < from_date).all()
        )
        ob = (l.opening_balance if l.balance_type == "Dr" else -l.opening_balance)
        ob_total += ob + sum(e.dr_amount - e.cr_amount for e in pre)

    closing = ob_total + total_receipts - total_payments
    return {
        "from_date": str(from_date), "to_date": str(to_date),
        "opening_balance": round(ob_total, 2),
        "transactions": rows,
        "total_receipts": round(total_receipts, 2),
        "total_payments": round(total_payments, 2),
        "closing_balance": round(closing, 2),
    }


# ── BANK BOOK ─────────────────────────────────────────────────────────────────
@router.get("/bank-book")
def bank_book(
    company_id: int,
    from_date:  date,
    to_date:    date,
    ledger_id:  Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Ledger).filter(Ledger.company_id == company_id, Ledger.group.in_(BANK_GROUPS))
    if ledger_id:
        q = q.filter(Ledger.id == ledger_id)
    bank_ledgers = q.all()
    bank_ids = {l.id: l for l in bank_ledgers}

    if not bank_ids:
        return {"error": "No bank ledgers found", "transactions": [], "banks": []}

    vouchers = (
        db.query(Voucher).filter(
            Voucher.company_id == company_id,
            Voucher.date >= from_date,
            Voucher.date <= to_date,
            Voucher.status == "Posted",
        ).order_by(Voucher.date, Voucher.id).all()
    )

    rows = []
    total_deposits = total_withdrawals = 0.0
    for v in vouchers:
        for e in v.entries:
            if e.ledger_id in bank_ids:
                rows.append({
                    "date": str(v.date),
                    "voucher_number": v.voucher_number,
                    "voucher_type": v.voucher_type,
                    "reference_no": v.reference_no or "",
                    "narration": v.narration or "",
                    "bank_name": bank_ids[e.ledger_id].name,
                    "deposits": round(e.dr_amount, 2),
                    "withdrawals": round(e.cr_amount, 2),
                })
                total_deposits    += e.dr_amount
                total_withdrawals += e.cr_amount

    return {
        "from_date": str(from_date), "to_date": str(to_date),
        "banks": [{"id": l.id, "name": l.name} for l in bank_ledgers],
        "transactions": rows,
        "total_deposits": round(total_deposits, 2),
        "total_withdrawals": round(total_withdrawals, 2),
    }


# ── OUTSTANDING RECEIVABLES / PAYABLES ───────────────────────────────────────
@router.get("/outstanding")
def outstanding(
    company_id: int,
    as_of:      date,
    party_type: Optional[str] = None,   # "debtor" | "creditor"
    db: Session = Depends(get_db),
):
    DEBTOR_GROUPS   = ["Sundry Debtors"]
    CREDITOR_GROUPS = ["Sundry Creditors"]

    if party_type == "creditor":
        target_groups = CREDITOR_GROUPS
    elif party_type == "debtor":
        target_groups = DEBTOR_GROUPS
    else:
        target_groups = DEBTOR_GROUPS + CREDITOR_GROUPS

    ledger_list = db.query(Ledger).filter(
        Ledger.company_id == company_id, Ledger.group.in_(target_groups)
    ).all()

    rows = []
    for l in ledger_list:
        entries = (
            db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
            .join(Voucher).filter(Voucher.status == "Posted", Voucher.date <= as_of).all()
        )
        net, bt = _ledger_net(l, entries)
        if net > 0.001:
            rows.append({
                "ledger_id": l.id,
                "ledger_name": l.name,
                "group": l.group,
                "party_type": "Debtor" if l.group in DEBTOR_GROUPS else "Creditor",
                "outstanding": round(net, 2),
                "balance_type": bt,
            })

    total_receivable = sum(float(r["outstanding"]) for r in rows if r["party_type"] == "Debtor")
    total_payable    = sum(float(r["outstanding"]) for r in rows if r["party_type"] == "Creditor")


    return {
        "as_of": str(as_of),
        "rows": rows,
        "total_receivable": round(total_receivable, 2),
        "total_payable": round(total_payable, 2),
    }


# ── SALES REGISTER ────────────────────────────────────────────────────────────
@router.get("/sales-register")
def sales_register(company_id: int, from_date: date, to_date: date, db: Session = Depends(get_db)):
    vouchers = (
        db.query(Voucher).filter(
            Voucher.company_id == company_id,
            Voucher.voucher_type == "Sales",
            Voucher.date >= from_date,
            Voucher.date <= to_date,
            Voucher.status == "Posted",
        ).order_by(Voucher.date, Voucher.voucher_number).all()
    )
    rows = []
    total = 0.0
    for v in vouchers:
        sales_amt = sum(e.cr_amount for e in v.entries if e.cr_amount > 0 and not e.is_gst_entry)
        gst_amt   = sum(e.cr_amount for e in v.entries if e.is_gst_entry)
        party     = next((e.ledger_name for e in v.entries if e.dr_amount > 0), "—")
        rows.append({
            "date": str(v.date),
            "voucher_number": v.voucher_number,
            "party": party,
            "reference_no": v.reference_no or "",
            "sales_amount": round(sales_amt, 2),
            "gst_amount":   round(gst_amt, 2),
            "total": round(v.total_amount, 2),
            "narration": v.narration or "",
        })
        total += v.total_amount
    return {"from_date": str(from_date), "to_date": str(to_date), "rows": rows, "grand_total": round(total, 2)}


# ── PURCHASE REGISTER ─────────────────────────────────────────────────────────
@router.get("/purchase-register")
def purchase_register(company_id: int, from_date: date, to_date: date, db: Session = Depends(get_db)):
    vouchers = (
        db.query(Voucher).filter(
            Voucher.company_id == company_id,
            Voucher.voucher_type == "Purchase",
            Voucher.date >= from_date,
            Voucher.date <= to_date,
            Voucher.status == "Posted",
        ).order_by(Voucher.date, Voucher.voucher_number).all()
    )
    rows = []
    total = 0.0
    for v in vouchers:
        purch_amt = sum(e.dr_amount for e in v.entries if e.dr_amount > 0 and not e.is_gst_entry)
        gst_amt   = sum(e.dr_amount for e in v.entries if e.is_gst_entry)
        party     = next((e.ledger_name for e in v.entries if e.cr_amount > 0), "—")
        rows.append({
            "date": str(v.date),
            "voucher_number": v.voucher_number,
            "party": party,
            "reference_no": v.reference_no or "",
            "purchase_amount": round(purch_amt, 2),
            "gst_amount":      round(gst_amt, 2),
            "total": round(v.total_amount, 2),
            "narration": v.narration or "",
        })
        total += v.total_amount
    return {"from_date": str(from_date), "to_date": str(to_date), "rows": rows, "grand_total": round(total, 2)}


# ── GST SUMMARY ───────────────────────────────────────────────────────────────
@router.get("/gst-summary")
def gst_summary(company_id: int, from_date: date, to_date: date, db: Session = Depends(get_db)):
    gst_entries = (
        db.query(VoucherEntry).filter(VoucherEntry.is_gst_entry == True)
        .join(Voucher).filter(
            Voucher.company_id == company_id,
            Voucher.status == "Posted",
            Voucher.date >= from_date,
            Voucher.date <= to_date,
        ).all()
    )

    output_tax = input_tax = 0.0
    cgst_out = sgst_out = igst_out = 0.0
    cgst_in  = sgst_in  = igst_in  = 0.0

    for e in gst_entries:
        if e.voucher.voucher_type in ("Sales",):
            output_tax += e.cr_amount
            if e.gst_type == "CGST": cgst_out += e.cr_amount
            elif e.gst_type == "SGST": sgst_out += e.cr_amount
            elif e.gst_type == "IGST": igst_out += e.cr_amount
        elif e.voucher.voucher_type in ("Purchase",):
            input_tax += e.dr_amount
            if e.gst_type == "CGST": cgst_in += e.dr_amount
            elif e.gst_type == "SGST": sgst_in += e.dr_amount
            elif e.gst_type == "IGST": igst_in += e.dr_amount

    net_gst = output_tax - input_tax
    return {
        "from_date": str(from_date), "to_date": str(to_date),
        "output_tax": round(output_tax, 2),
        "input_tax":  round(input_tax, 2),
        "net_payable": round(net_gst, 2),
        "breakdown": {
            "output": {"cgst": round(cgst_out, 2), "sgst": round(sgst_out, 2), "igst": round(igst_out, 2)},
            "input":  {"cgst": round(cgst_in, 2),  "sgst": round(sgst_in, 2),  "igst": round(igst_in, 2)},
        },
    }


# ── LEDGER SUMMARY (quick lookup) ────────────────────────────────────────────
@router.get("/ledger-summary")
def ledger_summary(company_id: int, as_of: date, db: Session = Depends(get_db)):
    ledger_list = db.query(Ledger).filter(
        Ledger.company_id == company_id, Ledger.is_active == True
    ).order_by(Ledger.group, Ledger.name).all()
    rows = []
    for l in ledger_list:
        entries = (
            db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
            .join(Voucher).filter(Voucher.status == "Posted", Voucher.date <= as_of).all()
        )
        net, bt = _ledger_net(l, entries)
        rows.append({"id": l.id, "name": l.name, "group": l.group, "closing_balance": round(net, 2), "balance_type": bt})
    return rows


# ── RATIO ANALYSIS ────────────────────────────────────────────────────────────
@router.get("/ratio-analysis")
def ratio_analysis(company_id: int, as_of: date, from_date: date, to_date: date, db: Session = Depends(get_db)):
    def _sum_groups(groups, mode="net"):
        total = 0.0
        for l in db.query(Ledger).filter(Ledger.company_id == company_id, Ledger.group.in_(groups)).all():
            entries = (
                db.query(VoucherEntry).filter(VoucherEntry.ledger_id == l.id)
                .join(Voucher).filter(Voucher.status == "Posted", Voucher.date <= as_of).all()
            )
            dr = (l.opening_balance if l.balance_type == "Dr" else 0) + sum(e.dr_amount for e in entries)
            cr = (l.opening_balance if l.balance_type == "Cr" else 0) + sum(e.cr_amount for e in entries)
            total += abs(dr - cr)
        return total

    current_assets = _sum_groups(["Current Assets", "Bank Accounts", "Cash-in-Hand", "Sundry Debtors"])
    current_liab   = _sum_groups(["Current Liabilities", "Sundry Creditors"])
    total_assets   = _sum_groups(ASSET_GROUPS)

    # P&L for gross/net profit
    pl = profit_loss(company_id, from_date, to_date, db)
    gross_profit = pl["net_profit"]
    revenue = pl["income"]["total"]

    current_ratio   = round(current_assets / current_liab, 2) if current_liab else 0
    gross_profit_r  = round((gross_profit / revenue * 100), 2) if revenue else 0
    net_profit_r    = round((pl["net_profit"] / revenue * 100), 2) if revenue else 0
    working_capital = round(current_assets - current_liab, 2)

    return {
        "current_ratio":        current_ratio,
        "gross_profit_ratio":   gross_profit_r,
        "net_profit_ratio":     net_profit_r,
        "working_capital":      working_capital,
        "current_assets":       round(current_assets, 2),
        "current_liabilities":  round(current_liab, 2),
        "total_assets":         round(total_assets, 2),
        "revenue":              round(revenue, 2),
        "net_profit":           round(pl["net_profit"], 2),
    }


# ── STOCK MOVEMENT ───────────────────────────────────────────────────────────
@router.get("/stock-movement")
def stock_movement(
    company_id: int,
    from_date: date,
    to_date: date,
    stock_item_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    from finance_app.models.stock_item import StockItem
    from finance_app.models.inventory import Location

    if stock_item_id is not None:
        # Detailed ledger for a single item
        item = db.query(StockItem).filter(StockItem.id == stock_item_id, StockItem.company_id == company_id).first()
        if not item:
            return {"error": "Stock item not found"}

        # Calculate opening qty (opening_qty + net movement before from_date)
        pre_entries = (
            db.query(VoucherEntry)
            .filter(VoucherEntry.stock_item_id == stock_item_id)
            .join(Voucher)
            .filter(Voucher.company_id == company_id, Voucher.status == "Posted", Voucher.date < from_date)
            .all()
        )
        opening_qty = item.opening_qty or 0.0
        for e in pre_entries:
            qty = e.qty or 0.0
            if e.dr_amount > 0:
                opening_qty += qty
            elif e.cr_amount > 0:
                opening_qty -= qty

        # Fetch period entries
        period_entries = (
            db.query(VoucherEntry)
            .filter(VoucherEntry.stock_item_id == stock_item_id)
            .join(Voucher)
            .filter(
                Voucher.company_id == company_id,
                Voucher.status == "Posted",
                Voucher.date >= from_date,
                Voucher.date <= to_date,
            )
            .order_by(Voucher.date, Voucher.id)
            .all()
        )

        rows = []
        running_qty = opening_qty
        for e in period_entries:
            v = e.voucher
            in_qty = (e.qty or 0.0) if e.dr_amount > 0 else 0.0
            out_qty = (e.qty or 0.0) if e.cr_amount > 0 else 0.0
            running_qty += in_qty - out_qty
            
            # Find the other ledger name or party name (for particulars)
            particulars = "—"
            for other_entry in v.entries:
                if other_entry.id != e.id:
                    particulars = other_entry.ledger_name
                    break

            rows.append({
                "date": str(v.date),
                "voucher_number": v.voucher_number,
                "voucher_type": v.voucher_type,
                "particulars": particulars,
                "inward_qty": round(in_qty, 2),
                "outward_qty": round(out_qty, 2),
                "rate": round(e.rate or 0.0, 2),
                "balance": round(running_qty, 2),
                "location_name": e.location_name or "—",
            })

        return {
            "stock_item_id": stock_item_id,
            "stock_item_name": item.name,
            "unit": item.unit or "Nos",
            "from_date": str(from_date),
            "to_date": str(to_date),
            "opening_qty": round(opening_qty, 2),
            "transactions": rows,
            "closing_qty": round(running_qty, 2),
        }

    else:
        # Summary for all items
        items = db.query(StockItem).filter(StockItem.company_id == company_id, StockItem.is_active == True).all()
        rows = []
        for item in items:
            # Pre entries
            pre_entries = (
                db.query(VoucherEntry)
                .filter(VoucherEntry.stock_item_id == item.id)
                .join(Voucher)
                .filter(Voucher.company_id == company_id, Voucher.status == "Posted", Voucher.date < from_date)
                .all()
            )
            opening_qty = item.opening_qty or 0.0
            for e in pre_entries:
                qty = e.qty or 0.0
                if e.dr_amount > 0:
                    opening_qty += qty
                elif e.cr_amount > 0:
                    opening_qty -= qty

            # Period entries
            period_entries = (
                db.query(VoucherEntry)
                .filter(VoucherEntry.stock_item_id == item.id)
                .join(Voucher)
                .filter(
                    Voucher.company_id == company_id,
                    Voucher.status == "Posted",
                    Voucher.date >= from_date,
                    Voucher.date <= to_date,
                )
                .all()
            )
            inward_qty = sum((e.qty or 0.0) for e in period_entries if e.dr_amount > 0)
            outward_qty = sum((e.qty or 0.0) for e in period_entries if e.cr_amount > 0)
            closing_qty = opening_qty + inward_qty - outward_qty
            
            rate = item.purchase_rate or item.opening_rate or 0.0
            value = closing_qty * rate

            rows.append({
                "id": item.id,
                "name": item.name,
                "unit": item.unit or "Nos",
                "opening_qty": round(opening_qty, 2),
                "inward_qty": round(inward_qty, 2),
                "outward_qty": round(outward_qty, 2),
                "closing_qty": round(closing_qty, 2),
                "rate": round(rate, 2),
                "value": round(value, 2),
            })
        return {
            "from_date": str(from_date),
            "to_date": str(to_date),
            "rows": rows,
        }


# ── GODOWN SUMMARY ───────────────────────────────────────────────────────────
@router.get("/godown-summary")
def godown_summary(
    company_id: int,
    as_of: date,
    db: Session = Depends(get_db),
):
    from finance_app.models.inventory import Location
    from finance_app.models.stock_item import StockItem

    godowns = db.query(Location).filter(Location.company_id == company_id, Location.is_active == True).all()
    primary_godown = db.query(Location).filter(Location.company_id == company_id, Location.is_active == True).order_by(Location.id).first()
    primary_godown_id = primary_godown.id if primary_godown else None

    # Get all active stock items to compute balances
    items = db.query(StockItem).filter(StockItem.company_id == company_id, StockItem.is_active == True).all()
    item_map = {item.id: item for item in items}

    result = []
    for gd in godowns:
        # Fetch entries inside this godown up to as_of
        entries = (
            db.query(VoucherEntry)
            .join(Voucher)
            .filter(
                Voucher.company_id == company_id,
                Voucher.status == "Posted",
                Voucher.date <= as_of,
                VoucherEntry.location_id == gd.id,
            )
            .all()
        )

        # Calculate quantities per stock item in this godown
        qty_by_item: defaultdict[int, float] = defaultdict(float)
        for e in entries:
            if e.stock_item_id:
                qty = e.qty or 0.0
                if e.dr_amount > 0:
                    qty_by_item[e.stock_item_id] += qty
                elif e.cr_amount > 0:
                    qty_by_item[e.stock_item_id] -= qty

        # Add opening quantities for items to the primary godown
        if gd.id == primary_godown_id:
            for item in items:
                if item.opening_qty:
                    qty_by_item[item.id] += item.opening_qty

        # Build list of items in this godown
        gd_items = []
        total_value = 0.0
        for item_id, qty in qty_by_item.items():
            if abs(qty) > 0.001 and item_id in item_map:
                item = item_map[item_id]
                rate = item.purchase_rate or item.opening_rate or 0.0
                val = qty * rate
                gd_items.append({
                    "item_id": item.id,
                    "item_name": item.name,
                    "qty": round(qty, 2),
                    "unit": item.unit or "Nos",
                    "rate": round(rate, 2),
                    "value": round(val, 2),
                })
                total_value += val

        result.append({
            "godown_id": gd.id,
            "godown_name": gd.name,
            "items": gd_items,
            "total_value": round(total_value, 2),
        })

    return result


# ── GSTR-1 REPORT ─────────────────────────────────────────────────────────────
@router.get("/gstr1")
def gstr1_report(company_id: int, from_date: date, to_date: date, db: Session = Depends(get_db)):
    vouchers = (
        db.query(Voucher).filter(
            Voucher.company_id == company_id,
            Voucher.voucher_type == "Sales",
            Voucher.date >= from_date,
            Voucher.date <= to_date,
            Voucher.status == "Posted",
        ).order_by(Voucher.date, Voucher.voucher_number).all()
    )
    
    rows = []
    total_taxable_value = 0.0
    total_cgst = total_sgst = total_igst = total_tax = total_invoice_value = 0.0
    
    for v in vouchers:
        customer_entry = next((e for e in v.entries if e.dr_amount > 0 and not e.is_gst_entry), None)
        
        customer_name = "—"
        customer_gstin = "—"
        state_code = "—"
        
        if customer_entry and customer_entry.ledger_id:
            customer_ledger = db.query(Ledger).filter(Ledger.id == customer_entry.ledger_id).first()
            if customer_ledger:
                customer_name = customer_ledger.name
                customer_gstin = customer_ledger.gstin or "—"
                state_code = customer_ledger.state_code or "—"
        
        taxable_value = sum(e.cr_amount for e in v.entries if e.cr_amount > 0 and not e.is_gst_entry)
        
        cgst = sum(e.cr_amount for e in v.entries if e.is_gst_entry and e.gst_type == "CGST")
        sgst = sum(e.cr_amount for e in v.entries if e.is_gst_entry and e.gst_type == "SGST")
        igst = sum(e.cr_amount for e in v.entries if e.is_gst_entry and e.gst_type == "IGST")
        tax_amt = cgst + sgst + igst
        
        total_taxable_value += taxable_value
        total_cgst += cgst
        total_sgst += sgst
        total_igst += igst
        total_tax += tax_amt
        total_invoice_value += v.total_amount
        
        rows.append({
            "date": str(v.date),
            "voucher_number": v.voucher_number,
            "customer_name": customer_name,
            "customer_gstin": customer_gstin,
            "state_code": state_code,
            "taxable_value": round(taxable_value, 2),
            "cgst": round(cgst, 2),
            "sgst": round(sgst, 2),
            "igst": round(igst, 2),
            "total_tax": round(tax_amt, 2),
            "invoice_value": round(v.total_amount, 2),
        })
        
    return {
        "from_date": str(from_date),
        "to_date": str(to_date),
        "rows": rows,
        "summary": {
            "total_taxable_value": round(total_taxable_value, 2),
            "total_cgst": round(total_cgst, 2),
            "total_sgst": round(total_sgst, 2),
            "total_igst": round(total_igst, 2),
            "total_tax": round(total_tax, 2),
            "total_invoice_value": round(total_invoice_value, 2),
        }
    }


# ── ITC LEDGER REPORT ─────────────────────────────────────────────────────────
@router.get("/itc-ledger")
def itc_ledger_report(company_id: int, from_date: date, to_date: date, db: Session = Depends(get_db)):
    vouchers = (
        db.query(Voucher).filter(
            Voucher.company_id == company_id,
            Voucher.voucher_type == "Purchase",
            Voucher.date >= from_date,
            Voucher.date <= to_date,
            Voucher.status == "Posted",
        ).order_by(Voucher.date, Voucher.voucher_number).all()
    )
    
    rows = []
    total_taxable_value = 0.0
    total_cgst = total_sgst = total_igst = total_tax = total_invoice_value = 0.0
    
    for v in vouchers:
        supplier_entry = next((e for e in v.entries if e.cr_amount > 0 and not e.is_gst_entry), None)
        
        supplier_name = "—"
        supplier_gstin = "—"
        state_code = "—"
        
        if supplier_entry and supplier_entry.ledger_id:
            supplier_ledger = db.query(Ledger).filter(Ledger.id == supplier_entry.ledger_id).first()
            if supplier_ledger:
                supplier_name = supplier_ledger.name
                supplier_gstin = supplier_ledger.gstin or "—"
                state_code = supplier_ledger.state_code or "—"
        
        taxable_value = sum(e.dr_amount for e in v.entries if e.dr_amount > 0 and not e.is_gst_entry)
        
        cgst = sum(e.dr_amount for e in v.entries if e.is_gst_entry and e.gst_type == "CGST")
        sgst = sum(e.dr_amount for e in v.entries if e.is_gst_entry and e.gst_type == "SGST")
        igst = sum(e.dr_amount for e in v.entries if e.is_gst_entry and e.gst_type == "IGST")
        tax_amt = cgst + sgst + igst
        
        total_taxable_value += taxable_value
        total_cgst += cgst
        total_sgst += sgst
        total_igst += igst
        total_tax += tax_amt
        total_invoice_value += v.total_amount
        
        rows.append({
            "date": str(v.date),
            "voucher_number": v.voucher_number,
            "supplier_name": supplier_name,
            "supplier_gstin": supplier_gstin,
            "state_code": state_code,
            "taxable_value": round(taxable_value, 2),
            "cgst": round(cgst, 2),
            "sgst": round(sgst, 2),
            "igst": round(igst, 2),
            "total_tax": round(tax_amt, 2),
            "invoice_value": round(v.total_amount, 2),
        })
        
    return {
        "from_date": str(from_date),
        "to_date": str(to_date),
        "rows": rows,
        "summary": {
            "total_taxable_value": round(total_taxable_value, 2),
            "total_cgst": round(total_cgst, 2),
            "total_sgst": round(total_sgst, 2),
            "total_igst": round(total_igst, 2),
            "total_tax": round(total_tax, 2),
            "total_invoice_value": round(total_invoice_value, 2),
        }
    }

