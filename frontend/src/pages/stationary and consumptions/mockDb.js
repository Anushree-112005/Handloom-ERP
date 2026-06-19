import api from '../../services/api';

// Mock Database and Helper Functions for Stationery & Consumables Management
const defaultCategories = [
  { id: 'CAT001', name: 'Office Stationery', description: 'Pens, papers, folders, binders, office tools', active: 'Yes' },
  { id: 'CAT002', name: 'Printing Consumables', description: 'Ink cartridges, toner, drum units', active: 'Yes' },
  { id: 'CAT003', name: 'Computer Accessories', description: 'USB drives, keyboards, mouse, cables', active: 'Yes' },
  { id: 'CAT004', name: 'Packing Materials', description: 'Cartons, tapes, bubble wrap, poly bags', active: 'Yes' },
  { id: 'CAT005', name: 'Housekeeping', description: 'Phenyl, detergents, mops, cleaning clothes', active: 'Yes' },
  { id: 'CAT006', name: 'Safety Items', description: 'Gloves, masks, helmets, ear plugs, jackets', active: 'Yes' },
  { id: 'CAT007', name: 'Production Consumables', description: 'Shade cards, lot stickers, design sheets', active: 'Yes' }
];

const defaultUOMs = [
  { id: 'UOM001', name: 'Nos', description: 'Number of units', active: 'Yes' },
  { id: 'UOM002', name: 'Box', description: 'Box package', active: 'Yes' },
  { id: 'UOM003', name: 'Packet', description: 'Packets', active: 'Yes' },
  { id: 'UOM004', name: 'Roll', description: 'Rolls of tape or sticker', active: 'Yes' },
  { id: 'UOM005', name: 'Kg', description: 'Kilograms', active: 'Yes' },
  { id: 'UOM006', name: 'Litre', description: 'Litres', active: 'Yes' },
  { id: 'UOM007', name: 'Ream', description: 'Reams of paper', active: 'Yes' }
];

const defaultDepartments = [
  { id: 'DEP001', name: 'HR & Admin', code: 'HRD', active: 'Yes' },
  { id: 'DEP002', name: 'Accounts & Finance', code: 'ACF', active: 'Yes' },
  { id: 'DEP003', name: 'Production', code: 'PRD', active: 'Yes' },
  { id: 'DEP004', name: 'Quality Assurance', code: 'QAC', active: 'Yes' },
  { id: 'DEP005', name: 'Stores & Warehouse', code: 'STW', active: 'Yes' }
];

const defaultVendors = [
  { id: 'VEN001', name: 'Apex Supplies Ltd', code: 'APX', gst: '33AAAAA1111A1Z1', phone: '9876543210', email: 'sales@apex.com', rating: 4.5 },
  { id: 'VEN002', name: 'Prime Packers', code: 'PRM', gst: '33BBBBB2222B2Z2', phone: '9876543211', email: 'orders@primepack.com', rating: 4.2 },
  { id: 'VEN003', name: 'SafeWork Safety Goods', code: 'SFW', gst: '33CCCCC3333C3Z3', phone: '9876543212', email: 'info@safework.com', rating: 4.8 },
  { id: 'VEN004', name: 'Metro Stationery Hub', code: 'MTR', gst: '33DDDDD4444D4Z4', phone: '9876543213', email: 'contact@metrostationery.com', rating: 4.0 }
];

const defaultItems = [
  { id: 'ITM001', name: 'A4 Paper', code: 'A4P', category: 'Office Stationery', uom: 'Ream', minStock: 20, maxStock: 200, safetyStock: 10, currentStock: 45, rate: 280, vendor: 'Metro Stationery Hub' },
  { id: 'ITM002', name: 'Ball Pen Blue', code: 'BPB', category: 'Office Stationery', uom: 'Box', minStock: 10, maxStock: 50, safetyStock: 5, currentStock: 8, rate: 150, vendor: 'Metro Stationery Hub' },
  { id: 'ITM003', name: 'HP Laser Toner', code: 'HPT', category: 'Printing Consumables', uom: 'Nos', minStock: 2, maxStock: 10, safetyStock: 1, currentStock: 1, rate: 3200, vendor: 'Apex Supplies Ltd' },
  { id: 'ITM004', name: 'Carton Box 5-Ply', code: 'CB5', category: 'Packing Materials', uom: 'Nos', minStock: 500, maxStock: 5000, safetyStock: 100, currentStock: 1200, rate: 45, vendor: 'Prime Packers' },
  { id: 'ITM005', name: 'BOPP Packing Tape 2"', code: 'BOP', category: 'Packing Materials', uom: 'Roll', minStock: 50, maxStock: 500, safetyStock: 10, currentStock: 80, rate: 65, vendor: 'Prime Packers' },
  { id: 'ITM006', name: 'Safety Gloves Latex', code: 'SGL', category: 'Safety Items', uom: 'Box', minStock: 15, maxStock: 100, safetyStock: 5, currentStock: 5, rate: 450, vendor: 'SafeWork Safety Goods' },
  { id: 'ITM007', name: 'Floor Cleaner Phenyl', code: 'FCP', category: 'Housekeeping', uom: 'Litre', minStock: 10, maxStock: 50, safetyStock: 2, currentStock: 25, rate: 85, vendor: 'Apex Supplies Ltd' }
];

