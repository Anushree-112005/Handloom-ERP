"""SQLAlchemy models for the Stores & Consumables module."""
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class StoresCategory(Base):
    __tablename__ = "stores_categories"

    id = Column(Integer, primary_key=True, index=True)
    category_code = Column(String(100), unique=True, index=True, nullable=False)
    category_name = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Active", nullable=False)  # Active, Inactive
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    items = relationship("StoresItem", back_populates="category")


class StoresUOM(Base):
    __tablename__ = "stores_uoms"

    id = Column(Integer, primary_key=True, index=True)
    uom_code = Column(String(100), unique=True, index=True, nullable=False)
    uom_name = Column(String(255), nullable=False)
    symbol = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)  # E.g. Weight, Length, Volume
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Active", nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    items = relationship("StoresItem", back_populates="uom")


class StoresVendor(Base):
    __tablename__ = "stores_vendors"

    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String(100), unique=True, index=True, nullable=False)
    vendor_name = Column(String(255), index=True, nullable=False)
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    gst_number = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    payment_terms = Column(String(100), nullable=True)
    vendor_type = Column(String(100), nullable=True)
    status = Column(String(50), default="Active", nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    items = relationship("StoresItem", back_populates="vendor")


class StoresDepartment(Base):
    __tablename__ = "stores_departments"

    id = Column(Integer, primary_key=True, index=True)
    department_code = Column(String(100), unique=True, index=True, nullable=False)
    department_name = Column(String(255), index=True, nullable=False)
    department_head = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="Active", nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    items = relationship("StoresItem", back_populates="department")


class StoresItem(Base):
    __tablename__ = "stores_items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(100), unique=True, index=True, nullable=False)
    item_name = Column(String(255), index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("stores_vendors.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("stores_departments.id"), nullable=False)
    description = Column(Text, nullable=True)
    
    # Inventory metrics
    minimum_stock = Column(Float, default=0.0, nullable=False)
    maximum_stock = Column(Float, default=0.0, nullable=False)
    reorder_level = Column(Float, default=0.0, nullable=False)
    purchase_price = Column(Float, default=0.0, nullable=False)
    current_stock = Column(Float, default=0.0, nullable=False)
    
    # Locations
    warehouse = Column(String(255), nullable=True)
    zone = Column(String(100), nullable=True)
    rack = Column(String(100), nullable=True)
    shelf = Column(String(100), nullable=True)
    bin = Column(String(100), nullable=True)
    
    barcode = Column(String(100), nullable=True)
    image = Column(String(500), nullable=True)
    status = Column(String(50), default="Active", nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    category = relationship("StoresCategory", back_populates="items")
    uom = relationship("StoresUOM", back_populates="items")
    vendor = relationship("StoresVendor", back_populates="items")
    department = relationship("StoresDepartment", back_populates="items")


class StoresMaterialRequest(Base):
    __tablename__ = "stores_material_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_no = Column(String(100), unique=True, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("stores_departments.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("stores_vendors.id"), nullable=True)
    
    quantity = Column(Float, default=1.0, nullable=False)
    requested_by = Column(String(255), nullable=False)
    priority = Column(String(50), default="Medium", nullable=False)  # Low, Medium, High
    status = Column(String(50), default="Pending", nullable=False)    # Pending, Approved, Rejected
    remarks = Column(Text, nullable=True)
    
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    department = relationship("StoresDepartment")
    category = relationship("StoresCategory")
    item = relationship("StoresItem")
    uom = relationship("StoresUOM")
    vendor = relationship("StoresVendor")


class StoresSubcategory(Base):
    __tablename__ = "stores_subcategories"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    subcategory_code = Column(String(100), unique=True, index=True, nullable=False)
    subcategory_name = Column(String(255), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    category = relationship("StoresCategory")


class StoresWarehouse(Base):
    __tablename__ = "stores_warehouses"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_code = Column(String(100), unique=True, index=True, nullable=False)
    warehouse_name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)


class StoresCostCenter(Base):
    __tablename__ = "stores_cost_centers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)


class StoresBudget(Base):
    __tablename__ = "stores_budgets"

    id = Column(Integer, primary_key=True, index=True)
    budget_code = Column(String(100), unique=True, index=True, nullable=False)
    project_code = Column(String(100), nullable=True)
    cost_center_id = Column(Integer, ForeignKey("stores_cost_centers.id"), nullable=False)
    budget_available = Column(Float, default=0.0, nullable=False)
    budget_used = Column(Float, default=0.0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    cost_center = relationship("StoresCostCenter")


class StoresPurchaseRequisition(Base):
    __tablename__ = "stores_purchase_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    pr_number = Column(String(100), unique=True, index=True, nullable=False)
    request_date = Column(DateTime, server_default=func.now(), nullable=False)
    required_date = Column(DateTime, nullable=False)
    request_type = Column(String(50), default="Normal", nullable=False)  # Normal, Urgent, Emergency
    priority = Column(String(50), default="Medium", nullable=False)      # Low, Medium, High, Critical
    status = Column(String(100), default="Requested", nullable=False)    # Requested, Pending Approval, Approved, Rejected, Converted to PO
    description = Column(Text, nullable=True)

    # Requester Details
    requester_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("stores_departments.id"), nullable=False)
    cost_center_id = Column(Integer, ForeignKey("stores_cost_centers.id"), nullable=False)
    branch_factory = Column(String(255), nullable=False)

    # Delivery Coordinates
    delivery_warehouse_id = Column(Integer, ForeignKey("stores_warehouses.id"), nullable=False)
    delivery_plant = Column(String(255), nullable=True)
    delivery_department_id = Column(Integer, ForeignKey("stores_departments.id"), nullable=True)
    delivery_address = Column(String(500), nullable=True)
    expected_delivery_date = Column(DateTime, nullable=True)

    # Budget Coordinates
    budget_id = Column(Integer, ForeignKey("stores_budgets.id"), nullable=False)
    
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)

    # Relationships
    requester = relationship("Employee")
    department = relationship("StoresDepartment", foreign_keys=[department_id])
    cost_center = relationship("StoresCostCenter")
    delivery_warehouse = relationship("StoresWarehouse")
    delivery_department = relationship("StoresDepartment", foreign_keys=[delivery_department_id])
    budget = relationship("StoresBudget")
    items = relationship("StoresPurchaseRequisitionItem", back_populates="pr")
    approvals = relationship("StoresPRApprovalHistory", back_populates="pr")


class StoresPurchaseRequisitionItem(Base):
    __tablename__ = "stores_purchase_requisition_items"

    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("stores_purchase_requisitions.id"), nullable=False)
    
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=True)
    item_name = Column(String(255), nullable=True)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    subcategory_id = Column(Integer, ForeignKey("stores_subcategories.id"), nullable=True)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("stores_vendors.id"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("stores_warehouses.id"), nullable=True)
    
    quantity = Column(Float, default=1.0, nullable=False)
    estimated_unit_price = Column(Float, default=0.0, nullable=False)
    gst = Column(Float, default=0.0, nullable=False)  # Percentage, e.g. 18.0
    currency = Column(String(20), default="INR", nullable=False)
    
    rack_bin = Column(String(100), nullable=True)
    brand = Column(String(255), nullable=True)
    specification = Column(Text, nullable=True)
    remarks = Column(String(500), nullable=True)
    
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    pr = relationship("StoresPurchaseRequisition", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    subcategory = relationship("StoresSubcategory")
    uom = relationship("StoresUOM")
    vendor = relationship("StoresVendor")
    warehouse = relationship("StoresWarehouse")


class StoresPRApprovalHistory(Base):
    __tablename__ = "stores_pr_approval_history"

    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("stores_purchase_requisitions.id"), nullable=False)
    
    approver_name = Column(String(255), nullable=False)
    designation = Column(String(255), nullable=False)
    stage = Column(String(100), nullable=False) # Department Manager, Store Manager, Purchase Manager, Finance, Final
    status = Column(String(50), nullable=False) # Pending, Approved, Rejected
    comments = Column(Text, nullable=True)
    action_date = Column(DateTime, server_default=func.now(), nullable=False)
    
    is_deleted = Column(Boolean, default=False, nullable=False)

    pr = relationship("StoresPurchaseRequisition", back_populates="approvals")


