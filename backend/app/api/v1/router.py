"""Aggregated API router — includes all module endpoints."""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, dashboard, parties, buyer_orders, yarn_purchase_orders

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(parties.router)
api_router.include_router(buyer_orders.router)
api_router.include_router(yarn_purchase_orders.router)