const defaultRequests = [
  { id: 'REQ001', date: '2026-06-10', department: 'HR & Admin', requestedBy: 'Dinesh Kumar', priority: 'Medium', status: 'Approved', remarks: 'For new joiners setup', items: [{ itemId: 'ITM001', qty: 5, approvedQty: 5 }, { itemId: 'ITM002', qty: 2, approvedQty: 2 }] },
  { id: 'REQ002', date: '2026-06-12', department: 'Production', requestedBy: 'M. Selvam', priority: 'High', status: 'Pending', remarks: 'Urgent packing material replenishment', items: [{ itemId: 'ITM004', qty: 500, approvedQty: 0 }] },
  { id: 'REQ003', date: '2026-06-13', department: 'Accounts & Finance', requestedBy: 'Priya Nair', priority: 'Low', status: 'Approved', remarks: 'Office desk accessories', items: [{ itemId: 'ITM001', qty: 10, approvedQty: 10 }] },
  { id: 'REQ004', date: '2026-06-14', department: 'Quality Assurance', requestedBy: 'Vijay Prasad', priority: 'High', status: 'Approved', remarks: 'QA floor safety gear', items: [{ itemId: 'ITM006', qty: 15, approvedQty: 15 }] },
  { id: 'REQ005', date: '2026-06-15', department: 'Stores & Warehouse', requestedBy: 'Karthik Raja', priority: 'Medium', status: 'Pending', remarks: 'BOPP Tape shortage', items: [{ itemId: 'ITM005', qty: 50, approvedQty: 0 }] },
  { id: 'REQ006', date: '2026-06-16', department: 'HR & Admin', requestedBy: 'Amit Sharma', priority: 'Low', status: 'Approved', remarks: 'HR meeting stationery', items: [{ itemId: 'ITM002', qty: 5, approvedQty: 5 }] },
  { id: 'REQ007', date: '2026-06-17', department: 'Production', requestedBy: 'Senthil Balan', priority: 'High', status: 'Approved', remarks: 'Phenyl for housekeeping team', items: [{ itemId: 'ITM007', qty: 8, approvedQty: 8 }] },
  { id: 'REQ008', date: '2026-06-18', department: 'Quality Assurance', requestedBy: 'Manoj Patil', priority: 'Medium', status: 'Approved', remarks: 'Gloves for table checking staff', items: [{ itemId: 'ITM006', qty: 10, approvedQty: 10 }] },
  { id: 'REQ009', date: '2026-06-19', department: 'Accounts & Finance', requestedBy: 'Dinesh Karthik', priority: 'High', status: 'Pending', remarks: 'Urgent toner replacement', items: [{ itemId: 'ITM003', qty: 1, approvedQty: 0 }] },
  { id: 'REQ010', date: '2026-06-19', department: 'Stores & Warehouse', requestedBy: 'M. Selvam', priority: 'Medium', status: 'Approved', remarks: 'Carton boxes for shipment preparation', items: [{ itemId: 'ITM004', qty: 300, approvedQty: 300 }] }
];

const defaultPOs = [
  { id: 'PO001', date: '2026-06-08', vendor: 'Prime Packers', paymentTerms: '30 Days Credit', expectedDate: '2026-06-15', status: 'Ordered', items: [{ itemId: 'ITM004', qty: 1000, rate: 45, total: 45000 }] },
  { id: 'PO002', date: '2026-06-09', vendor: 'Apex Supplies Ltd', paymentTerms: '30 Days Credit', expectedDate: '2026-06-16', status: 'Completed', items: [{ itemId: 'ITM001', qty: 50, rate: 280, total: 14000 }] },
  { id: 'PO003', date: '2026-06-10', vendor: 'SafeWork Safety Goods', paymentTerms: '15 Days Credit', expectedDate: '2026-06-17', status: 'Completed', items: [{ itemId: 'ITM006', qty: 20, rate: 450, total: 9000 }] },
  { id: 'PO004', date: '2026-06-11', vendor: 'Metro Stationery Hub', paymentTerms: '30 Days Credit', expectedDate: '2026-06-18', status: 'Ordered', items: [{ itemId: 'ITM002', qty: 100, rate: 150, total: 15000 }] },
  { id: 'PO005', date: '2026-06-12', vendor: 'Apex Supplies Ltd', paymentTerms: '30 Days Credit', expectedDate: '2026-06-19', status: 'Ordered', items: [{ itemId: 'ITM003', qty: 5, rate: 3200, total: 16000 }] },
  { id: 'PO006', date: '2026-06-13', vendor: 'Prime Packers', paymentTerms: '45 Days Credit', expectedDate: '2026-06-20', status: 'Completed', items: [{ itemId: 'ITM005', qty: 150, rate: 65, total: 9750 }] },
  { id: 'PO007', date: '2026-06-14', vendor: 'SafeWork Safety Goods', paymentTerms: '30 Days Credit', expectedDate: '2026-06-21', status: 'Ordered', items: [{ itemId: 'ITM006', qty: 30, rate: 450, total: 13500 }] },
  { id: 'PO008', date: '2026-06-15', vendor: 'Metro Stationery Hub', paymentTerms: '30 Days Credit', expectedDate: '2026-06-22', status: 'Completed', items: [{ itemId: 'ITM001', qty: 80, rate: 280, total: 22400 }] },
  { id: 'PO009', date: '2026-06-16', vendor: 'Apex Supplies Ltd', paymentTerms: 'Cash', expectedDate: '2026-06-23', status: 'Ordered', items: [{ itemId: 'ITM007', qty: 40, rate: 85, total: 3400 }] },
  { id: 'PO010', date: '2026-06-17', vendor: 'Prime Packers', paymentTerms: '30 Days Credit', expectedDate: '2026-06-24', status: 'Completed', items: [{ itemId: 'ITM004', qty: 2000, rate: 45, total: 90000 }] }
];

