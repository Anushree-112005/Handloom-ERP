"""Dashboard stats endpoint — aggregates counts from all modules."""
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.party_master import PartyMaster
from app.models.buyer_order import BuyerOrder, BuyerOrderItem
from app.models.yarn_purchase import YarnPurchaseOrder
from app.models.sales_invoice import SalesInvoice
from app.models.goods_release import GoodsRelease
from app.models.despatch_planning import DespatchPlanning
from app.models.cloth import ClothInward, ClothDelivery, OnTableChecking
from app.models.yarn_inward import YarnInward
from app.models.grey_yarn_delivery import GreyYarnDelivery
from app.models.dyed_yarn import DyedYarnReceived, DyedYarnReceivedItem, DyedYarnDelivery
from app.models.warp import WarpBeamReceipt, WarpDelivery
from app.models.packing_slip import PackingSlip
from app.models.eway_bill import EwayBill
from app.models.ppc import LoomAllocation

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    async def count(model):
        r = await db.execute(select(func.count(model.id)))
        return r.scalar() or 0

    async def sum_col(col):
        r = await db.execute(select(func.sum(col)))
        return float(r.scalar() or 0)

    # 1. Basic Stats for Operations Panel
    vendor_inward_rolls = int(await sum_col(ClothInward.total_pieces))
    purchase_inward_kgs = float(await sum_col(YarnInward.received_kgs))
    process_delivery_batches = int(await count(GreyYarnDelivery))
    process_inward_bags = int(await sum_col(DyedYarnReceivedItem.bags))
    sales_delivery = int(await count(ClothDelivery))
    impo_orders = int(await count(YarnPurchaseOrder))
    imbo_lots = int(await count(ClothInward))
    total_dc_challans = int(await count(EwayBill))
    total_qty_meters = float(await sum_col(SalesInvoice.total_qty))

    # 2. Production vs Dispatch by Month (Jan-Jun)
    months_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    prod_vs_disp_map = {
        'Jan': {'Production': 0.0, 'Dispatch': 0.0},
        'Feb': {'Production': 0.0, 'Dispatch': 0.0},
        'Mar': {'Production': 0.0, 'Dispatch': 0.0},
        'Apr': {'Production': 0.0, 'Dispatch': 0.0},
        'May': {'Production': 0.0, 'Dispatch': 0.0},
        'Jun': {'Production': 0.0, 'Dispatch': 0.0},
    }
    
    # Query actual records and group by month name
    # ClothInward -> Production
    ci_res = await db.execute(select(ClothInward.inw_date, ClothInward.total_meters))
    months_map = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
