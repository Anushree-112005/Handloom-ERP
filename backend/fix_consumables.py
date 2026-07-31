import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)

async def fix():
    async with engine.begin() as conn:
        # Clear existing ones for consumables_items
        await conn.execute(text("DELETE FROM stationary_items WHERE category = 'consumables_items'"))
        
        # Seed stationary_items with consumables_items, matching id to the string ID
        default_items = [
          { "id": "CON-PEN-01", "code": "CON-PEN-01", "name": "Ballpoint Pen", "category": "Stationery", "uom": "Nos", "currentStock": 500, "rate": 5, "minStock": 30, "maxStock": 500, "category_id": 1, "uom_id": 1 },
          { "id": "CON-PAPER-02", "code": "CON-PAPER-02", "name": "A4 Paper Ream", "category": "Stationery", "uom": "Pack", "currentStock": 200, "rate": 280, "minStock": 20, "maxStock": 200, "category_id": 1, "uom_id": 2 },
          { "id": "CON-NOTE-03", "code": "CON-NOTE-03", "name": "Notebook", "category": "Office Supplies", "uom": "Nos", "currentStock": 150, "rate": 55, "minStock": 40, "maxStock": 250, "category_id": 2, "uom_id": 1 }
        ]
        
        for item in default_items:
            await conn.execute(text("INSERT INTO stationary_items (category, data) VALUES (:cat, :data)"), {"cat": "consumables_items", "data": json.dumps(item)})

        print("Fixed data successfully!")

asyncio.run(fix())
