from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.general_master import GeneralMaster
from app.models.party_master import PartyMaster
from app.models.employee import Employee

router = APIRouter(prefix="/dropdowns", tags=["Dropdowns"])

DEFAULT_MASTERS = {
    "party_group": ["Textile Suppliers", "Buyers", "Processors", "Transporters", "Agents"],
    "customer_grade": ["A", "B", "C"],
    "state_code": ["TN / 33", "MH / 27", "KA / 29", "GJ / 24"],
    "city": ["Tiruchengodu", "Erode", "Coimbatore", "Mumbai", "Surat", "Ahmedabad"],
    "sales_region": ["South Zone", "North Zone", "Export", "Local"],
    "country": ["India", "Bangladesh", "USA", "UAE"],
    "currency": ["INR", "USD", "EUR"],
    "gst_type": ["With GST", "Without GST"],
    "tds": ["None", "194C", "194Q"],
    "payment_terms": ["Net 30", "Advance", "COD", "Against BL"],
}

@router.get("/")
async def get_all_dropdowns(db: AsyncSession = Depends(get_db)):
    # 1. Fetch dynamic parties
    parties_req = await db.execute(select(PartyMaster.id, PartyMaster.business_name, PartyMaster.party_type))
    parties = parties_req.all()
    
    agents = [{"id": p.id, "name": p.business_name} for p in parties if p.party_type == "Agent"]
    transporters = [{"id": p.id, "name": p.business_name} for p in parties if p.party_type == "Logistics"]
    all_parties = [{"id": p.id, "name": p.business_name} for p in parties]

    # 2. Fetch employees for Manager, Merchandiser, A/c Incharge
    emp_req = await db.execute(select(Employee.id, Employee.name))
    employees = [{"id": e.id, "name": e.name} for e in emp_req.all()]

    # 3. Fetch General Masters
    gm_req = await db.execute(select(GeneralMaster.category, GeneralMaster.value))
    gm_rows = gm_req.all()
    
    # Auto-seed if empty
    if not gm_rows:
        for category, values in DEFAULT_MASTERS.items():
            for val in values:
                db.add(GeneralMaster(category=category, value=val))
        await db.commit()
        
        gm_req = await db.execute(select(GeneralMaster.category, GeneralMaster.value))
        gm_rows = gm_req.all()

    # Group General Masters
    masters = {}
    for row in gm_rows:
        if row.category not in masters:
            masters[row.category] = []
        masters[row.category].append(row.value)

    return {
        "agents": agents,
        "transporters": transporters,
        "all_parties": all_parties,
        "employees": employees,
        "masters": masters
    }
