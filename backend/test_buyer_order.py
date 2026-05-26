from fastapi.testclient import TestClient
from app.main import app
import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/buyer-orders/", json={
            "order_date": "2026-05-26",
            "party_id": None,
            "party_name": "Test Party",
            "items": [{
                "party_po_no": "PO123",
                "uom": "MTR"
            }]
        })
        print(response.status_code)
        print(response.text)

asyncio.run(test())
