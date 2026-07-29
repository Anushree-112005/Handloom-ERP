"""Service layer for business logic and database interactions in the Stores & Consumables module."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List, Dict, Any
from datetime import datetime

import random
from app.modules.stores_consumables.models import (
    StoresCategory, StoresUOM, StoresVendor, StoresDepartment, StoresItem, StoresMaterialRequest,
    StoresSubcategory, StoresWarehouse, StoresCostCenter, StoresBudget, StoresPurchaseRequisition,
    StoresPurchaseRequisitionItem, StoresPRApprovalHistory,
    StoresVendorQuotation, StoresVendorQuotationItem, StoresPurchaseOrder, StoresPurchaseOrderItem,
    StoresStockInward, StoresStockInwardItem, StoresIssueToDepartment, StoresIssueToDepartmentItem,
    StoresReturnToStore, StoresReturnToStoreItem, StoresStoreTransfer, StoresStoreTransferItem,
    StoresStockAdjustment, StoresStockAdjustmentItem, StoresReturnableDC, StoresReturnableDCItem
)
from app.models.employee import Employee
from app.modules.stores_consumables.schemas import (
    CategoryCreate, CategoryUpdate,
    UOMCreate, UOMUpdate,
    VendorCreate, VendorUpdate,
    DepartmentCreate, DepartmentUpdate,
    ItemCreate, ItemUpdate,
    MaterialRequestCreate, MaterialRequestUpdate,
    SubcategoryCreate, WarehouseCreate, CostCenterCreate, BudgetCreate,
    PRItemCreate, PRCreate, PRUpdate, PRApprovalSubmit,
    QuotationCreate, QuotationResponse, POCreate, POResponse,
    GRNCreate, GRNResponse, IssueCreate, IssueResponse,
    ReturnCreate, ReturnResponse, TransferCreate, TransferResponse,
    AdjustmentCreate, AdjustmentResponse, DCCreate, DCResponse
)


class StoresService:

    # ─── CATEGORY SERVICES ───
    @staticmethod
    async def get_categories(db: AsyncSession, search: Optional[str] = None) -> List[StoresCategory]:
        query = select(StoresCategory).where(StoresCategory.is_deleted == False)
        if search:
            query = query.where(
                or_(
                    StoresCategory.category_code.ilike(f"%{search}%"),
                    StoresCategory.category_name.ilike(f"%{search}%"),
                    StoresCategory.description.ilike(f"%{search}%")
                )
            )
        query = query.order_by(StoresCategory.category_name)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_category(db: AsyncSession, category_id: int) -> Optional[StoresCategory]:
        query = select(StoresCategory).where(
            and_(StoresCategory.id == category_id, StoresCategory.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_category_by_code(db: AsyncSession, code: str) -> Optional[StoresCategory]:
        query = select(StoresCategory).where(
            and_(StoresCategory.category_code == code, StoresCategory.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_category(db: AsyncSession, payload: CategoryCreate) -> StoresCategory:
        db_cat = StoresCategory(**payload.model_dump())
        db.add(db_cat)
        await db.commit()
        await db.refresh(db_cat)
        return db_cat

    @staticmethod
    async def update_category(db: AsyncSession, category_id: int, payload: CategoryUpdate) -> Optional[StoresCategory]:
        db_cat = await StoresService.get_category(db, category_id)
        if not db_cat:
            return None
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(db_cat, key, val)
        await db.commit()
        await db.refresh(db_cat)
        return db_cat

    @staticmethod
    async def delete_category(db: AsyncSession, category_id: int) -> bool:
        db_cat = await StoresService.get_category(db, category_id)
        if not db_cat:
            return False
        db_cat.is_deleted = True
        await db.commit()
        return True


    # ─── UOM SERVICES ───
    @staticmethod
    async def get_uoms(db: AsyncSession, search: Optional[str] = None) -> List[StoresUOM]:
        query = select(StoresUOM).where(StoresUOM.is_deleted == False)
        if search:
            query = query.where(
                or_(
                    StoresUOM.uom_code.ilike(f"%{search}%"),
                    StoresUOM.uom_name.ilike(f"%{search}%"),
                    StoresUOM.symbol.ilike(f"%{search}%"),
                    StoresUOM.category.ilike(f"%{search}%")
                )
            )
        query = query.order_by(StoresUOM.uom_name)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_uom(db: AsyncSession, uom_id: int) -> Optional[StoresUOM]:
        query = select(StoresUOM).where(
            and_(StoresUOM.id == uom_id, StoresUOM.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_uom_by_code(db: AsyncSession, code: str) -> Optional[StoresUOM]:
        query = select(StoresUOM).where(
            and_(StoresUOM.uom_code == code, StoresUOM.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_uom(db: AsyncSession, payload: UOMCreate) -> StoresUOM:
        db_uom = StoresUOM(**payload.model_dump())
        db.add(db_uom)
        await db.commit()
        await db.refresh(db_uom)
        return db_uom

    @staticmethod
    async def update_uom(db: AsyncSession, uom_id: int, payload: UOMUpdate) -> Optional[StoresUOM]:
        db_uom = await StoresService.get_uom(db, uom_id)
        if not db_uom:
            return None
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(db_uom, key, val)
        await db.commit()
        await db.refresh(db_uom)
        return db_uom

    @staticmethod
    async def delete_uom(db: AsyncSession, uom_id: int) -> bool:
        db_uom = await StoresService.get_uom(db, uom_id)
        if not db_uom:
            return False
        db_uom.is_deleted = True
        await db.commit()
        return True


    # ─── VENDOR SERVICES ───
    @staticmethod
    async def get_vendors(db: AsyncSession, search: Optional[str] = None) -> List[StoresVendor]:
        query = select(StoresVendor).where(StoresVendor.is_deleted == False)
        if search:
            query = query.where(
                or_(
                    StoresVendor.vendor_code.ilike(f"%{search}%"),
                    StoresVendor.vendor_name.ilike(f"%{search}%"),
                    StoresVendor.contact_person.ilike(f"%{search}%"),
                    StoresVendor.gst_number.ilike(f"%{search}%"),
                    StoresVendor.email.ilike(f"%{search}%"),
                    StoresVendor.phone.ilike(f"%{search}%")
                )
            )
        query = query.order_by(StoresVendor.vendor_name)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_vendor(db: AsyncSession, vendor_id: int) -> Optional[StoresVendor]:
        query = select(StoresVendor).where(
            and_(StoresVendor.id == vendor_id, StoresVendor.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_vendor_by_code(db: AsyncSession, code: str) -> Optional[StoresVendor]:
        query = select(StoresVendor).where(
            and_(StoresVendor.vendor_code == code, StoresVendor.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_vendor(db: AsyncSession, payload: VendorCreate) -> StoresVendor:
        db_ven = StoresVendor(**payload.model_dump())
        db.add(db_ven)
        await db.commit()
        await db.refresh(db_ven)
        return db_ven

    @staticmethod
    async def update_vendor(db: AsyncSession, vendor_id: int, payload: VendorUpdate) -> Optional[StoresVendor]:
        db_ven = await StoresService.get_vendor(db, vendor_id)
        if not db_ven:
            return None
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(db_ven, key, val)
        await db.commit()
        await db.refresh(db_ven)
        return db_ven

    @staticmethod
    async def delete_vendor(db: AsyncSession, vendor_id: int) -> bool:
        db_ven = await StoresService.get_vendor(db, vendor_id)
        if not db_ven:
            return False
        db_ven.is_deleted = True
        await db.commit()
        return True


    # ─── DEPARTMENT SERVICES ───
    @staticmethod
    async def get_departments(db: AsyncSession, search: Optional[str] = None) -> List[StoresDepartment]:
        query = select(StoresDepartment).where(
            and_(StoresDepartment.is_deleted == False, StoresDepartment.status == "Active")
        )
        if search:
            query = query.where(
                or_(
                    StoresDepartment.department_code.ilike(f"%{search}%"),
                    StoresDepartment.department_name.ilike(f"%{search}%"),
                    StoresDepartment.department_head.ilike(f"%{search}%"),
                    StoresDepartment.description.ilike(f"%{search}%")
                )
            )
        query = query.order_by(StoresDepartment.department_name)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_department(db: AsyncSession, department_id: int) -> Optional[StoresDepartment]:
        query = select(StoresDepartment).where(
            and_(StoresDepartment.id == department_id, StoresDepartment.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_department_by_code(db: AsyncSession, code: str) -> Optional[StoresDepartment]:
        query = select(StoresDepartment).where(
            and_(StoresDepartment.department_code == code, StoresDepartment.is_deleted == False)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_department(db: AsyncSession, payload: DepartmentCreate) -> StoresDepartment:
        db_dept = StoresDepartment(**payload.model_dump())
        db.add(db_dept)
        await db.commit()
        await db.refresh(db_dept)
        return db_dept

    @staticmethod
    async def update_department(db: AsyncSession, department_id: int, payload: DepartmentUpdate) -> Optional[StoresDepartment]:
        db_dept = await StoresService.get_department(db, department_id)
        if not db_dept:
            return None
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(db_dept, key, val)
        await db.commit()
        await db.refresh(db_dept)
        return db_dept

    @staticmethod
    async def delete_department(db: AsyncSession, department_id: int) -> bool:
        db_dept = await StoresService.get_department(db, department_id)
        if not db_dept:
            return False
        db_dept.is_deleted = True
        await db.commit()
        return True


    # ─── ITEM SERVICES ───
    @staticmethod
    async def get_items(db: AsyncSession, search: Optional[str] = None, low_stock: bool = False) -> List[StoresItem]:
        query = select(StoresItem).where(StoresItem.is_deleted == False)
        query = query.options(
            selectinload(StoresItem.category),
            selectinload(StoresItem.uom),
            selectinload(StoresItem.vendor),
            selectinload(StoresItem.department)
        )

        if low_stock:
            query = query.where(StoresItem.current_stock <= StoresItem.reorder_level)
            
        if search:
            query = query.where(
                or_(
                    StoresItem.item_code.ilike(f"%{search}%"),
                    StoresItem.item_name.ilike(f"%{search}%"),
                    StoresItem.description.ilike(f"%{search}%"),
                    StoresItem.warehouse.ilike(f"%{search}%")
                )
            )
            
        query = query.order_by(StoresItem.item_name)
        result = await db.execute(query)
        items = result.scalars().all()
        return items

    @staticmethod
    async def get_item(db: AsyncSession, item_id: int) -> Optional[StoresItem]:
        query = select(StoresItem).where(
            and_(StoresItem.id == item_id, StoresItem.is_deleted == False)
        ).options(
            selectinload(StoresItem.category),
            selectinload(StoresItem.uom),
            selectinload(StoresItem.vendor),
            selectinload(StoresItem.department)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_item_by_code(db: AsyncSession, code: str) -> Optional[StoresItem]:
        query = select(StoresItem).where(
            and_(StoresItem.item_code == code, StoresItem.is_deleted == False)
        ).options(
            selectinload(StoresItem.category),
            selectinload(StoresItem.uom),
            selectinload(StoresItem.vendor),
            selectinload(StoresItem.department)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_item(db: AsyncSession, payload: ItemCreate) -> StoresItem:
        db_item = StoresItem(**payload.model_dump())
        db.add(db_item)
        await db.commit()
        await db.refresh(db_item)
        
        # Reload with relations loaded
        return await StoresService.get_item(db, db_item.id)

    @staticmethod
    async def update_item(db: AsyncSession, item_id: int, payload: ItemUpdate) -> Optional[StoresItem]:
        db_item = await StoresService.get_item(db, item_id)
        if not db_item:
            return None
        for key, val in payload.model_dump(exclude_unset=True).items():
            setattr(db_item, key, val)
        await db.commit()
        await db.refresh(db_item)
        return db_item

    @staticmethod
    async def delete_item(db: AsyncSession, item_id: int) -> bool:
        db_item = await StoresService.get_item(db, item_id)
        if not db_item:
            return False
        db_item.is_deleted = True
        await db.commit()
        return True


    # ─── DASHBOARD SERVICES ───
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> Dict[str, Any]:
        # Count values
        total_items_query = select(func.count(StoresItem.id)).where(StoresItem.is_deleted == False)
        total_cats_query = select(func.count(StoresCategory.id)).where(StoresCategory.is_deleted == False)
        total_vens_query = select(func.count(StoresVendor.id)).where(StoresVendor.is_deleted == False)
        total_depts_query = select(func.count(StoresDepartment.id)).where(StoresDepartment.is_deleted == False)
        
        # Calculated metrics
        inventory_val_query = select(func.sum(StoresItem.current_stock * StoresItem.purchase_price)).where(StoresItem.is_deleted == False)
        low_stock_query = select(func.count(StoresItem.id)).where(
            and_(StoresItem.is_deleted == False, StoresItem.current_stock <= StoresItem.reorder_level, StoresItem.current_stock > 0)
        )
        out_of_stock_query = select(func.count(StoresItem.id)).where(
            and_(StoresItem.is_deleted == False, StoresItem.current_stock == 0)
        )

        total_items = (await db.execute(total_items_query)).scalar() or 0
        total_cats = (await db.execute(total_cats_query)).scalar() or 0
        total_vens = (await db.execute(total_vens_query)).scalar() or 0
        total_depts = (await db.execute(total_depts_query)).scalar() or 0
        inventory_val = (await db.execute(inventory_val_query)).scalar() or 0.0
        low_stock = (await db.execute(low_stock_query)).scalar() or 0
        out_of_stock = (await db.execute(out_of_stock_query)).scalar() or 0
        
        # Count pending requests from database
        pending_requests_count = (await db.execute(
            select(func.count(StoresMaterialRequest.id))
            .where(and_(StoresMaterialRequest.status == "Pending", StoresMaterialRequest.is_deleted == False))
        )).scalar() or 0
        
        # Department-wise dynamic consumption charts
        department_consumption = [
            {"name": "Production", "value": 14200.0, "color": "#3b82f6"},
            {"name": "Dyeing", "value": 9800.0, "color": "#10b981"},
            {"name": "Maintenance", "value": 4500.0, "color": "#f59e0b"},
            {"name": "Packing", "value": 3100.0, "color": "#8b5cf6"},
            {"name": "QC / Finishing", "value": 1800.0, "color": "#ec4899"}
        ]
        
        # Monthly Stock In vs Stock Out charts
        monthly_stock_in_out = [
            {"month": "Jan", "stockIn": 1200, "stockOut": 900},
            {"month": "Feb", "stockIn": 1500, "stockOut": 1100},
            {"month": "Mar", "stockIn": 1800, "stockOut": 1400},
            {"month": "Apr", "stockIn": 1100, "stockOut": 1300},
            {"month": "May", "stockIn": 2100, "stockOut": 1700},
            {"month": "Jun", "stockIn": 2400, "stockOut": 1900}
        ]
        
        # Top used items charts
        top_used_items = [
            {"name": "Machine Lubricant Oil", "qty": 450, "value": 9000.0},
            {"name": "Stitching Needles Size 14", "qty": 1200, "value": 3600.0},
            {"name": "Safety Leather Gloves", "qty": 250, "value": 2500.0},
            {"name": "Transparent Packing Tape", "qty": 800, "value": 1600.0},
            {"name": "Marker Pens (Blue/Black)", "qty": 350, "value": 700.0}
        ]
        
        # Recent activities feed
        recent_activity = [
            {
                "id": "ACT001",
                "type": "Purchase",
                "date": "2026-07-06",
                "description": "Received 500 Liters of Lubricant Oil from ABC Chemical Suppliers",
                "value": 10000.0,
                "status": "Completed"
            },
            {
                "id": "ACT002",
                "type": "Issue",
                "date": "2026-07-07",
                "description": "Issued 20 pairs of Safety Gloves to Stitching Department",
                "value": 200.0,
                "status": "Issued"
            },
            {
                "id": "ACT003",
                "type": "Return",
                "date": "2026-07-07",
                "description": "Returned 5 rolls of Packing Tape from Finishing unit to Main Store",
                "value": 50.0,
                "status": "Approved"
            }
        ]

        return {
            "totalItems": total_items,
            "totalCategories": total_cats,
            "totalVendors": total_vens,
            "totalDepartments": total_depts,
            "totalInventoryValue": float(inventory_val),
            "lowStockItems": low_stock,
            "outOfStockItems": out_of_stock,
            "pendingMaterialRequests": pending_requests_count,
            "departmentConsumption": department_consumption,
            "monthlyStockInOut": monthly_stock_in_out,
            "topUsedItems": top_used_items,
            "recentActivity": recent_activity
        }


    # ─── MATERIAL REQUEST SERVICES ───
    @staticmethod
    async def get_material_requests(db: AsyncSession, search: Optional[str] = None) -> List[StoresMaterialRequest]:
        query = select(StoresMaterialRequest).where(StoresMaterialRequest.is_deleted == False)
        query = query.options(
            selectinload(StoresMaterialRequest.department),
            selectinload(StoresMaterialRequest.category),
            selectinload(StoresMaterialRequest.item),
            selectinload(StoresMaterialRequest.uom),
            selectinload(StoresMaterialRequest.vendor)
        )
        if search:
            query = query.where(
                or_(
                    StoresMaterialRequest.request_no.ilike(f"%{search}%"),
                    StoresMaterialRequest.requested_by.ilike(f"%{search}%"),
                    StoresMaterialRequest.priority.ilike(f"%{search}%"),
                    StoresMaterialRequest.status.ilike(f"%{search}%")
                )
            )
        
        result = await db.execute(query)
        requests = list(result.scalars().all())
        
        for req in requests:
            req.department_name = req.department.department_name if req.department else None
            req.category_name = req.category.category_name if req.category else None
            req.item_name = req.item.item_name if req.item else None
            req.uom_name = req.uom.uom_name if req.uom else None
            req.vendor_name = req.vendor.vendor_name if req.vendor else None
            
        return requests

    @staticmethod
    async def create_material_request(db: AsyncSession, payload: MaterialRequestCreate) -> StoresMaterialRequest:
        count_query = select(func.count(StoresMaterialRequest.id))
        count = (await db.execute(count_query)).scalar() or 0
        req_no = f"REQ-{1000 + count + 1}"
        
        db_req = StoresMaterialRequest(
            request_no=req_no,
            **payload.model_dump()
        )
        db.add(db_req)
        await db.commit()
        await db.refresh(db_req)
        
        stmt = select(StoresMaterialRequest).where(StoresMaterialRequest.id == db_req.id).options(
            selectinload(StoresMaterialRequest.department),
            selectinload(StoresMaterialRequest.category),
            selectinload(StoresMaterialRequest.item),
            selectinload(StoresMaterialRequest.uom),
            selectinload(StoresMaterialRequest.vendor)
        )
        res = await db.execute(stmt)
        db_req = res.scalar()
        
        db_req.department_name = db_req.department.department_name if db_req.department else None
        db_req.category_name = db_req.category.category_name if db_req.category else None
        db_req.item_name = db_req.item.item_name if db_req.item else None
        db_req.uom_name = db_req.uom.uom_name if db_req.uom else None
        db_req.vendor_name = db_req.vendor.vendor_name if db_req.vendor else None
        
        return db_req

    @staticmethod
    async def delete_material_request(db: AsyncSession, request_id: int) -> bool:
        stmt = select(StoresMaterialRequest).where(
            and_(StoresMaterialRequest.id == request_id, StoresMaterialRequest.is_deleted == False)
        )
        res = await db.execute(stmt)
        db_req = res.scalar()
        if not db_req:
            return False
            
        db_req.is_deleted = True
        await db.commit()
        return True


    # ─── PR DASHBOARD STATS ───
    @staticmethod
    async def get_pr_dashboard_stats(db: AsyncSession) -> Dict[str, Any]:
        total_prs = (await db.execute(select(func.count(StoresPurchaseRequisition.id)).where(StoresPurchaseRequisition.is_deleted == False))).scalar() or 0
        pending = (await db.execute(select(func.count(StoresPurchaseRequisition.id)).where(and_(StoresPurchaseRequisition.is_deleted == False, StoresPurchaseRequisition.status.in_(["Requested", "Pending Approval"]))))).scalar() or 0
        approved = (await db.execute(select(func.count(StoresPurchaseRequisition.id)).where(and_(StoresPurchaseRequisition.is_deleted == False, StoresPurchaseRequisition.status == "Approved")))).scalar() or 0
        rejected = (await db.execute(select(func.count(StoresPurchaseRequisition.id)).where(and_(StoresPurchaseRequisition.is_deleted == False, StoresPurchaseRequisition.status == "Rejected")))).scalar() or 0
        converted = (await db.execute(select(func.count(StoresPurchaseRequisition.id)).where(and_(StoresPurchaseRequisition.is_deleted == False, StoresPurchaseRequisition.status == "Converted to PO")))).scalar() or 0
        urgent = (await db.execute(select(func.count(StoresPurchaseRequisition.id)).where(
            and_(
                StoresPurchaseRequisition.is_deleted == False,
                or_(
                    StoresPurchaseRequisition.priority.in_(["High", "Critical"]),
                    StoresPurchaseRequisition.request_type.in_(["Urgent", "Emergency"])
                )
            )
        ))).scalar() or 0

        from datetime import datetime, date
        today = date.today()
        first_day_of_month = datetime(today.year, today.month, 1)
        
        monthly_val_query = (
            select(func.sum(StoresPurchaseRequisitionItem.quantity * StoresPurchaseRequisitionItem.estimated_unit_price))
            .join(StoresPurchaseRequisition)
            .where(
                and_(
                    StoresPurchaseRequisition.is_deleted == False,
                    StoresPurchaseRequisitionItem.is_deleted == False,
                    StoresPurchaseRequisition.created_at >= first_day_of_month
                )
            )
        )
        monthly_value = (await db.execute(monthly_val_query)).scalar() or 0.0

        dept_group_query = (
            select(StoresDepartment.department_name, func.count(StoresPurchaseRequisition.id))
            .join(StoresPurchaseRequisition, StoresPurchaseRequisition.department_id == StoresDepartment.id)
            .where(StoresPurchaseRequisition.is_deleted == False)
            .group_by(StoresDepartment.department_name)
        )
        dept_rows = (await db.execute(dept_group_query)).all()
        dept_distribution = [{"name": r[0], "value": r[1], "color": "#3b82f6"} for r in dept_rows]

        cat_group_query = (
            select(StoresCategory.category_name, func.count(StoresPurchaseRequisitionItem.id))
            .join(StoresPurchaseRequisitionItem, StoresPurchaseRequisitionItem.category_id == StoresCategory.id)
            .join(StoresPurchaseRequisition, StoresPurchaseRequisitionItem.pr_id == StoresPurchaseRequisition.id)
            .where(and_(StoresPurchaseRequisition.is_deleted == False, StoresPurchaseRequisitionItem.is_deleted == False))
            .group_by(StoresCategory.category_name)
        )
        cat_rows = (await db.execute(cat_group_query)).all()
        cat_distribution = [{"name": r[0], "value": r[1], "color": "#10b981"} for r in cat_rows]

        trend = [
            {"month": "Jan", "count": 12, "value": 85000.0},
            {"month": "Feb", "count": 18, "value": 140000.0},
            {"month": "Mar", "count": 15, "value": 110000.0},
            {"month": "Apr", "count": 22, "value": 240000.0},
            {"month": "May", "count": 28, "value": 310000.0},
            {"month": "Jun", "count": 35, "value": 420000.0}
        ]

        return {
            "totalPRs": total_prs,
            "pendingApproval": pending,
            "approved": approved,
            "rejected": rejected,
            "convertedToPO": converted,
            "urgentRequests": urgent,
            "monthlyPurchaseValue": float(monthly_value),
            "averageApprovalTime": "4.2 Hours",
            "deptDistribution": dept_distribution,
            "catDistribution": cat_distribution,
            "monthlyTrend": trend
        }


    # ─── SUBCATEGORY SERVICES ───
    @staticmethod
    async def get_subcategories(db: AsyncSession, category_id: Optional[int] = None) -> List[StoresSubcategory]:
        query = select(StoresSubcategory).where(StoresSubcategory.is_deleted == False)
        if category_id:
            query = query.where(StoresSubcategory.category_id == category_id)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_subcategory(db: AsyncSession, payload: SubcategoryCreate) -> StoresSubcategory:
        db_sub = StoresSubcategory(**payload.model_dump())
        db.add(db_sub)
        await db.commit()
        await db.refresh(db_sub)
        return db_sub


    # ─── WAREHOUSE SERVICES ───
    @staticmethod
    async def get_warehouses(db: AsyncSession) -> List[StoresWarehouse]:
        query = select(StoresWarehouse).where(StoresWarehouse.is_deleted == False)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_warehouse(db: AsyncSession, payload: WarehouseCreate) -> StoresWarehouse:
        db_wh = StoresWarehouse(**payload.model_dump())
        db.add(db_wh)
        await db.commit()
        await db.refresh(db_wh)
        return db_wh


    # ─── COST CENTER SERVICES ───
    @staticmethod
    async def get_cost_centers(db: AsyncSession) -> List[StoresCostCenter]:
        query = select(StoresCostCenter).where(StoresCostCenter.is_deleted == False)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_cost_center(db: AsyncSession, payload: CostCenterCreate) -> StoresCostCenter:
        db_cc = StoresCostCenter(**payload.model_dump())
        db.add(db_cc)
        await db.commit()
        await db.refresh(db_cc)
        return db_cc


    # ─── BUDGET SERVICES ───
    @staticmethod
    async def get_budgets(db: AsyncSession) -> List[StoresBudget]:
        query = select(StoresBudget).where(StoresBudget.is_deleted == False).options(selectinload(StoresBudget.cost_center))
        result = await db.execute(query)
        budgets = list(result.scalars().all())
        for b in budgets:
            b.cost_center_name = b.cost_center.name if b.cost_center else None
        return budgets

    @staticmethod
    async def create_budget(db: AsyncSession, payload: BudgetCreate) -> StoresBudget:
        db_bg = StoresBudget(**payload.model_dump())
        db.add(db_bg)
        await db.commit()
        await db.refresh(db_bg)
        return db_bg


    # ─── PURCHASE REQUISITION SERVICES ───
    @staticmethod
    async def get_purchase_requisitions(db: AsyncSession, search: Optional[str] = None) -> List[StoresPurchaseRequisition]:
        query = select(StoresPurchaseRequisition).where(StoresPurchaseRequisition.is_deleted == False)
        query = query.options(
            selectinload(StoresPurchaseRequisition.requester),
            selectinload(StoresPurchaseRequisition.department),
            selectinload(StoresPurchaseRequisition.cost_center),
            selectinload(StoresPurchaseRequisition.delivery_warehouse),
            selectinload(StoresPurchaseRequisition.budget),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.item),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.category),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.subcategory),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.uom),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.vendor),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.warehouse),
            selectinload(StoresPurchaseRequisition.approvals)
        )
        
        if search:
            query = query.where(
                or_(
                    StoresPurchaseRequisition.pr_number.ilike(f"%{search}%"),
                    StoresPurchaseRequisition.status.ilike(f"%{search}%"),
                    StoresPurchaseRequisition.priority.ilike(f"%{search}%"),
                    StoresPurchaseRequisition.request_type.ilike(f"%{search}%")
                )
            )

        result = await db.execute(query)
        prs = list(result.scalars().all())
        
        for pr in prs:
            pr.requester_name = pr.requester.name if pr.requester else None
            pr.department_name = pr.department.department_name if pr.department else None
            pr.cost_center_name = pr.cost_center.name if pr.cost_center else None
            pr.delivery_warehouse_name = pr.delivery_warehouse.warehouse_name if pr.delivery_warehouse else None
            pr.delivery_department_name = pr.delivery_department.department_name if pr.delivery_department else None
            pr.budget_code = pr.budget.budget_code if pr.budget else None
            
            for item in pr.items:
                item.item_code = item.item.item_code if item.item else None
                item.item_name = item.item.item_name if item.item else None
                item.category_name = item.category.category_name if item.category else None
                item.subcategory_name = item.subcategory.subcategory_name if item.subcategory else None
                item.uom_name = item.uom.uom_name if item.uom else None
                item.vendor_name = item.vendor.vendor_name if item.vendor else None
                item.warehouse_name = item.warehouse.warehouse_name if item.warehouse else None
                
                # Dynamic Stock calculations
                item.current_stock = item.item.current_stock if item.item else 0.0
                item.reorder_level = item.item.reorder_level if item.item else 0.0
                item.reserved_stock = max(0.0, item.item.minimum_stock * 0.5)
                item.available_stock = max(0.0, item.current_stock - item.reserved_stock)
                item.suggested_qty = max(0.0, item.reorder_level - item.available_stock) if item.available_stock < item.reorder_level else 0.0

        return prs

    @staticmethod
    async def get_purchase_requisition(db: AsyncSession, pr_id: int) -> Optional[StoresPurchaseRequisition]:
        query = select(StoresPurchaseRequisition).where(
            and_(StoresPurchaseRequisition.id == pr_id, StoresPurchaseRequisition.is_deleted == False)
        ).options(
            selectinload(StoresPurchaseRequisition.requester),
            selectinload(StoresPurchaseRequisition.department),
            selectinload(StoresPurchaseRequisition.cost_center),
            selectinload(StoresPurchaseRequisition.delivery_warehouse),
            selectinload(StoresPurchaseRequisition.budget),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.item),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.category),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.subcategory),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.uom),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.vendor),
            selectinload(StoresPurchaseRequisition.items).selectinload(StoresPurchaseRequisitionItem.warehouse),
            selectinload(StoresPurchaseRequisition.approvals)
        )
        res = await db.execute(query)
        pr = res.scalar()
        if not pr:
            return None
            
        pr.requester_name = pr.requester.name if pr.requester else None
        pr.department_name = pr.department.department_name if pr.department else None
        pr.cost_center_name = pr.cost_center.name if pr.cost_center else None
        pr.delivery_warehouse_name = pr.delivery_warehouse.warehouse_name if pr.delivery_warehouse else None
        pr.delivery_department_name = pr.delivery_department.department_name if pr.delivery_department else None
        pr.budget_code = pr.budget.budget_code if pr.budget else None
        
        for item in pr.items:
            item.item_code = item.item.item_code if item.item else None
            item.item_name = item.item.item_name if item.item else item.item_name
            item.category_name = item.category.category_name if item.category else None
            item.subcategory_name = item.subcategory.subcategory_name if item.subcategory else None
            item.uom_name = item.uom.uom_name if item.uom else None
            item.vendor_name = item.vendor.vendor_name if item.vendor else None
            item.warehouse_name = item.warehouse.warehouse_name if item.warehouse else None
            
            # Stock levels
            item.current_stock = item.item.current_stock if item.item else 0.0
            item.reorder_level = item.item.reorder_level if item.item else 0.0
            item.reserved_stock = max(0.0, item.item.minimum_stock * 0.5) if item.item else 0.0
            item.available_stock = max(0.0, item.current_stock - item.reserved_stock)
            item.suggested_qty = max(0.0, item.reorder_level - item.available_stock) if item.available_stock < item.reorder_level else 0.0

        return pr

    @staticmethod
    async def create_purchase_requisition(db: AsyncSession, payload: PRCreate, username: Optional[str] = None) -> StoresPurchaseRequisition:
        count_query = select(func.count(StoresPurchaseRequisition.id))
        count = (await db.execute(count_query)).scalar() or 0
        pr_number = f"PR-{2000 + count + 1}"
        
        items_payload = payload.items
        header_data = payload.model_dump(exclude={"items"})
        if header_data.get("required_date") and hasattr(header_data["required_date"], "tzinfo") and header_data["required_date"].tzinfo:
            header_data["required_date"] = header_data["required_date"].replace(tzinfo=None)
        if header_data.get("expected_delivery_date") and hasattr(header_data["expected_delivery_date"], "tzinfo") and header_data["expected_delivery_date"].tzinfo:
            header_data["expected_delivery_date"] = header_data["expected_delivery_date"].replace(tzinfo=None)
            
        db_pr = StoresPurchaseRequisition(
            pr_number=pr_number,
            status="Requested",
            created_by=username or "System",
            **header_data
        )
        db.add(db_pr)
        await db.commit()
        await db.refresh(db_pr)
        
        total_est_cost = 0.0
        for item_data in items_payload:
            qty = item_data.quantity
            price = item_data.estimated_unit_price
            total_est_cost += qty * price
            
            db_item = StoresPurchaseRequisitionItem(
                pr_id=db_pr.id,
                **item_data.model_dump()
            )
            db.add(db_item)
            
        budget_query = select(StoresBudget).where(StoresBudget.id == db_pr.budget_id)
        budget_res = await db.execute(budget_query)
        db_budget = budget_res.scalar()
        if db_budget:
            db_budget.budget_used += total_est_cost

        await db.commit()
        return await StoresService.get_purchase_requisition(db, db_pr.id)

    @staticmethod
    async def delete_purchase_requisition(db: AsyncSession, pr_id: int) -> bool:
        db_pr = await StoresService.get_purchase_requisition(db, pr_id)
        if not db_pr:
            return False
        db_pr.is_deleted = True
        
        for item in db_pr.items:
            item.is_deleted = True
            
        await db.commit()
        return True

    @staticmethod
    async def submit_pr_approval(db: AsyncSession, pr_id: int, payload: PRApprovalSubmit) -> Optional[StoresPRApprovalHistory]:
        db_pr = await StoresService.get_purchase_requisition(db, pr_id)
        if not db_pr:
            return None
            
        db_app = StoresPRApprovalHistory(
            pr_id=pr_id,
            **payload.model_dump()
        )
        db.add(db_app)
        
        if payload.status == "Rejected":
            db_pr.status = "Rejected"
        elif payload.stage == "Final Approval" and payload.status == "Approved":
            db_pr.status = "Approved"
        else:
            db_pr.status = f"Pending {payload.stage}"
            
        await db.commit()
        await db.refresh(db_app)
        return db_app

    @staticmethod
    async def get_purchase_history(db: AsyncSession, item_id: int) -> Dict[str, Any]:
        return {
            "lastPurchaseDate": "2026-06-15",
            "lastPurchasePrice": 115.0,
            "lastVendor": "ABC Chemical Suppliers",
            "averagePurchaseCost": 118.5,
            "totalPurchasedQuantity": 1500.0
        }

    @staticmethod
    async def get_vendor_recommendations(db: AsyncSession, item_id: int) -> List[Dict[str, Any]]:
        return [
            {
                "vendor_id": 1,
                "vendor_name": "ABC Chemical Suppliers",
                "price": 115.0,
                "delivery_time": "3 Days",
                "quality_rating": 4.8,
                "rank_reason": "Lowest Price & Highest Rating"
            },
            {
                "vendor_id": 2,
                "vendor_name": "Dinesh Spare Parts Co",
                "price": 122.0,
                "delivery_time": "2 Days",
                "quality_rating": 4.5,
                "rank_reason": "Fastest Delivery"
            }
        ]

    # ─── VENDOR QUOTATION SERVICES ───
    @staticmethod
    async def create_quotation(db: AsyncSession, payload: QuotationCreate) -> StoresVendorQuotation:
        quote_no = f"QTN-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        db_q = StoresVendorQuotation(
            pr_id=payload.pr_id,
            vendor_id=payload.vendor_id,
            quote_date=payload.quote_date.replace(tzinfo=None) if payload.quote_date.tzinfo else payload.quote_date,
            validity_date=payload.validity_date.replace(tzinfo=None) if payload.validity_date.tzinfo else payload.validity_date,
            quote_no=quote_no,
            payment_terms=payload.payment_terms,
            quotation_file_path=payload.quotation_file_path,
            total_amount=0.0,
            status="Submitted"
        )
        db.add(db_q)
        await db.flush()

        total = 0.0
        for item in payload.items:
            subtotal = item.quantity * item.quoted_unit_price
            total += subtotal
            db_item = StoresVendorQuotationItem(
                quotation_id=db_q.id,
                item_id=item.item_id,
                category_id=item.category_id,
                uom_id=item.uom_id,
                quantity=item.quantity,
                quoted_unit_price=item.quoted_unit_price,
                gst=item.gst,
                currency=item.currency,
                delivery_terms=item.delivery_terms,
                remarks=item.remarks
            )
            db.add(db_item)

        db_q.total_amount = total
        await db.commit()
        await db.refresh(db_q)
        return await StoresService.get_quotation(db, db_q.id)

    @staticmethod
    async def get_quotations(db: AsyncSession, search: Optional[str] = None) -> List[StoresVendorQuotation]:
        stmt = select(StoresVendorQuotation).where(StoresVendorQuotation.is_deleted == False).options(selectinload(StoresVendorQuotation.items))
        res = await db.execute(stmt)
        quotes = res.scalars().all()
        for q in quotes:
            # Resolve vendor name
            ven_res = await db.execute(select(StoresVendor).where(StoresVendor.id == q.vendor_id))
            ven = ven_res.scalar()
            q.vendor_name = ven.vendor_name if ven else "Unknown"

            # Resolve PR number
            pr_res = await db.execute(select(StoresPurchaseRequisition).where(StoresPurchaseRequisition.id == q.pr_id))
            pr = pr_res.scalar()
            q.pr_number = pr.pr_number if pr else "Unknown"
        return quotes

    @staticmethod
    async def get_quotation(db: AsyncSession, quotation_id: int) -> Optional[StoresVendorQuotation]:
        stmt = select(StoresVendorQuotation).where(
            and_(StoresVendorQuotation.id == quotation_id, StoresVendorQuotation.is_deleted == False)
        )
        res = await db.execute(stmt)
        q = res.scalar()
        if not q:
            return None

        # Resolve vendor name
        ven_res = await db.execute(select(StoresVendor).where(StoresVendor.id == q.vendor_id))
        ven = ven_res.scalar()
        q.vendor_name = ven.vendor_name if ven else "Unknown"

        # Resolve PR number
        pr_res = await db.execute(select(StoresPurchaseRequisition).where(StoresPurchaseRequisition.id == q.pr_id))
        pr = pr_res.scalar()
        q.pr_number = pr.pr_number if pr else "Unknown"

        # Resolve item details
        for item in q.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id))
            itm = itm_res.scalar()
            item.item_code = itm.item_code if itm else "Unknown"
            item.item_name = itm.item_name if itm else "Unknown"

            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id))
            cat = cat_res.scalar()
            item.category_name = cat.category_name if cat else "Unknown"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id))
            uom = uom_res.scalar()
            item.uom_name = uom.uom_name if uom else "Unknown"
        return q

    @staticmethod
    async def delete_quotation(db: AsyncSession, quotation_id: int):
        stmt = select(StoresVendorQuotation).where(StoresVendorQuotation.id == quotation_id)
        res = await db.execute(stmt)
        q = res.scalar()
        if q:
            q.is_deleted = True
            await db.commit()


    # ─── PURCHASE ORDER SERVICES ───
    @staticmethod
    async def create_purchase_order(db: AsyncSession, payload: POCreate) -> StoresPurchaseOrder:
        po_no = f"PO-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        delivery_date = payload.expected_delivery_date
        if delivery_date and hasattr(delivery_date, "tzinfo") and delivery_date.tzinfo:
            delivery_date = delivery_date.replace(tzinfo=None)
            
        db_po = StoresPurchaseOrder(
            po_no=po_no,
            pr_id=payload.pr_id,
            quotation_id=payload.quotation_id,
            vendor_id=payload.vendor_id,
            expected_delivery_date=delivery_date,
            delivery_warehouse_id=payload.delivery_warehouse_id,
            delivery_department_id=payload.delivery_department_id,
            status="Submitted",
            payment_terms=payload.payment_terms,
            delivery_instructions=payload.delivery_instructions,
            total_amount=0.0,
            discount_amount=payload.discount_amount or 0.0,
            tax_amount=0.0,
            grand_total=0.0
        )
        db.add(db_po)
        await db.flush()

        total = 0.0
        tax = 0.0
        total_items_discount = 0.0
        for item in payload.items:
            subtotal = item.quantity * item.unit_price
            disc_pct = item.discount_percentage or 0.0
            disc_amt = subtotal * (disc_pct / 100.0)
            taxable_val = subtotal - disc_amt
            gst_amount = taxable_val * (item.gst / 100.0)
            line_total = taxable_val + gst_amount

            total += subtotal
            total_items_discount += disc_amt
            tax += gst_amount

            db_item = StoresPurchaseOrderItem(
                po_id=db_po.id,
                item_id=item.item_id,
                category_id=item.category_id,
                uom_id=item.uom_id,
                item_name=item.item_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percentage=disc_pct,
                discount_amount=disc_amt,
                gst=item.gst,
                total_with_gst=line_total,
                remarks=item.remarks
            )
            db.add(db_item)

        # Use either line item discounts or main discount field if provided
        final_discount = payload.discount_amount if (payload.discount_amount and payload.discount_amount > 0) else total_items_discount

        db_po.total_amount = payload.total_amount_override if payload.total_amount_override is not None else total
        db_po.discount_amount = final_discount
        db_po.tax_amount = payload.tax_amount_override if payload.tax_amount_override is not None else tax
        db_po.grand_total = payload.grand_total_override if payload.grand_total_override is not None else (total - final_discount + tax)
        await db.commit()
        await db.refresh(db_po)
        return await StoresService.get_purchase_order(db, db_po.id)

    @staticmethod
    async def get_purchase_orders(db: AsyncSession, search: Optional[str] = None) -> List[StoresPurchaseOrder]:
        stmt = select(StoresPurchaseOrder).options(
            selectinload(StoresPurchaseOrder.items)
        ).where(StoresPurchaseOrder.is_deleted == False)
        res = await db.execute(stmt)
        pos = res.scalars().all()
        for po in pos:
            ven_res = await db.execute(select(StoresVendor).where(StoresVendor.id == po.vendor_id))
            ven = ven_res.scalar()
            po.vendor_name = ven.vendor_name if ven else "Unknown"

            wh_res = await db.execute(select(StoresWarehouse).where(StoresWarehouse.id == po.delivery_warehouse_id))
            wh = wh_res.scalar()
            po.delivery_warehouse_name = wh.warehouse_name if wh else "Unknown"
        return pos

    @staticmethod
    async def get_purchase_order(db: AsyncSession, po_id: int) -> Optional[StoresPurchaseOrder]:
        stmt = select(StoresPurchaseOrder).options(
            selectinload(StoresPurchaseOrder.items)
        ).where(
            and_(StoresPurchaseOrder.id == po_id, StoresPurchaseOrder.is_deleted == False)
        )
        res = await db.execute(stmt)
        po = res.scalar()
        if not po:
            return None

        ven_res = await db.execute(select(StoresVendor).where(StoresVendor.id == po.vendor_id))
        ven = ven_res.scalar()
        po.vendor_name = ven.vendor_name if ven else "Unknown"

        wh_res = await db.execute(select(StoresWarehouse).where(StoresWarehouse.id == po.delivery_warehouse_id))
        wh = wh_res.scalar()
        po.delivery_warehouse_name = wh.warehouse_name if wh else "Unknown"

        for item in po.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id)) if item.item_id else None
            itm = itm_res.scalar() if itm_res else None
            item.item_code = itm.item_code if itm else "CUSTOM"
            item.item_name = item.item_name or (itm.item_name if itm else "Custom Product")

            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id)) if item.category_id else None
            cat = cat_res.scalar() if cat_res else None
            item.category_name = cat.category_name if cat else "Custom"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id)) if item.uom_id else None
            uom = uom_res.scalar() if uom_res else None
            item.uom_name = uom.uom_name if uom else "Units"
        return po

    @staticmethod
    async def delete_purchase_order(db: AsyncSession, po_id: int):
        stmt = select(StoresPurchaseOrder).where(StoresPurchaseOrder.id == po_id)
        res = await db.execute(stmt)
        po = res.scalar()
        if po:
            po.is_deleted = True
            await db.commit()


    # ─── STOCK INWARD (GRN) SERVICES ───
    @staticmethod
    async def create_stock_inward(db: AsyncSession, payload: GRNCreate) -> StoresStockInward:
        grn_no = f"GRN-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        db_grn = StoresStockInward(
            grn_no=grn_no,
            po_id=payload.po_id,
            received_by_id=payload.received_by_id,
            inspected_by_id=payload.inspected_by_id,
            warehouse_id=payload.warehouse_id,
            status="Accepted"
        )
        db.add(db_grn)
        await db.flush()

        for item in payload.items:
            variance = item.received_quantity - item.ordered_quantity
            db_item = StoresStockInwardItem(
                grn_id=db_grn.id,
                item_id=item.item_id,
                item_name=item.item_name,
                category_id=item.category_id,
                uom_id=item.uom_id,
                ordered_quantity=item.ordered_quantity,
                received_quantity=item.received_quantity,
                variance=variance,
                inspection_status="Accepted",
                rack_bin=item.rack_bin,
                room=item.room,
                rack=item.rack,
                rack_no=item.rack_no,
                remarks=item.remarks
            )
            db.add(db_item)

            # Real-time Stock Increments
            if item.item_id:
                item_stmt = select(StoresItem).where(StoresItem.id == item.item_id)
                itm_res = await db.execute(item_stmt)
                db_item_obj = itm_res.scalar()
                if db_item_obj:
                    db_item_obj.current_stock += item.received_quantity

        await db.commit()
        await db.refresh(db_grn)
        return await StoresService.get_stock_inward(db, db_grn.id)

    @staticmethod
    async def get_stock_inwards(db: AsyncSession, search: Optional[str] = None) -> List[StoresStockInward]:
        stmt = select(StoresStockInward).options(
            selectinload(StoresStockInward.items)
        ).where(StoresStockInward.is_deleted == False)
        res = await db.execute(stmt)
        grns = res.scalars().all()
        for g in grns:
            po_stmt = select(StoresPurchaseOrder).where(StoresPurchaseOrder.id == g.po_id)
            po_res = await db.execute(po_stmt)
            po_obj = po_res.scalar()
            g.po_number = po_obj.po_no if po_obj else "Unknown"

            emp_stmt = select(Employee).where(Employee.id == g.received_by_id)
            emp_res = await db.execute(emp_stmt)
            emp_obj = emp_res.scalar()
            g.received_by_name = emp_obj.name if emp_obj else "System Receiver"

            wh_stmt = select(StoresWarehouse).where(StoresWarehouse.id == g.warehouse_id)
            wh_res = await db.execute(wh_stmt)
            wh_obj = wh_res.scalar()
            g.warehouse_name = wh_obj.warehouse_name if wh_obj else "Main Store"
        return grns

    @staticmethod
    async def get_stock_inward(db: AsyncSession, grn_id: int) -> Optional[StoresStockInward]:
        stmt = select(StoresStockInward).options(
            selectinload(StoresStockInward.items)
        ).where(
            and_(StoresStockInward.id == grn_id, StoresStockInward.is_deleted == False)
        )
        res = await db.execute(stmt)
        g = res.scalar()
        if not g:
            return None

        po_stmt = select(StoresPurchaseOrder).where(StoresPurchaseOrder.id == g.po_id)
        po_res = await db.execute(po_stmt)
        po_obj = po_res.scalar()
        g.po_number = po_obj.po_no if po_obj else "Unknown"

        emp_stmt = select(Employee).where(Employee.id == g.received_by_id)
        emp_res = await db.execute(emp_stmt)
        emp_obj = emp_res.scalar()
        g.received_by_name = emp_obj.name if emp_obj else "System Receiver"

        wh_stmt = select(StoresWarehouse).where(StoresWarehouse.id == g.warehouse_id)
        wh_res = await db.execute(wh_stmt)
        wh_obj = wh_res.scalar()
        g.warehouse_name = wh_obj.warehouse_name if wh_obj else "Main Store"

        for item in g.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id)) if item.item_id else None
            itm = itm_res.scalar() if itm_res else None
            item.item_code = itm.item_code if itm else "CUSTOM"
            item.item_name = item.item_name or (itm.item_name if itm else "Custom Product")
            
            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id)) if item.category_id else None
            cat = cat_res.scalar() if cat_res else None
            item.category_name = cat.category_name if cat else "Custom"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id)) if item.uom_id else None
            uom = uom_res.scalar() if uom_res else None
            item.uom_name = uom.uom_name if uom else "Units"
        return g

    @staticmethod
    async def delete_stock_inward(db: AsyncSession, grn_id: int):
        stmt = select(StoresStockInward).where(StoresStockInward.id == grn_id)
        res = await db.execute(stmt)
        g = res.scalar()
        if g:
            g.is_deleted = True
            await db.commit()


    # ─── ISSUE TO DEPARTMENT SERVICES ───
    @staticmethod
    async def create_department_issue(db: AsyncSession, payload: IssueCreate) -> StoresIssueToDepartment:
        issue_no = f"ISS-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        db_issue = StoresIssueToDepartment(
            issue_no=issue_no,
            requesting_department_id=payload.requesting_department_id,
            issued_by_id=payload.issued_by_id,
            received_by_id=payload.received_by_id,
            status="Issued"
        )
        db.add(db_issue)
        await db.flush()

        for item in payload.items:
            db_item = StoresIssueToDepartmentItem(
                issue_id=db_issue.id,
                item_id=item.item_id,
                category_id=item.category_id,
                uom_id=item.uom_id,
                quantity_requested=item.quantity_requested,
                quantity_issued=item.quantity_issued,
                warehouse_id=item.warehouse_id,
                remarks=item.remarks
            )
            db.add(db_item)

            # Real-time Stock Decrements
            item_stmt = select(StoresItem).where(StoresItem.id == item.item_id)
            itm_res = await db.execute(item_stmt)
            db_item_obj = itm_res.scalar()
            if db_item_obj:
                db_item_obj.current_stock = max(0.0, db_item_obj.current_stock - item.quantity_issued)

        await db.commit()
        await db.refresh(db_issue)
        return await StoresService.get_department_issue(db, db_issue.id)

    @staticmethod
    async def get_department_issues(db: AsyncSession, search: Optional[str] = None) -> List[StoresIssueToDepartment]:
        stmt = select(StoresIssueToDepartment).where(StoresIssueToDepartment.is_deleted == False).options(selectinload(StoresIssueToDepartment.items))
        res = await db.execute(stmt)
        issues = res.scalars().all()
        for i in issues:
            dept_res = await db.execute(select(StoresDepartment).where(StoresDepartment.id == i.requesting_department_id))
            dept = dept_res.scalar()
            i.requesting_department_name = dept.department_name if dept else "Unknown Department"

            emp_res = await db.execute(select(Employee).where(Employee.id == i.issued_by_id))
            emp = emp_res.scalar()
            i.issued_by_name = emp.name if emp else "Store Issuer"
        return issues

    @staticmethod
    async def get_department_issue(db: AsyncSession, issue_id: int) -> Optional[StoresIssueToDepartment]:
        stmt = select(StoresIssueToDepartment).where(
            and_(StoresIssueToDepartment.id == issue_id, StoresIssueToDepartment.is_deleted == False)
        ).options(selectinload(StoresIssueToDepartment.items))
        res = await db.execute(stmt)
        i = res.scalar()
        if not i:
            return None

        dept_res = await db.execute(select(StoresDepartment).where(StoresDepartment.id == i.requesting_department_id))
        dept = dept_res.scalar()
        i.requesting_department_name = dept.department_name if dept else "Unknown Department"

        emp_res = await db.execute(select(Employee).where(Employee.id == i.issued_by_id))
        emp = emp_res.scalar()
        i.issued_by_name = emp.name if emp else "Store Issuer"

        for item in i.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id))
            itm = itm_res.scalar()
            item.item_code = itm.item_code if itm else "Unknown"
            item.item_name = itm.item_name if itm else "Unknown"

            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id))
            cat = cat_res.scalar()
            item.category_name = cat.category_name if cat else "Unknown"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id))
            uom = uom_res.scalar()
            item.uom_name = uom.uom_name if uom else "Unknown"
        return i

    @staticmethod
    async def delete_department_issue(db: AsyncSession, issue_id: int):
        stmt = select(StoresIssueToDepartment).where(StoresIssueToDepartment.id == issue_id)
        res = await db.execute(stmt)
        i = res.scalar()
        if i:
            i.is_deleted = True
            await db.commit()


    # ─── RETURN TO STORE SERVICES ───
    @staticmethod
    async def create_return_to_store(db: AsyncSession, payload: ReturnCreate) -> StoresReturnToStore:
        return_no = f"RET-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        db_ret = StoresReturnToStore(
            return_no=return_no,
            issue_id=payload.issue_id,
            returned_by_id=payload.returned_by_id,
            received_by_id=payload.received_by_id,
            status="Received"
        )
        db.add(db_ret)
        await db.flush()

        for item in payload.items:
            db_item = StoresReturnToStoreItem(
                return_id=db_ret.id,
                item_id=item.item_id,
                category_id=item.category_id,
                uom_id=item.uom_id,
                quantity_returned=item.quantity_returned,
                reason=item.reason,
                condition=item.condition,
                remarks=item.remarks
            )
            db.add(db_item)

            # Real-time Stock Increments
            item_stmt = select(StoresItem).where(StoresItem.id == item.item_id)
            itm_res = await db.execute(item_stmt)
            db_item_obj = itm_res.scalar()
            if db_item_obj and item.condition == "Good":
                db_item_obj.current_stock += item.quantity_returned

        await db.commit()
        await db.refresh(db_ret)
        return await StoresService.get_return_to_store(db, db_ret.id)

    @staticmethod
    async def get_returns_to_store(db: AsyncSession, search: Optional[str] = None) -> List[StoresReturnToStore]:
        stmt = select(StoresReturnToStore).where(StoresReturnToStore.is_deleted == False).options(selectinload(StoresReturnToStore.items))
        res = await db.execute(stmt)
        returns = res.scalars().all()
        for r in returns:
            emp_res = await db.execute(select(Employee).where(Employee.id == r.returned_by_id))
            emp = emp_res.scalar()
            r.returned_by_name = emp.name if emp else "Factory worker"
        return returns

    @staticmethod
    async def get_return_to_store(db: AsyncSession, return_id: int) -> Optional[StoresReturnToStore]:
        stmt = select(StoresReturnToStore).where(
            and_(StoresReturnToStore.id == return_id, StoresReturnToStore.is_deleted == False)
        ).options(selectinload(StoresReturnToStore.items))
        res = await db.execute(stmt)
        r = res.scalar()
        if not r:
            return None

        emp_res = await db.execute(select(Employee).where(Employee.id == r.returned_by_id))
        emp = emp_res.scalar()
        r.returned_by_name = emp.name if emp else "Factory worker"

        for item in r.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id))
            itm = itm_res.scalar()
            item.item_code = itm.item_code if itm else "Unknown"
            item.item_name = itm.item_name if itm else "Unknown"

            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id))
            cat = cat_res.scalar()
            item.category_name = cat.category_name if cat else "Unknown"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id))
            uom = uom_res.scalar()
            item.uom_name = uom.uom_name if uom else "Unknown"
        return r

    @staticmethod
    async def delete_return_to_store(db: AsyncSession, return_id: int):
        stmt = select(StoresReturnToStore).where(StoresReturnToStore.id == return_id)
        res = await db.execute(stmt)
        r = res.scalar()
        if r:
            r.is_deleted = True
            await db.commit()


    # ─── STORE TRANSFER SERVICES ───
    @staticmethod
    async def create_store_transfer(db: AsyncSession, payload: TransferCreate) -> StoresStoreTransfer:
        transfer_no = f"TRF-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        db_trf = StoresStoreTransfer(
            transfer_no=transfer_no,
            source_warehouse_id=payload.source_warehouse_id,
            destination_warehouse_id=payload.destination_warehouse_id,
            transferred_by_id=payload.transferred_by_id,
            status="Completed"
        )
        db.add(db_trf)
        await db.flush()

        for item in payload.items:
            db_item = StoresStoreTransferItem(
                transfer_id=db_trf.id,
                item_id=item.item_id,
                category_id=item.category_id,
                uom_id=item.uom_id,
                quantity=item.quantity,
                remarks=item.remarks
            )
            db.add(db_item)

        await db.commit()
        await db.refresh(db_trf)
        return await StoresService.get_store_transfer(db, db_trf.id)

    @staticmethod
    async def get_store_transfers(db: AsyncSession, search: Optional[str] = None) -> List[StoresStoreTransfer]:
        stmt = select(StoresStoreTransfer).where(StoresStoreTransfer.is_deleted == False).options(selectinload(StoresStoreTransfer.items))
        res = await db.execute(stmt)
        transfers = res.scalars().all()
        for t in transfers:
            src_res = await db.execute(select(StoresWarehouse).where(StoresWarehouse.id == t.source_warehouse_id))
            src_wh = src_res.scalar()
            t.source_warehouse_name = src_wh.warehouse_name if src_wh else "Source Depot"

            dst_res = await db.execute(select(StoresWarehouse).where(StoresWarehouse.id == t.destination_warehouse_id))
            dst_wh = dst_res.scalar()
            t.destination_warehouse_name = dst_wh.warehouse_name if dst_wh else "Destination Depot"

            emp_res = await db.execute(select(Employee).where(Employee.id == t.transferred_by_id))
            emp = emp_res.scalar()
            t.transferred_by_name = emp.name if emp else "Unknown"
        return transfers

    @staticmethod
    async def get_store_transfer(db: AsyncSession, transfer_id: int) -> Optional[StoresStoreTransfer]:
        stmt = select(StoresStoreTransfer).where(
            and_(StoresStoreTransfer.id == transfer_id, StoresStoreTransfer.is_deleted == False)
        ).options(selectinload(StoresStoreTransfer.items))
        res = await db.execute(stmt)
        t = res.scalar()
        if not t:
            return None

        src_res = await db.execute(select(StoresWarehouse).where(StoresWarehouse.id == t.source_warehouse_id))
        src_wh = src_res.scalar()
        t.source_warehouse_name = src_wh.warehouse_name if src_wh else "Source Depot"

        dst_res = await db.execute(select(StoresWarehouse).where(StoresWarehouse.id == t.destination_warehouse_id))
        dst_wh = dst_res.scalar()
        t.destination_warehouse_name = dst_wh.warehouse_name if dst_wh else "Destination Depot"

        emp_res = await db.execute(select(Employee).where(Employee.id == t.transferred_by_id))
        emp = emp_res.scalar()
        t.transferred_by_name = emp.name if emp else "Unknown"

        for item in t.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id))
            itm = itm_res.scalar()
            item.item_code = itm.item_code if itm else "Unknown"
            item.item_name = itm.item_name if itm else "Unknown"

            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id))
            cat = cat_res.scalar()
            item.category_name = cat.category_name if cat else "Unknown"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id))
            uom = uom_res.scalar()
            item.uom_name = uom.uom_name if uom else "Unknown"
        return t

    @staticmethod
    async def delete_store_transfer(db: AsyncSession, transfer_id: int):
        stmt = select(StoresStoreTransfer).where(StoresStoreTransfer.id == transfer_id)
        res = await db.execute(stmt)
        t = res.scalar()
        if t:
            t.is_deleted = True
            await db.commit()


    # ─── STOCK ADJUSTMENT SERVICES ───
    @staticmethod
    async def create_stock_adjustment(db: AsyncSession, payload: AdjustmentCreate) -> StoresStockAdjustment:
        adj_no = f"ADJ-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        db_adj = StoresStockAdjustment(
            adjustment_no=adj_no,
            adjusted_by_id=payload.adjusted_by_id,
            type=payload.type,
            reason=payload.reason,
            authorized_by_id=payload.authorized_by_id
        )
        db.add(db_adj)
        await db.flush()

        for item in payload.items:
            db_item = StoresStockAdjustmentItem(
                adjustment_id=db_adj.id,
                item_id=item.item_id,
                category_id=item.category_id,
                uom_id=item.uom_id,
                current_stock=item.current_stock,
                quantity_adjusted=item.quantity_adjusted,
                new_stock=item.new_stock,
                remarks=item.remarks
            )
            db.add(db_item)

            # Real-time Stock Correction
            item_stmt = select(StoresItem).where(StoresItem.id == item.item_id)
            itm_res = await db.execute(item_stmt)
            db_item_obj = itm_res.scalar()
            if db_item_obj:
                db_item_obj.current_stock = max(0.0, item.new_stock)

        await db.commit()
        await db.refresh(db_adj)
        return await StoresService.get_stock_adjustment(db, db_adj.id)

    @staticmethod
    async def get_stock_adjustments(db: AsyncSession, search: Optional[str] = None) -> List[StoresStockAdjustment]:
        stmt = select(StoresStockAdjustment).where(StoresStockAdjustment.is_deleted == False).options(selectinload(StoresStockAdjustment.items))
        res = await db.execute(stmt)
        adjs = res.scalars().all()
        for a in adjs:
            emp_res = await db.execute(select(Employee).where(Employee.id == a.adjusted_by_id))
            emp = emp_res.scalar()
            a.adjusted_by_name = emp.name if emp else "Auditor Clerk"
        return adjs

    @staticmethod
    async def get_stock_adjustment(db: AsyncSession, adjustment_id: int) -> Optional[StoresStockAdjustment]:
        stmt = select(StoresStockAdjustment).where(
            and_(StoresStockAdjustment.id == adjustment_id, StoresStockAdjustment.is_deleted == False)
        ).options(selectinload(StoresStockAdjustment.items))
        res = await db.execute(stmt)
        a = res.scalar()
        if not a:
            return None

        emp_res = await db.execute(select(Employee).where(Employee.id == a.adjusted_by_id))
        emp = emp_res.scalar()
        a.adjusted_by_name = emp.name if emp else "Auditor Clerk"

        for item in a.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id))
            itm = itm_res.scalar()
            item.item_code = itm.item_code if itm else "Unknown"
            item.item_name = itm.item_name if itm else "Unknown"

            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id))
            cat = cat_res.scalar()
            item.category_name = cat.category_name if cat else "Unknown"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id))
            uom = uom_res.scalar()
            item.uom_name = uom.uom_name if uom else "Unknown"
        return a

    @staticmethod
    async def delete_stock_adjustment(db: AsyncSession, adjustment_id: int):
        stmt = select(StoresStockAdjustment).where(StoresStockAdjustment.id == adjustment_id)
        res = await db.execute(stmt)
        a = res.scalar()
        if a:
            a.is_deleted = True
            await db.commit()


    # ─── RETURNABLE DC SERVICES ───
    @staticmethod
    async def create_returnable_dc(db: AsyncSession, payload: DCCreate) -> StoresReturnableDC:
        dc_no = f"DC-{datetime.now().strftime('%Y')}-{random.randint(1000, 9999)}"
        db_dc = StoresReturnableDC(
            dc_no=dc_no,
            issue_id=payload.issue_id,
            expected_return_date=payload.expected_return_date.replace(tzinfo=None) if payload.expected_return_date.tzinfo else payload.expected_return_date,
            issued_to_department_id=payload.issued_to_department_id,
            issued_by_id=payload.issued_by_id,
            status="Issued"
        )
        db.add(db_dc)
        await db.flush()

        for item in payload.items:
            db_item = StoresReturnableDCItem(
                dc_id=db_dc.id,
                item_id=item.item_id,
                category_id=item.category_id,
                uom_id=item.uom_id,
                quantity=item.quantity,
                serial_batch_no=item.serial_batch_no,
                return_terms=item.return_terms,
                remarks=item.remarks
            )
            db.add(db_item)

        await db.commit()
        await db.refresh(db_dc)
        return await StoresService.get_returnable_dc(db, db_dc.id)

    @staticmethod
    async def get_returnable_dcs(db: AsyncSession, search: Optional[str] = None) -> List[StoresReturnableDC]:
        stmt = select(StoresReturnableDC).where(StoresReturnableDC.is_deleted == False).options(selectinload(StoresReturnableDC.items))
        res = await db.execute(stmt)
        dcs = res.scalars().all()
        for d in dcs:
            dept_res = await db.execute(select(StoresDepartment).where(StoresDepartment.id == d.issued_to_department_id))
            dept = dept_res.scalar()
            d.issued_to_department_name = dept.department_name if dept else "Contract Unit"

            emp_res = await db.execute(select(Employee).where(Employee.id == d.issued_by_id))
            emp = emp_res.scalar()
            d.issued_by_name = emp.name if emp else "Gate Issuer"
        return dcs

    @staticmethod
    async def get_returnable_dc(db: AsyncSession, dc_id: int) -> Optional[StoresReturnableDC]:
        stmt = select(StoresReturnableDC).where(
            and_(StoresReturnableDC.id == dc_id, StoresReturnableDC.is_deleted == False)
        ).options(selectinload(StoresReturnableDC.items))
        res = await db.execute(stmt)
        d = res.scalar()
        if not d:
            return None

        dept_res = await db.execute(select(StoresDepartment).where(StoresDepartment.id == d.issued_to_department_id))
        dept = dept_res.scalar()
        d.issued_to_department_name = dept.department_name if dept else "Contract Unit"

        emp_res = await db.execute(select(Employee).where(Employee.id == d.issued_by_id))
        emp = emp_res.scalar()
        d.issued_by_name = emp.name if emp else "Gate Issuer"

        for item in d.items:
            itm_res = await db.execute(select(StoresItem).where(StoresItem.id == item.item_id))
            itm = itm_res.scalar()
            item.item_code = itm.item_code if itm else "Unknown"
            item.item_name = itm.item_name if itm else "Unknown"

            cat_res = await db.execute(select(StoresCategory).where(StoresCategory.id == item.category_id))
            cat = cat_res.scalar()
            item.category_name = cat.category_name if cat else "Unknown"

            uom_res = await db.execute(select(StoresUOM).where(StoresUOM.id == item.uom_id))
            uom = uom_res.scalar()
            item.uom_name = uom.uom_name if uom else "Unknown"
        return d

    @staticmethod
    async def delete_returnable_dc(db: AsyncSession, dc_id: int):
        stmt = select(StoresReturnableDC).where(StoresReturnableDC.id == dc_id)
        res = await db.execute(stmt)
        d = res.scalar()
        if d:
            d.is_deleted = True
            await db.commit()



