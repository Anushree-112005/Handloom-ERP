from finance_app.database import engine
from finance_app.models.banking import BankReconciliation

def main():
    print("Dropping BankReconciliation table...")
    BankReconciliation.__table__.drop(engine, checkfirst=True)
    print("Recreating BankReconciliation table...")
    BankReconciliation.__table__.create(engine)
    print("Done!")

if __name__ == "__main__":
    main()