async def dashboard_stats(
    start_date: str | None = None,
    end_date: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    from datetime import datetime
    parsed_start = None
    parsed_end = None
    if start_date:
        try:
            parsed_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            pass
    if end_date:
        try:
            parsed_end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    def apply_date_filter(query, date_column):
        if parsed_start:
            query = query.where(date_column >= parsed_start)
        if parsed_end:
            query = query.where(date_column <= parsed_end)
        return query

    async def count(model, date_column=None):
        query = select(func.count(model.id))
        if date_column is not None:
            query = apply_date_filter(query, date_column)
        r = await db.execute(query)
        return r.scalar() or 0

    async def sum_col(col, date_column=None):
        query = select(func.sum(col))
        if date_column is not None:
            query = apply_date_filter(query, date_column)
        r = await db.execute(query)
        return float(r.scalar() or 0)

    # 1. Basic Stats for Operations Panel
    vendor_inward_rolls = int(await sum_col(ClothInward.total_pieces, ClothInward.inw_date))
    purchase_inward_kgs = float(await sum_col(YarnInward.received_kgs, YarnInward.inward_date))
    process_delivery_batches = int(await count(GreyYarnDelivery, GreyYarnDelivery.dc_date))
    
    # process_inward_bags (join for date filter)
    bags_query = select(func.sum(DyedYarnReceivedItem.bags)).join(DyedYarnReceived)
    if parsed_start:
        bags_query = bags_query.where(DyedYarnReceived.receipt_date >= parsed_start)
    if parsed_end:
        bags_query = bags_query.where(DyedYarnReceived.receipt_date <= parsed_end)
    bags_res = await db.execute(bags_query)
    process_inward_bags = int(bags_res.scalar() or 0)

    sales_delivery = int(await count(ClothDelivery, ClothDelivery.dc_date))
    impo_orders = int(await count(YarnPurchaseOrder, YarnPurchaseOrder.po_date))
    imbo_lots = int(await count(ClothInward, ClothInward.inw_date))
    total_dc_challans = int(await count(EwayBill, EwayBill.eway_date))
    total_qty_meters = float(await sum_col(SalesInvoice.total_qty, SalesInvoice.invoice_date))

    # 2. Production vs Dispatch by Month (Jan-Dec)
    months_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    prod_vs_disp_map = {m: {'Production': 0.0, 'Dispatch': 0.0} for m in months_names}
    months_map = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
    
    # ClothInward -> Production
    ci_query = select(ClothInward.inw_date, ClothInward.total_meters)
    ci_query = apply_date_filter(ci_query, ClothInward.inw_date)
    ci_res = await db.execute(ci_query)
    for row in ci_res.fetchall():
        if row[0]:
            m_name = months_map.get(row[0].month)
            if m_name in prod_vs_disp_map:
                prod_vs_disp_map[m_name]['Production'] += float(row[1] or 0)

    # ClothDelivery -> Dispatch
    cd_res = await db.execute(select(ClothDelivery.dc_date, ClothDelivery.total_meters))
    cd_query = select(ClothDelivery.dc_date, ClothDelivery.total_meters)
    cd_query = apply_date_filter(cd_query, ClothDelivery.dc_date)
    cd_res = await db.execute(cd_query)
    for row in cd_res.fetchall():
        if row[0]:
            m_name = months_map.get(row[0].month)
            if m_name in prod_vs_disp_map:
                prod_vs_disp_map[m_name]['Dispatch'] += float(row[1] or 0)

    production_vs_dispatch_list = [
        {"name": m, "Production": prod_vs_disp_map[m]['Production'], "Dispatch": prod_vs_disp_map[m]['Dispatch']}
        for m in months_names
    ]

    # 3. Process Bottlenecks
    warping_count = int(await count(WarpDelivery)) or 0
    weaving_count = int(await count(LoomAllocation)) or 0
    dyeing_count = int(await count(DyedYarnDelivery)) or 0
    checking_count = int(await count(OnTableChecking)) or 0
    packing_count = int(await count(PackingSlip)) or 0
    warping_q = select(func.count(WarpDelivery.id))
    warping_q = apply_date_filter(warping_q, WarpDelivery.dc_date)
    warping_count = (await db.execute(warping_q)).scalar() or 0

    weaving_q = select(func.count(LoomAllocation.id))
    weaving_q = apply_date_filter(weaving_q, LoomAllocation.start_time)
    weaving_count = (await db.execute(weaving_q)).scalar() or 0

    dyeing_q = select(func.count(DyedYarnDelivery.id))
    dyeing_q = apply_date_filter(dyeing_q, DyedYarnDelivery.dc_date)
    dyeing_count = (await db.execute(dyeing_q)).scalar() or 0

    checking_q = select(func.count(OnTableChecking.id))
    checking_q = apply_date_filter(checking_q, OnTableChecking.checking_date)
    checking_count = (await db.execute(checking_q)).scalar() or 0

    packing_q = select(func.count(PackingSlip.id))
    packing_q = apply_date_filter(packing_q, PackingSlip.slip_date)
    packing_count = (await db.execute(packing_q)).scalar() or 0
    
    process_bottlenecks = [
        {"name": "Warping", "value": warping_count},
        {"name": "Weaving", "value": weaving_count},
        {"name": "Dyeing", "value": dyeing_count},
        {"name": "Checking", "value": checking_count},
        {"name": "Packing", "value": packing_count}
    ]

    # 4. Buyer Order Volumes
    buyer_vol_query = select(BuyerOrder.party_name, func.sum(BuyerOrderItem.order_mtrs)).join(BuyerOrderItem).group_by(BuyerOrder.party_name)
    buyer_vol_res = await db.execute(buyer_vol_query)
    buyer_volumes = [{"name": row[0], "value": float(row[1] or 0)} for row in buyer_vol_res.fetchall() if row[0]]

    # 5. Quality Compliance %
    quality_compliance = [
        { "name": 'Warping', "value": 0 },
        { "name": 'Weaving', "value": 0 },
        { "name": 'Dyeing', "value": 0 },
        { "name": 'Checking', "value": 0 }
    ]

    # 6. Dispatch by Transporter
    trans_query = select(ClothDelivery.transport, func.sum(ClothDelivery.total_meters)).group_by(ClothDelivery.transport)
    trans_res = await db.execute(trans_query)
    transporter_data = [{"name": row[0], "value": float(row[1] or 0)} for row in trans_res.fetchall() if row[0]]

    # 7. Daily Factory Activity (last 7 days)
    daily_production_list = []
    start_date = date.today() - timedelta(days=6)
    
    ci_days = await db.execute(select(ClothInward.inw_date, func.count(ClothInward.id)).where(ClothInward.inw_date >= start_date).group_by(ClothInward.inw_date))
    ci_days_map = {row[0]: row[1] for row in ci_days.fetchall() if row[0]}
    
    otc_days = await db.execute(select(OnTableChecking.checking_date, func.count(OnTableChecking.id)).where(OnTableChecking.checking_date >= start_date).group_by(OnTableChecking.checking_date))
    otc_days_map = {row[0]: row[1] for row in otc_days.fetchall() if row[0]}
    
    gyd_days = await db.execute(select(GreyYarnDelivery.dc_date, func.count(GreyYarnDelivery.id)).where(GreyYarnDelivery.dc_date >= start_date).group_by(GreyYarnDelivery.dc_date))
    buyer_vol_query = select(BuyerOrder.party_name, func.sum(BuyerOrderItem.order_mtrs)).join(BuyerOrderItem)
    buyer_vol_query = apply_date_filter(buyer_vol_query, BuyerOrder.order_date)
    buyer_vol_query = buyer_vol_query.group_by(BuyerOrder.party_name)
    buyer_vol_res = await db.execute(buyer_vol_query)
    buyer_volumes = [{"name": row[0], "value": float(row[1] or 0)} for row in buyer_vol_res.fetchall() if row[0]]

    # 7. Daily Factory Activity (last 7 days)
    daily_production_list = []
    start_date_7 = date.today() - timedelta(days=6)
    
    ci_days = await db.execute(select(ClothInward.inw_date, func.count(ClothInward.id)).where(ClothInward.inw_date >= start_date_7).group_by(ClothInward.inw_date))
    ci_days_map = {row[0]: row[1] for row in ci_days.fetchall() if row[0]}
    
    otc_days = await db.execute(select(OnTableChecking.checking_date, func.count(OnTableChecking.id)).where(OnTableChecking.checking_date >= start_date_7).group_by(OnTableChecking.checking_date))
    otc_days_map = {row[0]: row[1] for row in otc_days.fetchall() if row[0]}
    
    gyd_days = await db.execute(select(GreyYarnDelivery.dc_date, func.count(GreyYarnDelivery.id)).where(GreyYarnDelivery.dc_date >= start_date_7).group_by(GreyYarnDelivery.dc_date))
    gyd_days_map = {row[0]: row[1] for row in gyd_days.fetchall() if row[0]}

    def get_past_date_label(days_ago):
        d = date.today() - timedelta(days=days_ago)
        return d.strftime("%d/%m")

    for days_ago in reversed(range(7)):
        d = date.today() - timedelta(days=days_ago)
        lbl = get_past_date_label(days_ago)
        
        ci_val = ci_days_map.get(d, 0)
        otc_val = otc_days_map.get(d, 0)
        gyd_val = gyd_days_map.get(d, 0)

        daily_production_list.append({
            "name": lbl,
            "Vendor": ci_val,
            "Checking": otc_val,
            "GreyDelivery": gyd_val
        })

    return {
        "total_parties": await count(PartyMaster),
        "total_buyer_orders": await count(BuyerOrder),
        "total_purchase_orders": await count(YarnPurchaseOrder),
        "total_invoices": await count(SalesInvoice),
        "total_gra": await count(GoodsRelease),
        "total_dispatch_plans": await count(DespatchPlanning),
        "total_buyer_orders": await count(BuyerOrder, BuyerOrder.order_date),
        "total_purchase_orders": await count(YarnPurchaseOrder, YarnPurchaseOrder.po_date),
        "total_invoices": await count(SalesInvoice, SalesInvoice.invoice_date),
        "total_gra": await count(GoodsRelease, GoodsRelease.gra_date),
        "total_dispatch_plans": await count(DespatchPlanning, DespatchPlanning.planning_date),
        
        # Real-time metrics
        "vendor_inward_rolls": vendor_inward_rolls,
        "purchase_inward_kgs": purchase_inward_kgs,
        "process_delivery_batches": process_delivery_batches,
        "process_inward_bags": process_inward_bags,
        "sales_delivery": sales_delivery,
        "impo_orders": impo_orders,
        "imbo_lots": imbo_lots,
        "total_dc_challans": total_dc_challans,
        "total_qty_meters": total_qty_meters,
        
        # Charts lists
        "production_vs_dispatch": production_vs_dispatch_list,
        "process_bottlenecks": process_bottlenecks,
        "buyer_order_volumes": buyer_volumes,
        "quality_compliance": quality_compliance,
        "dispatch_by_transporter": transporter_data,
        "daily_production": daily_production_list
    }
