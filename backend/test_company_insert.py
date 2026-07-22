import sys
import traceback

sys.path.append('c:\\Users\\User\\Desktop\\dinesh-tex\\dinesh-tex1\\dinesh-tex\\backend')

from finance_app.database import SessionLocal
from finance_app.models.company import Company

try:
    db = SessionLocal()
    company = Company(
        name="Test Company " + str(import_id := __import__("random").randint(1, 1000)),
        legal_name="Test Company",
        maintain_inventory=True
    )
    db.add(company)
    db.flush()
    print("Company flush succeeded.")
except Exception as e:
    print(f"Company insert error: {e}")
    traceback.print_exc()
finally:
    db.close()
