from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.yarn_inward import YarnInward, YarnInwardItem

router = APIRouter()

@router.get("/stock-summary")
async def get_stock_summary(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnInward, YarnInwardItem)
        .join(YarnInwardItem, YarnInward.id == YarnInwardItem.inward_id)
    )
    
    stock_dict = {}
    for inward, item in result.all():
        key = f"{item.yarn_count}_{item.colour}_{item.mill_name}_{inward.stock_godown}"
        if key not in stock_dict:
            item_name = f"{item.yarn_count or ''} {item.colour or ''} (Mill: {item.mill_name or 'N/A'})".strip()
            stock_dict[key] = {
                "id": f"YRN-{item.id}", 
                "category": "Yarn",
                "itemName": item_name if item_name != "(Mill: N/A)" else "Unknown Yarn",
                "qty": 0.0,
                "unit": "KGS",
                "value": 0.0,
                "godown": inward.stock_godown or "Main Godown",
                "lastUpdated": inward.entry_date.strftime("%Y-%m-%d") if inward.entry_date else ""
            }
        stock_dict[key]["qty"] += (item.kgs or 0.0)
        stock_dict[key]["value"] += (item.amount or 0.0)
        
        # Keep the latest date
        if inward.entry_date:
            curr_date = stock_dict[key]["lastUpdated"]
            new_date = inward.entry_date.strftime("%Y-%m-%d")
            if not curr_date or new_date > curr_date:
                stock_dict[key]["lastUpdated"] = new_date

    return list(stock_dict.values())


@router.get("/stock-ledger")
async def get_stock_ledger(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(YarnInward, YarnInwardItem)
        .join(YarnInwardItem, YarnInward.id == YarnInwardItem.inward_id)
        .order_by(YarnInward.entry_date.desc())
    )
    
    ledger_list = []
    for inward, item in result.all():
        item_name = f"{item.yarn_count or ''} {item.colour or ''} (Mill: {item.mill_name or ''})".strip()
        ledger_list.append({
            "id": f"TXN-YRN-{inward.id}-{item.id}",
            "date": inward.entry_date.strftime("%Y-%m-%d") if inward.entry_date else "",
            "sku": item_name if item_name else "Unknown Yarn",
            "type": "Inward",
            "ref": inward.ref_no or f"INW-{inward.id}",
            "qtyIn": item.kgs or 0.0,
            "qtyOut": 0.0,
            "balance": item.kgs or 0.0, 
            "godown": inward.stock_godown or "Main Godown",
            "operator": "System"
        })
    return ledger_list
