"""FastAPI router for the Stores & Consumables master endpoints and dashboard metrics."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta


from app.core.database import get_db
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.employee import Employee
from app.modules.stores_consumables.services import StoresService
from app.modules.stores_consumables.models import (
    StoresCategory, StoresUOM, StoresDepartment, StoresVendor, StoresItem,
    StoresSubcategory, StoresWarehouse, StoresCostCenter, StoresBudget,
    StoresPurchaseRequisition, StoresPRApprovalHistory,
    ProcurementVendor, ProcurementQuotationHeader, ProcurementQuotationLineItem
)


from app.modules.stores_consumables.schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    UOMCreate, UOMUpdate, UOMResponse,
    VendorCreate, VendorUpdate, VendorResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    ItemCreate, ItemUpdate, ItemResponse,
    DashboardStatsResponse,
    MaterialRequestCreate, MaterialRequestResponse, MaterialRequestUpdate,
    SubcategoryCreate, SubcategoryResponse,
    WarehouseCreate, WarehouseResponse,
    CostCenterCreate, CostCenterResponse,
    BudgetCreate, BudgetResponse,
    PRCreate, PRResponse, PRUpdate, PRApprovalSubmit, PRApprovalResponse,
    PRItemCreate, PRItemResponse,
    QuotationCreate, QuotationResponse, POCreate, POResponse,
    GRNCreate, GRNResponse, IssueCreate, IssueResponse, IssueStatusUpdate,
    ReturnCreate, ReturnResponse, TransferCreate, TransferResponse,
    AdjustmentCreate, AdjustmentResponse, DCCreate, DCResponse,
    ProcurementVendorCreate, ProcurementVendorResponse,
    ProcurementQuotationLineItemCreate, ProcurementQuotationLineItemResponse,
    ProcurementQuotationHeaderCreate, ProcurementQuotationHeaderResponse,
    CalculationRequest, CalculationResponse
)


router = APIRouter(prefix="/stores-consumables", tags=["Stores & Consumables"])

# ─── DASHBOARD STATS ───
@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    return await StoresService.get_dashboard_stats(db)


# ─── CATEGORY ENDPOINTS ───
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    search: Optional[str] = Query(None, description="Search filter for categories"),
    db: AsyncSession = Depends(get_db)
):
    return await StoresService.get_categories(db, search=search)

@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)):
    db_cat = await StoresService.get_category(db, category_id)
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_cat

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryCreate, db: AsyncSession = Depends(get_db)):
    existing = await StoresService.get_category_by_code(db, payload.category_code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Category with code '{payload.category_code}' already exists."
        )
    return await StoresService.create_category(db, payload)

@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: int, payload: CategoryUpdate, db: AsyncSession = Depends(get_db)):
    db_cat = await StoresService.update_category(db, category_id, payload)
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found or already deleted")
    return db_cat

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    success = await StoresService.delete_category(db, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found or already deleted")
    return None


# ─── UOM ENDPOINTS ───
@router.get("/uom", response_model=List[UOMResponse])
async def list_uoms(
    search: Optional[str] = Query(None, description="Search filter for UOMs"),
    db: AsyncSession = Depends(get_db)
):
    return await StoresService.get_uoms(db, search=search)

@router.post("/uom", response_model=UOMResponse, status_code=status.HTTP_201_CREATED)
async def create_uom(payload: UOMCreate, db: AsyncSession = Depends(get_db)):
    existing = await StoresService.get_uom_by_code(db, payload.uom_code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"UOM with code '{payload.uom_code}' already exists."
        )
    return await StoresService.create_uom(db, payload)

@router.put("/uom/{uom_id}", response_model=UOMResponse)
async def update_uom(uom_id: int, payload: UOMUpdate, db: AsyncSession = Depends(get_db)):
    db_uom = await StoresService.update_uom(db, uom_id, payload)
    if not db_uom:
        raise HTTPException(status_code=404, detail="UOM not found or already deleted")
    return db_uom

@router.delete("/uom/{uom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_uom(uom_id: int, db: AsyncSession = Depends(get_db)):
    success = await StoresService.delete_uom(db, uom_id)
    if not success:
        raise HTTPException(status_code=404, detail="UOM not found or already deleted")
    return None


# ─── VENDOR ENDPOINTS ───
@router.get("/vendors", response_model=List[VendorResponse])
async def list_vendors(
    search: Optional[str] = Query(None, description="Search filter for Vendors"),
    db: AsyncSession = Depends(get_db)
):
    return await StoresService.get_vendors(db, search=search)

@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(payload: VendorCreate, db: AsyncSession = Depends(get_db)):
    existing = await StoresService.get_vendor_by_code(db, payload.vendor_code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Vendor with code '{payload.vendor_code}' already exists."
        )
    return await StoresService.create_vendor(db, payload)

@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: int, payload: VendorUpdate, db: AsyncSession = Depends(get_db)):
    db_ven = await StoresService.update_vendor(db, vendor_id, payload)
    if not db_ven:
        raise HTTPException(status_code=404, detail="Vendor not found or already deleted")
    return db_ven

@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(vendor_id: int, db: AsyncSession = Depends(get_db)):
    success = await StoresService.delete_vendor(db, vendor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vendor not found or already deleted")
    return None


# ─── DEPARTMENT ENDPOINTS ───
@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(
    search: Optional[str] = Query(None, description="Search filter for Departments"),
    db: AsyncSession = Depends(get_db)
):
    return await StoresService.get_departments(db, search=search)

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(payload: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    existing = await StoresService.get_department_by_code(db, payload.department_code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Department with code '{payload.department_code}' already exists."
        )
    return await StoresService.create_department(db, payload)

@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(department_id: int, payload: DepartmentUpdate, db: AsyncSession = Depends(get_db)):
    db_dept = await StoresService.update_department(db, department_id, payload)
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found or already deleted")
    return db_dept

@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(department_id: int, db: AsyncSession = Depends(get_db)):
    success = await StoresService.delete_department(db, department_id)
    if not success:
        raise HTTPException(status_code=404, detail="Department not found or already deleted")
    return None


# ─── ITEM ENDPOINTS ───
@router.get("/items", response_model=List[ItemResponse])
async def list_items(
    search: Optional[str] = Query(None, description="Search filter for items"),
    db: AsyncSession = Depends(get_db)
):
    items = await StoresService.get_items(db, search=search, low_stock=False)
    
    # Flatten responses
    res = []
    for item in items:
        resp = ItemResponse.model_validate(item)
        resp.category_name = item.category.category_name if item.category else None
        resp.uom_name = item.uom.uom_name if item.uom else None
        resp.vendor_name = item.vendor.vendor_name if item.vendor else None
        resp.department_name = item.department.department_name if item.department else None
        res.append(resp)
    return res

@router.get("/items/low-stock", response_model=List[ItemResponse])
async def list_low_stock_items(db: AsyncSession = Depends(get_db)):
    items = await StoresService.get_items(db, low_stock=True)
    res = []
    for item in items:
        resp = ItemResponse.model_validate(item)
        resp.category_name = item.category.category_name if item.category else None
        resp.uom_name = item.uom.uom_name if item.uom else None
        resp.vendor_name = item.vendor.vendor_name if item.vendor else None
        resp.department_name = item.department.department_name if item.department else None
        res.append(resp)
    return res

@router.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await StoresService.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    resp = ItemResponse.model_validate(item)
    resp.category_name = item.category.category_name if item.category else None
    resp.uom_name = item.uom.uom_name if item.uom else None
    resp.vendor_name = item.vendor.vendor_name if item.vendor else None
    resp.department_name = item.department.department_name if item.department else None
    return resp

@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(payload: ItemCreate, db: AsyncSession = Depends(get_db)):
    existing = await StoresService.get_item_by_code(db, payload.item_code)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Item with code '{payload.item_code}' already exists."
        )
    item = await StoresService.create_item(db, payload)
    
    resp = ItemResponse.model_validate(item)
    resp.category_name = item.category.category_name if item.category else None
    resp.uom_name = item.uom.uom_name if item.uom else None
    resp.vendor_name = item.vendor.vendor_name if item.vendor else None
    resp.department_name = item.department.department_name if item.department else None
    return resp

@router.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(item_id: int, payload: ItemUpdate, db: AsyncSession = Depends(get_db)):
    item = await StoresService.update_item(db, item_id, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found or already deleted")
        
    resp = ItemResponse.model_validate(item)
    resp.category_name = item.category.category_name if item.category else None
    resp.uom_name = item.uom.uom_name if item.uom else None
    resp.vendor_name = item.vendor.vendor_name if item.vendor else None
    resp.department_name = item.department.department_name if item.department else None
    return resp

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    success = await StoresService.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found or already deleted")
    return None


# ─── SEED DATA ENDPOINT ───
@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_stores_data(db: AsyncSession = Depends(get_db)):
    # 1. Seed Categories
    cats_res = await db.execute(select(StoresCategory))
    cats_list = cats_res.scalars().all()
    cats_map = {c.category_code: c for c in cats_list}
    default_categories = [
        CategoryCreate(category_code="CAT-RAW", category_name="Raw Materials", description="Yarns, fibres, raw cloth"),
        CategoryCreate(category_code="CAT-CNS", category_name="Consumables", description="General lubricants, oils, tapes"),
        CategoryCreate(category_code="CAT-SPR", category_name="Spare Parts", description="Needles, gears, machine parts"),
        CategoryCreate(category_code="CAT-CHM", category_name="Chemicals", description="Dyes, processing acids, sizing starches"),
        CategoryCreate(category_code="CAT-STN", category_name="Stationery", description="Marker pens, tags, print papers"),
        CategoryCreate(category_code="CAT-SFT", category_name="Safety Equipment", description="Gloves, helmets, masks"),
        CategoryCreate(category_code="CAT-PKG", category_name="Packing Materials", description="Cardboard boxes, rolls, straps")
    ]
    seeded_cats = []
    for cat in default_categories:
        if cat.category_code in cats_map:
            db_cat = cats_map[cat.category_code]
            if db_cat.is_deleted:
                db_cat.is_deleted = False
                await db.commit()
            seeded_cats.append(db_cat)
        else:
            seeded_cats.append(await StoresService.create_category(db, cat))

    # 2. Seed UOMs
    uoms_res = await db.execute(select(StoresUOM))
    uoms_list = uoms_res.scalars().all()
    uoms_map = {u.uom_code: u for u in uoms_list}
    default_uoms = [
        UOMCreate(uom_code="UOM-KG", uom_name="Kilogram", symbol="Kg", category="Weight", description="Standard weight"),
        UOMCreate(uom_code="UOM-LTR", uom_name="Litre", symbol="Ltr", category="Volume", description="Standard liquid volume"),
        UOMCreate(uom_code="UOM-RLL", uom_name="Roll", symbol="Rl", category="Count", description="Packing or fabric rolls"),
        UOMCreate(uom_code="UOM-MTR", uom_name="Meter", symbol="m", category="Length", description="Standard metric length"),
        UOMCreate(uom_code="UOM-PCS", uom_name="Piece", symbol="Pcs", category="Count", description="Individual unit count"),
        UOMCreate(uom_code="UOM-BOX", uom_name="Box", symbol="Bx", category="Count", description="Cardboard boxes"),
        UOMCreate(uom_code="UOM-CON", uom_name="Cone", symbol="Cn", category="Count", description="Yarn cone packaging")
    ]
    seeded_uoms = []
    for uom in default_uoms:
        if uom.uom_code in uoms_map:
            db_uom = uoms_map[uom.uom_code]
            if db_uom.is_deleted:
                db_uom.is_deleted = False
                await db.commit()
            seeded_uoms.append(db_uom)
        else:
            seeded_uoms.append(await StoresService.create_uom(db, uom))

    # 3. Seed Departments
    depts_res = await db.execute(select(StoresDepartment))
    depts_list = depts_res.scalars().all()
    depts_map = {d.department_code: d for d in depts_list}
    default_departments = [
        DepartmentCreate(department_code="DEPT-PRD", department_name="Production (Weaving)", department_head="Mr. R. Kumar", description="Main weaving plant"),
        DepartmentCreate(department_code="DEPT-DYE", department_name="Dyeing Unit", department_head="Dr. S. Sharma", description="Yarn & Fabric dyeing division"),
        DepartmentCreate(department_code="DEPT-FNS", department_name="Finishing", department_head="Mr. A. Patel", description="Post-processing fabric finish"),
        DepartmentCreate(department_code="DEPT-PKG", department_name="Packing Unit", department_head="Mr. P. Singh", description="Bailing and roll packing"),
        DepartmentCreate(department_code="DEPT-MNT", department_name="Maintenance", department_head="Mr. D. Verma", description="Electrical and mechanical repairs"),
        DepartmentCreate(department_code="DEPT-QCS", department_name="Quality Control", department_head="Mrs. K. Iyer", description="Fabric testing and shade matching")
    ]
    seeded_depts = []
    for dept in default_departments:
        if dept.department_code in depts_map:
            db_dept = depts_map[dept.department_code]
            if db_dept.is_deleted:
                db_dept.is_deleted = False
                await db.commit()
            seeded_depts.append(db_dept)
        else:
            seeded_depts.append(await StoresService.create_department(db, dept))

    # 4. Seed Vendors
    vens_res = await db.execute(select(StoresVendor))
    vens_list = vens_res.scalars().all()
    vens_map = {v.vendor_code: v for v in vens_list}
    default_vendors = [
        VendorCreate(vendor_code="VEN-ABC", vendor_name="ABC Chemical Suppliers", contact_person="John Doe", phone="9876543210", email="sales@abcchem.com", gst_number="33AABCC1234F1Z1", address="Industrial Zone Phase 1", city="Coimbatore", state="Tamil Nadu", country="India", payment_terms="30 Days", vendor_type="Chemical Supplier"),
        VendorCreate(vendor_code="VEN-DSP", vendor_name="Dinesh Spare Parts Co", contact_person="Dinesh Kumar", phone="9988776655", email="dineshspares@gmail.com", gst_number="33DDPSP5678Q2Z3", address="Market Road Cross 3", city="Erode", state="Tamil Nadu", country="India", payment_terms="15 Days", vendor_type="Machinery Parts"),
        VendorCreate(vendor_code="VEN-SPP", vendor_name="Super Packing Products", contact_person="Vijay Raj", phone="9123456789", email="orders@superpack.in", gst_number="33SSPPP9876R3Z5", address="NH-47 bypass road", city="Salem", state="Tamil Nadu", country="India", payment_terms="Immediate", vendor_type="Packaging Supplier"),
        VendorCreate(vendor_code="VEN-GSH", vendor_name="General Stationery Hub", contact_person="Ravi K.", phone="9444332211", email="ravi@stationeryhub.com", gst_number="33GGSSH0011K4Z8", address="Town Hall Area", city="Tiruppur", state="Tamil Nadu", country="India", payment_terms="45 Days", vendor_type="Stationery Supplier")
    ]
    seeded_vens = []
    for ven in default_vendors:
        if ven.vendor_code in vens_map:
            db_ven = vens_map[ven.vendor_code]
            if db_ven.is_deleted:
                db_ven.is_deleted = False
                await db.commit()
            seeded_vens.append(db_ven)
        else:
            seeded_vens.append(await StoresService.create_vendor(db, ven))

    # 5. Seed Items
    items_res = await db.execute(select(StoresItem))
    items_list = items_res.scalars().all()
    items_map = {i.item_code: i for i in items_list}
    default_items = [
        ItemCreate(
            item_code="ITM-OIL", item_name="Machine Lubricant Oil Grade 40", 
            category_id=seeded_cats[1].id, uom_id=seeded_uoms[1].id, 
            vendor_id=seeded_vens[0].id, department_id=seeded_depts[4].id,
            description="High viscosity machinery oil for looms", 
            minimum_stock=50, maximum_stock=500, reorder_level=100, 
            purchase_price=120.0, current_stock=250, 
            warehouse="Main Warehouse", zone="Zone A", rack="Rack 2", shelf="Shelf 1", bin="Bin A"
        ),
        ItemCreate(
            item_code="ITM-GLV", item_name="Safety Leather Gloves", 
            category_id=seeded_cats[5].id, uom_id=seeded_uoms[4].id, 
            vendor_id=seeded_vens[1].id, department_id=seeded_depts[0].id,
            description="Protective leather work gloves", 
            minimum_stock=20, maximum_stock=200, reorder_level=40, 
            purchase_price=75.0, current_stock=15, 
            warehouse="Safety Depot", zone="Zone D", rack="Rack 1", shelf="Shelf 3", bin="Bin H"
        ),
        ItemCreate(
            item_code="ITM-TAP", item_name="Transparent Packing Tape 2inch", 
            category_id=seeded_cats[6].id, uom_id=seeded_uoms[2].id, 
            vendor_id=seeded_vens[2].id, department_id=seeded_depts[3].id,
            description="Bailing and packing adhesive tape", 
            minimum_stock=100, maximum_stock=1000, reorder_level=200, 
            purchase_price=25.0, current_stock=450, 
            warehouse="Packing Store", zone="Zone P", rack="Rack 4", shelf="Shelf 2", bin="Bin T"
        ),
        ItemCreate(
            item_code="ITM-NDL", item_name="Stitching Needles Size 14", 
            category_id=seeded_cats[2].id, uom_id=seeded_uoms[4].id, 
            vendor_id=seeded_vens[1].id, department_id=seeded_depts[0].id,
            description="High precision needles for stitching machines", 
            minimum_stock=500, maximum_stock=5000, reorder_level=1000, 
            purchase_price=3.5, current_stock=800, 
            warehouse="Spare Depot", zone="Zone S", rack="Rack 3", shelf="Shelf 4", bin="Bin N"
        ),
        ItemCreate(
            item_code="ITM-PEN", item_name="Blue Gel Pens (Markers)", 
            category_id=seeded_cats[4].id, uom_id=seeded_uoms[4].id, 
            vendor_id=seeded_vens[3].id, department_id=seeded_depts[5].id,
            description="Standard marking pens for quality checkers", 
            minimum_stock=50, maximum_stock=300, reorder_level=100, 
            purchase_price=8.0, current_stock=220, 
            warehouse="Stationery cupboard", zone="Zone O", rack="Rack A", shelf="Shelf B", bin="Bin S"
        )
    ]
    seeded_items = []
    for item in default_items:
        if item.item_code in items_map:
            db_itm = items_map[item.item_code]
            if db_itm.is_deleted:
                db_itm.is_deleted = False
                await db.commit()
            seeded_items.append(db_itm)
        else:
            seeded_items.append(await StoresService.create_item(db, item))

    # 6. Seed Subcategories
    subs_res = await db.execute(select(StoresSubcategory))
    subs = subs_res.scalars().all()
    if not subs:
        sub1 = await StoresService.create_subcategory(db, SubcategoryCreate(category_id=seeded_cats[2].id, subcategory_code="SUB-SPR-NDL", subcategory_name="Needles"))
        sub2 = await StoresService.create_subcategory(db, SubcategoryCreate(category_id=seeded_cats[1].id, subcategory_code="SUB-CNS-OIL", subcategory_name="Oils"))
        sub_id = sub2.id
    else:
        sub_id = subs[0].id

    # 7. Seed Warehouses
    whs_res = await db.execute(select(StoresWarehouse))
    whs = whs_res.scalars().all()
    if not whs:
        wh1 = await StoresService.create_warehouse(db, WarehouseCreate(warehouse_code="WH-MAIN", warehouse_name="Main Store Room", location="Building A Ground Floor"))
        wh2 = await StoresService.create_warehouse(db, WarehouseCreate(warehouse_code="WH-SPARE", warehouse_name="Spare Depot", location="Building B 1st Floor"))
    else:
        wh1 = whs[0]
        wh2 = whs[1] if len(whs) > 1 else whs[0]

    # 8. Seed Cost Centers
    ccs_res = await db.execute(select(StoresCostCenter))
    ccs = ccs_res.scalars().all()
    if not ccs:
        cc1 = await StoresService.create_cost_center(db, CostCenterCreate(code="CC-WEAVE", name="Weaving Cost Center"))
        cc2 = await StoresService.create_cost_center(db, CostCenterCreate(code="CC-STITCH", name="Stitching Cost Center"))
    else:
        cc1 = ccs[0]
        cc2 = ccs[1] if len(ccs) > 1 else ccs[0]

    # 9. Seed Budgets
    bgs_res = await db.execute(select(StoresBudget))
    bgs = bgs_res.scalars().all()
    if not bgs:
        bg1 = await StoresService.create_budget(db, BudgetCreate(budget_code="BG-2026-WEAVE", project_code="PROJ-W10", cost_center_id=cc1.id, budget_available=500000.0, budget_used=0.0))
        bg2 = await StoresService.create_budget(db, BudgetCreate(budget_code="BG-2026-STITCH", project_code="PROJ-S20", cost_center_id=cc2.id, budget_available=300000.0, budget_used=0.0))
    else:
        bg1 = bgs[0]
        bg2 = bgs[1] if len(bgs) > 1 else bgs[0]

    # 10. Seed Initial Purchase Requisition
    prs_res = await db.execute(select(StoresPurchaseRequisition))
    prs = prs_res.scalars().all()
    if not prs:
        emp_res = await db.execute(select(Employee).where(Employee.employee_code == "admin"))
        admin_emp = emp_res.scalar()
        admin_emp_id = admin_emp.id if admin_emp else 1

        pr_payload = PRCreate(
            required_date=datetime.now() + timedelta(days=10),
            request_type="Normal",
            priority="Medium",
            description="Initial seed requisition for weaving spares and oils",
            requester_id=admin_emp_id,
            department_id=seeded_depts[0].id,
            cost_center_id=cc1.id,
            branch_factory="Coimbatore Main Plant",
            delivery_warehouse_id=wh1.id,
            delivery_plant="Shed C",
            delivery_department_id=seeded_depts[0].id,
            delivery_address="123 Export Road, Coimbatore",
            expected_delivery_date=datetime.now() + timedelta(days=9),
            budget_id=bg1.id,
            items=[
                PRItemCreate(
                    item_id=seeded_items[0].id, # Machine Oil
                    category_id=seeded_cats[1].id,
                    subcategory_id=sub_id,
                    uom_id=seeded_uoms[1].id,
                    vendor_id=seeded_vens[0].id,
                    warehouse_id=wh1.id,
                    quantity=100.0,
                    estimated_unit_price=120.0,
                    gst=18.0,
                    currency="INR",
                    rack_bin="Rack 2 / Bin A",
                    brand="Servo",
                    specification="Grade 40 Loom Oil",
                    remarks="Loom maintenance lubrication refill"
                )
            ]
        )
        
        seeded_pr = await StoresService.create_purchase_requisition(db, pr_payload, "admin")

        await StoresService.submit_pr_approval(db, seeded_pr.id, PRApprovalSubmit(
            approver_name="Mr. R. Kumar",
            designation="Weaving Dept Manager",
            stage="Department Manager Approval",
            status="Approved",
            comments="Approved for loom servicing."
        ))

    return {
        "message": "Seeding verified!",
        "categories": len(seeded_cats),
        "uoms": len(seeded_uoms),
        "departments": len(seeded_depts),
        "vendors": len(seeded_vens),
        "items": len(seeded_items)
    }





# ─── MATERIAL REQUEST ENDPOINTS ───
@router.get("/requests", response_model=List[MaterialRequestResponse])
async def list_material_requests(
    search: Optional[str] = Query(None, description="Search for requests"),
    db: AsyncSession = Depends(get_db)
):
    requests = await StoresService.get_material_requests(db, search=search)
    res = []
    for req in requests:
        resp = MaterialRequestResponse.model_validate(req)
        resp.department_name = req.department.department_name if req.department else None
        resp.category_name = req.category.category_name if req.category else None
        resp.item_name = req.item.item_name if req.item else None
        resp.uom_name = req.uom.uom_name if req.uom else None
        resp.vendor_name = req.vendor.vendor_name if req.vendor else None
        res.append(resp)
    return res

@router.post("/requests", response_model=MaterialRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_material_request(payload: MaterialRequestCreate, db: AsyncSession = Depends(get_db)):
    req = await StoresService.create_material_request(db, payload)
    resp = MaterialRequestResponse.model_validate(req)
    resp.department_name = req.department.department_name if req.department else None
    resp.category_name = req.category.category_name if req.category else None
    resp.item_name = req.item.item_name if req.item else None
    resp.uom_name = req.uom.uom_name if req.uom else None
    resp.vendor_name = req.vendor.vendor_name if req.vendor else None
    return resp

@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material_request(request_id: int, db: AsyncSession = Depends(get_db)):
    success = await StoresService.delete_material_request(db, request_id)
    if not success:
        raise HTTPException(status_code=404, detail="Material request not found or already deleted")
    return None


# ─── PR DASHBOARD ENDPOINTS ───
@router.get("/pr/stats")
async def get_pr_stats(db: AsyncSession = Depends(get_db)):
    return await StoresService.get_pr_dashboard_stats(db)


# ─── SUBCATEGORY ENDPOINTS ───
@router.get("/subcategories", response_model=List[SubcategoryResponse])
async def list_subcategories(category_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
    return await StoresService.get_subcategories(db, category_id)

@router.post("/subcategories", response_model=SubcategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_subcategory(payload: SubcategoryCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_subcategory(db, payload)


# ─── WAREHOUSE ENDPOINTS ───
@router.get("/warehouses", response_model=List[WarehouseResponse])
async def list_warehouses(db: AsyncSession = Depends(get_db)):
    return await StoresService.get_warehouses(db)

@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(payload: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_warehouse(db, payload)


# ─── COST CENTER ENDPOINTS ───
@router.get("/cost-centers", response_model=List[CostCenterResponse])
async def list_cost_centers(db: AsyncSession = Depends(get_db)):
    return await StoresService.get_cost_centers(db)

@router.post("/cost-centers", response_model=CostCenterResponse, status_code=status.HTTP_201_CREATED)
async def create_cost_center(payload: CostCenterCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_cost_center(db, payload)


# ─── BUDGET ENDPOINTS ───
@router.get("/budgets", response_model=List[BudgetResponse])
async def list_budgets(db: AsyncSession = Depends(get_db)):
    return await StoresService.get_budgets(db)

@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(payload: BudgetCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_budget(db, payload)


# ─── EMPLOYEES ENDPOINTS ───
@router.get("/employees")
async def list_employees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).where(Employee.status == "Active"))
    return result.scalars().all()


# ─── PURCHASE REQUISITION ENDPOINTS ───
@router.get("/pr", response_model=List[PRResponse])
async def list_purchase_requisitions(
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await StoresService.get_purchase_requisitions(db, search=search)

@router.get("/pr/{pr_id}", response_model=PRResponse)
async def get_purchase_requisition(pr_id: int, db: AsyncSession = Depends(get_db)):
    pr = await StoresService.get_purchase_requisition(db, pr_id)
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
    return pr

@router.post("/pr", response_model=PRResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_requisition(payload: PRCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_purchase_requisition(db, payload)

@router.delete("/pr/{pr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_requisition(pr_id: int, db: AsyncSession = Depends(get_db)):
    success = await StoresService.delete_purchase_requisition(db, pr_id)
    if not success:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
    return None

@router.post("/pr/{pr_id}/approve", response_model=PRApprovalResponse, status_code=status.HTTP_201_CREATED)
async def submit_pr_approval(pr_id: int, payload: PRApprovalSubmit, db: AsyncSession = Depends(get_db)):
    app_log = await StoresService.submit_pr_approval(db, pr_id, payload)
    if not app_log:
        raise HTTPException(status_code=404, detail="Purchase Requisition not found")
    return app_log


# ─── SMART FEATURES ENDPOINTS ───
@router.get("/items/{item_id}/purchase-history")
async def get_item_purchase_history(item_id: int, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_purchase_history(db, item_id)

@router.get("/items/{item_id}/vendor-recommendations")
async def get_item_vendor_recommendations(item_id: int, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_vendor_recommendations(db, item_id)


# ─── VENDOR QUOTATION ENDPOINTS ───
@router.post("/quotations", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
async def create_quotation(payload: QuotationCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_quotation(db, payload)

@router.get("/quotations", response_model=List[QuotationResponse])
async def list_quotations(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_quotations(db, search)

@router.get("/quotations/{quotation_id}", response_model=QuotationResponse)
async def get_quotation(quotation_id: int, db: AsyncSession = Depends(get_db)):
    q = await StoresService.get_quotation(db, quotation_id)
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return q

@router.delete("/quotations/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quotation(quotation_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_quotation(db, quotation_id)
    return None


# ─── PURCHASE ORDER ENDPOINTS ───
@router.post("/po", response_model=POResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(payload: POCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_purchase_order(db, payload)

@router.get("/po", response_model=List[POResponse])
async def list_purchase_orders(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_purchase_orders(db, search)

@router.get("/po/{po_id}", response_model=POResponse)
async def get_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    po = await StoresService.get_purchase_order(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return po

@router.delete("/po/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_order(po_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_purchase_order(db, po_id)
    return None


# ─── STOCK INWARD (GRN) ENDPOINTS ───
@router.post("/grn", response_model=GRNResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_inward(payload: GRNCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_stock_inward(db, payload)

@router.get("/grn", response_model=List[GRNResponse])
async def list_stock_inwards(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_stock_inwards(db, search)

@router.get("/grn/{grn_id}", response_model=GRNResponse)
async def get_stock_inward(grn_id: int, db: AsyncSession = Depends(get_db)):
    g = await StoresService.get_stock_inward(db, grn_id)
    if not g:
        raise HTTPException(status_code=404, detail="GRN Stock Inward not found")
    return g

@router.delete("/grn/{grn_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stock_inward(grn_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_stock_inward(db, grn_id)
    return None


# ─── ISSUE TO DEPARTMENT ENDPOINTS ───
@router.post("/issues", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def create_department_issue(payload: IssueCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_department_issue(db, payload)

@router.get("/issues", response_model=List[IssueResponse])
async def list_department_issues(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_department_issues(db, search)

@router.get("/issues/{issue_id}", response_model=IssueResponse)
async def get_department_issue(issue_id: int, db: AsyncSession = Depends(get_db)):
    i = await StoresService.get_department_issue(db, issue_id)
    if not i:
        raise HTTPException(status_code=404, detail="Department Issue not found")
    return i

@router.patch("/issues/{issue_id}/status", response_model=IssueResponse)
async def update_department_issue_status(issue_id: int, payload: IssueStatusUpdate, db: AsyncSession = Depends(get_db)):
    i = await StoresService.update_department_issue_status(db, issue_id, payload)
    if not i:
        raise HTTPException(status_code=404, detail="Department Issue not found")
    return i

@router.delete("/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department_issue(issue_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_department_issue(db, issue_id)
    return None


# ─── RETURN TO STORE ENDPOINTS ───
@router.post("/returns", response_model=ReturnResponse, status_code=status.HTTP_201_CREATED)
async def create_return_to_store(payload: ReturnCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_return_to_store(db, payload)

@router.get("/returns", response_model=List[ReturnResponse])
async def list_returns_to_store(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_returns_to_store(db, search)

@router.get("/returns/{return_id}", response_model=ReturnResponse)
async def get_return_to_store(return_id: int, db: AsyncSession = Depends(get_db)):
    r = await StoresService.get_return_to_store(db, return_id)
    if not r:
        raise HTTPException(status_code=404, detail="Return to Store record not found")
    return r

@router.delete("/returns/{return_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_return_to_store(return_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_return_to_store(db, return_id)
    return None


# ─── STORE TRANSFER ENDPOINTS ───
@router.post("/transfers", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def create_store_transfer(payload: TransferCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_store_transfer(db, payload)

@router.get("/transfers", response_model=List[TransferResponse])
async def list_store_transfers(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_store_transfers(db, search)

@router.get("/transfers/{transfer_id}", response_model=TransferResponse)
async def get_store_transfer(transfer_id: int, db: AsyncSession = Depends(get_db)):
    t = await StoresService.get_store_transfer(db, transfer_id)
    if not t:
        raise HTTPException(status_code=404, detail="Store Transfer not found")
    return t

@router.delete("/transfers/{transfer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store_transfer(transfer_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_store_transfer(db, transfer_id)
    return None


# ─── STOCK ADJUSTMENT ENDPOINTS ───
@router.post("/adjustments", response_model=AdjustmentResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_adjustment(payload: AdjustmentCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_stock_adjustment(db, payload)

@router.get("/adjustments", response_model=List[AdjustmentResponse])
async def list_stock_adjustments(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_stock_adjustments(db, search)

@router.get("/adjustments/{adjustment_id}", response_model=AdjustmentResponse)
async def get_stock_adjustment(adjustment_id: int, db: AsyncSession = Depends(get_db)):
    a = await StoresService.get_stock_adjustment(db, adjustment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Stock Adjustment not found")
    return a

@router.delete("/adjustments/{adjustment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stock_adjustment(adjustment_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_stock_adjustment(db, adjustment_id)
    return None


# ─── RETURNABLE DC ENDPOINTS ───
@router.post("/returnable-dc", response_model=DCResponse, status_code=status.HTTP_201_CREATED)
async def create_returnable_dc(payload: DCCreate, db: AsyncSession = Depends(get_db)):
    return await StoresService.create_returnable_dc(db, payload)

@router.get("/returnable-dc", response_model=List[DCResponse])
async def list_returnable_dcs(search: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await StoresService.get_returnable_dcs(db, search)

@router.get("/returnable-dc/{dc_id}", response_model=DCResponse)
async def get_returnable_dc(dc_id: int, db: AsyncSession = Depends(get_db)):
    d = await StoresService.get_returnable_dc(db, dc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Returnable DC not found")
    return d

@router.delete("/returnable-dc/{dc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_returnable_dc(dc_id: int, db: AsyncSession = Depends(get_db)):
    await StoresService.delete_returnable_dc(db, dc_id)
    return None


# ─── NEW PROCUREMENT VENDOR QUOTATION ENDPOINTS ───
@router.post("/procurement-vendors", response_model=ProcurementVendorResponse, status_code=status.HTTP_201_CREATED)
async def create_procurement_vendor(payload: ProcurementVendorCreate, db: AsyncSession = Depends(get_db)):
    if not payload.vendor_name.strip():
        raise HTTPException(status_code=400, detail="Vendor name cannot be empty")
    db_vendor = ProcurementVendor(vendor_name=payload.vendor_name, contact_info=payload.contact_info)
    db.add(db_vendor)
    await db.commit()
    await db.refresh(db_vendor)
    return db_vendor

@router.get("/procurement-vendors", response_model=List[ProcurementVendorResponse])
async def list_procurement_vendors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcurementVendor))
    return result.scalars().all()

@router.put("/procurement-vendors/{vendor_id}", response_model=ProcurementVendorResponse)
async def update_procurement_vendor(vendor_id: int, payload: ProcurementVendorCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcurementVendor).where(ProcurementVendor.vendor_id == vendor_id))
    db_ven = result.scalar()
    if not db_ven:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if not payload.vendor_name.strip():
        raise HTTPException(status_code=400, detail="Vendor name cannot be empty")
    db_ven.vendor_name = payload.vendor_name
    db_ven.contact_info = payload.contact_info
    await db.commit()
    await db.refresh(db_ven)
    return db_ven

@router.delete("/procurement-vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_procurement_vendor(vendor_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProcurementVendor).where(ProcurementVendor.vendor_id == vendor_id))
    db_ven = result.scalar()
    if not db_ven:
        raise HTTPException(status_code=404, detail="Vendor not found")
    await db.delete(db_ven)
    await db.commit()
    return None

@router.post("/procurement-quotations", response_model=ProcurementQuotationHeaderResponse, status_code=status.HTTP_201_CREATED)
async def create_procurement_quotation(payload: ProcurementQuotationHeaderCreate, db: AsyncSession = Depends(get_db)):
    # 1. Input validation
    if not payload.company_name.strip():
        raise HTTPException(status_code=400, detail="Company name cannot be empty")
    
    # 2. Referential integrity check
    vendor_check = await db.execute(select(ProcurementVendor).where(ProcurementVendor.vendor_id == payload.vendor_id))
    if not vendor_check.scalar():
        raise HTTPException(status_code=400, detail=f"Vendor with ID {payload.vendor_id} does not exist")
    
    # 3. Create quotation header
    db_header = ProcurementQuotationHeader(
        company_name=payload.company_name,
        vendor_id=payload.vendor_id
    )
    db.add(db_header)
    await db.flush() # Get the quotation_id

    # 4. Process line items with calculation and validation
    for item in payload.items:
        if not item.item_name.strip():
            raise HTTPException(status_code=400, detail="Item name cannot be empty")
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
        if item.unit_price < 0:
            raise HTTPException(status_code=400, detail="Unit price cannot be negative")
        if item.gst_percentage < 0:
            raise HTTPException(status_code=400, detail="GST percentage cannot be negative")

        # total = qty * price * (1 + GST%)
        line_total = item.quantity * item.unit_price * (1 + (item.gst_percentage / 100.0))
        
        db_item = ProcurementQuotationLineItem(
            quotation_id=db_header.quotation_id,
            item_name=item.item_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percentage=item.gst_percentage,
            total=round(line_total, 2)
        )
        db.add(db_item)

    await db.commit()
    
    # Load with relationship eager loaded
    result = await db.execute(
        select(ProcurementQuotationHeader)
        .options(
            selectinload(ProcurementQuotationHeader.vendor),
            selectinload(ProcurementQuotationHeader.items)
        )
        .where(ProcurementQuotationHeader.quotation_id == db_header.quotation_id)
    )
    q = result.scalar()
    q.grand_total = sum(item.total for item in q.items)
    
    return q

@router.get("/procurement-quotations", response_model=List[ProcurementQuotationHeaderResponse])
async def list_procurement_quotations(vendor_id: Optional[int] = Query(None), db: AsyncSession = Depends(get_db)):
    query = select(ProcurementQuotationHeader).options(
        selectinload(ProcurementQuotationHeader.vendor),
        selectinload(ProcurementQuotationHeader.items)
    )
    if vendor_id is not None:
        query = query.where(ProcurementQuotationHeader.vendor_id == vendor_id)
    
    result = await db.execute(query)
    quotes = result.scalars().all()
    
    res_list = []
    for q in quotes:
        q.grand_total = sum(item.total for item in q.items)
        res_list.append(q)
        
    return res_list

@router.get("/procurement-quotations/{quotation_id}", response_model=ProcurementQuotationHeaderResponse)
async def get_procurement_quotation_by_id(quotation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcurementQuotationHeader)
        .options(
            selectinload(ProcurementQuotationHeader.vendor),
            selectinload(ProcurementQuotationHeader.items)
        )
        .where(ProcurementQuotationHeader.quotation_id == quotation_id)
    )
    q = result.scalar()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    q.grand_total = sum(item.total for item in q.items)
    return q

@router.delete("/procurement-quotations/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_procurement_quotation(quotation_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcurementQuotationHeader).where(ProcurementQuotationHeader.quotation_id == quotation_id)
    )
    q = result.scalar()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    await db.delete(q)
    await db.commit()
    return None

@router.post("/procurement-quotations/{quotation_id}/items", response_model=ProcurementQuotationLineItemResponse, status_code=status.HTTP_201_CREATED)
async def add_quotation_line_item(quotation_id: int, payload: ProcurementQuotationLineItemCreate, db: AsyncSession = Depends(get_db)):
    # 1. Referential integrity check
    q_check = await db.execute(select(ProcurementQuotationHeader).where(ProcurementQuotationHeader.quotation_id == quotation_id))
    if not q_check.scalar():
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    # 2. Input validation
    if not payload.item_name.strip():
        raise HTTPException(status_code=400, detail="Item name cannot be empty")
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    if payload.unit_price < 0:
        raise HTTPException(status_code=400, detail="Unit price cannot be negative")
    if payload.gst_percentage < 0:
        raise HTTPException(status_code=400, detail="GST percentage cannot be negative")

    # 3. Calculate GST & total
    line_total = payload.quantity * payload.unit_price * (1 + (payload.gst_percentage / 100.0))
    
    db_item = ProcurementQuotationLineItem(
        quotation_id=quotation_id,
        item_name=payload.item_name,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        gst_percentage=payload.gst_percentage,
        total=round(line_total, 2)
    )
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.put("/procurement-quotations/items/{line_item_id}", response_model=ProcurementQuotationLineItemResponse)
async def edit_quotation_line_item(line_item_id: int, payload: ProcurementQuotationLineItemCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcurementQuotationLineItem).where(ProcurementQuotationLineItem.line_item_id == line_item_id)
    )
    db_item = result.scalar()
    if not db_item:
        raise HTTPException(status_code=404, detail="Line item not found")
        
    # Validation
    if not payload.item_name.strip():
        raise HTTPException(status_code=400, detail="Item name cannot be empty")
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    if payload.unit_price < 0:
        raise HTTPException(status_code=400, detail="Unit price cannot be negative")
    if payload.gst_percentage < 0:
        raise HTTPException(status_code=400, detail="GST percentage cannot be negative")

    line_total = payload.quantity * payload.unit_price * (1 + (payload.gst_percentage / 100.0))
    
    db_item.item_name = payload.item_name
    db_item.quantity = payload.quantity
    db_item.unit_price = payload.unit_price
    db_item.gst_percentage = payload.gst_percentage
    db_item.total = round(line_total, 2)
    
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.delete("/procurement-quotations/items/{line_item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quotation_line_item(line_item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcurementQuotationLineItem).where(ProcurementQuotationLineItem.line_item_id == line_item_id)
    )
    db_item = result.scalar()
    if not db_item:
        raise HTTPException(status_code=404, detail="Line item not found")
        
    await db.delete(db_item)
    await db.commit()
    return None

@router.post("/procurement-quotations/calculate", response_model=CalculationResponse)
async def calculate_totals(payload: CalculationRequest):
    res_items = []
    grand_total = 0.0
    for item in payload.items:
        if item.quantity <= 0 or item.unit_price < 0 or item.gst_percentage < 0:
            raise HTTPException(status_code=400, detail="Invalid item input numeric values")
        
        line_total = item.quantity * item.unit_price * (1 + (item.gst_percentage / 100.0))
        total = round(line_total, 2)
        grand_total += total
        res_items.append(CalculationResponseItem(
            item_name=item.item_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percentage=item.gst_percentage,
            total=total
        ))
    return CalculationResponse(items=res_items, grand_total=round(grand_total, 2))



