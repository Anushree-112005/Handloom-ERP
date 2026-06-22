"""
Report Registry — Whitelist of all report definitions.

Each report defines:
  - title: Human-readable title
  - module: Which ERP module it belongs to
  - model: SQLAlchemy model class name string
  - formats: Allowed output formats
  - filters: Allowed filter keys
  - columns: Column definitions for export [{key, label}]
  - permission: Required module_permission key
  - synonyms: Natural-language aliases for chatbot intent matching
"""

REPORT_REGISTRY = {
    # ── Sales Reports ──────────────────────────────────────────────
    "buyer_order": {
        "title": "Buyer Order Report",
        "module": "buyer_order",
        "model": "BuyerOrder",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "party", "status"],
        "columns": [
            {"key": "ibpo_number", "label": "Order ID"},
            {"key": "order_date", "label": "Order Date"},
            {"key": "party_name", "label": "Customer"},
            {"key": "order_type", "label": "Order Type"},
            {"key": "status", "label": "Status"},
        ],
        "permission": "buyer_order",
        "synonyms": ["buyer order", "buyer orders", "sales order", "sales orders", "purchase order report", "ibpo report", "order report"],
    },
    "invoice": {
        "title": "Sales Invoice Report",
        "module": "sales_invoice",
        "model": "SalesInvoice",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "party", "status"],
        "columns": [
            {"key": "invoice_no", "label": "Invoice No"},
            {"key": "invoice_date", "label": "Invoice Date"},
            {"key": "party_name", "label": "Customer"},
            {"key": "net_amount", "label": "Net Amount (₹)"},
            {"key": "status", "label": "Status"},
        ],
        "permission": "account",
        "synonyms": ["invoice", "invoices", "sales invoice", "bill", "billing report"],
    },
    "dispatch": {
        "title": "Goods Release / Dispatch Report",
        "module": "goods_release",
        "model": "GoodsRelease",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "party", "status"],
        "columns": [
            {"key": "gra_no", "label": "GRA No"},
            {"key": "gra_date", "label": "Date"},
            {"key": "party_name", "label": "Customer"},
            {"key": "vehicle_no", "label": "Vehicle No"},
            {"key": "status", "label": "Status"},
        ],
        "permission": "report",
        "synonyms": ["dispatch", "goods release", "dispatch report", "delivery report"],
    },
    "packing_list": {
        "title": "Packing Slip Report",
        "module": "packing_slip",
        "model": "PackingSlip",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "party"],
        "columns": [
            {"key": "slip_no", "label": "Packing No"},
            {"key": "slip_date", "label": "Date"},
            {"key": "party_name", "label": "Customer"},
            {"key": "total_bales", "label": "Total Bales"},
            {"key": "status", "label": "Status"},
        ],
        "permission": "report",
        "synonyms": ["packing slip", "packing list", "packing report"],
    },

    # ── Yarn Reports ──────────────────────────────────────────────
    "yarn_purchase": {
        "title": "Yarn Purchase Order Report",
        "module": "yarn",
        "model": "YarnPurchaseOrder",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "status"],
        "columns": [
            {"key": "po_number", "label": "PO No"},
            {"key": "po_date", "label": "PO Date"},
            {"key": "supplier_name", "label": "Supplier"},
            {"key": "total_order_kgs", "label": "Order Kgs"},
            {"key": "status", "label": "Status"},
        ],
        "permission": "yarn",
        "synonyms": ["yarn purchase", "yarn po", "yarn purchase order"],
    },

    # ── Fabric Reports ────────────────────────────────────────────
    "cloth_inward": {
        "title": "Cloth Inward Report",
        "module": "fabric",
        "model": "ClothInward",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "party"],
        "columns": [
            {"key": "ref_no", "label": "Inward No"},
            {"key": "inw_date", "label": "Inward Date"},
            {"key": "party_name", "label": "Party"},
            {"key": "total_meters", "label": "Total Meters"},
        ],
        "permission": "fabric",
        "synonyms": ["cloth inward", "fabric inward", "grey fabric receipt"],
    },
    "cloth_delivery": {
        "title": "Cloth Delivery (Grey Challan) Report",
        "module": "fabric",
        "model": "ClothDelivery",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "party"],
        "columns": [
            {"key": "dc_no", "label": "DC No"},
            {"key": "dc_date", "label": "DC Date"},
            {"key": "party_name", "label": "Process House / Buyer"},
            {"key": "total_meters", "label": "Total Mtrs"},
        ],
        "permission": "fabric",
        "synonyms": ["cloth delivery", "grey challan", "fabric delivery"],
    },
    "finished_fabric": {
        "title": "Finished Fabric Inward Report",
        "module": "fabric",
        "model": "FinishedFabricInward",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "party"],
        "columns": [
            {"key": "ref_no", "label": "Inward No"},
            {"key": "inv_date", "label": "Inward Date"},
            {"key": "party_name", "label": "Party"},
            {"key": "total_meters", "label": "Total Meters"},
        ],
        "permission": "fabric",
        "synonyms": ["finished fabric", "finished fabric inward", "processed fabric"],
    },

    # ── Employee / Log Reports ────────────────────────────────────
    "employee_list": {
        "title": "Employee Master List",
        "module": "master",
        "model": "Employee",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["department", "status"],
        "columns": [
            {"key": "employee_code", "label": "Emp Code"},
            {"key": "name", "label": "Name"},
            {"key": "department", "label": "Department"},
            {"key": "designation", "label": "Designation"},
            {"key": "status", "label": "Status"},
        ],
        "permission": "master",
        "synonyms": ["employee list", "staff list", "employee report", "hr report"],
    },
    "log_report": {
        "title": "Activity Log Report",
        "module": "report",
        "model": "LogReport",
        "formats": ["pdf", "excel", "csv"],
        "filters": ["from_date", "to_date", "user"],
        "columns": [
            {"key": "user_name", "label": "User"},
            {"key": "mode", "label": "Action"},
            {"key": "module", "label": "Module"},
            {"key": "remarks", "label": "Remarks"},
            {"key": "created_at", "label": "Timestamp"},
        ],
        "permission": "report",
        "synonyms": ["activity log", "audit log", "log report", "user log"],
    },
}


def get_report_templates():
    """Return report catalog for chatbot suggestions / frontend listing."""
    return [
        {
            "id": rid,
            "title": r["title"],
            "module": r["module"],
            "formats": r["formats"],
            "filters": r["filters"],
        }
        for rid, r in REPORT_REGISTRY.items()
    ]


def get_report_definition(report_id: str):
    """Look up a single report definition by ID."""
    return REPORT_REGISTRY.get(report_id)
