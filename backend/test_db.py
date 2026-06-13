import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.sales_invoice import SalesInvoice, SalesInvoiceItem


async def test():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        import datetime
        payload = {
          "invoice_no": "TEST-123",
          "invoice_date": datetime.date(2026, 6, 5),
          "invoice_type": "Proforma Invoice",
          "party_name": "ABC",
          "status": "Draft",
          "items": []
        }
        
        try:
            db_invoice = SalesInvoice(**payload)
            db.add(db_invoice)
            await db.flush()
            print("Flush succeeded")
        except Exception as e:
            print("Error:", e)

asyncio.run(test())
