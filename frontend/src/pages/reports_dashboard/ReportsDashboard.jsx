import { useState, useMemo } from 'react';
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
    rows: [
      { orderId: 'BO-2026-001', date: '2026-05-10', customer: 'Reliance Retail', fabricType: 'Cotton Twill', qty: 15000, amount: 2250000, status: 'Completed' },
      { orderId: 'BO-2026-002', date: '2026-05-12', customer: 'Birla Fashion', fabricType: 'Polyester Blend', qty: 8500, amount: 1105000, status: 'Pending' },
      { orderId: 'BO-2026-003', date: '2026-05-15', customer: 'Dinesh Fabrics', fabricType: 'Viscose Satin', qty: 12000, amount: 2040000, status: 'Completed' },
      { orderId: 'BO-2026-004', date: '2026-05-18', customer: 'Vikas Garments', fabricType: 'Cotton Canvas', qty: 6200, amount: 930000, status: 'Cancelled' },
      { orderId: 'BO-2026-005', date: '2026-05-22', customer: 'Standard Weaving', fabricType: 'Cotton Voile', qty: 22000, amount: 2860000, status: 'Pending' },
      { orderId: 'BO-2026-006', date: '2026-05-25', customer: 'Raymond Ltd', fabricType: 'Cotton Twill', qty: 18000, amount: 2700000, status: 'Completed' },
      { orderId: 'BO-2026-007', date: '2026-05-28', customer: 'Arvind Mills', fabricType: 'Polyester Blend', qty: 9500, amount: 1235000, status: 'Pending' }
    ]
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
    rows: [
      { invoiceNo: 'INV-2601', date: '2026-05-12', customer: 'Reliance Retail', gstin: '27AAACR1234F1Z5', taxable: 2250000, gst: 405000, total: 2655000, status: 'Completed' },
      { invoiceNo: 'INV-2602', date: '2026-05-16', customer: 'Dinesh Fabrics', gstin: '33AABBD4321A1Z9', taxable: 2040000, gst: 367200, total: 2407200, status: 'Completed' },
      { invoiceNo: 'INV-2603', date: '2026-05-20', customer: 'Raymond Ltd', gstin: '27AAAAR5566C1Z2', taxable: 2700000, gst: 486000, total: 3186000, status: 'Completed' },
      { invoiceNo: 'INV-2604', date: '2026-05-28', customer: 'Birla Fashion', gstin: '24AAACB9876G1ZA', taxable: 1105000, gst: 198900, total: 1303900, status: 'Pending' }
    ]
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
    rows: [
      { dispatchNo: 'DSP-26001', date: '2026-05-13', customer: 'Reliance Retail', invoiceNo: 'INV-2601', vehicleNo: 'MH-12-PQ-9876', pcs: 120, status: 'Completed' },
      { dispatchNo: 'DSP-26002', date: '2026-05-17', customer: 'Dinesh Fabrics', invoiceNo: 'INV-2602', vehicleNo: 'TN-38-DF-4321', pcs: 98, status: 'Completed' },
      { dispatchNo: 'DSP-26003', date: '2026-05-21', customer: 'Raymond Ltd', invoiceNo: 'INV-2603', vehicleNo: 'MH-04-GP-5511', pcs: 154, status: 'Completed' },
      { dispatchNo: 'DSP-26004', date: '2026-05-29', customer: 'Birla Fashion', invoiceNo: 'INV-2604', vehicleNo: 'GJ-01-XY-8822', pcs: 75, status: 'Pending' }
    ]
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
    rows: [
      { packingNo: 'PK-2601', date: '2026-05-11', customer: 'Reliance Retail', rolls: 120, netWeight: 3450, grossWeight: 3520, status: 'Completed' },
      { packingNo: 'PK-2602', date: '2026-05-14', customer: 'Dinesh Fabrics', rolls: 98, netWeight: 2890, grossWeight: 2950, status: 'Completed' },
      { packingNo: 'PK-2603', date: '2026-05-19', customer: 'Raymond Ltd', rolls: 154, netWeight: 4120, grossWeight: 4200, status: 'Completed' }
    ]
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
    rows: [
      { orderId: 'BO-2026-002', date: '2026-05-12', customer: 'Birla Fashion', ordered: 8500, dispatched: 0, balance: 8500, status: 'Pending' },
      { orderId: 'BO-2026-005', date: '2026-05-22', customer: 'Standard Weaving', ordered: 22000, dispatched: 10000, balance: 12000, status: 'Pending' },
      { orderId: 'BO-2026-007', date: '2026-05-28', customer: 'Arvind Mills', ordered: 9500, dispatched: 0, balance: 9500, status: 'Pending' }
    ]
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
    rows: [
      { loomNo: 'Loom-01', date: '2026-05-31', supervisor: 'Ramesh K.', quality: '40s Cotton Sateen', target: 200, actual: 185, efficiency: 92.5 },
      { loomNo: 'Loom-02', date: '2026-05-31', supervisor: 'Ramesh K.', quality: '60s Cotton Sateen', target: 180, actual: 172, efficiency: 95.5 },
      { loomNo: 'Loom-03', date: '2026-05-31', supervisor: 'Suresh M.', quality: '50s Viscose Linen', target: 190, actual: 181, efficiency: 95.2 },
      { loomNo: 'Loom-04', date: '2026-05-31', supervisor: 'Suresh M.', quality: 'PC Blend 2/40', target: 220, actual: 215, efficiency: 97.7 },
      { loomNo: 'Loom-05', date: '2026-05-31', supervisor: 'Vikas P.', quality: '40s Cotton Sateen', target: 200, actual: 160, efficiency: 80.0 },
      { loomNo: 'Loom-06', date: '2026-05-31', supervisor: 'Vikas P.', quality: 'Cotton Twill 2/20', target: 210, actual: 208, efficiency: 99.0 }
    ]
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
    rows: [
      { setNo: 'SET-991', beamNo: 'BM-2051', date: '2026-05-28', yarnLot: 'YLT-COT-40S', ends: 4800, speed: 650, status: 'Completed' },
      { setNo: 'SET-991', beamNo: 'BM-2052', date: '2026-05-29', yarnLot: 'YLT-COT-40S', ends: 4800, speed: 640, status: 'Completed' },
      { setNo: 'SET-992', beamNo: 'BM-2053', date: '2026-05-30', yarnLot: 'YLT-VIS-50S', ends: 5200, speed: 580, status: 'Completed' },
      { setNo: 'SET-993', beamNo: 'BM-2054', date: '2026-05-31', yarnLot: 'YLT-POLY-30S', ends: 4200, speed: 700, status: 'Pending' }
    ]
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
    rows: [
      { batchNo: 'DY-BT-701', date: '2026-05-25', shade: 'Classic Navy Blue', fabricType: 'Cotton Voile', weight: 450, process: 'Reactive Dyeing', status: 'Completed' },
      { batchNo: 'DY-BT-702', date: '2026-05-27', shade: 'Olive Green 104', fabricType: 'Cotton Twill', weight: 600, process: 'Vat Dyeing', status: 'Completed' },
      { batchNo: 'DY-BT-703', date: '2026-05-29', shade: 'Crimson Red', fabricType: 'Viscose Satin', weight: 380, process: 'Disperse Dyeing', status: 'Pending' }
    ]
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
    rows: [
      { date: '2026-05-25', shift: 'Shift A', dept: 'Weaving Section I', looms: 36, target: 7200, actual: 6840, efficiency: 95.0 },
      { date: '2026-05-26', shift: 'Shift B', dept: 'Weaving Section I', looms: 36, target: 7200, actual: 6912, efficiency: 96.0 },
      { date: '2026-05-27', shift: 'Shift C', dept: 'Weaving Section I', looms: 34, target: 6800, actual: 6392, efficiency: 94.0 },
      { date: '2026-05-28', shift: 'Shift A', dept: 'Weaving Section II', looms: 20, target: 4400, actual: 3960, efficiency: 90.0 }
    ]
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
    rows: [
      { yarnType: 'Cotton Combed', count: '40s Ne', brand: 'Vardhman Spinning', inward: 45000, consumed: 38200, balance: 6800, val: 2040000 },
      { yarnType: 'Viscose Vortex', count: '50s Ne', brand: 'Birla Acrylic', inward: 24000, consumed: 18500, balance: 5500, val: 1925000 },
      { yarnType: 'Polyester Filament', count: '150 Denier', brand: 'Reliance Ind.', inward: 30000, consumed: 28000, balance: 2000, val: 400000 },
      { yarnType: 'Cotton Carded', count: '20s Ne', brand: 'KPR Mills', inward: 18000, consumed: 12000, balance: 6000, val: 1560000 }
    ]
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
    rows: [
      { date: '2026-05-30', loomNo: 'Loom-01', warpLot: 'YLT-COT-40S', weftLot: 'YLT-COT-40S', consumed: 45.8, waste: 0.9 },
      { date: '2026-05-30', loomNo: 'Loom-02', warpLot: 'YLT-COT-40S', weftLot: 'YLT-COT-40S', consumed: 42.4, waste: 0.8 },
      { date: '2026-05-30', loomNo: 'Loom-03', warpLot: 'YLT-VIS-50S', weftLot: 'YLT-VIS-50S', consumed: 38.6, waste: 0.7 },
      { date: '2026-05-30', loomNo: 'Loom-04', warpLot: 'YLT-POLY-30S', weftLot: 'YLT-POLY-30S', consumed: 52.1, waste: 1.1 }
    ]
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
    rows: [
      { poNo: 'YPO-2026-101', date: '2026-05-01', supplier: 'Vardhman Spinning', yarnType: '40s Combed Cotton', qty: 10000, rate: 300, total: 3000000, status: 'Completed' },
      { poNo: 'YPO-2026-102', date: '2026-05-15', supplier: 'KPR Mills', yarnType: '20s Carded Cotton', qty: 12000, rate: 260, total: 3120000, status: 'Completed' },
      { poNo: 'YPO-2026-103', date: '2026-05-26', supplier: 'Birla Acrylic', yarnType: '50s Viscose Vortex', qty: 8000, rate: 350, total: 2800000, status: 'Pending' }
    ]
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
    rows: [
      { challanNo: 'YDC-9801', date: '2026-05-03', supplier: 'Vardhman Spinning', yarnType: '40s Combed Cotton', vehicleNo: 'PB-10-XX-7811', netQty: 10000, status: 'Completed' },
      { challanNo: 'YDC-9802', date: '2026-05-18', supplier: 'KPR Mills', yarnType: '20s Carded Cotton', vehicleNo: 'TN-33-AA-9900', netQty: 12000, status: 'Completed' }
    ]
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
    rows: [
      { inwardNo: 'CI-1109', date: '2026-05-30', loomNo: 'Loom-01', quality: '40s Cotton Sateen', rolls: 4, mtrs: 485, status: 'Completed' },
      { inwardNo: 'CI-1110', date: '2026-05-30', loomNo: 'Loom-02', quality: '60s Cotton Sateen', rolls: 3, mtrs: 350, status: 'Completed' },
      { inwardNo: 'CI-1111', date: '2026-05-30', loomNo: 'Loom-03', quality: '50s Viscose Linen', rolls: 4, mtrs: 520, status: 'Completed' }
    ]
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
    rows: [
      { challanNo: 'CDC-5501', date: '2026-05-24', buyer: 'Krishna Dyeing House', quality: '40s Cotton Sateen', rolls: 45, mtrs: 5400, gatePass: 'GP-2281' },
      { challanNo: 'CDC-5502', date: '2026-05-28', buyer: 'Apex Processing Ind.', quality: '50s Viscose Linen', rolls: 32, mtrs: 3840, gatePass: 'GP-2295' }
    ]
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
    rows: [
      { batchNo: 'FFB-901', date: '2026-05-26', quality: 'Cotton Voile 40x40', shade: 'Classic Navy Blue', mtrs: 432, gradeA: 96.5, gradeB: 3.5, status: 'Completed' },
      { batchNo: 'FFB-902', date: '2026-05-28', quality: 'Cotton Twill 2/20', shade: 'Olive Green 104', mtrs: 585, gradeA: 95.0, gradeB: 5.0, status: 'Completed' }
    ]
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
    rows: [
      { rollNo: 'RL-10801', date: '2026-05-29', quality: '40s Cotton Sateen', width: 63, mtrs: 125, wt: 18.5, grade: 'A' },
      { rollNo: 'RL-10802', date: '2026-05-29', quality: '40s Cotton Sateen', width: 63, mtrs: 120, wt: 17.8, grade: 'A' },
      { rollNo: 'RL-10803', date: '2026-05-29', quality: '50s Viscose Linen', width: 58, mtrs: 130, wt: 20.2, grade: 'A' },
      { rollNo: 'RL-10804', date: '2026-05-29', quality: 'Cotton Twill 2/20', width: 60, mtrs: 110, wt: 22.0, grade: 'B' }
    ]
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
    rows: [
      { customer: 'Reliance Retail', billed: 5600000, paid: 4800000, balance: 800000, lastPayment: '2026-05-20', overdue: 12, status: 'Pending' },
      { customer: 'Birla Fashion', billed: 3200000, paid: 2000000, balance: 1200000, lastPayment: '2026-05-15', overdue: 25, status: 'Pending' },
      { customer: 'Dinesh Fabrics', billed: 4200000, paid: 4200000, balance: 0, lastPayment: '2026-05-28', overdue: 0, status: 'Completed' },
      { customer: 'Raymond Ltd', billed: 7800000, paid: 6000000, balance: 1800000, lastPayment: '2026-05-22', overdue: 9, status: 'Pending' }
    ]
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
    rows: [
      { supplier: 'Vardhman Spinning', purchases: 6400000, paid: 5400000, balance: 1000000, nextDue: '2026-06-10', overdue: 0, status: 'Pending' },
      { supplier: 'KPR Mills', purchases: 3800000, paid: 3800000, balance: 0, nextDue: '-', overdue: 0, status: 'Completed' },
      { supplier: 'Birla Acrylic', purchases: 2800000, paid: 1800000, balance: 1000000, nextDue: '2026-05-28', overdue: 4, status: 'Pending' }
    ]
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
    rows: [
      { month: 'April 2026', outwardGst: 1620000, inwardGst: 1080000, payable: 540000, paid: 540000, filedDate: '2026-05-18' },
      { month: 'March 2026', outwardGst: 1890000, inwardGst: 1250000, payable: 640000, paid: 640000, filedDate: '2026-04-19' },
      { month: 'February 2026', outwardGst: 1450000, inwardGst: 980000, payable: 470000, paid: 470000, filedDate: '2026-03-20' }
    ]
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
    rows: [
      { quarter: 'Q1 FY 2025-26', revenue: 45000000, directExp: 31000000, indirectExp: 4500000, grossProfit: 14000000, netProfit: 9500000 },
      { quarter: 'Q4 FY 2024-25', revenue: 48000000, directExp: 33000000, indirectExp: 4800000, grossProfit: 15000000, netProfit: 10200000 },
      { quarter: 'Q3 FY 2024-25', revenue: 41000000, directExp: 28500000, indirectExp: 4200000, grossProfit: 12500000, netProfit: 8300000 }
    ]
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
    rows: [
      { itemCode: 'YRN-COT-40S', itemName: '40s Ne Combed Cotton Yarn', category: 'Yarn Stock', uom: 'Kgs', currentQty: 6800, reorder: 5000, val: 2040000 },
      { itemCode: 'YRN-VIS-50S', itemName: '50s Ne Vortex Viscose Yarn', category: 'Yarn Stock', uom: 'Kgs', currentQty: 5500, reorder: 4000, val: 1925000 },
      { itemCode: 'DY-NVY-22', itemName: 'Navy Blue Reactive Dye RD-22', category: 'Dyes & Chem', uom: 'Kgs', currentQty: 240, reorder: 150, val: 96000 },
      { itemCode: 'DY-OLV-14', itemName: 'Olive Green Vat Dye OLV-14', category: 'Dyes & Chem', uom: 'Kgs', currentQty: 180, reorder: 100, val: 108000 },
      { itemCode: 'PKG-CAR-L', itemName: 'Heavy Duty Export Cartons L', category: 'Packaging', uom: 'Pcs', currentQty: 1500, reorder: 1000, val: 75000 }
    ]
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
    rows: [
      { date: '2026-05-30', slipNo: 'REQ-12001', dept: 'Dyeing House', user: 'Vikas Sharma', itemName: 'Navy Blue Reactive Dye RD-22', qty: 35, uom: 'Kgs' },
      { date: '2026-05-30', slipNo: 'REQ-12002', dept: 'Weaving Room', user: 'Ramesh K.', itemName: '40s Ne Combed Cotton Yarn', qty: 250, uom: 'Kgs' },
      { date: '2026-05-30', slipNo: 'REQ-12003', dept: 'Packing Unit', user: 'Anthony D.', itemName: 'Heavy Duty Export Cartons L', qty: 85, uom: 'Pcs' }
    ]
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
    rows: [
      { itemCode: 'YRN-COT-40S', itemName: '40s Ne Combed Cotton Yarn', category: 'Yarn Stock', age0_30: 1800, age31_90: 3200, age91_180: 1800, age180plus: 0 },
      { itemCode: 'YRN-VIS-50S', itemName: '50s Ne Vortex Viscose Yarn', category: 'Yarn Stock', age0_30: 2500, age31_90: 2000, age91_180: 1000, age180plus: 0 },
      { itemCode: 'DY-NVY-22', itemName: 'Navy Blue Reactive Dye RD-22', category: 'Dyes & Chem', age0_30: 90, age31_90: 150, age91_180: 0, age180plus: 0 },
      { itemCode: 'PKG-CAR-L', itemName: 'Heavy Duty Export Cartons L', category: 'Packaging', age0_30: 500, age31_90: 400, age91_180: 200, age180plus: 400 }
    ]
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
    rows: [
      { warehouse: 'Main Yarn Godown', itemName: '40s Ne Combed Cotton Yarn', rackNo: 'RK-A1', binNo: 'BIN-102', available: 5800, reserved: 1000, total: 6800 },
      { warehouse: 'Main Yarn Godown', itemName: '50s Ne Vortex Viscose Yarn', rackNo: 'RK-A3', binNo: 'BIN-108', available: 4500, reserved: 1000, total: 5500 },
      { warehouse: 'Chemical Store Rm 1', itemName: 'Navy Blue Reactive Dye RD-22', rackNo: 'RK-D5', binNo: 'BIN-401', available: 240, reserved: 0, total: 240 },
      { warehouse: 'Packaging Depot', itemName: 'Heavy Duty Export Cartons L', rackNo: 'RK-P2', binNo: 'BOX-22', available: 1200, reserved: 300, total: 1500 }
    ]
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
    return MOCK_REPORTS_DATA[activeReportId] || MOCK_REPORTS_DATA['loom_production'];
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
