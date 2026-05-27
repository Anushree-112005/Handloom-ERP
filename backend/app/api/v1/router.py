"""Aggregated API router — includes all module endpoints."""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, dashboard, parties, buyer_orders, yarn_purchase_orders, dropdowns, employees, despatch_planning, sales_invoices, goods_releases, packing_slips, finished_fabrics, cloth_deliveries, on_table_checking, cloth_inwards, log_reports, eway_bills, company_settings

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
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


