"""Aggregated API router — includes all module endpoints."""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, dashboard, parties, buyer_orders, yarn_purchase_orders, dropdowns, employees, design_entries, yarn_inwards, grey_yarn_deliveries, dyed_yarn_receipts, dyed_yarn_deliveries, warp_beam_receipts, warp_deliveries

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(parties.router)
api_router.include_router(buyer_orders.router)
api_router.include_router(yarn_purchase_orders.router)
api_router.include_router(dropdowns.router)
api_router.include_router(employees.router)
api_router.include_router(design_entries.router)
api_router.include_router(yarn_inwards.router)
api_router.include_router(grey_yarn_deliveries.router)
api_router.include_router(dyed_yarn_receipts.router)
api_router.include_router(dyed_yarn_deliveries.router)
api_router.include_router(warp_beam_receipts.router)
api_router.include_router(warp_deliveries.router)