class StoresVendorQuotation(Base):
    __tablename__ = "stores_vendor_quotations"

    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("stores_purchase_requisitions.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("stores_vendors.id"), nullable=False)
    quote_no = Column(String(100), unique=True, index=True, nullable=False)
    quote_date = Column(DateTime, server_default=func.now(), nullable=False)
    validity_date = Column(DateTime, nullable=False)
    payment_terms = Column(String(255), nullable=True)
    quotation_file_path = Column(String(500), nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String(100), default="Submitted", nullable=False)  # Draft, Submitted, Accepted, Rejected, Expired
    is_deleted = Column(Boolean, default=False, nullable=False)

    pr = relationship("StoresPurchaseRequisition")
    vendor = relationship("StoresVendor")
    items = relationship("StoresVendorQuotationItem", back_populates="quotation")


class StoresVendorQuotationItem(Base):
    __tablename__ = "stores_vendor_quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("stores_vendor_quotations.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    quoted_unit_price = Column(Float, default=0.0, nullable=False)
    gst = Column(Float, default=0.0, nullable=False)
    currency = Column(String(20), default="INR", nullable=False)
    delivery_terms = Column(String(255), nullable=True)
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    quotation = relationship("StoresVendorQuotation", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")


class StoresPurchaseOrder(Base):
    __tablename__ = "stores_purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_no = Column(String(100), unique=True, index=True, nullable=False)
    pr_id = Column(Integer, ForeignKey("stores_purchase_requisitions.id"), nullable=True)
    quotation_id = Column(Integer, ForeignKey("quotation_headers.quotation_id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("stores_vendors.id"), nullable=False)
    po_date = Column(DateTime, server_default=func.now(), nullable=False)
    expected_delivery_date = Column(DateTime, nullable=True)
    delivery_warehouse_id = Column(Integer, ForeignKey("stores_warehouses.id"), nullable=False)
    delivery_department_id = Column(Integer, ForeignKey("stores_departments.id"), nullable=True)
    status = Column(String(100), default="Submitted", nullable=False)  # Draft, Submitted, Approved, Partially Received, Fully Received, Cancelled
    payment_terms = Column(String(255), nullable=True)
    delivery_instructions = Column(Text, nullable=True)
    total_amount = Column(Float, default=0.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=True)
    tax_amount = Column(Float, default=0.0, nullable=False)
    grand_total = Column(Float, default=0.0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    pr = relationship("StoresPurchaseRequisition")
    quotation = relationship("ProcurementQuotationHeader")
    vendor = relationship("StoresVendor")
    delivery_warehouse = relationship("StoresWarehouse")
    delivery_department = relationship("StoresDepartment")
    items = relationship("StoresPurchaseOrderItem", back_populates="po")


class StoresPurchaseOrderItem(Base):
    __tablename__ = "stores_purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("stores_purchase_orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=True)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=True)
    item_name = Column(String(255), nullable=True)
    quantity = Column(Float, default=1.0, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    discount_percentage = Column(Float, default=0.0, nullable=True)
    discount_amount = Column(Float, default=0.0, nullable=True)
    gst = Column(Float, default=0.0, nullable=False)
    total_with_gst = Column(Float, default=0.0, nullable=True)
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    po = relationship("StoresPurchaseOrder", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")


class StoresStockInward(Base):
    __tablename__ = "stores_stock_inwards"

    id = Column(Integer, primary_key=True, index=True)
    grn_no = Column(String(100), unique=True, index=True, nullable=False)
    po_id = Column(Integer, ForeignKey("stores_purchase_orders.id"), nullable=False)
    inward_date = Column(DateTime, server_default=func.now(), nullable=False)
    received_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    inspected_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("stores_warehouses.id"), nullable=False)
    status = Column(String(100), default="Pending", nullable=False)  # Pending, Inspected, Accepted, Rejected, Partial
    is_deleted = Column(Boolean, default=False, nullable=False)

    po = relationship("StoresPurchaseOrder")
    received_by = relationship("Employee", foreign_keys=[received_by_id])
    inspected_by = relationship("Employee", foreign_keys=[inspected_by_id])
    warehouse = relationship("StoresWarehouse")
    items = relationship("StoresStockInwardItem", back_populates="grn")


class StoresStockInwardItem(Base):
    __tablename__ = "stores_stock_inward_items"

    id = Column(Integer, primary_key=True, index=True)
    grn_id = Column(Integer, ForeignKey("stores_stock_inwards.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=True)
    item_name = Column(String(255), nullable=True)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=True)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=True)
    ordered_quantity = Column(Float, default=0.0, nullable=False)
    received_quantity = Column(Float, default=0.0, nullable=False)
    variance = Column(Float, default=0.0, nullable=False)
    inspection_status = Column(String(100), default="Pending", nullable=False)  # Pending, Inspected, Accepted, Rejected
    rack_bin = Column(String(100), nullable=True)
    room = Column(String(100), nullable=True)
    rack = Column(String(100), nullable=True)
    rack_no = Column(String(100), nullable=True)
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    grn = relationship("StoresStockInward", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")


class StoresIssueToDepartment(Base):
    __tablename__ = "stores_issue_to_departments"

    id = Column(Integer, primary_key=True, index=True)
    issue_no = Column(String(100), unique=True, index=True, nullable=False)
    requesting_department_id = Column(Integer, ForeignKey("stores_departments.id"), nullable=False)
    issued_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    received_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    issue_date = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(String(100), default="Issued", nullable=False)  # Requested, Approved, Issued, Received, Cancelled
    is_deleted = Column(Boolean, default=False, nullable=False)

    requesting_department = relationship("StoresDepartment")
    issued_by = relationship("Employee", foreign_keys=[issued_by_id])
    received_by = relationship("Employee", foreign_keys=[received_by_id])
    items = relationship("StoresIssueToDepartmentItem", back_populates="issue")


class StoresIssueToDepartmentItem(Base):
    __tablename__ = "stores_issue_to_department_items"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("stores_issue_to_departments.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    quantity_requested = Column(Float, default=1.0, nullable=False)
    quantity_issued = Column(Float, default=1.0, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("stores_warehouses.id"), nullable=True)
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    issue = relationship("StoresIssueToDepartment", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")
    warehouse = relationship("StoresWarehouse")


class StoresReturnToStore(Base):
    __tablename__ = "stores_return_to_stores"

    id = Column(Integer, primary_key=True, index=True)
    return_no = Column(String(100), unique=True, index=True, nullable=False)
    issue_id = Column(Integer, ForeignKey("stores_issue_to_departments.id"), nullable=True)
    return_date = Column(DateTime, server_default=func.now(), nullable=False)
    returned_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    received_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    status = Column(String(100), default="Received", nullable=False)  # Initiated, Approved, Received, Inspected, Closed
    is_deleted = Column(Boolean, default=False, nullable=False)

    issue = relationship("StoresIssueToDepartment")
    returned_by = relationship("Employee", foreign_keys=[returned_by_id])
    received_by = relationship("Employee", foreign_keys=[received_by_id])
    items = relationship("StoresReturnToStoreItem", back_populates="return_record")


class StoresReturnToStoreItem(Base):
    __tablename__ = "stores_return_to_store_items"

    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("stores_return_to_stores.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    quantity_returned = Column(Float, default=1.0, nullable=False)
    reason = Column(String(255), nullable=True)  # Quality Issue, Excess Stock, Damage, etc.
    condition = Column(String(100), default="Good", nullable=False)  # Good, Damaged, Partial
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    return_record = relationship("StoresReturnToStore", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")


class StoresStoreTransfer(Base):
    __tablename__ = "stores_store_transfers"

    id = Column(Integer, primary_key=True, index=True)
    transfer_no = Column(String(100), unique=True, index=True, nullable=False)
    source_warehouse_id = Column(Integer, ForeignKey("stores_warehouses.id"), nullable=False)
    destination_warehouse_id = Column(Integer, ForeignKey("stores_warehouses.id"), nullable=False)
    transferred_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    transfer_date = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(String(100), default="Completed", nullable=False)  # Requested, Approved, In Transit, Received, Closed
    is_deleted = Column(Boolean, default=False, nullable=False)

    source_warehouse = relationship("StoresWarehouse", foreign_keys=[source_warehouse_id])
    destination_warehouse = relationship("StoresWarehouse", foreign_keys=[destination_warehouse_id])
    transferred_by = relationship("Employee", foreign_keys=[transferred_by_id])
    items = relationship("StoresStoreTransferItem", back_populates="transfer")


class StoresStoreTransferItem(Base):
    __tablename__ = "stores_store_transfer_items"

    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stores_store_transfers.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    transfer = relationship("StoresStoreTransfer", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")


class StoresStockAdjustment(Base):
    __tablename__ = "stores_stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    adjustment_no = Column(String(100), unique=True, index=True, nullable=False)
    adjustment_date = Column(DateTime, server_default=func.now(), nullable=False)
    adjusted_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    type = Column(String(100), default="Correction", nullable=False)  # Increase, Decrease, Write-off, Correction
    reason = Column(String(500), nullable=True)
    authorized_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    adjusted_by = relationship("Employee", foreign_keys=[adjusted_by_id])
    authorized_by = relationship("Employee", foreign_keys=[authorized_by_id])
    items = relationship("StoresStockAdjustmentItem", back_populates="adjustment")


class StoresStockAdjustmentItem(Base):
    __tablename__ = "stores_stock_adjustment_items"

    id = Column(Integer, primary_key=True, index=True)
    adjustment_id = Column(Integer, ForeignKey("stores_stock_adjustments.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    current_stock = Column(Float, default=0.0, nullable=False)
    quantity_adjusted = Column(Float, default=0.0, nullable=False)
    new_stock = Column(Float, default=0.0, nullable=False)
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    adjustment = relationship("StoresStockAdjustment", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")


class StoresReturnableDC(Base):
    __tablename__ = "stores_returnable_dcs"

    id = Column(Integer, primary_key=True, index=True)
    dc_no = Column(String(100), unique=True, index=True, nullable=False)
    issue_id = Column(Integer, ForeignKey("stores_issue_to_departments.id"), nullable=True)
    issue_date = Column(DateTime, server_default=func.now(), nullable=False)
    expected_return_date = Column(DateTime, nullable=False)
    issued_to_department_id = Column(Integer, ForeignKey("stores_departments.id"), nullable=False)
    issued_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    status = Column(String(100), default="Issued", nullable=False)  # Issued, Returned, Overdue, Closed
    is_deleted = Column(Boolean, default=False, nullable=False)

    issue = relationship("StoresIssueToDepartment")
    issued_to_department = relationship("StoresDepartment")
    issued_by = relationship("Employee", foreign_keys=[issued_by_id])
    items = relationship("StoresReturnableDCItem", back_populates="dc")


class StoresReturnableDCItem(Base):
    __tablename__ = "stores_returnable_dc_items"

    id = Column(Integer, primary_key=True, index=True)
    dc_id = Column(Integer, ForeignKey("stores_returnable_dcs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("stores_items.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("stores_categories.id"), nullable=False)
    uom_id = Column(Integer, ForeignKey("stores_uoms.id"), nullable=False)
    quantity = Column(Float, default=1.0, nullable=False)
    serial_batch_no = Column(String(100), nullable=True)
    return_terms = Column(String(255), nullable=True)
    remarks = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)

    dc = relationship("StoresReturnableDC", back_populates="items")
    item = relationship("StoresItem")
    category = relationship("StoresCategory")
    uom = relationship("StoresUOM")


class ProcurementVendor(Base):
    __tablename__ = "vendors"

    vendor_id = Column(Integer, primary_key=True, index=True)
    vendor_name = Column(String(255), index=True, nullable=False)
    contact_info = Column(String(500), nullable=True)


class ProcurementQuotationHeader(Base):
    __tablename__ = "quotation_headers"

    quotation_id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    vendor_id = Column(Integer, ForeignKey("stores_vendors.id"), nullable=False)
    date_created = Column(DateTime, server_default=func.now(), nullable=False)

    vendor = relationship("StoresVendor")
    items = relationship("ProcurementQuotationLineItem", back_populates="quotation", cascade="all, delete-orphan")


class ProcurementQuotationLineItem(Base):
    __tablename__ = "quotation_line_items"

    line_item_id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotation_headers.quotation_id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    gst_percentage = Column(Float, nullable=False)
    total = Column(Float, nullable=False)

    quotation = relationship("ProcurementQuotationHeader", back_populates="items")



