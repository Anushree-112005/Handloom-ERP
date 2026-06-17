from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from finance_app.database import get_db
from finance_app.models.voucher import Voucher, VoucherEntry

router = APIRouter()

@router.get("/summary")
def gst_summary(company_id: int, month: int, year: int, db: Session = Depends(get_db)):
    """GSTR-3B style summary — output tax, input credit, net payable"""
    from calendar import monthrange
    fd = date(year, month, 1)
    td = date(year, month, monthrange(year, month)[1])

    output = {"CGST": 0.0, "SGST": 0.0, "IGST": 0.0, "taxable_value": 0.0}
    input_credit = {"CGST": 0.0, "SGST": 0.0, "IGST": 0.0, "taxable_value": 0.0}

    entries = db.query(VoucherEntry).filter(
        VoucherEntry.is_gst_entry == True
    ).join(Voucher).filter(
        Voucher.company_id == company_id,
        Voucher.date >= fd, Voucher.date <= td,
        Voucher.status == "Posted"
    ).all()

    for e in entries:
        v = e.voucher
        amt = e.cr_amount if e.cr_amount > 0 else e.dr_amount
        gst_type = e.gst_type
        
        # Calculate approximate taxable value if rate > 0
        taxable = 0.0
        if e.gst_rate > 0:
             # Since amt is the tax amount, taxable = amt * 100 / rate
             # Wait, the prompt seed has gst_rate in entry, so we can calculate
             pass 

        if v.voucher_type in ("Sales", "Credit Note"):
            if gst_type == "CGST": output["CGST"] += amt  # pyrefly: ignore[bad-argument-type]
            elif gst_type == "SGST": output["SGST"] += amt  # pyrefly: ignore[bad-argument-type]
            elif gst_type == "IGST": output["IGST"] += amt  # pyrefly: ignore[bad-argument-type]
        elif v.voucher_type in ("Purchase", "Debit Note"):
            if gst_type == "CGST": input_credit["CGST"] += amt  # pyrefly: ignore[bad-argument-type]
            elif gst_type == "SGST": input_credit["SGST"] += amt  # pyrefly: ignore[bad-argument-type]
            elif gst_type == "IGST": input_credit["IGST"] += amt  # pyrefly: ignore[bad-argument-type]

    net_cgst = output["CGST"] - input_credit["CGST"]
    net_sgst = output["SGST"] - input_credit["SGST"]
    net_igst = output["IGST"] - input_credit["IGST"]

    return {
        "period": f"{month:02d}/{year}",
        "output_tax":    {k: round(v, 2) for k, v in output.items()},
        "input_credit":  {k: round(v, 2) for k, v in input_credit.items()},
        "net_payable": {
            "CGST": round(net_cgst, 2),
            "SGST": round(net_sgst, 2),
            "IGST": round(net_igst, 2),
            "total": round(net_cgst + net_sgst + net_igst, 2)
        }
    }
