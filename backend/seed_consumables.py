import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DATABASE_URL = "postgresql+asyncpg://postgres:Navaniloga0901@localhost:5432/dinesh_textile_erp"
engine = create_async_engine(DATABASE_URL)

async def seed():
    async with engine.begin() as conn:
        # Seed erp_current_stock with some CON items
        await conn.execute(text("""
            INSERT INTO erp_current_stock (item_id, location_id, location_type, quantity, status)
            VALUES 
            ('CON-PEN-01', 1, 'STORE', 500, 'AVAILABLE'),
            ('CON-PAPER-02', 1, 'STORE', 200, 'AVAILABLE'),
            ('CON-NOTE-03', 1, 'STORE', 150, 'AVAILABLE')
            ON CONFLICT DO NOTHING;
        """))
        
        # Seed stationary_items with consumables_items
        default_items = [
          { "id": 1, "code": "CON-PEN-01", "name": "Ballpoint Pen", "category": "Stationery", "uom": "Nos", "currentStock": 500, "rate": 5, "minStock": 30, "maxStock": 500, "category_id": 1, "uom_id": 1 },
          { "id": 2, "code": "CON-PAPER-02", "name": "A4 Paper Ream", "category": "Stationery", "uom": "Pack", "currentStock": 200, "rate": 280, "minStock": 20, "maxStock": 200, "category_id": 1, "uom_id": 2 },
          { "id": 3, "code": "CON-NOTE-03", "name": "Notebook", "category": "Office Supplies", "uom": "Nos", "currentStock": 150, "rate": 55, "minStock": 40, "maxStock": 250, "category_id": 2, "uom_id": 1 }
        ]
        
        # Seed stationary_items with consumables_issues
        default_issues = [
          { "id": "ISS001", "date": "2026-07-19", "department": "Stores", "employee": "Suresh Kumar", "status": "Pending", "purpose": "Daily issue for stationery", "items": [{"itemId": "CON-PEN-01", "qty": 10}] },
          { "id": "ISS002", "date": "2026-07-16", "department": "Production", "employee": "Anita Sharma", "status": "Approved", "purpose": "Production department issue", "items": [{"itemId": "CON-PAPER-02", "qty": 2}] }
        ]
        
        # Clear existing ones for these categories just in case
        await conn.execute(text("DELETE FROM stationary_items WHERE category IN ('consumables_items', 'consumables_issues')"))
        
        for item in default_items:
            await conn.execute(text("INSERT INTO stationary_items (category, data) VALUES (:cat, :data)"), {"cat": "consumables_items", "data": json.dumps(item)})
            
        for issue in default_issues:
            await conn.execute(text("INSERT INTO stationary_items (category, data) VALUES (:cat, :data)"), {"cat": "consumables_issues", "data": json.dumps(issue)})

        print("Seeded data successfully!")

asyncio.run(seed())
