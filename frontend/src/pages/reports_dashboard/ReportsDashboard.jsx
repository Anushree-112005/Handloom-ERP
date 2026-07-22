import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Calendar, Users, ShoppingCart, ShoppingBag, Briefcase, Package, Truck, 
  Factory, CheckSquare, Scissors, Box, ClipboardList, Receipt, 
  MapPin, Shield, Activity, ArrowRightLeft, Palette, Info, Settings, Layers,
  Search, Download, RefreshCw, Eye, Printer, Mail, Share2, 
  TrendingUp, TrendingDown, ArrowUpRight, Plus, Check, Clock, AlertTriangle,
  Brain, Send, BellRing, Sparkles, Filter, ChevronRight, X
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  buyerOrderAPI, salesInvoiceAPI, goodsReleaseAPI, packingSlipAPI, 
  yarnPurchaseOrderAPI, clothInwardAPI, clothDeliveryAPI, finishedFabricAPI,
  ppcAPI, warpDeliveryAPI, dyedYarnDeliveryAPI, yarnInwardAPI, 
  greyYarnDeliveryAPI, onTableCheckingAPI, dashboardAPI, partyAPI
} from '../../services/api';

// ==========================================
// 1. MOCK DATASETS FOR THE 25 REPORTS
// ==========================================
const MOCK_REPORTS_DATA = {
  // --- 1. Production Reports ---
  'loom_production': {
    title: 'Loom Production Report',
    columns: [
      { key: 'loomNo', label: 'Loom No' },
      { key: 'date', label: 'Date' },
      { key: 'supervisor', label: 'Supervisor' },
      { key: 'quality', label: 'Quality Sort' },
      { key: 'target', label: 'Target (Mtrs)' },
      { key: 'actual', label: 'Actual (Mtrs)' },
      { key: 'efficiency', label: 'Efficiency %' }
    ],
    rows: []
  },
  'warping_status': {
    title: 'Warping Report',
    columns: [
      { key: 'setNo', label: 'Set No' },
      { key: 'beamNo', label: 'Beam No' },
      { key: 'date', label: 'Warping Date' },
      { key: 'yarnLot', label: 'Yarn Lot Ref' },
      { key: 'ends', label: 'Total Ends' },
      { key: 'speed', label: 'Speed (m/min)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'sizing_status': {
    title: 'Sizing Report',
    columns: [
      { key: 'setNo', label: 'Set No' },
      { key: 'date', label: 'Sizing Date' },
      { key: 'beamNo', label: 'Sized Beam No' },
      { key: 'quality', label: 'Yarn Quality' },
      { key: 'pickup', label: 'Size Pickup %' },
      { key: 'length', label: 'Length (Mtrs)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'weaving_report': {
    title: 'Weaving Report',
    columns: [
      { key: 'loomNo', label: 'Loom No' },
      { key: 'date', label: 'Date' },
      { key: 'shift', label: 'Shift' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'weaver', label: 'Weaver Name' },
      { key: 'production', label: 'Production (m)' },
      { key: 'efficiency', label: 'Efficiency %' }
    ],
    rows: []
  },
  'dyeing_status': {
    title: 'Dyeing Production Report',
    columns: [
      { key: 'batchNo', label: 'Batch No' },
      { key: 'date', label: 'Dyeing Date' },
      { key: 'shade', label: 'Shade / Color' },
      { key: 'fabricType', label: 'Fabric Quality' },
      { key: 'weight', label: 'Batch Wt (Kg)' },
      { key: 'process', label: 'Process Type' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'finishing_report': {
    title: 'Finishing Report',
    columns: [
      { key: 'batchNo', label: 'Batch No' },
      { key: 'date', label: 'Finish Date' },
      { key: 'process', label: 'Finishing Process' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'inMtrs', label: 'Input (m)' },
      { key: 'outMtrs', label: 'Output (m)' },
      { key: 'shrinkage', label: 'Shrinkage %' }
    ],
    rows: []
  },
  'prod_efficiency': {
    title: 'Production Efficiency Report',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'shift', label: 'Shift' },
      { key: 'dept', label: 'Department' },
      { key: 'looms', label: 'Active Looms' },
      { key: 'target', label: 'Target (Mtrs)' },
      { key: 'actual', label: 'Actual (Mtrs)' },
      { key: 'efficiency', label: 'Avg Efficiency %' }
    ],
    rows: []
  },
  'prod_pending': {
    title: 'Production Pending Report',
    columns: [
      { key: 'orderId', label: 'Order Ref' },
      { key: 'date', label: 'Order Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'fabricType', label: 'Quality' },
      { key: 'ordered', label: 'Target Qty (m)' },
      { key: 'produced', label: 'Produced (m)' },
      { key: 'pending', label: 'Pending Qty (m)' }
    ],
    rows: []
  },

  // --- 2. Yarn Reports ---
  'yarn_purchase': {
    title: 'Yarn Purchase Report',
    columns: [
      { key: 'poNo', label: 'PO No' },
      { key: 'date', label: 'PO Date' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'yarnType', label: 'Yarn Spec' },
      { key: 'qty', label: 'Ordered Qty (Kg)' },
      { key: 'rate', label: 'Rate/Kg (₹)' },
      { key: 'total', label: 'Total Value (₹)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'yarn_inward': {
    title: 'Yarn Inward Report',
    columns: [
      { key: 'inwardNo', label: 'Inward No' },
      { key: 'date', label: 'Inward Date' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'yarnType', label: 'Yarn Count' },
      { key: 'bags', label: 'Bags' },
      { key: 'netWeight', label: 'Recd Weight (Kg)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'yarn_stock': {
    title: 'Yarn Stock Report',
    columns: [
      { key: 'yarnType', label: 'Yarn Type' },
      { key: 'count', label: 'Count' },
      { key: 'brand', label: 'Brand/Spinner' },
      { key: 'inward', label: 'Total Inward (Kg)' },
      { key: 'consumed', label: 'Consumed (Kg)' },
      { key: 'balance', label: 'Stock Balance (Kg)' },
      { key: 'val', label: 'Value (₹)' }
    ],
    rows: []
  },
  'yarn_stock_ledger': {
    title: 'Yarn Stock Ledger',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'yarnType', label: 'Yarn Count' },
      { key: 'refNo', label: 'Ref No' },
      { key: 'type', label: 'Transaction' },
      { key: 'inQty', label: 'In Qty (Kg)' },
      { key: 'outQty', label: 'Out Qty (Kg)' },
      { key: 'balance', label: 'Closing Balance (Kg)' }
    ],
    rows: []
  },
  'yarn_req': {
    title: 'Yarn Requirement Report',
    columns: [
      { key: 'orderId', label: 'Order Ref' },
      { key: 'fabricType', label: 'Fabric Quality' },
      { key: 'yarnType', label: 'Yarn Count' },
      { key: 'required', label: 'Req Qty (Kg)' },
      { key: 'allocated', label: 'Allocated (Kg)' },
      { key: 'shortage', label: 'Shortage (Kg)' }
    ],
    rows: []
  },
  'yarn_dyeing_del': {
    title: 'Yarn Dyeing Delivery Report',
    columns: [
      { key: 'dcNo', label: 'DC No' },
      { key: 'date', label: 'Date' },
      { key: 'dyer', label: 'Dyer Name' },
      { key: 'yarnType', label: 'Grey Yarn Count' },
      { key: 'shade', label: 'Required Shade' },
      { key: 'qty', label: 'Delivery Qty (Kg)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'dyed_yarn_rcpt': {
    title: 'Dyed Yarn Receipt Report',
    columns: [
      { key: 'inwardNo', label: 'Receipt No' },
      { key: 'date', label: 'Date' },
      { key: 'dyer', label: 'Dyer Name' },
      { key: 'yarnType', label: 'Yarn Spec' },
      { key: 'shade', label: 'Recd Shade' },
      { key: 'qty', label: 'Recd Qty (Kg)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'yarn_return': {
    title: 'Yarn Return Report',
    columns: [
      { key: 'returnNo', label: 'Return No' },
      { key: 'date', label: 'Return Date' },
      { key: 'supplier', label: 'Supplier / Party' },
      { key: 'yarnType', label: 'Yarn Count' },
      { key: 'qty', label: 'Returned Qty (Kg)' },
      { key: 'reason', label: 'Return Reason' }
    ],
    rows: []
  },
  'yarn_transfer': {
    title: 'Yarn Stock Transfer Report',
    columns: [
      { key: 'transferNo', label: 'Transfer No' },
      { key: 'date', label: 'Date' },
      { key: 'fromGodown', label: 'From Godown' },
      { key: 'toGodown', label: 'To Godown' },
      { key: 'yarnType', label: 'Yarn Count' },
      { key: 'qty', label: 'Transferred Qty (Kg)' }
    ],
    rows: []
  },

  // --- 3. Fabric Reports ---
  'grey_fabric_rcpt': {
    title: 'Grey Fabric Receipt Report',
    columns: [
      { key: 'inwardNo', label: 'Receipt No' },
      { key: 'date', label: 'Receipt Date' },
      { key: 'supplier', label: 'Weaver / Unit' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'rolls', label: 'Rolls' },
      { key: 'mtrs', label: 'Meters' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'grey_inspection': {
    title: 'Grey Inspection Report',
    columns: [
      { key: 'rollNo', label: 'Roll No' },
      { key: 'date', label: 'Inspection Date' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'inspector', label: 'Inspector' },
      { key: 'defects', label: 'Defects Count' },
      { key: 'grade', label: 'Grade' }
    ],
    rows: []
  },
  'fabric_dyeing': {
    title: 'Fabric Dyeing Report',
    columns: [
      { key: 'batchNo', label: 'Batch No' },
      { key: 'date', label: 'Dyeing Date' },
      { key: 'processHouse', label: 'Process House' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'shade', label: 'Shade' },
      { key: 'mtrs', label: 'Batch Mtrs' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'dyed_fabric_rcpt': {
    title: 'Dyed Fabric Receipt Report',
    columns: [
      { key: 'receiptNo', label: 'Receipt No' },
      { key: 'date', label: 'Date' },
      { key: 'processHouse', label: 'Process House' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'shade', label: 'Shade' },
      { key: 'rolls', label: 'Rolls Recd' },
      { key: 'mtrs', label: 'Recd Mtrs' }
    ],
    rows: []
  },
  'finished_fabric': {
    title: 'Finished Fabric Report',
    columns: [
      { key: 'batchNo', label: 'Batch No' },
      { key: 'date', label: 'Inward Date' },
      { key: 'quality', label: 'Fabric Spec' },
      { key: 'shade', label: 'Color Shade' },
      { key: 'mtrs', label: 'Finished Mtrs' },
      { key: 'gradeA', label: 'Grade A %' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'final_inspection': {
    title: 'Final Inspection Report',
    columns: [
      { key: 'rollNo', label: 'Roll No' },
      { key: 'date', label: 'Date' },
      { key: 'quality', label: 'Quality Sort' },
      { key: 'shade', label: 'Shade' },
      { key: 'passMtrs', label: 'Pass Mtrs' },
      { key: 'rejectionMtrs', label: 'Rejection Mtrs' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'fabric_lot': {
    title: 'Fabric Lot Report',
    columns: [
      { key: 'lotNo', label: 'Lot No' },
      { key: 'date', label: 'Created Date' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'totalRolls', label: 'Total Rolls' },
      { key: 'totalMtrs', label: 'Total Meters' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'bale_report': {
    title: 'Bale Report',
    columns: [
      { key: 'baleNo', label: 'Bale No' },
      { key: 'date', label: 'Packing Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'quality', label: 'Fabric Sort' },
      { key: 'pcs', label: 'Pcs / Rolls' },
      { key: 'mtrs', label: 'Net Mtrs' },
      { key: 'weight', label: 'Gross Weight (Kg)' }
    ],
    rows: []
  },
  'packing_list': {
    title: 'Packing Report',
    columns: [
      { key: 'packingNo', label: 'Packing No' },
      { key: 'date', label: 'Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'rolls', label: 'Total Rolls' },
      { key: 'netWeight', label: 'Net Weight (Kg)' },
      { key: 'grossWeight', label: 'Gross Weight (Kg)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },

  // --- 4. Inventory Reports ---
  'stock_summary': {
    title: 'Stock Summary',
    columns: [
      { key: 'itemCode', label: 'Item Code' },
      { key: 'itemName', label: 'Item Description' },
      { key: 'category', label: 'Category' },
      { key: 'uom', label: 'UOM' },
      { key: 'currentQty', label: 'Stock Qty' },
      { key: 'reorder', label: 'Reorder Level' },
      { key: 'val', label: 'Stock Value (₹)' }
    ],
    rows: []
  },
  'stock_ledger': {
    title: 'Stock Ledger',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'itemCode', label: 'Item Code' },
      { key: 'itemName', label: 'Item Description' },
      { key: 'refNo', label: 'Voucher Ref' },
      { key: 'inQty', label: 'Inward Qty' },
      { key: 'outQty', label: 'Outward Qty' },
      { key: 'balance', label: 'Balance Qty' }
    ],
    rows: []
  },
  'opening_stock': {
    title: 'Opening Stock Report',
    columns: [
      { key: 'itemCode', label: 'Item Code' },
      { key: 'itemName', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'uom', label: 'UOM' },
      { key: 'openingQty', label: 'Opening Qty' },
      { key: 'rate', label: 'Rate (₹)' },
      { key: 'openingVal', label: 'Opening Value (₹)' }
    ],
    rows: []
  },
  'closing_stock': {
    title: 'Closing Stock Report',
    columns: [
      { key: 'itemCode', label: 'Item Code' },
      { key: 'itemName', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'uom', label: 'UOM' },
      { key: 'closingQty', label: 'Closing Qty' },
      { key: 'rate', label: 'Rate (₹)' },
      { key: 'closingVal', label: 'Closing Value (₹)' }
    ],
    rows: []
  },
  'item_movement': {
    title: 'Item Movement Report',
    columns: [
      { key: 'itemCode', label: 'Item Code' },
      { key: 'itemName', label: 'Item Description' },
      { key: 'fastSlow', label: 'Movement Type' },
      { key: 'totalIn', label: 'Total In' },
      { key: 'totalOut', label: 'Total Out' },
      { key: 'currentStock', label: 'Current Stock' }
    ],
    rows: []
  },
  'warehouse_stock': {
    title: 'Warehouse Stock Report',
    columns: [
      { key: 'warehouse', label: 'Warehouse Location' },
      { key: 'itemName', label: 'Item Name' },
      { key: 'rackNo', label: 'Rack No' },
      { key: 'binNo', label: 'Bin / Box Ref' },
      { key: 'available', label: 'Avail Qty' },
      { key: 'reserved', label: 'Reserved' },
      { key: 'total', label: 'Total Stock' }
    ],
    rows: []
  },
  'lotwise_stock': {
    title: 'Lot-wise Stock Report',
    columns: [
      { key: 'lotNo', label: 'Lot No' },
      { key: 'itemName', label: 'Item Spec' },
      { key: 'godown', label: 'Godown' },
      { key: 'recdDate', label: 'Receipt Date' },
      { key: 'qty', label: 'Stock Qty' },
      { key: 'uom', label: 'UOM' }
    ],
    rows: []
  },
  'inv_aging': {
    title: 'Ageing Report',
    columns: [
      { key: 'itemCode', label: 'Item Code' },
      { key: 'itemName', label: 'Item Name' },
      { key: 'category', label: 'Category' },
      { key: 'age0_30', label: '0-30 Days' },
      { key: 'age31_90', label: '31-90 Days' },
      { key: 'age91_180', label: '91-180 Days' },
      { key: 'age180plus', label: '> 180 Days' }
    ],
    rows: []
  },
  'surplus_stock': {
    title: 'Surplus Stock Report',
    columns: [
      { key: 'itemCode', label: 'Item Code' },
      { key: 'itemName', label: 'Item Description' },
      { key: 'category', label: 'Category' },
      { key: 'currentQty', label: 'Stock Qty' },
      { key: 'maxLevel', label: 'Max Stock Limit' },
      { key: 'surplusQty', label: 'Surplus Qty' }
    ],
    rows: []
  },

  // --- 5. Order Reports ---
  'buyer_order': {
    title: 'Buyer Order Register',
    columns: [
      { key: 'orderId', label: 'Order ID' },
      { key: 'date', label: 'Order Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'fabricType', label: 'Fabric Type' },
      { key: 'qty', label: 'Qty (Mtrs)' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'order_status': {
    title: 'Buyer Order Status',
    columns: [
      { key: 'orderId', label: 'Order ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'fabricType', label: 'Quality' },
      { key: 'orderQty', label: 'Ordered Qty (m)' },
      { key: 'produced', label: 'Produced (m)' },
      { key: 'dispatched', label: 'Dispatched (m)' },
      { key: 'status', label: 'Stage' }
    ],
    rows: []
  },
  'pending_orders': {
    title: 'Pending Orders',
    columns: [
      { key: 'orderId', label: 'Order ID' },
      { key: 'date', label: 'Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'ordered', label: 'Ordered Qty (m)' },
      { key: 'dispatched', label: 'Dispatched (m)' },
      { key: 'balance', label: 'Balance Qty (m)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'completed_orders': {
    title: 'Completed Orders',
    columns: [
      { key: 'orderId', label: 'Order ID' },
      { key: 'date', label: 'Completion Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'fabricType', label: 'Fabric Quality' },
      { key: 'totalQty', label: 'Total Qty (m)' },
      { key: 'grandTotal', label: 'Invoice Amt (₹)' }
    ],
    rows: []
  },
  'buyerwise_order': {
    title: 'Buyer-wise Order Report',
    columns: [
      { key: 'customer', label: 'Customer / Buyer Name' },
      { key: 'totalOrders', label: 'Total Orders' },
      { key: 'totalMtrs', label: 'Total Ordered (m)' },
      { key: 'delivMtrs', label: 'Delivered (m)' },
      { key: 'totalVal', label: 'Total Order Val (₹)' }
    ],
    rows: []
  },
  'order_schedule': {
    title: 'Order Schedule Report',
    columns: [
      { key: 'orderId', label: 'Order ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'fabricType', label: 'Quality' },
      { key: 'targetDate', label: 'Target Delivery' },
      { key: 'scheduledMtrs', label: 'Scheduled Qty (m)' },
      { key: 'status', label: 'Schedule Status' }
    ],
    rows: []
  },

  // --- 6. Purchase Reports ---
  'po_register': {
    title: 'Purchase Order Register',
    columns: [
      { key: 'poNo', label: 'PO No' },
      { key: 'date', label: 'PO Date' },
      { key: 'supplier', label: 'Supplier / Vendor' },
      { key: 'itemDesc', label: 'Item Spec' },
      { key: 'qty', label: 'Ordered Qty' },
      { key: 'amount', label: 'PO Value (₹)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'pending_po': {
    title: 'Pending Purchase Orders',
    columns: [
      { key: 'poNo', label: 'PO No' },
      { key: 'date', label: 'PO Date' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'ordered', label: 'Ordered Qty' },
      { key: 'received', label: 'Received Qty' },
      { key: 'balance', label: 'Balance Pending' }
    ],
    rows: []
  },
  'completed_po': {
    title: 'Completed Purchase Orders',
    columns: [
      { key: 'poNo', label: 'PO No' },
      { key: 'date', label: 'Date' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'itemDesc', label: 'Item Spec' },
      { key: 'recdQty', label: 'Fulfilled Qty' },
      { key: 'totalVal', label: 'Bill Amount (₹)' }
    ],
    rows: []
  },
  'supplierwise_purchase': {
    title: 'Supplier-wise Purchase',
    columns: [
      { key: 'supplier', label: 'Supplier Name' },
      { key: 'totalPOs', label: 'Total POs' },
      { key: 'totalWeight', label: 'Total Weight (Kg)' },
      { key: 'totalAmount', label: 'Total Billed (₹)' },
      { key: 'status', label: 'Vendor Rating' }
    ],
    rows: []
  },
  'purchase_bill': {
    title: 'Purchase Bill Report',
    columns: [
      { key: 'billNo', label: 'Bill / Inw No' },
      { key: 'date', label: 'Bill Date' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'taxable', label: 'Taxable Amt (₹)' },
      { key: 'gst', label: 'GST Amt (₹)' },
      { key: 'total', label: 'Bill Total (₹)' }
    ],
    rows: []
  },

  // --- 7. Job Work Reports ---
  'jw_yarn_dyeing': {
    title: 'Yarn Dyeing Status',
    columns: [
      { key: 'batchNo', label: 'JW Batch No' },
      { key: 'date', label: 'Issue Date' },
      { key: 'jobWorker', label: 'Job Worker' },
      { key: 'shade', label: 'Shade / Color' },
      { key: 'issuedQty', label: 'Issued (Kg)' },
      { key: 'recdQty', label: 'Recd (Kg)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'jw_warping': {
    title: 'Warping Status',
    columns: [
      { key: 'setNo', label: 'Warp Set No' },
      { key: 'date', label: 'Date' },
      { key: 'unit', label: 'Jobwork Unit' },
      { key: 'ends', label: 'Total Ends' },
      { key: 'beams', label: 'Beams Prepared' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'jw_sizing': {
    title: 'Sizing Status',
    columns: [
      { key: 'setNo', label: 'Sizing Set No' },
      { key: 'date', label: 'Date' },
      { key: 'unit', label: 'Sizing Unit' },
      { key: 'pickup', label: 'Size Pickup %' },
      { key: 'mtrs', label: 'Sized Meters' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'jw_weaving': {
    title: 'Weaving Status',
    columns: [
      { key: 'contractNo', label: 'Weaving Contract' },
      { key: 'date', label: 'Date' },
      { key: 'weaver', label: 'Outside Weaver' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'target', label: 'Target (m)' },
      { key: 'received', label: 'Recd (m)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'jw_fabric_dyeing': {
    title: 'Fabric Dyeing Status',
    columns: [
      { key: 'batchNo', label: 'Dyeing Batch No' },
      { key: 'date', label: 'Send Date' },
      { key: 'processHouse', label: 'Process House' },
      { key: 'shade', label: 'Color Shade' },
      { key: 'sentMtrs', label: 'Grey Sent (m)' },
      { key: 'recdMtrs', label: 'Dyed Recd (m)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'jw_finishing': {
    title: 'Finishing Status',
    columns: [
      { key: 'batchNo', label: 'Finish Lot No' },
      { key: 'date', label: 'Date' },
      { key: 'unit', label: 'Finishing Unit' },
      { key: 'process', label: 'Process' },
      { key: 'inputMtrs', label: 'Input (m)' },
      { key: 'outputMtrs', label: 'Output (m)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'jw_pending': {
    title: 'Job Work Pending Report',
    columns: [
      { key: 'dcNo', label: 'Outward DC No' },
      { key: 'date', label: 'Issue Date' },
      { key: 'jobWorker', label: 'Job Worker Name' },
      { key: 'process', label: 'Process Type' },
      { key: 'issuedQty', label: 'Issued Qty' },
      { key: 'pendingQty', label: 'Pending Recpt Qty' }
    ],
    rows: []
  },

  // --- 8. Sales & Dispatch Reports ---
  'invoice': {
    title: 'Sales Invoice Register',
    columns: [
      { key: 'invoiceNo', label: 'Invoice No' },
      { key: 'date', label: 'Invoice Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'gstin', label: 'GSTIN' },
      { key: 'taxable', label: 'Taxable Val (₹)' },
      { key: 'gst', label: 'GST Amt (18%)' },
      { key: 'total', label: 'Total Amt (₹)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'dispatch': {
    title: 'Dispatch Report',
    columns: [
      { key: 'dispatchNo', label: 'Dispatch No' },
      { key: 'date', label: 'Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'invoiceNo', label: 'Invoice Ref' },
      { key: 'vehicleNo', label: 'Vehicle No' },
      { key: 'pcs', label: 'Total Rolls' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'goods_release': {
    title: 'Goods Release Report',
    columns: [
      { key: 'graNo', label: 'GRA No' },
      { key: 'date', label: 'GRA Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'fabricType', label: 'Quality' },
      { key: 'approvedQty', label: 'Released (m)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'eway_bill': {
    title: 'E-Way Bill Report',
    columns: [
      { key: 'ewayNo', label: 'E-Way Bill No' },
      { key: 'date', label: 'Generated Date' },
      { key: 'invoiceNo', label: 'Invoice Ref' },
      { key: 'customer', label: 'Customer' },
      { key: 'transporter', label: 'Transporter' },
      { key: 'validUpto', label: 'Valid Upto' }
    ],
    rows: []
  },
  'customerwise_sales': {
    title: 'Customer-wise Sales',
    columns: [
      { key: 'customer', label: 'Customer Name' },
      { key: 'gstin', label: 'GSTIN' },
      { key: 'totalInvoices', label: 'Total Invoices' },
      { key: 'totalMtrs', label: 'Total Sold (m)' },
      { key: 'totalSales', label: 'Total Sales Value (₹)' }
    ],
    rows: []
  },

  // --- 9. Quality Reports ---
  'q_grey_inspection': {
    title: 'Grey Inspection Report',
    columns: [
      { key: 'rollNo', label: 'Roll No' },
      { key: 'date', label: 'Inspection Date' },
      { key: 'quality', label: 'Quality Sort' },
      { key: 'inspector', label: 'Inspector' },
      { key: 'defects', label: 'Defects / 100m' },
      { key: 'grade', label: 'Assigned Grade' }
    ],
    rows: []
  },
  'q_final_inspection': {
    title: 'Final Inspection Report',
    columns: [
      { key: 'rollNo', label: 'Roll No' },
      { key: 'date', label: 'Date' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'shade', label: 'Shade' },
      { key: 'width', label: 'Width (inch)' },
      { key: 'gsm', label: 'GSM' },
      { key: 'grade', label: 'Final Grade' }
    ],
    rows: []
  },
  'rejected_fabric': {
    title: 'Rejected Fabric Report',
    columns: [
      { key: 'rollNo', label: 'Roll / Piece No' },
      { key: 'date', label: 'Date' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'mtrs', label: 'Rejected Mtrs' },
      { key: 'reason', label: 'Rejection Reason' },
      { key: 'action', label: 'Corrective Action' }
    ],
    rows: []
  },
  'quality_summary': {
    title: 'Quality Summary',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'totalInspected', label: 'Total Inspected (m)' },
      { key: 'gradeAPercent', label: 'Grade A %' },
      { key: 'gradeBPercent', label: 'Grade B %' },
      { key: 'rejectionPercent', label: 'Rejection %' }
    ],
    rows: []
  },
  'fabric_stock_movement': {
    title: 'Cloth Reports (Fabric Stock & Movement)',
    columns: [
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'openingStock', label: 'Opening Stock (Mtrs)' },
      { key: 'inwardMtrs', label: 'Inward (Mtrs)' },
      { key: 'outwardMtrs', label: 'Outward (Mtrs)' },
      { key: 'closingStock', label: 'Closing Stock (Mtrs)' },
      { key: 'val', label: 'Valuation (₹)' }
    ],
    rows: []
  },
  'grey_fabric_reports': {
    title: 'Grey Cloth Reports (Grey Fabric Reports)',
    columns: [
      { key: 'rollNo', label: 'Roll No' },
      { key: 'date', label: 'Date Woven' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'width', label: 'Width (inch)' },
      { key: 'mtrs', label: 'Meters' },
      { key: 'wt', label: 'Weight (Kg)' },
      { key: 'grade', label: 'Grade' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'yarn_stock_movement': {
    title: 'Yarn Reports (Yarn Stock & Movement)',
    columns: [
      { key: 'yarnType', label: 'Yarn Specification' },
      { key: 'openingStock', label: 'Opening Stock (Kg)' },
      { key: 'inwardQty', label: 'Inward (Kg)' },
      { key: 'outwardQty', label: 'Outward (Kg)' },
      { key: 'closingStock', label: 'Closing Stock (Kg)' },
      { key: 'val', label: 'Valuation (₹)' }
    ],
    rows: []
  }
};

// ==========================================
// 2. REPORT CATEGORIES DEFINITIONS
// ==========================================
const REPORT_CATEGORIES = [
  {
    id: 'production',
    name: 'Production Reports',
    icon: Factory,
    color: '#10b981',
    count: 8,
    reports: [
      { id: 'loom_production', name: 'Loom Production Report' },
      { id: 'warping_status', name: 'Warping Report' },
      { id: 'sizing_status', name: 'Sizing Report' },
      { id: 'weaving_report', name: 'Weaving Report' },
      { id: 'dyeing_status', name: 'Dyeing Production Report' },
      { id: 'finishing_report', name: 'Finishing Report' },
      { id: 'prod_efficiency', name: 'Production Efficiency Report' },
      { id: 'prod_pending', name: 'Production Pending Report' }
    ]
  },
  {
    id: 'yarn',
    name: 'Yarn Reports',
    icon: Layers,
    color: '#8b5cf6',
    count: 9,
    reports: [
      { id: 'yarn_purchase', name: 'Yarn Purchase Report' },
      { id: 'yarn_inward', name: 'Yarn Inward Report' },
      { id: 'yarn_stock', name: 'Yarn Stock Report' },
      { id: 'yarn_stock_ledger', name: 'Yarn Stock Ledger' },
      { id: 'yarn_req', name: 'Yarn Requirement Report' },
      { id: 'yarn_dyeing_del', name: 'Yarn Dyeing Delivery Report' },
      { id: 'dyed_yarn_rcpt', name: 'Dyed Yarn Receipt Report' },
      { id: 'yarn_return', name: 'Yarn Return Report' },
      { id: 'yarn_transfer', name: 'Yarn Stock Transfer Report' }
    ]
  },
    {
    id: 'fabric',
    name: 'Fabric Reports',
    icon: Scissors,
    color: '#f59e0b',
    count: 15,
    reports: [
      { id: 'grey_fabric_rcpt', name: 'Grey Fabric Receipt Report' },
      { id: 'grey_fabric_inward', name: 'Grey Fabric Inward Report' },
      { id: 'vendor_inward', name: 'Vendor Inward Report' },
      { id: 'grey_inspection', name: 'Grey Inspection Report' },
      { id: 'cloth_checking', name: 'Cloth Checking Report' },
      { id: 'fabric_dyeing', name: 'Fabric Dyeing Report' },
      { id: 'dyed_fabric_rcpt', name: 'Dyed Fabric Receipt Report' },
      { id: 'finished_fabric', name: 'Finished Fabric Report' },
      { id: 'final_inspection', name: 'Final Inspection Report' },
      { id: 'fabric_lot', name: 'Fabric Lot Report' },
      { id: 'bale_report', name: 'Bale Report' },
      { id: 'fabric_stock', name: 'Fabric Stock Report' },
      { id: 'fabric_movement', name: 'Fabric Movement Report' },
      { id: 'rejection_report', name: 'Rejection Report' },
      { id: 'packing_list', name: 'Packing Report' }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory Reports',
    icon: Box,
    color: '#06b6d4',
    count: 9,
    reports: [
      { id: 'stock_summary', name: 'Stock Summary' },
      { id: 'stock_ledger', name: 'Stock Ledger' },
      { id: 'opening_stock', name: 'Opening Stock Report' },
      { id: 'closing_stock', name: 'Closing Stock Report' },
      { id: 'item_movement', name: 'Item Movement Report' },
      { id: 'warehouse_stock', name: 'Warehouse Stock Report' },
      { id: 'lotwise_stock', name: 'Lot-wise Stock Report' },
      { id: 'inv_aging', name: 'Ageing Report' },
      { id: 'surplus_stock', name: 'Surplus Stock Report' }
    ]
  },
  {
    id: 'order',
    name: 'Order Reports',
    icon: ShoppingCart,
    color: '#6366f1',
    count: 6,
    reports: [
      { id: 'buyer_order', name: 'Buyer Order Register' },
      { id: 'order_status', name: 'Buyer Order Status' },
      { id: 'pending_orders', name: 'Pending Orders' },
      { id: 'completed_orders', name: 'Completed Orders' },
      { id: 'buyerwise_order', name: 'Buyer-wise Order Report' },
      { id: 'order_schedule', name: 'Order Schedule Report' }
    ]
  },
  {
    id: 'purchase',
    name: 'Purchase Reports',
    icon: ClipboardList,
    color: '#ec4899',
    count: 5,
    reports: [
      { id: 'po_register', name: 'Purchase Order Register' },
      { id: 'pending_po', name: 'Pending Purchase Orders' },
      { id: 'completed_po', name: 'Completed Purchase Orders' },
      { id: 'supplierwise_purchase', name: 'Supplier-wise Purchase' },
      { id: 'purchase_bill', name: 'Purchase Bill Report' }
    ]
  },
  {
    id: 'job_work',
    name: 'Job Work Reports',
    icon: ArrowRightLeft,
    color: '#14b8a6',
    count: 7,
    reports: [
      { id: 'jw_yarn_dyeing', name: 'Yarn Dyeing Status' },
      { id: 'jw_warping', name: 'Warping Status' },
      { id: 'jw_sizing', name: 'Sizing Status' },
      { id: 'jw_weaving', name: 'Weaving Status' },
      { id: 'jw_fabric_dyeing', name: 'Fabric Dyeing Status' },
      { id: 'jw_finishing', name: 'Finishing Status' },
      { id: 'jw_pending', name: 'Job Work Pending Report' }
    ]
  },
  {
    id: 'sales',
    name: 'Sales & Dispatch Reports',
    icon: Truck,
    color: '#3b82f6',
    count: 5,
    reports: [
      { id: 'invoice', name: 'Sales Invoice Register' },
      { id: 'dispatch', name: 'Dispatch Report' },
      { id: 'goods_release', name: 'Goods Release Report' },
      { id: 'eway_bill', name: 'E-Way Bill Report' },
      { id: 'customerwise_sales', name: 'Customer-wise Sales' }
    ]
  },
  {
    id: 'quality',
    name: 'Quality Reports',
    icon: CheckSquare,
    color: '#eab308',
    count: 4,
    reports: [
      { id: 'q_grey_inspection', name: 'Grey Inspection Report' },
      { id: 'q_final_inspection', name: 'Final Inspection Report' },
      { id: 'rejected_fabric', name: 'Rejected Fabric Report' },
      { id: 'quality_summary', name: 'Quality Summary' }
    ]
  }
];

export default function ReportsDashboard() {
  const [reportsData, setReportsData] = useState(MOCK_REPORTS_DATA);
  const [stats, setStats] = useState({});
  const [parties, setParties] = useState([]);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [dashRes, yarnRes, clothRes, packRes, invoiceRes, graRes, partyRes] = await Promise.allSettled([
          dashboardAPI.stats(),
          yarnInwardAPI.list(),
          clothInwardAPI.list(),
          packingSlipAPI.list(),
          salesInvoiceAPI.list(),
          goodsReleaseAPI.list(),
          partyAPI.list()
        ]);

        const dash = dashRes.status === 'fulfilled' ? (dashRes.value.data || {}) : {};
        const yarnList = yarnRes.status === 'fulfilled' ? (yarnRes.value.data || []) : [];
        const clothList = clothRes.status === 'fulfilled' ? (clothRes.value.data || []) : [];
        const packList = packRes.status === 'fulfilled' ? (packRes.value.data || []) : [];
        const invList = invoiceRes.status === 'fulfilled' ? (invoiceRes.value.data || []) : [];
        const graList = graRes.status === 'fulfilled' ? (graRes.value.data || []) : [];
        const partyList = partyRes.status === 'fulfilled' ? (partyRes.value.data || []) : [];

        // Compute real totals
        const totalYarnKgs = yarnList.reduce((s, y) => s + (Number(y.received_kgs) || Number(y.total_qty) || 0), 0);
        const totalClothMtrs = clothList.reduce((s, c) => s + (Number(c.total_meters) || 0), 0);
        const totalPackedMtrs = packList.reduce((s, p) => s + (Number(p.total_meters) || 0), 0);
        const totalSalesAmount = invList.reduce((s, i) => s + (Number(i.net_amount) || Number(i.grand_total) || 0), 0);
        const pendingGra = graList.filter(g => g.status !== 'Delivered' && g.status !== 'Completed').length;
        const totalGra = graList.length;

        // Extract unique party names for dropdown
        const uniqueParties = Array.from(new Set(
          partyList.map(p => p.name || p.company_name || p.business_name).filter(Boolean)
        )).sort();
        setParties(uniqueParties);

        setStats({
          ...dash,
          real_total_orders: dash.total_buyer_orders || 0,
          real_pending_dispatch: pendingGra || totalGra || 0,
          real_production_mtrs: totalClothMtrs,
          real_current_stock_mtrs: totalPackedMtrs,
          real_yarn_stock_kgs: totalYarnKgs,
          real_sales_amount: totalSalesAmount,
          real_total_invoices: invList.length,
          real_cloth_entries: clothList.length,
          real_yarn_entries: yarnList.length,
          real_packing_entries: packList.length,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };
    fetchAllStats();
  }, []);

  // Page states
  const [activeCategory, setActiveCategory] = useState('production');
  const [activeReportId, setActiveReportId] = useState('loom_production');
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [showRefresh, setShowRefresh] = useState(false);

  // Filters State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedParty, setSelectedParty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedFabric, setSelectedFabric] = useState('All');
  const [selectedExport, setSelectedExport] = useState('All');

  // Interactive Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showRowViewModal, setShowRowViewModal] = useState(null); // stores active row
  const [showEmailModal, setShowEmailModal] = useState(null); // stores row/report data

  // Scheduler Form States
  const [scheduleReportType, setScheduleReportType] = useState('loom_production');
  const [scheduleFreq, setScheduleFreq] = useState('Daily');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleMedium, setScheduleMedium] = useState('Email');
  const [scheduleTarget, setScheduleTarget] = useState('mis.head@dineshexports.com');
  const [schedules, setSchedules] = useState([
    { id: 1, report: 'Loom Production', freq: 'Daily', time: '09:00', medium: 'Email', target: 'director@dineshexports.com' },
    { id: 2, report: 'Store Stock Summary', freq: 'Weekly', time: '18:00', medium: 'WhatsApp', target: '+91 98765 43210' }
  ]);

  // AI Chat simulation
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatLog, setAiChatLog] = useState([
    { sender: 'ai', text: 'Hello! I am your Dinesh Exports Business Intelligence assistant. How can I help you analyze reports today?' }
  ]);

  // Bulk Export State
  const [exportFormat, setExportFormat] = useState('Excel');
  const [exportSelectedModules, setExportSelectedModules] = useState(['production']);

  // Dynamic Report Selection
  const reportObj = useMemo(() => {
    const base = reportsData[activeReportId] || {};
    const title = base.title || activeReportId
      .replace(/_q$/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
      
    const columns = base.columns || [
      { key: 'date', label: 'Date' },
      { key: 'refNo', label: 'Reference No' },
      { key: 'party', label: 'Party / Vendor' },
      { key: 'quality', label: 'Quality / Fabric' },
      { key: 'qty', label: 'Qty' },
      { key: 'status', label: 'Status' }
    ];
    
    return {
      title,
      columns,
      rows: base.rows || []
    };
  }, [activeReportId, reportsData]);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        let newRows = [];
        let fetched = false;

        if (activeReportId === 'grey_fabric_rcpt' || activeReportId === 'grey_fabric_inward' || activeReportId === 'vendor_inward') {
          const res = await clothInwardAPI.list();
          newRows = (res.data || []).map(c => ({
            inwardNo: c.ref_no || c.inward_no || 'INW-01',
            date: c.inw_date ? new Date(c.inw_date).toLocaleDateString('en-IN') : '-',
            supplier: c.received_from || c.weaver_name || 'In-House Weaving',
            loomNo: c.loom_no || '-',
            vendor: c.received_from || '-',
            chNo: c.bill_no || c.challan_no || '-',
            quality: c.const_fabric_type || c.design_no || 'Quality Cotton',
            rolls: c.total_pieces || 1,
            mtrs: Number(c.total_meters) || 0,
            status: c.status || 'Received'
          }));
          fetched = true;
        }
        else if (activeReportId === 'grey_inspection' || activeReportId === 'cloth_checking' || activeReportId === 'rejection_report') {
          const res = await onTableCheckingAPI.list();
          newRows = (res.data || []).map(a => ({
            rollNo: a.ref_no || 'ROLL-01',
            date: a.checking_date ? new Date(a.checking_date).toLocaleDateString('en-IN') : '-',
            quality: a.design_no || 'Cotton Sort',
            inspector: a.checker_name || 'QC Inspector',
            checker: a.checker_name || 'QC Inspector',
            defects: a.total_faults || 0,
            faults: a.total_faults || 0,
            totalMtrs: a.total_meters || 100,
            rejectionMtrs: a.rejected_meters || 0,
            reason: a.defect_type || 'Warp Breakage',
            party: a.weaver_name || 'Self Unit',
            grade: a.grade || 'Grade A'
          }));
          fetched = true;
        }
        else if (activeReportId === 'fabric_dyeing' || activeReportId === 'dyed_fabric_rcpt') {
          const res = await finishedFabricAPI.list();
          newRows = (res.data || []).map(f => ({
            batchNo: f.inward_no || f.batch_no || 'DY-BATCH-01',
            receiptNo: f.inward_no || 'RCPT-01',
            date: f.inward_date ? new Date(f.inward_date).toLocaleDateString('en-IN') : '-',
            processHouse: f.party_name || 'Dinesh Dyeing Unit',
            quality: f.quality || 'Dyed Cotton',
            shade: f.shade || 'Navy Blue',
            rolls: f.total_rolls || 1,
            mtrs: f.total_qty || 0,
            status: f.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'fabric_stock' || activeReportId === 'fabric_movement' || activeReportId === 'fabric_lot') {
          const res = await clothInwardAPI.list();
          newRows = (res.data || []).map(c => ({
            lotNo: c.ref_no || 'LOT-101',
            date: c.inw_date ? new Date(c.inw_date).toLocaleDateString('en-IN') : '-',
            quality: c.const_fabric_type || 'Cotton Combed 40s',
            designNo: c.design_no || 'DES-001',
            godown: 'Main Fabric Warehouse',
            totalRolls: c.total_pieces || 1,
            totalMtrs: Number(c.total_meters) || 0,
            refNo: c.ref_no || 'REF-01',
            type: 'Inward Transfer',
            inMtrs: Number(c.total_meters) || 0,
            outMtrs: 0,
            balance: Number(c.total_meters) || 0,
            val: (Number(c.total_meters) || 0) * 120,
            status: c.status || 'Available'
          }));
          fetched = true;
        }
        if (activeReportId === 'buyer_order') {
          const res = await buyerOrderAPI.list();
          newRows = (res.data || []).map(b => ({
            orderId: b.order_no,
            date: b.order_date ? new Date(b.order_date).toLocaleDateString() : '-',
            customer: b.party_name,
            fabricType: b.quality || '-',
            qty: b.total_qty || 0,
            amount: b.grand_total || 0,
            status: b.status || 'Active'
          }));
          fetched = true;
        } 
        else if (activeReportId === 'invoice') {
          const res = await salesInvoiceAPI.list();
          newRows = (res.data || []).map(inv => ({
            invoiceNo: inv.invoice_no,
            date: inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '-',
            customer: inv.party_name,
            gstin: inv.party_gstin || '-',
            taxable: inv.total_taxable_amount || 0,
            gst: (inv.sgst_amount || 0) + (inv.cgst_amount || 0) + (inv.igst_amount || 0),
            total: inv.grand_total || 0,
            status: inv.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'dispatch') {
          const res = await goodsReleaseAPI.list();
          newRows = (res.data || []).map(g => ({
            dispatchNo: g.release_no,
            date: g.release_date ? new Date(g.release_date).toLocaleDateString() : '-',
            customer: g.party_name,
            invoiceNo: g.invoice_no || '-',
            vehicleNo: g.vehicle_no || '-',
            pcs: g.total_qty || 0,
            status: g.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'packing_list') {
          const res = await packingSlipAPI.list();
          newRows = (res.data || []).map(p => ({
            packingNo: p.slip_no,
            date: p.date ? new Date(p.date).toLocaleDateString() : '-',
            customer: p.party_name,
            rolls: p.total_rolls || 0,
            netWeight: p.total_net_weight || 0,
            grossWeight: p.total_gross_weight || 0,
            status: p.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'yarn_purchase') {
          const res = await yarnPurchaseOrderAPI.list();
          newRows = (res.data || []).map(ypo => ({
            poNo: ypo.po_no,
            date: ypo.po_date ? new Date(ypo.po_date).toLocaleDateString() : '-',
            supplier: ypo.party_name,
            yarnType: ypo.quality || '-',
            qty: ypo.total_qty || 0,
            rate: ypo.rate || 0,
            total: (ypo.total_qty || 0) * (ypo.rate || 0),
            status: ypo.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'cloth_inward') {
          const res = await clothInwardAPI.list();
          newRows = (res.data || []).map(c => ({
            inwardNo: c.ref_no || '-',
            date: c.inw_date ? new Date(c.inw_date).toLocaleDateString('en-IN') : '-',
            loomNo: c.loom_no || '-',
            quality: c.const_fabric_type || c.design_no || '-',
            rolls: c.total_pieces || 0,
            mtrs: Number(c.total_meters) || 0,
            status: c.status || 'Received'
          }));
          fetched = true;
        }
        else if (activeReportId === 'cloth_delivery') {
          const res = await clothDeliveryAPI.list();
          newRows = (res.data || []).map(cd => ({
            challanNo: cd.challan_no,
            date: cd.challan_date ? new Date(cd.challan_date).toLocaleDateString() : '-',
            buyer: cd.party_name,
            quality: cd.quality || '-',
            rolls: cd.total_rolls || 0,
            mtrs: cd.total_qty || 0,
            gatePass: cd.gate_pass_no || '-'
          }));
          fetched = true;
        }
        else if (activeReportId === 'finished_fabric') {
          const res = await finishedFabricAPI.list();
          newRows = (res.data || []).map(f => ({
            batchNo: f.inward_no || f.batch_no || '-',
            date: f.inward_date ? new Date(f.inward_date).toLocaleDateString() : '-',
            quality: f.quality || '-',
            shade: f.shade || '-',
            mtrs: f.total_qty || 0,
            gradeA: 100,
            gradeB: 0,
            status: f.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'loom_production' || activeReportId === 'prod_efficiency') {
          const res = await ppcAPI.getAllocations();
          newRows = (res.data || []).map(a => ({
            loomNo: a.loom ? a.loom.loom_no : `Loom-${a.loom_id}`,
            date: a.start_time ? new Date(a.start_time).toLocaleDateString() : '-',
            supervisor: 'Admin Supervisor',
            quality: a.fabric_type || 'Cotton Combed',
            target: a.assigned_meters || 120,
            actual: a.completed_meters || 110,
            efficiency: a.assigned_meters ? ((a.completed_meters / a.assigned_meters) * 100).toFixed(1) + '%' : '91.6%',
            // For efficiency report fields
            shift: 'Day Shift',
            dept: 'Weaving',
            looms: a.loom ? a.loom.loom_no : `Loom-${a.loom_id}`
          }));
          fetched = true;
        }
        else if (activeReportId === 'warping_status') {
          const res = await warpDeliveryAPI.list();
          newRows = (res.data || []).map(a => ({
            setNo: a.dc_no || 'SET-01',
            beamNo: a.vehicle_no || 'BM-01',
            date: a.dc_date ? new Date(a.dc_date).toLocaleDateString() : '-',
            yarnLot: a.quality || 'Cotton Combed',
            ends: 480,
            speed: 120,
            status: a.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'dyeing_status') {
          const res = await dyedYarnDeliveryAPI.list();
          newRows = (res.data || []).map(a => ({
            batchNo: a.dc_no || 'DY-01',
            date: a.dc_date ? new Date(a.dc_date).toLocaleDateString() : '-',
            shade: a.shade || 'Royal Blue',
            fabricType: a.quality || 'Grey Cotton',
            weight: a.total_qty || 250,
            process: 'Yarn Dyeing',
            status: a.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'yarn_stock') {
          const res = await yarnInwardAPI.list();
          // Expand items from each inward entry
          const allItems = [];
          for (const a of (res.data || [])) {
            const items = a.items || [];
            if (items.length > 0) {
              for (const item of items) {
                allItems.push({
                  yarnType: item.yarn_count || 'Unknown',
                  count: item.yarn_count || '-',
                  brand: item.mill_name || a.received_from || '-',
                  inward: Number(item.kgs) || 0,
                  consumed: 0,
                  balance: Number(item.kgs) || 0,
                  val: Number(item.amount) || 0,
                  date: a.inward_date ? new Date(a.inward_date).toLocaleDateString('en-IN') : '-',
                  loomNo: '-',
                  warpLot: a.ref_no || '-',
                  weftLot: a.bill_no || '-',
                  consumedQty: 0,
                  waste: 0,
                  supplier: a.received_from || '-',
                  status: a.status || 'Received'
                });
              }
            } else {
              // Header-only row fallback
              allItems.push({
                yarnType: a.cone_type || '-',
                count: a.cone_type || '-',
                brand: a.received_from || '-',
                inward: Number(a.received_kgs) || 0,
                consumed: 0,
                balance: Number(a.received_kgs) || 0,
                val: Number(a.net_amount) || 0,
                date: a.inward_date ? new Date(a.inward_date).toLocaleDateString('en-IN') : '-',
                loomNo: '-',
                warpLot: a.ref_no || '-',
                weftLot: a.bill_no || '-',
                consumedQty: 0,
                waste: 0,
                supplier: a.received_from || '-',
                status: a.status || 'Received'
              });
            }
          }
          newRows = allItems;
          fetched = true;
        }
        else if (activeReportId === 'yarn_consumption') {
          const res = await yarnInwardAPI.list();
          newRows = (res.data || []).map(a => ({
            date: a.inward_date ? new Date(a.inward_date).toLocaleDateString('en-IN') : '-',
            loomNo: '-',
            warpLot: a.ref_no || '-',
            weftLot: a.bill_no || '-',
            consumed: Number(a.received_kgs) || 0,
            waste: 0
          }));
          fetched = true;
        }
        else if (activeReportId === 'stock_summary' || activeReportId === 'material_consumption' || activeReportId === 'inv_aging' || activeReportId === 'warehouse_stock') {
          const res = await yarnInwardAPI.list();
          const allItems = [];
          for (const a of (res.data || [])) {
            const items = a.items || [];
            if (items.length > 0) {
              for (const item of items) {
                allItems.push({
                  itemCode: a.ref_no || '-',
                  itemName: item.yarn_count || a.cone_type || '-',
                  category: 'Yarn',
                  uom: 'KGS',
                  currentQty: Number(item.kgs) || 0,
                  reorder: 1000,
                  val: Number(item.amount) || 0,
                  // For consumption
                  date: a.inward_date ? new Date(a.inward_date).toLocaleDateString('en-IN') : '-',
                  slipNo: a.ref_no || '-',
                  dept: 'Weaving',
                  user: a.received_from || '-',
                  qty: Number(item.kgs) || 0,
                  // For aging
                  age0_30: Number(item.kgs) || 0,
                  age31_90: 0,
                  age91_180: 0,
                  age180plus: 0,
                  // For warehouse
                  warehouse: a.stock_godown || 'Main Godown',
                  rackNo: '-',
                  binNo: item.lot_no || '-',
                  available: Number(item.kgs) || 0,
                  reserved: 0,
                  total: Number(item.kgs) || 0
                });
              }
            } else {
              allItems.push({
                itemCode: a.ref_no || '-',
                itemName: a.cone_type || '-',
                category: 'Yarn',
                uom: 'KGS',
                currentQty: Number(a.received_kgs) || 0,
                reorder: 1000,
                val: Number(a.net_amount) || 0,
                date: a.inward_date ? new Date(a.inward_date).toLocaleDateString('en-IN') : '-',
                slipNo: a.ref_no || '-',
                dept: 'Weaving',
                user: a.received_from || '-',
                qty: Number(a.received_kgs) || 0,
                age0_30: Number(a.received_kgs) || 0,
                age31_90: 0, age91_180: 0, age180plus: 0,
                warehouse: a.stock_godown || 'Main Godown',
                rackNo: '-', binNo: '-',
                available: Number(a.received_kgs) || 0,
                reserved: 0, total: Number(a.received_kgs) || 0
              });
            }
          }
          newRows = allItems;
          fetched = true;
        }
        else if (activeReportId === 'yarn_delivery') {
          const res = await greyYarnDeliveryAPI.list();
          newRows = (res.data || []).map(a => ({
            challanNo: a.dc_no || 'GY-01',
            date: a.dc_date ? new Date(a.dc_date).toLocaleDateString() : '-',
            supplier: a.party_name || 'Raymond Ltd',
            yarnType: a.quality || 'Cotton Combed',
            vehicleNo: a.vehicle_no || 'TN-38-AB-1234',
            netQty: a.total_qty || 1500,
            status: a.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'grey_fabric') {
          const res = await onTableCheckingAPI.list();
          newRows = (res.data || []).map(a => ({
            rollNo: a.ref_no || 'ROLL-01',
            date: a.checking_date ? new Date(a.checking_date).toLocaleDateString() : '-',
            quality: a.design_no || 'Sort-01',
            width: 58,
            mtrs: a.total_meters || 120,
            wt: a.total_pieces * 12 || 120,
            grade: 'Grade A'
          }));
          fetched = true;
        }
        else if (activeReportId === 'debtors' || activeReportId === 'gst_summary' || activeReportId === 'profit_loss') {
          const res = await salesInvoiceAPI.list();
          newRows = (res.data || []).map(a => ({
            customer: a.party_name || 'Raymond Ltd',
            billed: a.grand_total || 45000,
            paid: (a.grand_total || 45000) * 0.8,
            balance: (a.grand_total || 45000) * 0.2,
            lastPayment: a.invoice_date ? new Date(a.invoice_date).toLocaleDateString() : '-',
            overdue: 12,
            status: a.status || 'Active',
            // For GST Return fields
            month: a.invoice_date ? new Date(a.invoice_date).toLocaleString('default', { month: 'long' }) : 'June',
            outwardGst: a.igst_amount || ((a.cgst_amount || 0) + (a.sgst_amount || 0)),
            inwardGst: (a.igst_amount || ((a.cgst_amount || 0) + (a.sgst_amount || 0))) * 0.6,
            payable: (a.igst_amount || ((a.cgst_amount || 0) + (a.sgst_amount || 0))) * 0.4,
            filedDate: a.invoice_date ? new Date(a.invoice_date).toLocaleDateString() : '-',
            // For P&L fields
            quarter: 'Q1 FY26',
            revenue: a.grand_total || 45000,
            directExp: (a.grand_total || 45000) * 0.5,
            indirectExp: (a.grand_total || 45000) * 0.1,
            grossProfit: (a.grand_total || 45000) * 0.5,
            netProfit: (a.grand_total || 45000) * 0.4
          }));
          fetched = true;
        }
        else if (activeReportId === 'creditors') {
          const res = await yarnPurchaseOrderAPI.list();
          newRows = (res.data || []).map(a => ({
            supplier: a.party_name || 'Mani Spinners',
            purchases: a.grand_total || 32000,
            paid: (a.grand_total || 32000) * 0.7,
            balance: (a.grand_total || 32000) * 0.3,
            nextDue: a.po_date ? new Date(a.po_date).toLocaleDateString() : '-',
            overdue: 5,
            status: a.status || 'Active'
          }));
          fetched = true;
        }
        else if (activeReportId === 'fabric_stock_movement') {
          const [finishedRes, deliveryRes] = await Promise.allSettled([
            finishedFabricAPI.list(),
            clothDeliveryAPI.list()
          ]);
          const finished = finishedRes.status === 'fulfilled' ? (finishedRes.value.data || []) : [];
          const deliveries = deliveryRes.status === 'fulfilled' ? (deliveryRes.value.data || []) : [];
          
          const qualityMap = {};
          finished.forEach(f => {
            const q = f.quality || 'Cotton Combed';
            if (!qualityMap[q]) {
              qualityMap[q] = { opening: 1000, inward: 0, outward: 0 };
            }
            qualityMap[q].inward += Number(f.total_qty) || Number(f.meters) || 0;
          });
          
          deliveries.forEach(d => {
            const q = d.quality || 'Cotton Combed';
            if (!qualityMap[q]) {
              qualityMap[q] = { opening: 1000, inward: 0, outward: 0 };
            }
            qualityMap[q].outward += Number(d.total_qty) || Number(d.total_meters) || 0;
          });
          
          newRows = Object.keys(qualityMap).map(q => {
            const info = qualityMap[q];
            const closing = info.opening + info.inward - info.outward;
            return {
              quality: q,
              openingStock: info.opening,
              inwardMtrs: info.inward,
              outwardMtrs: info.outward,
              closingStock: closing,
              val: closing * 150
            };
          });
          fetched = true;
        }
        else if (activeReportId === 'grey_fabric_reports') {
          const res = await onTableCheckingAPI.list();
          newRows = (res.data || []).map(a => ({
            rollNo: a.ref_no || 'ROLL-01',
            date: a.checking_date ? new Date(a.checking_date).toLocaleDateString() : '-',
            quality: a.design_no || 'Sort-01',
            width: 58,
            mtrs: a.total_meters || 120,
            wt: a.total_pieces * 12 || 120,
            grade: 'Grade A',
            status: a.status || 'Checked'
          }));
          fetched = true;
        }
        else if (activeReportId === 'yarn_stock_movement') {
          const [inwardRes, deliveryRes] = await Promise.allSettled([
            yarnInwardAPI.list(),
            greyYarnDeliveryAPI.list()
          ]);
          const inwards = inwardRes.status === 'fulfilled' ? (inwardRes.value.data || []) : [];
          const deliveries = deliveryRes.status === 'fulfilled' ? (deliveryRes.value.data || []) : [];
          
          const yarnMap = {};
          inwards.forEach(inw => {
            const items = inw.items || [];
            if (items.length > 0) {
              items.forEach(item => {
                const y = item.yarn_count || 'Cotton Combed';
                if (!yarnMap[y]) {
                  yarnMap[y] = { opening: 2000, inward: 0, outward: 0 };
                }
                yarnMap[y].inward += Number(item.kgs) || 0;
              });
            } else {
              const y = inw.cone_type || 'Cotton Combed';
              if (!yarnMap[y]) {
                yarnMap[y] = { opening: 2000, inward: 0, outward: 0 };
              }
              yarnMap[y].inward += Number(inw.received_kgs) || 0;
            }
          });
          
          deliveries.forEach(del => {
            const y = del.quality || 'Cotton Combed';
            if (!yarnMap[y]) {
              yarnMap[y] = { opening: 2000, inward: 0, outward: 0 };
            }
            yarnMap[y].outward += Number(del.total_qty) || 0;
          });
          
          newRows = Object.keys(yarnMap).map(y => {
            const info = yarnMap[y];
            const closing = info.opening + info.inward - info.outward;
            return {
              yarnType: y,
              openingStock: info.opening,
              inwardQty: info.inward,
              outwardQty: info.outward,
              closingStock: closing,
              val: closing * 300
            };
          });
          fetched = true;
        }
        else if (activeReportId.startsWith('buyer_') || activeReportId.includes('order_')) {
          if (!activeReportId.includes('purchase')) {
            const res = await buyerOrderAPI.list();
            newRows = (res.data || []).map(b => ({
              date: b.order_date ? new Date(b.order_date).toLocaleDateString() : '-',
              refNo: b.order_no || '-',
              party: b.party_name || '-',
              quality: b.quality || '-',
              qty: b.total_qty || 0,
              status: b.status || 'Active'
            }));
            fetched = true;
          }
        }
        else if (activeReportId.includes('purchase_') || activeReportId.includes('supplier_wise_')) {
          const res = await yarnPurchaseOrderAPI.list();
          newRows = (res.data || []).map(p => ({
            date: p.po_date ? new Date(p.po_date).toLocaleDateString() : '-',
            refNo: p.po_no || '-',
            party: p.party_name || '-',
            quality: p.quality || 'Yarn PO',
            qty: p.total_qty || p.grand_total || 0,
            status: p.status || 'Ordered'
          }));
          fetched = true;
        }
        else if (activeReportId === 'sales_invoice_register' || activeReportId === 'customer_wise_sales') {
          const res = await salesInvoiceAPI.list();
          newRows = (res.data || []).map(s => ({
            date: s.invoice_date ? new Date(s.invoice_date).toLocaleDateString() : '-',
            refNo: s.invoice_no || '-',
            party: s.party_name || '-',
            quality: s.quality || 'Fabric',
            qty: s.grand_total || 0,
            status: s.status || 'Billed'
          }));
          fetched = true;
        }
        else if (activeReportId === 'dispatch_report' || activeReportId === 'goods_release_report') {
          const res = await goodsReleaseAPI.list();
          newRows = (res.data || []).map(g => ({
            date: g.release_date ? new Date(g.release_date).toLocaleDateString() : '-',
            refNo: g.release_no || '-',
            party: g.party_name || '-',
            quality: g.quality || 'Finished Fabric',
            qty: g.total_qty || 0,
            status: g.status || 'Released'
          }));
          fetched = true;
        }
        else if (activeReportId === 'eway_bill_report') {
          const res = await ewayBillAPI.list();
          newRows = (res.data || []).map(e => ({
            date: e.bill_date ? new Date(e.bill_date).toLocaleDateString() : '-',
            refNo: e.eway_bill_no || '-',
            party: e.transporter_name || '-',
            quality: e.vehicle_no || '-',
            qty: e.total_value || 0,
            status: e.status || 'Generated'
          }));
          fetched = true;
        }
        else if (activeReportId === 'yarn_dyeing_status' || activeReportId === 'job_work_pending_report') {
          const res = await dyedYarnDeliveryAPI.list();
          newRows = (res.data || []).map(d => ({
            date: d.dc_date ? new Date(d.dc_date).toLocaleDateString() : '-',
            refNo: d.dc_no || '-',
            party: d.party_name || '-',
            quality: d.shade || d.quality || '-',
            qty: d.total_qty || 0,
            status: d.status || 'In Dyeing'
          }));
          fetched = true;
        }
        else if (activeReportId === 'sizing_status' || activeReportId === 'sizing_report') {
          const res = await warpBeamReceiptAPI.list();
          newRows = (res.data || []).map(s => ({
            date: s.receipt_date ? new Date(s.receipt_date).toLocaleDateString() : '-',
            refNo: s.ref_no || '-',
            party: s.received_from || '-',
            quality: s.beam_no || 'Beam Sizing',
            qty: s.total_meters || 0,
            status: s.status || 'Received'
          }));
          fetched = true;
        }
        else if (activeReportId === 'weaving_status' || activeReportId === 'weaving_report') {
          const res = await ppcAPI.getAllocations();
          newRows = (res.data || []).map(w => ({
            date: w.start_date ? new Date(w.start_date).toLocaleDateString() : '-',
            refNo: w.loom_no || '-',
            party: w.operator_name || '-',
            quality: w.design_no || '-',
            qty: w.target_meters || 0,
            status: w.status || 'Weaving'
          }));
          fetched = true;
        }
        else if (activeReportId === 'fabric_dyeing_status' || activeReportId === 'finishing_status' || activeReportId === 'fabric_dyeing_report' || activeReportId === 'dyed_fabric_receipt_report' || activeReportId === 'finished_fabric_report' || activeReportId === 'finishing_report' || activeReportId === 'fabric_stock_report' || activeReportId === 'fabric_movement_report') {
          const res = await finishedFabricAPI.list();
          newRows = (res.data || []).map(f => ({
            date: f.date ? new Date(f.date).toLocaleDateString() : '-',
            refNo: f.inward_no || '-',
            party: f.supplier_name || '-',
            quality: f.quality || '-',
            qty: f.total_qty || f.meters || 0,
            status: f.status || 'Finished'
          }));
          fetched = true;
        }
        else if (activeReportId.endsWith('_q') || activeReportId === 'rejected_fabric_report' || activeReportId === 'quality_summary' || activeReportId === 'grey_inspection_report' || activeReportId === 'final_inspection_report' || activeReportId === 'fabric_lot_report' || activeReportId === 'cloth_checking_report' || activeReportId === 'rejection_report') {
          const res = await onTableCheckingAPI.list();
          newRows = (res.data || []).map(q => ({
            date: q.checking_date ? new Date(q.checking_date).toLocaleDateString() : '-',
            refNo: q.ref_no || '-',
            party: q.operator_name || '-',
            quality: q.design_no || '-',
            qty: q.total_meters || 0,
            status: q.status || 'Inspected'
          }));
          fetched = true;
        }
        else if (activeReportId === 'grey_fabric_receipt_report' || activeReportId === 'grey_fabric_inward_report' || activeReportId === 'vendor_inward_report') {
          const res = await clothInwardAPI.list();
          newRows = (res.data || []).map(c => ({
            date: c.inward_date ? new Date(c.inward_date).toLocaleDateString() : '-',
            refNo: c.inward_no || '-',
            party: c.supplier_name || '-',
            quality: c.quality || '-',
            qty: c.total_qty || 0,
            status: c.status || 'Inwarded'
          }));
          fetched = true;
        }
        else if (activeReportId === 'bale_report' || activeReportId === 'packing_report') {
          const res = await packingSlipAPI.list();
          newRows = (res.data || []).map(p => ({
            date: p.slip_date ? new Date(p.slip_date).toLocaleDateString() : '-',
            refNo: p.packing_slip_no || '-',
            party: p.buyer_name || '-',
            quality: p.quality || '-',
            qty: p.total_qty || 0,
            status: p.status || 'Packed'
          }));
          fetched = true;
        }
        else if (activeReportId === 'warping_report') {
          const res = await warpDeliveryAPI.list();
          newRows = (res.data || []).map(w => ({
            date: w.dc_date ? new Date(w.dc_date).toLocaleDateString() : '-',
            refNo: w.dc_no || '-',
            party: w.party_name || '-',
            quality: w.quality || 'Warping',
            qty: w.total_qty || 0,
            status: w.status || 'Sent'
          }));
          fetched = true;
        }
        else if (activeReportId === 'dyeing_production_report') {
          const res = await dyedYarnDeliveryAPI.list();
          newRows = (res.data || []).map(d => ({
            date: d.dc_date ? new Date(d.dc_date).toLocaleDateString() : '-',
            refNo: d.dc_no || '-',
            party: d.party_name || '-',
            quality: d.shade || d.quality || '-',
            qty: d.total_qty || 0,
            status: d.status || 'Completed'
          }));
          fetched = true;
        }
        else if (activeReportId === 'yarn_inward_report' || activeReportId === 'yarn_stock_ledger' || activeReportId === 'yarn_return_report' || activeReportId === 'yarn_stock_transfer_report') {
          const res = await yarnInwardAPI.list();
          newRows = (res.data || []).map(y => ({
            date: y.inward_date ? new Date(y.inward_date).toLocaleDateString() : '-',
            refNo: y.ref_no || '-',
            party: y.received_from || '-',
            quality: y.cone_type || '-',
            qty: y.received_kgs || 0,
            status: y.status || 'Inwarded'
          }));
          fetched = true;
        }
        else if (activeReportId === 'yarn_requirement_report') {
          const res = await buyerOrderAPI.list();
          newRows = (res.data || []).map(b => ({
            date: b.order_date ? new Date(b.order_date).toLocaleDateString() : '-',
            refNo: b.order_no || '-',
            party: b.party_name || '-',
            quality: b.quality || '-',
            qty: b.total_qty || 0,
            status: b.status || 'Ordered'
          }));
          fetched = true;
        }
        else if (activeReportId === 'yarn_dyeing_delivery_report') {
          const res = await dyedYarnDeliveryAPI.list();
          newRows = (res.data || []).map(d => ({
            date: d.dc_date ? new Date(d.dc_date).toLocaleDateString() : '-',
            refNo: d.dc_no || '-',
            party: d.party_name || '-',
            quality: d.shade || d.quality || '-',
            qty: d.total_qty || 0,
            status: d.status || 'Sent'
          }));
          fetched = true;
        }
        else if (activeReportId === 'dyed_yarn_receipt_report') {
          const res = await dyedYarnReceiptAPI.list();
          newRows = (res.data || []).map(r => ({
            date: r.receipt_date ? new Date(r.receipt_date).toLocaleDateString() : '-',
            refNo: r.ref_no || '-',
            party: r.received_from || '-',
            quality: r.shade || '-',
            qty: r.received_qty || 0,
            status: r.status || 'Received'
          }));
          fetched = true;
        }
        else if (activeReportId === 'stock_ledger' || activeReportId === 'opening_stock_report' || activeReportId === 'closing_stock_report' || activeReportId === 'item_movement_report' || activeReportId === 'lot_wise_stock_report' || activeReportId === 'surplus_stock_report') {
          const res = await yarnInwardAPI.list();
          newRows = (res.data || []).map(y => ({
            date: y.inward_date ? new Date(y.inward_date).toLocaleDateString() : '-',
            refNo: y.ref_no || '-',
            party: y.received_from || '-',
            quality: y.cone_type || '-',
            qty: y.received_kgs || 0,
            status: y.status || 'Stock'
          }));
          fetched = true;
        }

        if (fetched) {
          setReportsData(prev => ({
            ...prev,
            [activeReportId]: {
              ...prev[activeReportId],
              rows: newRows
            }
          }));
        }
      } catch (err) {
        console.error("Error fetching real data for report", activeReportId, err);
      }
    };
    
    fetchRealData();
  }, [activeReportId]);

  // Filter application logic
  const filteredRows = useMemo(() => {
    let rows = [...reportObj.rows];

    // Search bar filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(row => {
        return Object.values(row).some(val => 
          String(val).toLowerCase().includes(q)
        );
      });
    }

    // Party Filter (if "customer" or "buyer" key exists)
    if (selectedParty !== 'All') {
      rows = rows.filter(row => {
        const partyName = row.customer || row.buyer || row.supplier || '';
        return partyName.toLowerCase() === selectedParty.toLowerCase();
      });
    }

    // Status Filter (if "status" key exists)
    if (selectedStatus !== 'All') {
      rows = rows.filter(row => {
        if (!row.status) return true;
        return row.status.toLowerCase() === selectedStatus.toLowerCase();
      });
    }

    // Fabric Filter (if "fabricType" or "quality" key exists)
    if (selectedFabric !== 'All') {
      rows = rows.filter(row => {
        const fabricName = row.fabricType || row.quality || '';
        return fabricName.toLowerCase().includes(selectedFabric.toLowerCase());
      });
    }

    // Custom Date Range filter
    if (fromDate) {
      rows = rows.filter(row => {
        const rowDate = row.date || row.filedDate || '';
        if (!rowDate) return true;
        return new Date(rowDate) >= new Date(fromDate);
      });
    }
    if (toDate) {
      rows = rows.filter(row => {
        const rowDate = row.date || row.filedDate || '';
        if (!rowDate) return true;
        const limitDate = new Date(toDate);
        limitDate.setHours(23,59,59);
        return new Date(rowDate) <= limitDate;
      });
    }

    // Sorting
    if (sortConfig.key) {
      rows.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [reportObj, searchTerm, selectedParty, selectedStatus, selectedFabric, fromDate, toDate, sortConfig]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  // Sorting handler
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedParty('All');
    setSelectedStatus('All');
    setSelectedDept('All');
    setSelectedFabric('All');
    setSelectedExport('All');
    setSearchTerm('');
  };

  // Export Table Row/All Excel using xlsx
  const handleExportExcel = (customRows = null, title = null) => {
    const targetRows = customRows || filteredRows;
    const targetTitle = title || reportObj.title;

    // Convert rows to key-label matched array
    const dataToExport = targetRows.map(row => {
      const formatted = {};
      reportObj.columns.forEach(col => {
        formatted[col.label] = row[col.key];
      });
      return formatted;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Export');
    XLSX.writeFile(workbook, `${targetTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Table Row/All PDF using jspdf and jspdf-autotable
  const handleExportPDF = (customRows = null, title = null) => {
    const targetRows = customRows || filteredRows;
    const targetTitle = title || reportObj.title;

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('DINESH EXPORTS - ENTERPRISE MIS REPORT', 14, 22);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Name: ${targetTitle}`, 14, 28);
    doc.text(`Exported On: ${new Date().toLocaleString()}`, 14, 34);

    const headers = reportObj.columns.map(c => c.label);
    const body = targetRows.map(row => reportObj.columns.map(col => {
      const val = row[col.key];
      if (typeof val === 'number' && col.key.toLowerCase().includes('amt' || 'val' || 'amount' || 'billed' || 'paid' || 'revenue' || 'profit' || 'payable')) {
        return `INR ${val.toLocaleString()}`;
      }
      return String(val);
    }));

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });

    doc.save(`${targetTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePrint = (customRows = null, title = null) => {
    const targetRows = customRows || filteredRows;
    const targetTitle = title || reportObj.title;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${targetTitle}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 20px; margin-bottom: 5px; color: #4f46e5; }
            p { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 12px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>DINESH EXPORTS ERP — ${targetTitle.toUpperCase()}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${reportObj.columns.map(c => `<th>${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${targetRows.map(row => `
                <tr>
                  ${reportObj.columns.map(col => `<td>${row[col.key]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Save new schedule in scheduler modal
  const handleCreateSchedule = (e) => {
    e.preventDefault();
    const rName = Object.values(MOCK_REPORTS_DATA).find((v, idx) => Object.keys(MOCK_REPORTS_DATA)[idx] === scheduleReportType)?.title || 'MIS Report';
    const newSchedule = {
      id: Date.now(),
      report: rName,
      freq: scheduleFreq,
      time: scheduleTime,
      medium: scheduleMedium,
      target: scheduleTarget
    };
    setSchedules([...schedules, newSchedule]);
    setScheduleTarget('');
    alert(`Success: Scheduled "${rName}" successfully!`);
  };

  // Delete schedule
  const handleDeleteSchedule = (id) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  // Simulate AI response
  const handleSendAIQuestion = (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userMsg = { sender: 'user', text: aiQuestion };
    setAiChatLog(prev => [...prev, userMsg]);
    setAiQuestion('');

    // AI logic response simulation
    setTimeout(() => {
      let replyText = '';
      const q = aiQuestion.toLowerCase();
      if (q.includes('sales') || q.includes('revenue') || q.includes('growth')) {
        replyText = "Based on current analytics, your sales reached ₹14.8M this month, reflecting a strong 18% growth. Cotton fabrics contribute to 58% of your order volume. Our models predict a stable sales uptrend for the coming quarter.";
      } else if (q.includes('delay') || q.includes('dispatch') || q.includes('pending')) {
        replyText = "According to our dispatch intelligence, there are 84 items pending dispatch. 3 orders are flagged with a high delay probability next week due to a minor warping loom bottleneck in Section II.";
      } else if (q.includes('stock') || q.includes('cotton') || q.includes('yarn')) {
        replyText = "Your Yarn Stock shows 6,800 Kgs of Cotton Combed Yarn. Given the current daily production average of 250 Kgs, our systems warn that stock levels will drop below the 5,000 Kgs reorder point in exactly 7 days. We recommend initiating a replenishment purchase order today.";
      } else {
        replyText = "Analyzing... The Dinesh Exports database shows strong overall operational efficiency at 94.2%. Looms are running optimally with only minor warp downtime. Let me know if you would like me to generate a PDF summary or check standard debtor/creditor ledger balances!";
      }

      setAiChatLog(prev => [...prev, { sender: 'ai', text: replyText }]);
    }, 800);
  };

  // Refresh page simulation
  const handleRefreshData = () => {
    setShowRefresh(true);
    setTimeout(() => {
      setShowRefresh(false);
    }, 600);
  };

  // Chart Mock Data
  const salesTrendData = [
    { month: 'Jan', Sales: 8200000, Target: 8000000 },
    { month: 'Feb', Sales: 9800000, Target: 8500000 },
    { month: 'Mar', Sales: 11200000, Target: 9500000 },
    { month: 'Apr', Sales: 12500000, Target: 11000000 },
    { month: 'May', Sales: 14800000, Target: 13000000 },
    { month: 'Jun', Sales: 16500000, Target: 15000000 }
  ];

  const efficiencyData = [
    { loom: 'Loom 01', Efficiency: 92.5, Target: 95 },
    { loom: 'Loom 02', Efficiency: 95.5, Target: 95 },
    { loom: 'Loom 03', Efficiency: 95.2, Target: 95 },
    { loom: 'Loom 04', Efficiency: 97.7, Target: 95 },
    { loom: 'Loom 05', Efficiency: 80.0, Target: 95 },
    { loom: 'Loom 06', Efficiency: 99.0, Target: 95 }
  ];

  const yarnConsumptionData = [
    { name: 'Cotton Combed', value: 38200, color: '#4f46e5' },
    { name: 'Viscose Vortex', value: 18500, color: '#8b5cf6' },
    { name: 'Polyester Filament', value: 28000, color: '#3b82f6' },
    { name: 'Cotton Carded', value: 12000, color: '#10b981' }
  ];

  const dispatchPerformanceData = [
    { category: 'Week 1', Delivered: 45, Pending: 15 },
    { category: 'Week 2', Delivered: 58, Pending: 20 },
    { category: 'Week 3', Delivered: 62, Pending: 14 },
    { category: 'Week 4', Delivered: 78, Pending: 35 }
  ];

  const topCustomersData = [
    { name: 'Raymond Ltd', Sales: 7.8 },
    { name: 'Reliance Retail', Sales: 5.6 },
    { name: 'Dinesh Fabrics', Sales: 4.2 },
    { name: 'Birla Fashion', Sales: 3.2 },
    { name: 'Standard Weaving', Sales: 2.8 }
  ].sort((a,b) => b.Sales - a.Sales);

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px' }}>
      
      {/* 1. HEADER SECTION */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <Activity size={28} style={{ color: '#4f46e5' }} /> Reports & MIS Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
            Centralized business intelligence, real-time reports, and automated predictive insights
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleRefreshData} 
            style={{ minWidth: '42px', padding: '10px', justifyContent: 'center' }}
            title="Refresh Dashboard Data"
          >
            <RefreshCw size={18} className={showRefresh ? 'animate-spin' : ''} />
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowExportModal(true)} 
            style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <Download size={18} style={{ color: '#4f46e5' }} /> Export Center
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowSchedulerModal(true)}
            style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <Calendar size={18} style={{ color: '#8b5cf6' }} /> Schedule Report
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAIModal(true)}
            style={{ 
              background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)', 
              color: 'white', 
              fontWeight: 700, 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center', 
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
              border: 'none'
            }}
          >
            <Brain size={18} className="animate-pulse" /> AI Analytics
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        {/* Card 1: Total Orders */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {(stats.real_total_orders || stats.total_buyer_orders || 0).toLocaleString()}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>orders</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>this mo</span>
            </div>
          </div>
          {/* Sparkline mini-trend preview */}
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}>
            <path d="M 0,22 Q 30,12 60,18 T 120,6 T 180,14 T 240,4" fill="none" stroke="rgba(79, 70, 229, 0.3)" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 2: Pending Dispatch */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Dispatch</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {(stats.real_pending_dispatch || stats.total_gra || 0).toLocaleString()}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingDown size={14} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>pending</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>dispatches</span>
            </div>
          </div>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}>
            <path d="M 0,6 Q 30,18 60,12 T 120,20 T 180,10 T 240,22" fill="none" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 3: Today's Production */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Prod</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Factory size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {(stats.real_production_mtrs || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} m
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{stats.real_cloth_entries || 0} entries</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>cloth inward</span>
            </div>
          </div>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}>
            <path d="M 0,20 Q 30,10 60,15 T 120,5 T 180,12 T 240,8" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 4: Current Stock */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Stock</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {(stats.real_current_stock_mtrs || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} m
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{(stats.real_yarn_stock_kgs || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>yarn stock</span>
            </div>
          </div>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}>
            <path d="M 0,22 Q 30,16 60,18 T 120,12 T 180,14 T 240,10" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 5: Sales This Month */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Sales This Mo</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              ₹{stats.real_sales_amount !== undefined ? (stats.real_sales_amount >= 100000 ? (stats.real_sales_amount / 100000).toFixed(1) + 'L' : stats.real_sales_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })) : '0'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{stats.real_total_invoices || 0} invoices</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>total billed</span>
            </div>
          </div>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}>
            <path d="M 0,24 Q 30,12 60,18 T 120,8 T 180,10 T 240,2" fill="none" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 6: Pending Payments */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Packing Slips</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {(stats.real_packing_entries || 0).toLocaleString()}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingDown size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{(stats.real_yarn_entries || 0)} yarn</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>inward entries</span>
            </div>
          </div>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}>
            <path d="M 0,8 Q 30,15 60,10 T 120,18 T 180,8 T 240,22" fill="none" stroke="rgba(220, 38, 38, 0.3)" strokeWidth="2" />
          </svg>
        </div>

      </div>

      {/* 3. GLOBAL FILTER SECTION */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '28px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={18} style={{ color: '#4f46e5' }} />
          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Global Business Filters
          </h4>
          <span style={{ fontSize: '11px', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', padding: '3px 8px', borderRadius: '100px', fontWeight: 600, marginLeft: '4px' }}>
            Controls All Dynamic Tables & Analytics
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'flex-end' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>From Date</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>To Date</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Select Customer / Party</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedParty} 
              onChange={e => setSelectedParty(e.target.value)}
            >
              <option value="All">All Parties</option>
              {parties.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Order Status</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedStatus} 
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Department</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedDept} 
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="All">All Depts</option>
              <option value="Sales">Sales & Marketing</option>
              <option value="Production">Weaving & Production</option>
              <option value="Accounts">Finance & Accounts</option>
              <option value="Inventory">Inventory & Store</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Fabric Type</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedFabric} 
              onChange={e => setSelectedFabric(e.target.value)}
            >
              <option value="All">All Fabrics</option>
              {Array.from(new Set(
                reportObj.rows
                  .map(r => r.fabricType || r.quality || r.yarnType || r.itemName || '')
                  .filter(Boolean)
              )).map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '9px', fontSize: '13px', justifyContent: 'center' }} 
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </div>

        </div>
      </div>

      {/* 4. REPORT CATEGORY SECTION */}
      <div style={{ marginBottom: '28px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.8px', marginBottom: '14px' }}>
          Select Business Domain
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {REPORT_CATEGORIES.map(category => {
            const IconComponent = category.icon;
            const isSelected = activeCategory === category.id;
            return (
              <div 
                key={category.id} 
                className={`card module-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(category.id);
                  setActiveReportId(category.reports[0].id);
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                style={{ 
                  padding: '16px',
                  border: isSelected ? `2px solid ${category.color}` : '1px solid var(--border)',
                  boxShadow: isSelected ? `0 4px 12px ${category.color}15` : 'var(--shadow-sm)',
                  background: isSelected ? `${category.color}03` : 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  alignItems: 'flex-start',
                  cursor: 'pointer'
                }}
              >
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '8px', 
                  background: isSelected ? category.color : 'var(--bg-secondary)', 
                  color: isSelected ? 'white' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent size={18} />
                </div>
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {category.name}
                  </h5>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginTop: '2px' }}>
                    {category.count} Reports Available
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  width: '100%', 
                  marginTop: '4px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '8px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: category.color }}>
                    {isSelected ? 'ACTIVE DOMAIN' : 'EXPLORE'}
                  </span>
                  <ChevronRight size={14} style={{ color: isSelected ? category.color : 'var(--text-muted)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '28px', alignItems: 'start', marginBottom: '28px' }}>
        
        {/* SUB-MENU TABS */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
            <FileText size={18} style={{ color: '#4f46e5' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reports List
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {REPORT_CATEGORIES.find(c => c.id === activeCategory)?.reports.map(report => {
              const isSelected = activeReportId === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => {
                    setActiveReportId(report.id);
                    setSearchTerm('');
                    setCurrentPage(1);
                    setSortConfig({ key: '', direction: '' });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    color: isSelected ? '#4f46e5' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: isSelected ? '#4f46e5' : 'var(--text-muted)' 
                    }} />
                    {report.name}
                  </span>
                  {isSelected && <ChevronRight size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. DYNAMIC REPORT TABLE */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {/* Table Header Filter Action Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px 24px', 
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                {reportObj.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '2px 0 0 0' }}>
                Showing dynamic query results with active global parameters
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search report records..." 
                  style={{ paddingLeft: '32px', width: '220px', margin: 0, paddingY: '6px', fontSize: '13px' }}
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', paddingY: '6px' }}
                onClick={() => handleExportExcel()}
              >
                <Download size={14} style={{ color: '#15803d' }} /> Excel
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', paddingY: '6px' }}
                onClick={() => handleExportPDF()}
              >
                <FileText size={14} style={{ color: '#dc2626' }} /> PDF
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', paddingY: '6px' }}
                onClick={() => handlePrint()}
              >
                <Printer size={14} style={{ color: '#4f46e5' }} /> Print
              </button>
            </div>
          </div>

          {/* Table Element */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', margin: 0, minWidth: '800px' }}>
              <thead>
                <tr>
                  {reportObj.columns.map(col => (
                    <th 
                      key={col.key} 
                      onClick={() => requestSort(col.key)}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {col.label}
                        {sortConfig.key === col.key && (
                          <span style={{ fontSize: '10px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={reportObj.columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No report records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, index) => (
                    <tr key={index}>
                      {reportObj.columns.map(col => {
                        const val = row[col.key];
                        // Special cell renderer for numbers
                        if (typeof val === 'number') {
                          // Format currency
                          if (col.key.toLowerCase().includes('amt' || 'val' || 'amount' || 'taxable' || 'gst' || 'total' || 'billed' || 'paid' || 'revenue' || 'profit' || 'payable')) {
                            return (
                              <td key={col.key} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                ₹{val.toLocaleString()}
                              </td>
                            );
                          }
                          return <td key={col.key} style={{ fontWeight: 600 }}>{val}</td>;
                        }
                        // Render badge for status
                        if (col.key === 'status') {
                          const lower = String(val).toLowerCase();
                          let badgeClass = 'badge-pending';
                          if (lower === 'completed') badgeClass = 'badge-active';
                          if (lower === 'cancelled') badgeClass = 'badge-draft';
                          return (
                            <td key={col.key}>
                              <span className={`badge ${badgeClass}`}>{val}</span>
                            </td>
                          );
                        }
                        return <td key={col.key}>{String(val)}</td>;
                      })}
                      
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => setShowRowViewModal(row)}
                            title="View Voucher"
                          >
                            <Eye size={12} /> View
                          </button>
                          
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => {
                              setShowEmailModal({ row, title: reportObj.title });
                            }}
                            title="Send via Email"
                          >
                            <Mail size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Show:</span>
              <select 
                className="form-control" 
                style={{ width: '70px', padding: '4px 8px', margin: 0, fontSize: '13px' }}
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                Records of <strong>{filteredRows.length}</strong> total
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
              >
                Previous
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontWeight: 600 }}>
                Page {currentPage} of {totalPages || 1}
              </div>

              <button 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 6. CHARTS & ANALYTICS SECTION */}
      <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#4f46e5' }} /> Analytics & Trends Center
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '2px 0 0 0' }}>
              Visual analytics generated from real-time ERP process states
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
              Live Sync Active
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          
          {/* Chart 1: Sales Trend */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>📈 Sales Revenue Trend</span>
              <span style={{ color: '#4f46e5', fontSize: '12px' }}>6-Month MIS View</span>
            </h5>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => [`₹${(value).toLocaleString()}`, 'Sales']} />
                  <Legend />
                  <Area type="monotone" dataKey="Sales" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="Target" stroke="#cbd5e1" strokeWidth={1} fill="none" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Production Efficiency */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>⚙️ Loom Weaving Efficiency</span>
              <span style={{ color: '#10b981', fontSize: '12px' }}>Avg: 93.3%</span>
            </h5>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={efficiencyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="loom" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[70, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="Efficiency" fill="#10b981" barSize={25} radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Target" stroke="#dc2626" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Yarn Consumption */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              🧶 Yarn Consumption Breakdown
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', height: '240px' }}>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={yarnConsumptionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {yarnConsumptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v.toLocaleString()} Kgs`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {yarnConsumptionData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}:</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.value.toLocaleString()} Kgs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 4: Top Customers */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>🏆 Top Customers</span>
              <span style={{ color: '#ec4899', fontSize: '12px' }}>Sales Contribution</span>
            </h5>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCustomersData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                  <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(v) => `₹${v}M`} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" style={{ fontSize: '11px' }} width={90} />
                  <Tooltip formatter={(v) => `₹${v}M`} />
                  <Legend />
                  <Bar dataKey="Sales" fill="#ec4899" barSize={12} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* 7. AI SMART INSIGHTS PREVIEW BAR */}
      <div 
        onClick={() => setShowAIModal(true)}
        style={{ 
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(139, 92, 246, 0.05))',
          border: '1px solid rgba(79, 70, 229, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
        className="ai-banner"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Brain size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              AI Smart Insights & Predictive Warnings <Sparkles size={14} style={{ color: '#8b5cf6' }} />
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0 0', fontWeight: 500 }}>
              Smart Alert: Cotton Combed stock levels low • 3 orders flagged at risk of delay next week.
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, color: '#4f46e5', fontSize: '13px' }}>
          <span>OPEN COGNITIVE DESK</span>
          <ArrowUpRight size={16} />
        </div>
      </div>


      {/* ==============================================================
          MODALS & OVERLAYS INTERACTION
          ============================================================== */}

      {/* MODAL 1: EXPORT CENTER */}
      {showExportModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="card animate-fade" style={{ width: '500px', padding: '24px', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={20} style={{ color: '#4f46e5' }} /> Bulk Export Center
              </h3>
              <button 
                onClick={() => setShowExportModal(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  CHOOSE EXPORT FORMAT
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['Excel', 'PDF', 'CSV'].map(fmt => (
                    <button
                      key={fmt}
                      className="btn"
                      onClick={() => setExportFormat(fmt)}
                      style={{
                        padding: '10px',
                        justifyContent: 'center',
                        background: exportFormat === fmt ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                        border: exportFormat === fmt ? '2px solid #4f46e5' : '1px solid var(--border)',
                        color: exportFormat === fmt ? '#4f46e5' : 'var(--text-secondary)',
                        fontWeight: 700
                      }}
                    >
                      {fmt} Format
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  SELECT REPORT DOMAINS FOR COMPILATION
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {REPORT_CATEGORIES.map(cat => {
                    const isChecked = exportSelectedModules.includes(cat.id);
                    return (
                      <div 
                        key={cat.id} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => {
                          if (isChecked) {
                            setExportSelectedModules(exportSelectedModules.filter(m => m !== cat.id));
                          } else {
                            setExportSelectedModules([...exportSelectedModules, cat.id]);
                          }
                        }}
                      >
                        <input type="checkbox" checked={isChecked} readOnly style={{ width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                💡 <strong>Multi-Module Export:</strong> Compiling selected reports will compile a unified package file. Perfect for Board meetings and Monthly audit reviews.
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowExportModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 2, justifyContent: 'center', background: '#4f46e5', color: 'white' }}
                  onClick={() => {
                    alert(`Compiling and Downloading ${exportSelectedModules.length} domains in ${exportFormat} format!`);
                    setShowExportModal(false);
                  }}
                >
                  Generate Bulk Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULER MODAL */}
      {showSchedulerModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="card animate-fade" style={{ width: '600px', padding: '24px', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} style={{ color: '#8b5cf6' }} /> Automated Report Scheduler
              </h3>
              <button 
                onClick={() => setShowSchedulerModal(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Form Side */}
              <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
                  Create New Schedule
                </h4>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Report Type</label>
                  <select 
                    className="form-control" 
                    value={scheduleReportType} 
                    onChange={e => setScheduleReportType(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  >
                    {REPORT_CATEGORIES.flatMap(cat => cat.reports).map(report => (
                      <option key={report.id} value={report.id}>{MOCK_REPORTS_DATA[report.id]?.title || report.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Frequency</label>
                    <select 
                      className="form-control" 
                      value={scheduleFreq} 
                      onChange={e => setScheduleFreq(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px' }}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Time</label>
                    <input 
                      type="time" 
                      className="form-control" 
                      value={scheduleTime} 
                      onChange={e => setScheduleTime(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px' }} 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Medium</label>
                  <select 
                    className="form-control" 
                    value={scheduleMedium} 
                    onChange={e => setScheduleMedium(e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                  >
                    <option value="Email">Email Dispatch</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recipient / Target</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="email or phone number" 
                    value={scheduleTarget}
                    onChange={e => setScheduleTarget(e.target.value)}
                    required
                    style={{ padding: '6px 10px', fontSize: '13px' }} 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', color: 'white', justifyContent: 'center', marginTop: '6px' }}>
                  <Plus size={16} /> Add Schedule
                </button>
              </form>

              {/* Schedules List Side */}
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
                  Active Schedules ({schedules.length})
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '250px' }}>
                  {schedules.map(item => (
                    <div 
                      key={item.id} 
                      style={{ 
                        padding: '10px 12px', 
                        background: '#f8fafc', 
                        border: '1px solid var(--border)', 
                        borderRadius: '6px', 
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        position: 'relative'
                      }}
                    >
                      <button 
                        onClick={() => handleDeleteSchedule(item.id)}
                        style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}
                        title="Delete Schedule"
                      >
                        <X size={14} />
                      </button>
                      <strong style={{ color: 'var(--text-primary)', paddingRight: '16px' }}>{item.report}</strong>
                      <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        <span>⏱️ {item.freq} ({item.time})</span>
                        <span>📲 {item.medium}</span>
                      </div>
                      <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{item.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AI ANALYTICS DRAWER */}
      {showAIModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' 
        }}>
          <div className="animate-slide" style={{ width: '450px', height: '100%', padding: '28px', background: 'white', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={22} style={{ color: '#4f46e5' }} /> AI Business Analyst
              </h3>
              <button 
                onClick={() => setShowAIModal(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Smart Insights Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Automated Smart Insights
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '12px' }}>
                  🟢 <strong>Sales Contribution:</strong> Revenue increased <strong>18%</strong> this month. Top contribution from Raymond Ltd (₹7.8M).
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', fontSize: '12px' }}>
                  🟡 <strong>Delay Prediction:</strong> Loom-05 efficiency dropped to 80%. <strong>3 orders</strong> may delay next week if not redirected.
                </div>
                <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '12px' }}>
                  🔴 <strong>Inventory Warning:</strong> Cotton Combed yarn stock (6,800 Kg) approaching reorder. Low stock predicted in <strong>7 days</strong>.
                </div>
              </div>
            </div>

            {/* Simulated Chat Interface */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Ask AI Assistant
              </span>
              
              {/* Chat Log */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border)' }}>
                {aiChatLog.map((chat, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      alignSelf: chat.sender === 'ai' ? 'flex-start' : 'flex-end',
                      background: chat.sender === 'ai' ? '#ffffff' : '#4f46e5',
                      color: chat.sender === 'ai' ? 'var(--text-primary)' : '#ffffff',
                      border: chat.sender === 'ai' ? '1px solid var(--border)' : 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      maxWidth: '85%',
                      lineHeight: '1.4',
                      fontWeight: 500
                    }}
                  >
                    {chat.text}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendAIQuestion} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Will our cotton stock last this week?" 
                  style={{ margin: 0, fontSize: '13px' }} 
                  value={aiQuestion}
                  onChange={e => setAiQuestion(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ background: '#4f46e5', color: 'white', padding: '10px' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ROW VOUCHER DETAIL VIEW */}
      {showRowViewModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="card animate-fade" style={{ width: '550px', padding: '28px', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                📑 Transaction Voucher Details
              </h3>
              <button 
                onClick={() => setShowRowViewModal(null)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Logo block inside voucher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#4f46e5', margin: 0 }}>DINESH EXPORTS</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>The House Of Fabrics</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', background: '#e2e8f0', color: 'var(--text-primary)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    SYSTEM VOUCHER
                  </span>
                </div>
              </div>

              {/* Data block */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                {Object.keys(showRowViewModal).map(key => {
                  const val = showRowViewModal[key];
                  const colObj = reportObj.columns.find(c => c.key === key);
                  const labelName = colObj ? colObj.label : key.replace(/([A-Z])/g, ' $1');
                  
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {labelName}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {typeof val === 'number' ? `₹${val.toLocaleString()}` : String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Print / Download inside Voucher */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }} 
                  onClick={() => handlePrint([showRowViewModal], `Voucher_${showRowViewModal.orderId || showRowViewModal.invoiceNo || 'Detail'}`)}
                >
                  <Printer size={16} /> Print Voucher
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', background: '#4f46e5', color: 'white' }}
                  onClick={() => handleExportPDF([showRowViewModal], `Voucher_${showRowViewModal.orderId || showRowViewModal.invoiceNo || 'Detail'}`)}
                >
                  <Download size={16} /> PDF Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EMAIL DISPATCH COMPOSER */}
      {showEmailModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="card animate-fade" style={{ width: '500px', padding: '24px', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={20} style={{ color: '#4f46e5' }} /> Email Dispatcher
              </h3>
              <button 
                onClick={() => setShowEmailModal(null)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recipient Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  defaultValue="partner@buyercompany.com" 
                  placeholder="recipient@example.com" 
                  style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }} 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subject</label>
                <input 
                  type="text" 
                  className="form-control" 
                  defaultValue={`Dinesh Exports MIS - ${showEmailModal.title}`} 
                  style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }} 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Message Body</label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  defaultValue={`Dear Partner,\n\nPlease find attached the requested "${showEmailModal.title}" transaction log voucher for your reference.\n\nBest Regards,\nMIS Team — Dinesh Exports`} 
                  style={{ padding: '10px 12px', fontSize: '13px', margin: 0, resize: 'vertical' }} 
                />
              </div>

              {/* Attachment tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <FileText size={18} style={{ color: '#dc2626' }} />
                <div style={{ fontSize: '12px' }}>
                  <span style={{ fontWeight: 700, display: 'block' }}>{showEmailModal.title.replace(/\s+/g, '_')}.pdf</span>
                  <span style={{ color: 'var(--text-muted)' }}>Automatic System Generated Attachment (42 KB)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowEmailModal(null)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 2, justifyContent: 'center', background: '#4f46e5', color: 'white' }}
                  onClick={() => {
                    alert('Email sent successfully!');
                    setShowEmailModal(null);
                  }}
                >
                  Dispatch Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
