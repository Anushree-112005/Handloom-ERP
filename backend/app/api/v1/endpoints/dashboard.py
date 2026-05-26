"""Dashboard stats endpoint — aggregates counts from all modules."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.party_master import PartyMaster
from app.models.buyer_order import BuyerOrder
from app.models.yarn_purchase import YarnPurchaseOrder
from app.models.sales_invoice import SalesInvoice
from app.models.goods_release import GoodsRelease
from app.models.despatch_planning import DespatchPlanning

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    async def count(model):
        r = await db.execute(select(func.count(model.id)))
        return r.scalar() or 0

    return {
        "total_parties": await count(PartyMaster),
        "total_buyer_orders": await count(BuyerOrder),
        "total_purchase_orders": await count(YarnPurchaseOrder),
        "total_invoices": await count(SalesInvoice),
        "total_gra": await count(GoodsRelease),
        "total_dispatch_plans": await count(DespatchPlanning),
    }