const defaultGRNs = [
  { id: 'GRN001', date: '2026-06-09', vendor: 'Prime Packers', poId: 'PO001', invoiceNo: 'INV-9921', status: 'Accepted', items: [{ itemId: 'ITM004', orderedQty: 1000, receivedQty: 1000, acceptedQty: 1000, rejectedQty: 0, rate: 45 }] },
  { id: 'GRN002', date: '2026-06-10', vendor: 'Apex Supplies Ltd', poId: 'PO002', invoiceNo: 'INV-8812', status: 'Accepted', items: [{ itemId: 'ITM001', orderedQty: 50, receivedQty: 50, acceptedQty: 50, rejectedQty: 0, rate: 280 }] },
  { id: 'GRN003', date: '2026-06-11', vendor: 'SafeWork Safety Goods', poId: 'PO003', invoiceNo: 'INV-7711', status: 'Accepted', items: [{ itemId: 'ITM006', orderedQty: 20, receivedQty: 20, acceptedQty: 18, rejectedQty: 2, rate: 450 }] },
  { id: 'GRN004', date: '2026-06-12', vendor: 'Metro Stationery Hub', poId: 'PO004', invoiceNo: 'INV-6622', status: 'Accepted', items: [{ itemId: 'ITM002', orderedQty: 100, receivedQty: 100, acceptedQty: 100, rejectedQty: 0, rate: 150 }] },
  { id: 'GRN005', date: '2026-06-13', vendor: 'Apex Supplies Ltd', poId: 'PO005', invoiceNo: 'INV-5544', status: 'Accepted', items: [{ itemId: 'ITM003', orderedQty: 5, receivedQty: 5, acceptedQty: 5, rejectedQty: 0, rate: 3200 }] },
  { id: 'GRN006', date: '2026-06-14', vendor: 'Prime Packers', poId: 'PO006', invoiceNo: 'INV-4411', status: 'Accepted', items: [{ itemId: 'ITM005', orderedQty: 150, receivedQty: 150, acceptedQty: 150, rejectedQty: 0, rate: 65 }] },
  { id: 'GRN007', date: '2026-06-15', vendor: 'SafeWork Safety Goods', poId: 'PO007', invoiceNo: 'INV-3399', status: 'Accepted', items: [{ itemId: 'ITM006', orderedQty: 30, receivedQty: 30, acceptedQty: 28, rejectedQty: 2, rate: 450 }] },
  { id: 'GRN008', date: '2026-06-16', vendor: 'Metro Stationery Hub', poId: 'PO008', invoiceNo: 'INV-2211', status: 'Accepted', items: [{ itemId: 'ITM001', orderedQty: 80, receivedQty: 80, acceptedQty: 80, rejectedQty: 0, rate: 280 }] },
  { id: 'GRN009', date: '2026-06-17', vendor: 'Apex Supplies Ltd', poId: 'PO009', invoiceNo: 'INV-1188', status: 'Accepted', items: [{ itemId: 'ITM007', orderedQty: 40, receivedQty: 40, acceptedQty: 38, rejectedQty: 2, rate: 85 }] },
  { id: 'GRN010', date: '2026-06-18', vendor: 'Prime Packers', poId: 'PO010', invoiceNo: 'INV-0099', status: 'Accepted', items: [{ itemId: 'ITM004', orderedQty: 2000, receivedQty: 2000, acceptedQty: 2000, rejectedQty: 0, rate: 45 }] }
];

