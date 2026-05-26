"""Aggregated API router — includes all module endpoints."""
from fastapi import APIRouter
<<<<<<< HEAD
from app.api.v1.endpoints import auth, dashboard, parties, buyer_orders, yarn_purchase_orders, dropdowns, employees
=======
from app.api.v1.endpoints import auth, dashboard, parties, buyer_orders, yarn_purchase_orders
>>>>>>> 048802c6a0e838215281295d658f4e749ede1691

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(parties.router)
api_router.include_router(buyer_orders.router)
api_router.include_router(yarn_purchase_orders.router)
<<<<<<< HEAD
api_router.include_router(dropdowns.router)
api_router.include_router(employees.router)
=======
>>>>>>> 048802c6a0e838215281295d658f4e749ede1691
