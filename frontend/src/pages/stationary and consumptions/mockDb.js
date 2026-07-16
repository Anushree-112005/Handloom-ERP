import api from '../../services/api';

// Mock Database and Helper Functions for Stationery & Consumables Management
const defaultCategories = [
  { id: 1, category_code: 'CAT-CHEM', category_name: 'Chemicals & Dyes', description: 'Various dyes and chemical processing agents', status: 'Active' },
  { id: 2, category_code: 'CAT-SPRS', category_name: 'Spare Parts', description: 'Machinery replacement parts and tools', status: 'Active' },
  { id: 3, category_code: 'CAT-STAT', category_name: 'Stationery', description: 'Office and administrative supplies', status: 'Active' }
];

const defaultUOMs = [
  { id: 1, uom_code: 'KGS', uom_name: 'Kilograms', symbol: 'kg', status: 'Active' },
  { id: 2, uom_code: 'PCS', uom_name: 'Pieces', symbol: 'pcs', status: 'Active' },
  { id: 3, uom_code: 'LTR', uom_name: 'Liters', symbol: 'L', status: 'Active' }
];

const defaultDepartments = [
  { id: 1, department_code: 'DPT-PRD', department_name: 'Production', head: 'John Doe', status: 'Active' },
  { id: 2, department_code: 'DPT-MNT', department_name: 'Maintenance', head: 'Jane Smith', status: 'Active' },
  { id: 3, department_code: 'DPT-ADM', department_name: 'Administration', head: 'Alice Johnson', status: 'Active' }
];

const defaultVendors = [
  { id: 1, vendor_code: 'VND-C01', vendor_name: 'Apex Chemical Industries', contact_person: 'Rahul Sharma', email: 'rahul@apexchemicals.com', phone: '9876543210', status: 'Active' },
  { id: 2, vendor_code: 'VND-S01', vendor_name: 'Global Spares Hub', contact_person: 'Vikram Singh', email: 'sales@globalspares.com', phone: '9876543211', status: 'Active' },
  { id: 3, vendor_code: 'VND-P01', vendor_name: 'Prime Stationers', contact_person: 'Amit Kumar', email: 'info@primestationers.com', phone: '9876543212', status: 'Active' }
];

const defaultItems = [
  { id: 1, item_code: 'ITM-C01', item_name: 'Reactive Red Dye RC', category_id: 1, uom_id: 1, vendor_id: 1, department_id: 1, minimum_stock: 50, maximum_stock: 500, current_stock: 150, reorder_level: 60, purchase_price: 500, status: 'Active', category_name: 'Chemicals & Dyes', uom_name: 'Kilograms', department_name: 'Production', vendor_name: 'Apex Chemical Industries' },
  { id: 2, item_code: 'ITM-S01', item_name: 'Loom Bearing 6204', category_id: 2, uom_id: 2, vendor_id: 2, department_id: 2, minimum_stock: 10, maximum_stock: 100, current_stock: 25, reorder_level: 15, purchase_price: 150, status: 'Active', category_name: 'Spare Parts', uom_name: 'Pieces', department_name: 'Maintenance', vendor_name: 'Global Spares Hub' },
  { id: 3, item_code: 'ITM-P01', item_name: 'A4 Copier Paper Ream', category_id: 3, uom_id: 2, vendor_id: 3, department_id: 3, minimum_stock: 20, maximum_stock: 200, current_stock: 80, reorder_level: 30, purchase_price: 250, status: 'Active', category_name: 'Stationery', uom_name: 'Pieces', department_name: 'Administration', vendor_name: 'Prime Stationers' }
];

const defaultRequests = [
  { id: 1, request_no: 'REQ-2310-001', request_date: '2026-07-10', department_id: 1, department_name: 'Production', priority: 'High', status: 'Pending', remarks: 'Urgent for new batch', items: [{ item_id: 1, item_name: 'Reactive Red Dye RC', uom: 'Kilograms', quantity: 20 }] }
];
const defaultPOs = [
  { id: 1, po_no: 'PO-2310-001', po_date: '2026-07-11', vendor_id: 1, vendor_name: 'Apex Chemical Industries', total_amount: 10000, status: 'Approved', items: [{ item_id: 1, item_name: 'Reactive Red Dye RC', uom: 'Kilograms', quantity: 20, unit_price: 500, total: 10000 }] }
];
const defaultGRNs = [
  { id: 1, grn_no: 'GRN-2310-001', grn_date: '2026-07-12', po_no: 'PO-2310-001', vendor_name: 'Apex Chemical Industries', status: 'Received', items: [{ item_id: 1, item_name: 'Reactive Red Dye RC', uom: 'Kilograms', order_qty: 20, receive_qty: 20 }] }
];
const defaultIssues = [
  { id: 1, issue_no: 'ISS-2310-001', issue_date: '2026-07-13', department_id: 1, department_name: 'Production', request_no: 'REQ-2310-001', status: 'Issued', items: [{ item_id: 1, item_name: 'Reactive Red Dye RC', uom: 'Kilograms', quantity: 10 }] }
];
const defaultLedger = [
  { id: 1, date: '2026-07-12', itemId: 1, refType: 'GRN', refId: 'GRN-2310-001', inQty: 20, outQty: 0, balance: 170 },
  { id: 2, date: '2026-07-13', itemId: 1, refType: 'ISSUE', refId: 'ISS-2310-001', inQty: 0, outQty: 10, balance: 160 }
];
const defaultQuotations = [];
const defaultRequisitions = [];
const defaultReturns = [];
const defaultTransfers = [];
const defaultAdjustments = [];
const defaultVerifications = [];
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
  const mockPrefixes = ['CAT00', 'UOM00', 'DEP00', 'VEN00', 'ITM00', 'REQ00', 'PO00', 'GRN00', 'ISS00', 'LED00', 'QTN00', 'PRQ00', 'RET00', 'TRF00', 'ADJ00', 'PV00'];
  for (const key of keys) {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.some(item => {
          const itemId = String(item.id || item.itemId || '');
          return mockPrefixes.some(p => itemId.startsWith(p));
        })) {
          localStorage.removeItem(key);
        }
      } catch (e) {}
    }
  }

  const getOrSet = (key, defaultData) => {
    const val = localStorage.getItem(key);
    if (!val) {
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

const normalizeArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(obj => {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = {};
    const keys = Object.keys(obj).filter(k => k !== 'category').sort();
    for (const k of keys) {
      clean[k] = obj[k];
    }
    return clean;
  });
};

let lastSyncTime = 0;
const syncFromBackend = async () => {
  const now = Date.now();
  if (now - lastSyncTime < 5000) return; // Limit background sync checks
  lastSyncTime = now;
  try {
    let changed = false;
    for (const key of keys) {
      const res = await api.get(`/stationary/${key}`);
      if (res.data) {
        const localVal = localStorage.getItem(key);
        const localParsed = JSON.parse(localVal || '[]');
        const normLocal = normalizeArray(localParsed);
        const normRemote = normalizeArray(res.data);
        if (JSON.stringify(normLocal) !== JSON.stringify(normRemote)) {
          localStorage.setItem(key, JSON.stringify(res.data));
          changed = true;
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