const defaultIssues = [
  { id: 'ISS001', date: '2026-06-11', department: 'HR & Admin', employee: 'Dinesh Kumar', purpose: 'Office Stationery Setup', items: [{ itemId: 'ITM001', qty: 3, rate: 280 }, { itemId: 'ITM002', qty: 1, rate: 150 }] },
  { id: 'ISS002', date: '2026-06-12', department: 'Production', employee: 'M. Selvam', purpose: 'Packing materials for loom 1-5', items: [{ itemId: 'ITM004', qty: 100, rate: 45 }, { itemId: 'ITM005', qty: 5, rate: 65 }] },
  { id: 'ISS003', date: '2026-06-13', department: 'Accounts & Finance', employee: 'Priya Nair', purpose: 'Finance office setup', items: [{ itemId: 'ITM001', qty: 5, rate: 280 }, { itemId: 'ITM002', qty: 10, rate: 150 }] },
  { id: 'ISS004', date: '2026-06-14', department: 'Quality Assurance', employee: 'Vijay Prasad', purpose: 'Safety kit distribution', items: [{ itemId: 'ITM006', qty: 10, rate: 450 }] },
  { id: 'ISS005', date: '2026-06-15', department: 'HR & Admin', employee: 'Amit Sharma', purpose: 'GM office supplies', items: [{ itemId: 'ITM001', qty: 2, rate: 280 }, { itemId: 'ITM003', qty: 1, rate: 3200 }] },
  { id: 'ISS006', date: '2026-06-16', department: 'Production', employee: 'Senthil Balan', purpose: 'Housekeeping stock', items: [{ itemId: 'ITM007', qty: 12, rate: 85 }] },
  { id: 'ISS007', date: '2026-06-17', department: 'Stores & Warehouse', employee: 'Karthik Raja', purpose: 'Packing tape replacement', items: [{ itemId: 'ITM005', qty: 25, rate: 65 }] },
  { id: 'ISS008', date: '2026-06-18', department: 'Quality Assurance', employee: 'Manoj Patil', purpose: 'Gloves for checking desk', items: [{ itemId: 'ITM006', qty: 12, rate: 450 }] },
  { id: 'ISS009', date: '2026-06-19', department: 'Accounts & Finance', employee: 'Dinesh Karthik', purpose: 'Ledgers A4 paper print', items: [{ itemId: 'ITM001', qty: 8, rate: 280 }, { itemId: 'ITM003', qty: 1, rate: 3200 }] },
  { id: 'ISS010', date: '2026-06-19', department: 'Stores & Warehouse', employee: 'M. Selvam', purpose: 'Carton packaging issue', items: [{ itemId: 'ITM004', qty: 250, rate: 45 }] }
];

const defaultLedger = [
  { id: 'LED001', date: '2026-06-01', itemId: 'ITM001', refType: 'Opening', refId: '-', inQty: 100, outQty: 0, balance: 100 },
  { id: 'LED002', date: '2026-06-11', itemId: 'ITM001', refType: 'Issue', refId: 'ISS001', inQty: 0, outQty: 3, balance: 97 },
  { id: 'LED003', date: '2026-06-12', itemId: 'ITM004', refType: 'Issue', refId: 'ISS002', inQty: 0, outQty: 100, balance: 1100 },
  { id: 'LED004', date: '2026-06-13', itemId: 'ITM001', refType: 'Issue', refId: 'ISS003', inQty: 0, outQty: 5, balance: 92 },
  { id: 'LED005', date: '2026-06-14', itemId: 'ITM006', refType: 'Issue', refId: 'ISS004', inQty: 0, outQty: 10, balance: 25 },
  { id: 'LED006', date: '2026-06-15', itemId: 'ITM003', refType: 'Issue', refId: 'ISS005', inQty: 0, outQty: 1, balance: 2 },
  { id: 'LED007', date: '2026-06-16', itemId: 'ITM007', refType: 'Issue', refId: 'ISS006', inQty: 0, outQty: 12, balance: 13 },
  { id: 'LED008', date: '2026-06-17', itemId: 'ITM005', refType: 'Issue', refId: 'ISS007', inQty: 0, outQty: 25, balance: 55 },
  { id: 'LED009', date: '2026-06-18', itemId: 'ITM006', refType: 'Issue', refId: 'ISS008', inQty: 0, outQty: 12, balance: 13 },
  { id: 'LED010', date: '2026-06-19', itemId: 'ITM001', refType: 'Issue', refId: 'ISS009', inQty: 0, outQty: 8, balance: 84 }
];

