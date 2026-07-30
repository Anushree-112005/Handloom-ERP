"""Pydantic schemas for the Stores & Consumables module validation and serialization."""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# ─── CATEGORY SCHEMAS ───
class CategoryBase(BaseModel):
    category_code: str
    category_name: str
    description: Optional[str] = None
    status: str = "Active"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    category_code: Optional[str] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── UOM SCHEMAS ───
class UOMBase(BaseModel):
    uom_code: str
    uom_name: str
    symbol: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: str = "Active"

class UOMCreate(UOMBase):
    pass

class UOMUpdate(BaseModel):
    uom_code: Optional[str] = None
    uom_name: Optional[str] = None
    symbol: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class UOMResponse(UOMBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── VENDOR SCHEMAS ───
class VendorBase(BaseModel):
    vendor_code: str
    vendor_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    payment_terms: Optional[str] = None
    vendor_type: Optional[str] = None
    status: str = "Active"

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    vendor_code: Optional[str] = None
    vendor_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    payment_terms: Optional[str] = None
    vendor_type: Optional[str] = None
    status: Optional[str] = None

class VendorResponse(VendorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── DEPARTMENT SCHEMAS ───
class DepartmentBase(BaseModel):
    department_code: str
    department_name: str
    department_head: Optional[str] = None
    description: Optional[str] = None
    status: str = "Active"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    department_code: Optional[str] = None
    department_name: Optional[str] = None
    department_head: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── ITEM SCHEMAS ───
class ItemBase(BaseModel):
    item_code: str
    item_name: str
    category_id: int
    uom_id: int
    vendor_id: Optional[int] = None
    department_id: int
    description: Optional[str] = None
    minimum_stock: float = 0.0
    maximum_stock: float = 0.0
    reorder_level: float = 0.0
    purchase_price: float = 0.0
    current_stock: float = 0.0
    warehouse: Optional[str] = None
    zone: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None
    barcode: Optional[str] = None
    image: Optional[str] = None
    status: str = "Active"

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_id: Optional[int] = None
    uom_id: Optional[int] = None
    vendor_id: Optional[int] = None
    department_id: Optional[int] = None
    description: Optional[str] = None
    minimum_stock: Optional[float] = None
    maximum_stock: Optional[float] = None
    reorder_level: Optional[float] = None
    purchase_price: Optional[float] = None
    current_stock: Optional[float] = None
    warehouse: Optional[str] = None
    zone: Optional[str] = None
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None
    barcode: Optional[str] = None
    image: Optional[str] = None
    status: Optional[str] = None

class ItemResponse(ItemBase):
    id: int
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    vendor_name: Optional[str] = None
    department_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── DASHBOARD SCHEMAS ───
class DashboardActivity(BaseModel):
    id: str
    type: str  # Purchase, Issue, Return
    date: str
    description: str
    value: float
    status: str

class DepartmentConsumption(BaseModel):
    name: str
    value: float
    color: str

class MonthlyStockInOut(BaseModel):
    month: str
    stockIn: float
    stockOut: float

class TopUsedItem(BaseModel):
    name: str
    qty: float
    value: float

class DashboardStatsResponse(BaseModel):
    totalItems: int
    totalCategories: int
    totalVendors: int
    totalDepartments: int
    totalInventoryValue: float
    lowStockItems: int
    outOfStockItems: int
    pendingMaterialRequests: int
    
    departmentConsumption: List[DepartmentConsumption]
    monthlyStockInOut: List[MonthlyStockInOut]
    topUsedItems: List[TopUsedItem]
    recentActivity: List[DashboardActivity]


# ─── MATERIAL REQUEST SCHEMAS ───
class MaterialRequestBase(BaseModel):
    department_id: int
    category_id: int
    item_id: int
    uom_id: int
    vendor_id: Optional[int] = None
    quantity: float = 1.0
    requested_by: str
    priority: str = "Medium"
    status: str = "Pending"
    remarks: Optional[str] = None

class MaterialRequestCreate(MaterialRequestBase):
    pass

class MaterialRequestUpdate(BaseModel):
    department_id: Optional[int] = None
    category_id: Optional[int] = None
    item_id: Optional[int] = None
    uom_id: Optional[int] = None
    vendor_id: Optional[int] = None
    quantity: Optional[float] = None
    requested_by: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class MaterialRequestResponse(MaterialRequestBase):
    id: int
    request_no: str
    
    # Relational labels
    department_name: Optional[str] = None
    category_name: Optional[str] = None
    item_name: Optional[str] = None
    uom_name: Optional[str] = None
    vendor_name: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── SUBCATEGORY SCHEMAS ───
class SubcategoryBase(BaseModel):
    category_id: int
    subcategory_code: str
    subcategory_name: str

class SubcategoryCreate(SubcategoryBase):
    pass

class SubcategoryResponse(SubcategoryBase):
    id: int
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)


# ─── WAREHOUSE SCHEMAS ───
class WarehouseBase(BaseModel):
    warehouse_code: str
    warehouse_name: str
    location: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)


