"""Aggregated API router — includes all module endpoints."""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, dashboard, parties, buyer_orders, yarn_purchase_orders, dropdowns, employees, despatch_planning, sales_invoices, goods_releases, packing_slips, finished_fabrics, cloth_deliveries, on_table_checking, cloth_inwards, log_reports, eway_bills, company_settings, design_entries, yarn_inwards, grey_yarn_deliveries, dyed_yarn_receipts, dyed_yarn_deliveries, warp_beam_receipts, warp_deliveries, sub_masters, fleet, twisting_doubling_po, yarn_dyeing_po, fabric_dyeing_po, warping_sizing_po, weaving_po, processing_po, cloth_purchase_po, inventory, calendar_events, costing_sheet, stock_sheet, notifications


api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(inventory.router)
api_router.include_router(parties.router)
api_router.include_router(buyer_orders.router)
api_router.include_router(yarn_purchase_orders.router)
api_router.include_router(dropdowns.router)
api_router.include_router(employees.router)
api_router.include_router(despatch_planning.router)
api_router.include_router(sales_invoices.router)
api_router.include_router(goods_releases.router)
api_router.include_router(packing_slips.router)
api_router.include_router(finished_fabrics.router)
api_router.include_router(cloth_deliveries.router)
api_router.include_router(on_table_checking.router)
api_router.include_router(cloth_inwards.router)
api_router.include_router(log_reports.router)
api_router.include_router(eway_bills.router)
api_router.include_router(company_settings.router)
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Newly registered missing routers
api_router.include_router(design_entries.router)
api_router.include_router(yarn_inwards.router)
api_router.include_router(grey_yarn_deliveries.router)
api_router.include_router(dyed_yarn_receipts.router)
api_router.include_router(dyed_yarn_deliveries.router)
api_router.include_router(warp_beam_receipts.router)
api_router.include_router(warp_deliveries.router)
api_router.include_router(sub_masters.router)
api_router.include_router(fleet.router)

api_router.include_router(twisting_doubling_po.router, prefix="/purchase/twisting-doubling", tags=["Purchase Orders - Twisting & Doubling"])
api_router.include_router(calendar_events.router, prefix="/calendar-events", tags=["Calendar Events"])
api_router.include_router(costing_sheet.router, prefix="/costing-sheet", tags=["Costing Sheet"])
api_router.include_router(stock_sheet.router, prefix="/stock-sheet", tags=["Stock Sheet"])

api_router.include_router(yarn_dyeing_po.router, prefix="/yarn-dyeing-po", tags=["Yarn Dyeing PO"])
api_router.include_router(fabric_dyeing_po.router, prefix="/fabric-dyeing-po", tags=["Fabric Dyeing PO"])
api_router.include_router(warping_sizing_po.router, prefix="/warping-sizing-po", tags=["Warping Sizing PO"])
api_router.include_router(weaving_po.router, prefix="/weaving-po", tags=["Weaving PO"])
api_router.include_router(processing_po.router, prefix="/processing-po", tags=["Processing PO"])
api_router.include_router(cloth_purchase_po.router, prefix="/cloth-purchase-po", tags=["Cloth Purchase PO"])

from app.api.v1.endpoints import work_order_transactions
api_router.include_router(work_order_transactions.router)

from app.design_ai.router import router as design_ai_router
api_router.include_router(design_ai_router)

from app.api.v1.endpoints import textile_designs
api_router.include_router(textile_designs.router)

from app.api.v1.endpoints import ppc
api_router.include_router(ppc.router, prefix="/ppc", tags=["Production Planning (PPC)"])

from app.api.v1.endpoints import chat
api_router.include_router(chat.router)

from app.api.v1.endpoints import reports
api_router.include_router(reports.router)

from app.modules.hr.router import router as hr_router
from app.modules.vehicle_management.router import router as fleet_router
from app.modules.stationary.router import router as stationary_router
from app.modules.stores_consumables.router import router as stores_consumables_router
api_router.include_router(hr_router)
api_router.include_router(fleet_router)
api_router.include_router(stationary_router)
api_router.include_router(stores_consumables_router)

from app.api.v1.endpoints import generic_po
api_router.include_router(generic_po.router)