const defaultQuotations = [
  { id: 'QTN001', date: '2026-06-05', vendor: 'Apex Supplies Ltd', validityDate: '2026-07-05', paymentTerms: '30 Days Credit', status: 'Approved', items: [{ itemId: 'ITM001', qty: 10, rate: 270, total: 2700 }], quotation_file_path: '' },
  { id: 'QTN002', date: '2026-06-06', vendor: 'Prime Packers', validityDate: '2026-07-06', paymentTerms: '15 Days Credit', status: 'Approved', items: [{ itemId: 'ITM004', qty: 500, rate: 43, total: 21500 }], quotation_file_path: '' },
  { id: 'QTN003', date: '2026-06-07', vendor: 'SafeWork Safety Goods', validityDate: '2026-07-07', paymentTerms: 'Cash', status: 'Pending', items: [{ itemId: 'ITM006', qty: 15, rate: 440, total: 6600 }], quotation_file_path: '' },
  { id: 'QTN004', date: '2026-06-08', vendor: 'Metro Stationery Hub', validityDate: '2026-07-08', paymentTerms: '30 Days Credit', status: 'Approved', items: [{ itemId: 'ITM002', qty: 40, rate: 140, total: 5600 }], quotation_file_path: '' },
  { id: 'QTN005', date: '2026-06-09', vendor: 'Apex Supplies Ltd', validityDate: '2026-07-09', paymentTerms: '30 Days Credit', status: 'Pending', items: [{ itemId: 'ITM003', qty: 3, rate: 3100, total: 9300 }], quotation_file_path: '' },
  { id: 'QTN006', date: '2026-06-10', vendor: 'Prime Packers', validityDate: '2026-07-10', paymentTerms: '30 Days Credit', status: 'Approved', items: [{ itemId: 'ITM005', qty: 80, rate: 60, total: 4800 }], quotation_file_path: '' },
  { id: 'QTN007', date: '2026-06-11', vendor: 'SafeWork Safety Goods', validityDate: '2026-07-11', paymentTerms: '45 Days Credit', status: 'Approved', items: [{ itemId: 'ITM006', qty: 25, rate: 430, total: 10750 }], quotation_file_path: '' },
  { id: 'QTN008', date: '2026-06-12', vendor: 'Metro Stationery Hub', validityDate: '2026-07-12', paymentTerms: '30 Days Credit', status: 'Pending', items: [{ itemId: 'ITM001', qty: 100, rate: 265, total: 26500 }], quotation_file_path: '' },
  { id: 'QTN009', date: '2026-06-13', vendor: 'Apex Supplies Ltd', validityDate: '2026-07-13', paymentTerms: 'Cash', status: 'Approved', items: [{ itemId: 'ITM007', qty: 20, rate: 80, total: 1600 }], quotation_file_path: '' },
  { id: 'QTN010', date: '2026-06-14', vendor: 'Prime Packers', validityDate: '2026-07-14', paymentTerms: '30 Days Credit', status: 'Approved', items: [{ itemId: 'ITM004', qty: 1000, rate: 42, total: 42000 }], quotation_file_path: '' }
];

const defaultRequisitions = [
  { id: 'PRQ001', date: '2026-06-11', requestedBy: 'M. Selvam', status: 'Pending', items: [{ itemId: 'ITM004', qty: 200, currentStock: 1200, minStock: 500 }] },
  { id: 'PRQ002', date: '2026-06-12', requestedBy: 'Dinesh Kumar', status: 'Approved', items: [{ itemId: 'ITM001', qty: 50, currentStock: 45, minStock: 20 }] },
  { id: 'PRQ003', date: '2026-06-13', requestedBy: 'Priya Nair', status: 'Approved', items: [{ itemId: 'ITM003', qty: 5, currentStock: 3, minStock: 2 }] },
  { id: 'PRQ004', date: '2026-06-14', requestedBy: 'Vijay Prasad', status: 'Pending', items: [{ itemId: 'ITM006', qty: 20, currentStock: 35, minStock: 15 }] },
  { id: 'PRQ005', date: '2026-06-15', requestedBy: 'Amit Sharma', status: 'Approved', items: [{ itemId: 'ITM002', qty: 30, currentStock: 15, minStock: 10 }] },
  { id: 'PRQ006', date: '2026-06-16', requestedBy: 'Senthil Balan', status: 'Pending', items: [{ itemId: 'ITM007', qty: 15, currentStock: 25, minStock: 10 }] },
  { id: 'PRQ007', date: '2026-06-17', requestedBy: 'Karthik Raja', status: 'Approved', items: [{ itemId: 'ITM005', qty: 100, currentStock: 80, minStock: 50 }] },
  { id: 'PRQ008', date: '2026-06-18', requestedBy: 'Dinesh Karthik', status: 'Approved', items: [{ itemId: 'ITM001', qty: 30, currentStock: 45, minStock: 20 }] },
  { id: 'PRQ009', date: '2026-06-19', requestedBy: 'Manoj Patil', status: 'Pending', items: [{ itemId: 'ITM004', qty: 400, currentStock: 1200, minStock: 500 }] },
  { id: 'PRQ010', date: '2026-06-19', requestedBy: 'Priya Nair', status: 'Approved', items: [{ itemId: 'ITM003', qty: 2, currentStock: 3, minStock: 2 }] }
];

