import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Calendar, Users, ShoppingCart, Package, Truck, 
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
  yarnPurchaseOrderAPI, clothInwardAPI, clothDeliveryAPI, finishedFabricAPI 
} from '../../services/api';

// ==========================================
// 1. MOCK DATASETS FOR THE 25 REPORTS
// ==========================================
const MOCK_REPORTS_DATA = {
  // --- A. Sales Reports ---
  'buyer_order': {
    title: 'Buyer Order Report',
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
  'invoice': {
    title: 'Invoice Report',
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
  'packing_list': {
    title: 'Packing List Report',
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
  'pending_orders': {
    title: 'Pending Orders Report',
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

  // --- B. Production Reports ---
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
    title: 'Warping Status Report',
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
  'dyeing_status': {
    title: 'Dyeing Status Report',
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

  // --- C. Yarn Reports ---
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
  'yarn_consumption': {
    title: 'Yarn Consumption Report',
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'loomNo', label: 'Loom No' },
      { key: 'warpLot', label: 'Warp Lot Ref' },
      { key: 'weftLot', label: 'Weft Lot Ref' },
      { key: 'consumed', label: 'Yarn Consumed (Kg)' },
      { key: 'waste', label: 'Waste Generated (Kg)' }
    ],
    rows: []
  },
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
  'yarn_delivery': {
    title: 'Yarn Delivery Challan',
    columns: [
      { key: 'challanNo', label: 'Challan No' },
      { key: 'date', label: 'Delivery Date' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'yarnType', label: 'Yarn Spec' },
      { key: 'vehicleNo', label: 'Vehicle No' },
      { key: 'netQty', label: 'Net Weight (Kg)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },

  // --- D. Fabric Reports ---
  'cloth_inward': {
    title: 'Cloth Inward Report',
    columns: [
      { key: 'inwardNo', label: 'Inward No' },
      { key: 'date', label: 'Inward Date' },
      { key: 'loomNo', label: 'Loom Ref' },
      { key: 'quality', label: 'Grey Fabric Quality' },
      { key: 'rolls', label: 'Rolls Recd' },
      { key: 'mtrs', label: 'Total Meters' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'cloth_delivery': {
    title: 'Cloth Delivery (Grey Challan)',
    columns: [
      { key: 'challanNo', label: 'Challan No' },
      { key: 'date', label: 'Challan Date' },
      { key: 'buyer', label: 'Process House / Buyer' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'rolls', label: 'Rolls Deliv.' },
      { key: 'mtrs', label: 'Total Mtrs' },
      { key: 'gatePass', label: 'Gate Pass No' }
    ],
    rows: []
  },
  'finished_fabric': {
    title: 'Finished Fabric Inward',
    columns: [
      { key: 'batchNo', label: 'Batch No' },
      { key: 'date', label: 'Inward Date' },
      { key: 'quality', label: 'Fabric Spec' },
      { key: 'shade', label: 'Color Shade' },
      { key: 'mtrs', label: 'Finished Mtrs' },
      { key: 'gradeA', label: 'Grade A %' },
      { key: 'gradeB', label: 'Grade B %' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'grey_fabric': {
    title: 'Grey Fabric Roll Stock',
    columns: [
      { key: 'rollNo', label: 'Roll No' },
      { key: 'date', label: 'Date Woven' },
      { key: 'quality', label: 'Fabric Quality' },
      { key: 'width', label: 'Width (inch)' },
      { key: 'mtrs', label: 'Meters' },
      { key: 'wt', label: 'Weight (Kg)' },
      { key: 'grade', label: 'Grade' }
    ],
    rows: []
  },

  // --- E. Accounts Reports ---
  'debtors': {
    title: 'Debtors Outstanding Report',
    columns: [
      { key: 'customer', label: 'Buyer Name' },
      { key: 'billed', label: 'Total Billed (₹)' },
      { key: 'paid', label: 'Total Received (₹)' },
      { key: 'balance', label: 'Balance Outstanding (₹)' },
      { key: 'lastPayment', label: 'Last Recd Date' },
      { key: 'overdue', label: 'Overdue (Days)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'creditors': {
    title: 'Creditors Outstanding Report',
    columns: [
      { key: 'supplier', label: 'Vendor Name' },
      { key: 'purchases', label: 'Total Purchases (₹)' },
      { key: 'paid', label: 'Total Paid (₹)' },
      { key: 'balance', label: 'Balance Owed (₹)' },
      { key: 'nextDue', label: 'Next Due Date' },
      { key: 'overdue', label: 'Overdue (Days)' },
      { key: 'status', label: 'Status' }
    ],
    rows: []
  },
  'gst_summary': {
    title: 'GST Return Summary (3B/1)',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'outwardGst', label: 'Outward GST (18%) (₹)' },
      { key: 'inwardGst', label: 'ITC Claimed (18%) (₹)' },
      { key: 'payable', label: 'Net Tax Payable (₹)' },
      { key: 'paid', label: 'Tax Paid (Challan) (₹)' },
      { key: 'filedDate', label: 'Date of Filing' }
    ],
    rows: []
  },
  'profit_loss': {
    title: 'Profit & Loss Statement (MIS)',
    columns: [
      { key: 'quarter', label: 'Quarter' },
      { key: 'revenue', label: 'Revenue (₹)' },
      { key: 'directExp', label: 'Direct Expenses (₹)' },
      { key: 'indirectExp', label: 'Indirect Expenses (₹)' },
      { key: 'grossProfit', label: 'Gross Profit (₹)' },
      { key: 'netProfit', label: 'Net Profit (₹)' }
    ],
    rows: []
  },

  // --- F. Inventory Reports ---
  'stock_summary': {
    title: 'Store Stock Summary',
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
  'material_consumption': {
    title: 'Material Consumption Log',
    columns: [
      { key: 'date', label: 'Date Issued' },
      { key: 'slipNo', label: 'Req Slip No' },
      { key: 'dept', label: 'Department' },
      { key: 'user', label: 'Issued To' },
      { key: 'itemName', label: 'Material Description' },
      { key: 'qty', label: 'Qty Consumed' },
      { key: 'uom', label: 'UOM' }
    ],
    rows: []
  },
  'inv_aging': {
    title: 'Inventory Aging Report',
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
  'warehouse_stock': {
    title: 'Warehouse Bin Stock Location',
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
    count: 4,
    reports: [
      { id: 'loom_production', name: 'Loom Production' },
      { id: 'warping_status', name: 'Warping Status' },
      { id: 'dyeing_status', name: 'Dyeing Status' },
      { id: 'prod_efficiency', name: 'Production Efficiency' }
    ]
  },
  {
    id: 'yarn',
    name: 'Yarn Reports',
    icon: Layers,
    color: '#8b5cf6',
    count: 4,
    reports: [
      { id: 'yarn_stock', name: 'Yarn Stock' },
      { id: 'yarn_consumption', name: 'Yarn Consumption' },
      { id: 'yarn_purchase', name: 'Yarn Purchase Order' },
      { id: 'yarn_delivery', name: 'Yarn Delivery Challan' }
    ]
  },
  {
    id: 'fabric',
    name: 'Fabric Reports',
    icon: Scissors,
    color: '#f59e0b',
    count: 4,
    reports: [
      { id: 'cloth_inward', name: 'Cloth Inward' },
      { id: 'cloth_delivery', name: 'Cloth Delivery' },
      { id: 'finished_fabric', name: 'Finished Fabric' },
      { id: 'grey_fabric', name: 'Grey Fabric Stock' }
    ]
  },
  {
    id: 'inventory',
    name: 'Inventory Reports',
    icon: Box,
    color: '#06b6d4',
    count: 4,
    reports: [
      { id: 'stock_summary', name: 'Store Stock Summary' },
      { id: 'material_consumption', name: 'Material Consumption' },
      { id: 'inv_aging', name: 'Inventory Aging' },
      { id: 'warehouse_stock', name: 'Warehouse Location' }
    ]
  }
];

export default function ReportsDashboard() {
  const [reportsData, setReportsData] = useState(MOCK_REPORTS_DATA);

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
    return reportsData[activeReportId] || reportsData['loom_production'];
  }, [activeReportId, reportsData]);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        let newRows = [];
        let fetched = false;

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
            inwardNo: c.inward_no,
            date: c.inward_date ? new Date(c.inward_date).toLocaleDateString() : '-',
            loomNo: c.loom_no || '-',
            quality: c.quality || '-',
            rolls: c.total_rolls || 0,
            mtrs: c.total_qty || 0,
            status: c.status || 'Active'
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '28px' }}>
        
        {/* Card 1: Total Orders */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>1,250</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>+12%</span>
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
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>84</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingDown size={14} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>-5%</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>vs yesterday</span>
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
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>2,450 m</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>+8%</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>avg efficiency</span>
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
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>45,800 m</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>+3%</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>inventory aging</span>
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
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>₹14.8M</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingUp size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>+18%</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>target achieved</span>
            </div>
          </div>
          <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '24px' }}>
            <path d="M 0,24 Q 30,12 60,18 T 120,8 T 180,10 T 240,2" fill="none" stroke="rgba(236, 72, 153, 0.3)" strokeWidth="2" />
          </svg>
        </div>

        {/* Card 6: Pending Payments */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Pay</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>₹2.4M</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <TrendingDown size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>-15%</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>overdue reduction</span>
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
              <option value="Reliance Retail">Reliance Retail</option>
              <option value="Birla Fashion">Birla Fashion</option>
              <option value="Dinesh Fabrics">Dinesh Fabrics</option>
              <option value="Raymond Ltd">Raymond Ltd</option>
              <option value="Standard Weaving">Standard Weaving</option>
              <option value="Arvind Mills">Arvind Mills</option>
              <option value="Vardhman Spinning">Vardhman Spinning</option>
              <option value="KPR Mills">KPR Mills</option>
              <option value="Birla Acrylic">Birla Acrylic</option>
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
              <option value="Cotton">Cotton Base</option>
              <option value="Polyester">Polyester Blend</option>
              <option value="Viscose">Viscose Satin</option>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
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