# ─── COST CENTER SCHEMAS ───
class CostCenterBase(BaseModel):
    code: str
    name: str

class CostCenterCreate(CostCenterBase):
    pass

class CostCenterResponse(CostCenterBase):
    id: int
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)


# ─── BUDGET SCHEMAS ───
class BudgetBase(BaseModel):
    budget_code: str
    project_code: Optional[str] = None
    cost_center_id: int
    budget_available: float = 0.0
    budget_used: float = 0.0

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    cost_center_name: Optional[str] = None
    is_deleted: bool
    model_config = ConfigDict(from_attributes=True)


# ─── REQUISITION ITEM SCHEMAS ───
class PRItemBase(BaseModel):
    item_id: Optional[int] = None
    item_name: Optional[str] = None
    category_id: int
    subcategory_id: Optional[int] = None
    uom_id: int
    vendor_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    quantity: float = 1.0
    estimated_unit_price: float = 0.0
    gst: float = 0.0
    currency: str = "INR"
    rack_bin: Optional[str] = None
    brand: Optional[str] = None
    specification: Optional[str] = None
    remarks: Optional[str] = None

class PRItemCreate(PRItemBase):
    pass

class PRItemResponse(PRItemBase):
    id: int
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    subcategory_name: Optional[str] = None
    uom_name: Optional[str] = None
    vendor_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    
    # Stock metrics live from inventory helper
    current_stock: float = 0.0
    reserved_stock: float = 0.0
    available_stock: float = 0.0
    reorder_level: float = 0.0
    suggested_qty: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# ─── PURCHASE REQUISITION SCHEMAS ───
class PRBase(BaseModel):
    required_date: datetime
    request_type: str = "Normal"  # Normal, Urgent, Emergency
    priority: str = "Medium"      # Low, Medium, High, Critical
    description: Optional[str] = None
    
    requester_id: int
    department_id: int
    cost_center_id: int
    branch_factory: str
    
    delivery_warehouse_id: int
    delivery_plant: Optional[str] = None
    delivery_department_id: Optional[int] = None
    delivery_address: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None
    
    budget_id: int

class PRCreate(PRBase):
    items: List[PRItemCreate]

class PRUpdate(BaseModel):
    required_date: Optional[datetime] = None
    request_type: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    
    delivery_warehouse_id: Optional[int] = None
    delivery_plant: Optional[str] = None
    delivery_department_id: Optional[int] = None
    delivery_address: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None

class PRApprovalSubmit(BaseModel):
    approver_name: str
    designation: str
    stage: str
    status: str
    comments: Optional[str] = None

class PRApprovalResponse(BaseModel):
    id: int
    pr_id: int
    approver_name: str
    designation: str
    stage: str
    status: str
    comments: Optional[str] = None
    action_date: datetime

    model_config = ConfigDict(from_attributes=True)