const defaultReturns = [
  { id: 'RET001', date: '2026-06-12', department: 'Production', employee: 'K. Ramasamy', itemId: 'ITM006', qty: 5, reason: 'Excess quantity returned from floor' },
  { id: 'RET002', date: '2026-06-13', department: 'HR & Admin', employee: 'P. Sudha', itemId: 'ITM002', qty: 10, reason: 'Unused pens returned to store' },
  { id: 'RET003', date: '2026-06-14', department: 'Accounts & Finance', employee: 'Priya Nair', itemId: 'ITM001', qty: 2, reason: 'Extra A4 sheets returned' },
  { id: 'RET004', date: '2026-06-15', department: 'Quality Assurance', employee: 'Vijay Prasad', itemId: 'ITM006', qty: 3, reason: 'Defective size exchanged' },
  { id: 'RET005', date: '2026-06-16', department: 'Production', employee: 'Senthil Balan', itemId: 'ITM004', qty: 50, reason: 'Leftover boxes returned' },
  { id: 'RET006', date: '2026-06-17', department: 'HR & Admin', employee: 'Amit Sharma', itemId: 'ITM001', qty: 1, reason: 'Extra ream not needed' },
  { id: 'RET007', date: '2026-06-18', department: 'Stores & Warehouse', employee: 'Karthik Raja', itemId: 'ITM005', qty: 5, reason: 'Rolls not used in shift' },
  { id: 'RET008', date: '2026-06-19', department: 'Quality Assurance', employee: 'Manoj Patil', itemId: 'ITM006', qty: 4, reason: 'Surplus safety gear returned' },
  { id: 'RET009', date: '2026-06-19', department: 'Accounts & Finance', employee: 'Dinesh Karthik', itemId: 'ITM002', qty: 5, reason: 'Extra pens returned' },
  { id: 'RET010', date: '2026-06-19', department: 'Production', employee: 'M. Selvam', itemId: 'ITM004', qty: 30, reason: 'Excess boxes returned' }
];

const defaultTransfers = [
  { id: 'TRF001', date: '2026-06-14', fromStore: 'Main Store', toStore: 'Weaving Section Store', itemId: 'ITM005', qty: 20, transferBy: 'M. Selvam' },
  { id: 'TRF002', date: '2026-06-15', fromStore: 'Main Store', toStore: 'Garment Store', itemId: 'ITM004', qty: 100, transferBy: 'Dinesh Kumar' },
  { id: 'TRF003', date: '2026-06-16', fromStore: 'Main Store', toStore: 'Admin Sub-Store', itemId: 'ITM001', qty: 15, transferBy: 'Priya Nair' },
  { id: 'TRF004', date: '2026-06-17', fromStore: 'Main Store', toStore: 'Lab Store', itemId: 'ITM006', qty: 8, transferBy: 'Vijay Prasad' },
  { id: 'TRF005', date: '2026-06-18', fromStore: 'Main Store', toStore: 'Weaving Section Store', itemId: 'ITM004', qty: 250, transferBy: 'Manoj Patil' },
  { id: 'TRF006', date: '2026-06-18', fromStore: 'Main Store', toStore: 'Admin Sub-Store', itemId: 'ITM002', qty: 40, transferBy: 'Amit Sharma' },
  { id: 'TRF007', date: '2026-06-19', fromStore: 'Main Store', toStore: 'Garment Store', itemId: 'ITM005', qty: 30, transferBy: 'Karthik Raja' },
  { id: 'TRF008', date: '2026-06-19', fromStore: 'Main Store', toStore: 'Lab Store', itemId: 'ITM007', qty: 10, transferBy: 'Senthil Balan' },
  { id: 'TRF009', date: '2026-06-19', fromStore: 'Main Store', toStore: 'Weaving Section Store', itemId: 'ITM005', qty: 15, transferBy: 'M. Selvam' },
  { id: 'TRF010', date: '2026-06-19', fromStore: 'Main Store', toStore: 'Admin Sub-Store', itemId: 'ITM003', qty: 2, transferBy: 'Dinesh Karthik' }
];

