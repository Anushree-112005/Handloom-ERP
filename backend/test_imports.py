import sys
import traceback
import os

try:
    print("Testing imports in finance_app...")
    from finance_app.models.voucher import Voucher
    from finance_app.models.ledger import Ledger
    from finance_app.schemas.voucher import VoucherCreate
    from finance_app.schemas.ledger import LedgerCreate
    print("Imports are perfectly fine!")
except Exception as e:
    traceback.print_exc()