class PRResponse(PRBase):
    id: int
    pr_number: str
    status: str
    
    requester_name: Optional[str] = None
    department_name: Optional[str] = None
    cost_center_name: Optional[str] = None
    delivery_warehouse_name: Optional[str] = None
    delivery_department_name: Optional[str] = None
    budget_code: Optional[str] = None
    
    items: List[PRItemResponse] = []
    approvals: List[PRApprovalResponse] = []
    
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ─── VENDOR QUOTATION SCHEMAS ───
class QuotationItemCreate(BaseModel):
    item_id: int
    category_id: int
    uom_id: int
    quantity: float
    quoted_unit_price: float
    gst: float = 18.0
    currency: str = "INR"
    delivery_terms: Optional[str] = None
    remarks: Optional[str] = None

class QuotationItemResponse(BaseModel):
    id: int
    quotation_id: int
    item_id: int
    category_id: int
    uom_id: int
    quantity: float
    quoted_unit_price: float
    gst: float
    currency: str
    delivery_terms: Optional[str] = None
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class QuotationCreate(BaseModel):
    pr_id: int
    vendor_id: int
    validity_date: datetime
    payment_terms: Optional[str] = None
    quotation_file_path: Optional[str] = None
    items: List[QuotationItemCreate]

class QuotationResponse(BaseModel):
    id: int
    pr_id: int
    vendor_id: int
    quote_no: str
    quote_date: datetime
    validity_date: datetime
    payment_terms: Optional[str] = None
    quotation_file_path: Optional[str] = None
    total_amount: float
    status: str
    vendor_name: Optional[str] = None
    pr_number: Optional[str] = None
    items: List[QuotationItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── PURCHASE ORDER SCHEMAS ───
class POItemCreate(BaseModel):
    item_id: Optional[int] = None
    category_id: Optional[int] = None
    uom_id: Optional[int] = None
    item_name: Optional[str] = None
    quantity: float
    unit_price: float
    discount_percentage: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    gst: float = 18.0
    remarks: Optional[str] = None

class POItemResponse(BaseModel):
    id: int
    po_id: int
    item_id: Optional[int] = None
    category_id: Optional[int] = None
    uom_id: Optional[int] = None
    item_name: Optional[str] = None
    quantity: float
    unit_price: float
    discount_percentage: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    gst: float
    total_with_gst: Optional[float] = None
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class POCreate(BaseModel):
    pr_id: Optional[int] = None
    quotation_id: Optional[int] = None
    vendor_id: int
    expected_delivery_date: Optional[datetime] = None
    delivery_warehouse_id: int
    delivery_department_id: Optional[int] = None
    payment_terms: Optional[str] = None
    delivery_instructions: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    total_amount_override: Optional[float] = None
    tax_amount_override: Optional[float] = None
    grand_total_override: Optional[float] = None
    items: List[POItemCreate]

class POResponse(BaseModel):
    id: int
    po_no: str
    pr_id: Optional[int] = None
    quotation_id: Optional[int] = None
    vendor_id: int
    po_date: datetime
    expected_delivery_date: Optional[datetime] = None
    delivery_warehouse_id: int
    delivery_department_id: Optional[int] = None
    status: str
    payment_terms: Optional[str] = None
    delivery_instructions: Optional[str] = None
    total_amount: float
    discount_amount: Optional[float] = 0.0
    tax_amount: float
    grand_total: float
    vendor_name: Optional[str] = None
    delivery_warehouse_name: Optional[str] = None
    items: List[POItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── STOCK INWARD (GRN) SCHEMAS ───
class GRNItemCreate(BaseModel):
    item_id: Optional[int] = None
    item_name: Optional[str] = None
    category_id: Optional[int] = None
    uom_id: Optional[int] = None
    ordered_quantity: float
    received_quantity: float
    inspection_status: str = "Pending"  # Pending, Inspected, Accepted, Rejected
    rack_bin: Optional[str] = None
    room: Optional[str] = None
    rack: Optional[str] = None
    rack_no: Optional[str] = None
    remarks: Optional[str] = None

class GRNItemResponse(BaseModel):
    id: int
    grn_id: int
    item_id: Optional[int] = None
    item_name: Optional[str] = None
    category_id: Optional[int] = None
    uom_id: Optional[int] = None
    ordered_quantity: float
    received_quantity: float
    variance: float
    inspection_status: str
    rack_bin: Optional[str] = None
    room: Optional[str] = None
    rack: Optional[str] = None
    rack_no: Optional[str] = None
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class GRNCreate(BaseModel):
    po_id: int
    received_by_id: int
    inspected_by_id: Optional[int] = None
    warehouse_id: int
    items: List[GRNItemCreate]

class GRNResponse(BaseModel):
    id: int
    grn_no: str
    po_id: int
    inward_date: datetime
    received_by_id: int
    inspected_by_id: Optional[int] = None
    warehouse_id: int
    status: str
    po_number: Optional[str] = None
    received_by_name: Optional[str] = None
    inspected_by_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    items: List[GRNItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── ISSUE TO DEPARTMENT SCHEMAS ───
class IssueItemCreate(BaseModel):
    item_id: int
    category_id: int
    uom_id: int
    quantity_requested: float
    quantity_issued: float
    warehouse_id: Optional[int] = None
    remarks: Optional[str] = None

class IssueItemResponse(BaseModel):
    id: int
    issue_id: int
    item_id: int
    category_id: int
    uom_id: int
    quantity_requested: float
    quantity_issued: float
    warehouse_id: Optional[int] = None
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class IssueStatusUpdate(BaseModel):
    status: str

class IssueCreate(BaseModel):
    requesting_department_id: int
    issued_by_id: int
    received_by_id: Optional[int] = None
    items: List[IssueItemCreate]

class IssueResponse(BaseModel):
    id: int
    issue_no: str
    requesting_department_id: int
    issued_by_id: int
    received_by_id: Optional[int] = None
    issue_date: datetime
    status: str
    requesting_department_name: Optional[str] = None
    issued_by_name: Optional[str] = None
    received_by_name: Optional[str] = None
    items: List[IssueItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── RETURN TO STORE SCHEMAS ───
class ReturnItemCreate(BaseModel):
    item_id: int
    category_id: int
    uom_id: int
    quantity_returned: float
    reason: Optional[str] = None
    condition: str = "Good"  # Good, Damaged, Partial
    remarks: Optional[str] = None

class ReturnItemResponse(BaseModel):
    id: int
    return_id: int
    item_id: int
    category_id: int
    uom_id: int
    quantity_returned: float
    reason: Optional[str] = None
    condition: str
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ReturnCreate(BaseModel):
    issue_id: Optional[int] = None
    returned_by_id: int
    received_by_id: Optional[int] = None
    items: List[ReturnItemCreate]

class ReturnResponse(BaseModel):
    id: int
    return_no: str
    issue_id: Optional[int] = None
    return_date: datetime
    returned_by_id: int
    received_by_id: Optional[int] = None
    status: str
    returned_by_name: Optional[str] = None
    received_by_name: Optional[str] = None
    items: List[ReturnItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── STORE TRANSFER SCHEMAS ───
class TransferItemCreate(BaseModel):
    item_id: int
    category_id: int
    uom_id: int
    quantity: float
    remarks: Optional[str] = None

class TransferItemResponse(BaseModel):
    id: int
    transfer_id: int
    item_id: int
    category_id: int
    uom_id: int
    quantity: float
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TransferCreate(BaseModel):
    source_warehouse_id: int
    destination_warehouse_id: int
    transferred_by_id: int
    items: List[TransferItemCreate]

class TransferResponse(BaseModel):
    id: int
    transfer_no: str
    source_warehouse_id: int
    destination_warehouse_id: int
    transferred_by_id: int
    transfer_date: datetime
    status: str
    source_warehouse_name: Optional[str] = None
    destination_warehouse_name: Optional[str] = None
    transferred_by_name: Optional[str] = None
    items: List[TransferItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── STOCK ADJUSTMENT SCHEMAS ───
class AdjustmentItemCreate(BaseModel):
    item_id: int
    category_id: int
    uom_id: int
    current_stock: float
    quantity_adjusted: float
    new_stock: float
    remarks: Optional[str] = None

class AdjustmentItemResponse(BaseModel):
    id: int
    adjustment_id: int
    item_id: int
    category_id: int
    uom_id: int
    current_stock: float
    quantity_adjusted: float
    new_stock: float
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AdjustmentCreate(BaseModel):
    adjusted_by_id: int
    type: str = "Correction"  # Increase, Decrease, Write-off, Correction
    reason: Optional[str] = None
    authorized_by_id: Optional[int] = None
    items: List[AdjustmentItemCreate]

class AdjustmentResponse(BaseModel):
    id: int
    adjustment_no: str
    adjustment_date: datetime
    adjusted_by_id: int
    type: str
    reason: Optional[str] = None
    authorized_by_id: Optional[int] = None
    adjusted_by_name: Optional[str] = None
    authorized_by_name: Optional[str] = None
    items: List[AdjustmentItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── RETURNABLE DC SCHEMAS ───
class DCItemCreate(BaseModel):
    item_id: int
    category_id: int
    uom_id: int
    quantity: float
    serial_batch_no: Optional[str] = None
    return_terms: Optional[str] = None
    remarks: Optional[str] = None

class DCItemResponse(BaseModel):
    id: int
    dc_id: int
    item_id: int
    category_id: int
    uom_id: int
    quantity: float
    serial_batch_no: Optional[str] = None
    return_terms: Optional[str] = None
    remarks: Optional[str] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class DCCreate(BaseModel):
    issue_id: Optional[int] = None
    expected_return_date: datetime
    issued_to_department_id: int
    issued_by_id: int
    items: List[DCItemCreate]

class DCResponse(BaseModel):
    id: int
    dc_no: str
    issue_id: Optional[int] = None
    issue_date: datetime
    expected_return_date: datetime
    issued_to_department_id: int
    issued_by_id: int
    status: str
    issued_to_department_name: Optional[str] = None
    issued_by_name: Optional[str] = None
    items: List[DCItemResponse] = []
    model_config = ConfigDict(from_attributes=True)


# ─── NEW PROCUREMENT VENDOR QUOTATION SCHEMAS ───
class ProcurementVendorBase(BaseModel):
    vendor_name: str
    contact_info: Optional[str] = None

class ProcurementVendorCreate(ProcurementVendorBase):
    pass

class ProcurementVendorResponse(ProcurementVendorBase):
    vendor_id: int
    model_config = ConfigDict(from_attributes=True)

class ProcurementQuotationLineItemBase(BaseModel):
    item_name: str
    quantity: float
    unit_price: float
    gst_percentage: float

class ProcurementQuotationLineItemCreate(ProcurementQuotationLineItemBase):
    pass

class ProcurementQuotationLineItemResponse(ProcurementQuotationLineItemBase):
    line_item_id: int
    quotation_id: int
    total: float
    model_config = ConfigDict(from_attributes=True)

class ProcurementQuotationHeaderCreate(BaseModel):
    company_name: str
    vendor_id: int
    items: List[ProcurementQuotationLineItemCreate]

class ProcurementQuotationHeaderResponse(BaseModel):
    quotation_id: int
    company_name: str
    vendor_id: int
    date_created: datetime
    vendor: Optional[VendorResponse] = None
    items: List[ProcurementQuotationLineItemResponse] = []
    grand_total: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class CalculationRequest(BaseModel):
    items: List[ProcurementQuotationLineItemCreate]

class CalculationResponseItem(BaseModel):
    item_name: str
    quantity: float
    unit_price: float
    gst_percentage: float
    total: float

class CalculationResponse(BaseModel):
    items: List[CalculationResponseItem]
    grand_total: float






class ProcurementQuotationHeaderUpdate(BaseModel):
    company_name: Optional[str] = None
    date: Optional[datetime] = None
    vendor_id: Optional[int] = None
    status: Optional[str] = None
    items: Optional[List[ProcurementQuotationLineItemCreate]] = None