const defaultAdjustments = [
  { id: 'ADJ001', date: '2026-06-15', itemId: 'ITM001', qty: 2, type: 'Physical Difference', remarks: 'Found extra during pre-audit', adjustedBy: 'M. Selvam' },
  { id: 'ADJ002', date: '2026-06-16', itemId: 'ITM003', qty: 1, type: 'Damage', remarks: 'Damaged in storage', adjustedBy: 'Dinesh Kumar' },
  { id: 'ADJ003', date: '2026-06-17', itemId: 'ITM002', qty: 5, type: 'Lost', remarks: 'Misplaced in sub-store', adjustedBy: 'Priya Nair' },
  { id: 'ADJ004', date: '2026-06-17', itemId: 'ITM004', qty: 20, type: 'Physical Difference', remarks: 'Box count correction', adjustedBy: 'Vijay Prasad' },
  { id: 'ADJ005', date: '2026-06-18', itemId: 'ITM005', qty: 2, type: 'Expired', remarks: 'Defective adhesive detected', adjustedBy: 'Karthik Raja' },
  { id: 'ADJ006', date: '2026-06-18', itemId: 'ITM006', qty: 4, type: 'Breakage', remarks: 'Tear in transit inspection', adjustedBy: 'Manoj Patil' },
  { id: 'ADJ007', date: '2026-06-19', itemId: 'ITM007', qty: 3, type: 'Physical Difference', remarks: 'Spillage in storage area', adjustedBy: 'Senthil Balan' },
  { id: 'ADJ008', date: '2026-06-19', itemId: 'ITM001', qty: 5, type: 'Physical Difference', remarks: 'Recount correction', adjustedBy: 'Amit Sharma' },
  { id: 'ADJ009', date: '2026-06-19', itemId: 'ITM002', qty: 10, type: 'Lost', remarks: 'Discrepancy during shift audit', adjustedBy: 'Dinesh Karthik' },
  { id: 'ADJ010', date: '2026-06-19', itemId: 'ITM004', qty: 15, type: 'Damage', remarks: 'Water damage in storage roof leak', adjustedBy: 'M. Selvam' }
];

const defaultVerifications = [
  { id: 'PV001', date: '2026-06-17', verifiedBy: 'Audit Team A', status: 'Completed', items: [{ itemId: 'ITM001', name: 'A4 Paper', systemQty: 45, physicalQty: 45, variance: 0 }, { itemId: 'ITM002', name: 'Ball Pen Blue', systemQty: 15, physicalQty: 14, variance: -1 }] },
  { id: 'PV002', date: '2026-06-17', verifiedBy: 'Audit Team A', status: 'Completed', items: [{ itemId: 'ITM003', name: 'HP Laser Toner', systemQty: 3, physicalQty: 3, variance: 0 }] },
  { id: 'PV003', date: '2026-06-17', verifiedBy: 'Audit Team A', status: 'Completed', items: [{ itemId: 'ITM004', name: 'Carton Box 5-Ply', systemQty: 1200, physicalQty: 1220, variance: 20 }] },
  { id: 'PV004', date: '2026-06-18', verifiedBy: 'Audit Team B', status: 'Completed', items: [{ itemId: 'ITM005', name: 'BOPP Packing Tape', systemQty: 80, physicalQty: 78, variance: -2 }] },
  { id: 'PV005', date: '2026-06-18', verifiedBy: 'Audit Team B', status: 'Completed', items: [{ itemId: 'ITM006', name: 'Safety Gloves', systemQty: 35, physicalQty: 31, variance: -4 }] },
  { id: 'PV006', date: '2026-06-18', verifiedBy: 'Audit Team B', status: 'Completed', items: [{ itemId: 'ITM007', name: 'Floor Cleaner Phenyl', systemQty: 25, physicalQty: 25, variance: 0 }] },
  { id: 'PV007', date: '2026-06-19', verifiedBy: 'Audit Team C', status: 'Completed', items: [{ itemId: 'ITM001', name: 'A4 Paper', systemQty: 45, physicalQty: 50, variance: 5 }] },
  { id: 'PV008', date: '2026-06-19', verifiedBy: 'Audit Team C', status: 'Completed', items: [{ itemId: 'ITM002', name: 'Ball Pen Blue', systemQty: 15, physicalQty: 5, variance: -10 }] },
  { id: 'PV009', date: '2026-06-19', verifiedBy: 'Audit Team C', status: 'Completed', items: [{ itemId: 'ITM004', name: 'Carton Box 5-Ply', systemQty: 1220, physicalQty: 1205, variance: -15 }] },
  { id: 'PV010', date: '2026-06-19', verifiedBy: 'Audit Team C', status: 'Completed', items: [{ itemId: 'ITM006', name: 'Safety Gloves', systemQty: 31, physicalQty: 31, variance: 0 }] }
];

const keys = [
  'consumables_categories',
  'consumables_uoms',
  'consumables_departments',
  'consumables_vendors',
  'consumables_items',
  'consumables_requests',
  'consumables_pos',
  'consumables_grns',
  'consumables_issues',
  'consumables_ledger',
  'consumables_returns',
  'consumables_transfers',
  'consumables_adjustments',
  'consumables_verifications',
  'consumables_quotations',
  'consumables_requisitions'
];

