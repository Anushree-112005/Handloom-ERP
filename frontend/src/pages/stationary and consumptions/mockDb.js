import api from '../../services/api';

// Mock Database and Helper Functions for Stationery & Consumables Management
const defaultCategories = [
  { id: 1, name: 'Stationery' },
  { id: 2, name: 'Office Supplies' },
  { id: 3, name: 'Packaging' }
];
const defaultUOMs = [
  { id: 1, name: 'Nos' },
  { id: 2, name: 'Pack' },
  { id: 3, name: 'Box' }
];
const defaultDepartments = [
  { id: 1, department_name: 'Stores' },
  { id: 2, department_name: 'Production' },
  { id: 3, department_name: 'Administration' }
];
const defaultVendors = [
  { id: 1, vendor_name: 'ABC Stationery Supplies' },
  { id: 2, vendor_name: 'Office Essentials Pvt Ltd' }
];
const defaultItems = [
  {
    id: 1,
    code: 'ITM100',
    item_name: 'Ballpoint Pen',
    category: 'Stationery',
    uom: 'Nos',
    currentStock: 320,
    rate: 5,
    minStock: 30,
    maxStock: 500,
    category_id: 1,
    uom_id: 1
  },
  {
    id: 2,
    code: 'ITM101',
    item_name: 'A4 Paper Ream',
    category: 'Stationery',
    uom: 'Pack',
    currentStock: 85,
    rate: 280,
    minStock: 20,
    maxStock: 200,
    category_id: 1,
    uom_id: 2
  },
  {
    id: 3,
    code: 'ITM102',
    item_name: 'Notebook',
    category: 'Office Supplies',
    uom: 'Nos',
    currentStock: 125,
    rate: 55,
    minStock: 40,
    maxStock: 250,
    category_id: 2,
    uom_id: 1
  }
];
const defaultRequests = [
  { id: 'REQ001', date: '2026-07-20', department: 'Stores', requestedBy: 'Ravi Kumar', status: 'Pending' },
  { id: 'REQ002', date: '2026-07-18', department: 'Production', requestedBy: 'Meena R.', status: 'Approved' }
];
const defaultPOs = [
  { id: 'PO001', date: '2026-07-17', vendor: 'ABC Stationery Supplies', items: [{ total: 900 }], status: 'Ordered' },
  { id: 'PO002', date: '2026-07-15', vendor: 'Office Essentials Pvt Ltd', items: [{ total: 240 }], status: 'Approved' }
];
const defaultGRNs = [
  { id: 'GRN001', date: '2026-07-18', vendor: 'ABC Stationery Supplies', status: 'Received' }
];
const defaultIssues = [
  { id: 'ISS001', date: '2026-07-19', department: 'Stores', employee: 'Suresh Kumar', status: 'Pending', purpose: 'Daily issue for stationery' },
  { id: 'ISS002', date: '2026-07-16', department: 'Production', employee: 'Anita Sharma', status: 'Approved', purpose: 'Production department issue' }
];
const defaultLedger = [];
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
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(key, JSON.stringify(defaultData));
        return defaultData;
      }
      return parsed;
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
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
