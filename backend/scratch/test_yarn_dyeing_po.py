import asyncio
import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import engine
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.yarn_dyeing_po import YarnDyeingPO, YarnDyeingPOItem

async def test_create_and_fetch():
    # Use expire_on_commit=False to avoid missing greenlet issues
    async with AsyncSession(engine, expire_on_commit=False) as session:
        unique_po_no = f"TEST-YPO-{uuid.uuid4().hex[:8].upper()}"
        print("Using PO Number:", unique_po_no)

        # Create a new PO
        po = YarnDyeingPO(
            po_no=unique_po_no,
            supplier_dyeing_unit="Test Supplier Unit",
            certificate_type="BCI Cotton",
        )
        session.add(po)
        await session.commit()

        # Create PO Item with lot_no
        item = YarnDyeingPOItem(
            order_id=po.id,
            sp_no="SP-9999",
            lot_no="LOT-12345-TEST",
            dsn_count="40s",
            yarn_count="40s",
            color="Red",
            uom="KGS",
            tot_qty=100.5,
            rate=150.0,
            amount=15075.0,
        )
        session.add(item)
        await session.commit()

        # Query back to verify
        stmt = select(YarnDyeingPO).options(selectinload(YarnDyeingPO.items)).where(YarnDyeingPO.id == po.id)
        result = await session.execute(stmt)
        fetched_po = result.scalars().first()

        print("Fetched PO NO:", fetched_po.po_no)
        print("Certificate Type:", fetched_po.certificate_type)
        print("Items Count:", len(fetched_po.items))
        if fetched_po.items:
            print("Item Lot No:", fetched_po.items[0].lot_no)
            print("Item SP No:", fetched_po.items[0].sp_no)

        # Cleanup
        await session.delete(fetched_po)
        await session.commit()
        print("Cleanup completed successfully.")

if __name__ == "__main__":
    asyncio.run(test_create_and_fetch())