const initializeDb = () => {
  const getOrSet = (key, defaultData) => {
    const val = localStorage.getItem(key);
    const isTransactionKey = [
      'consumables_requests', 'consumables_pos', 'consumables_grns',
      'consumables_issues', 'consumables_returns', 'consumables_transfers',
      'consumables_adjustments', 'consumables_verifications', 'consumables_quotations',
      'consumables_requisitions'
    ].includes(key);

    const needsItemReseed = key === 'consumables_items' && val && !JSON.parse(val).some(i => (i.currentStock || 0) <= i.minStock);

    if (!val || (isTransactionKey && JSON.parse(val).length < 10) || needsItemReseed) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(val);
  };

  getOrSet('consumables_categories', defaultCategories);
  getOrSet('consumables_uoms', defaultUOMs);
  getOrSet('consumables_departments', defaultDepartments);
  getOrSet('consumables_vendors', defaultVendors);
  getOrSet('consumables_items', defaultItems);
  getOrSet('consumables_requests', defaultRequests);
  getOrSet('consumables_pos', defaultPOs);
  getOrSet('consumables_grns', defaultGRNs);
  getOrSet('consumables_issues', defaultIssues);
  getOrSet('consumables_ledger', defaultLedger);
  getOrSet('consumables_quotations', defaultQuotations);
  getOrSet('consumables_requisitions', defaultRequisitions);
  getOrSet('consumables_returns', defaultReturns);
  getOrSet('consumables_transfers', defaultTransfers);
  getOrSet('consumables_adjustments', defaultAdjustments);
  getOrSet('consumables_verifications', defaultVerifications);
};

initializeDb();

let lastSyncTime = 0;
const syncFromBackend = async () => {
  const now = Date.now();
  if (now - lastSyncTime < 5000) return; // Limit background sync checks
  lastSyncTime = now;
  try {
    let changed = false;
    for (const key of keys) {
      const res = await api.get(`/stationary/${key}`);
      if (res.data && res.data.length > 0) {
        const localVal = localStorage.getItem(key);
        const remoteVal = JSON.stringify(res.data);
        if (localVal !== remoteVal) {
          localStorage.setItem(key, remoteVal);
          changed = true;
        }
      } else {
        const localData = JSON.parse(localStorage.getItem(key) || '[]');
        if (localData.length > 0) {
          await api.post(`/stationary/${key}/bulk`, { items: localData });
        }
      }
    }
    if (changed) {
      window.dispatchEvent(new Event('mockdb-update'));
    }
  } catch (err) {
    console.error("Failed to sync stationary from backend:", err);
  }
};

// Start background sync on script load
setTimeout(syncFromBackend, 200);

export const mockDb = {
  get: (key) => {
    setTimeout(syncFromBackend, 0);
    return JSON.parse(localStorage.getItem(key) || '[]');
  },
  
  set: (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('mockdb-update'));
    api.post(`/stationary/${key}/bulk`, { items: data }).catch(err => {
      console.error(`Failed to bulk save ${key}:`, err);
    });
  },
  
  add: (key, item) => {
    const data = mockDb.get(key);
    data.push(item);
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('mockdb-update'));
    api.post(`/stationary/${key}`, item).catch(err => {
      console.error(`Failed to add item to ${key}:`, err);
    });
    return item;
  },

  update: (key, id, updatedItem) => {
    const data = mockDb.get(key);
    const index = data.findIndex(x => x.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updatedItem };
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new Event('mockdb-update'));
      api.put(`/stationary/${key}/${id}`, data[index]).catch(err => {
        console.error(`Failed to update item ${id} in ${key}:`, err);
      });
    }
  },

  delete: (key, id) => {
    const data = mockDb.get(key);
    const filtered = data.filter(x => x.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    window.dispatchEvent(new Event('mockdb-update'));
    api.delete(`/stationary/${key}/${id}`).catch(err => {
      console.error(`Failed to delete item ${id} in ${key}:`, err);
    });
  },

  // Stock Ledger Helper
  postToLedger: (itemId, refType, refId, qty, type) => {
    const items = mockDb.get('consumables_items');
    const ledger = mockDb.get('consumables_ledger');
    const itemIndex = items.findIndex(x => x.id === itemId);

    if (itemIndex !== -1) {
      let current = items[itemIndex].currentStock || 0;
      let inQty = 0;
      let outQty = 0;

      if (type === 'IN') {
        inQty = qty;
        current += qty;
      } else if (type === 'OUT') {
        outQty = qty;
        current -= qty;
      }

      items[itemIndex].currentStock = current;
      localStorage.setItem('consumables_items', JSON.stringify(items));
      api.post('/stationary/consumables_items/bulk', { items }).catch(err => console.error(err));

      const newLedgerEntry = {
        id: 'LED' + Math.floor(Math.random() * 1000000),
        date: new Date().toISOString().split('T')[0],
        itemId,
        refType,
        refId,
        inQty,
        outQty,
        balance: current
      };
      ledger.push(newLedgerEntry);
      localStorage.setItem('consumables_ledger', JSON.stringify(ledger));
      window.dispatchEvent(new Event('mockdb-update'));
      api.post('/stationary/consumables_ledger', newLedgerEntry).catch(err => console.error(err));
    }
  }
};
