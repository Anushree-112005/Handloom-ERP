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
  { id: 'ITM002', name: 'Ball Pen Blue', code: 'BPB', category: 'Office Stationery', uom: 'Box', minStock: 10, maxStock: 50, safetyStock: 5, currentStock: 15, rate: 150, vendor: 'Metro Stationery Hub' },
  { id: 'ITM003', name: 'HP Laser Toner', code: 'HPT', category: 'Printing Consumables', uom: 'Nos', minStock: 2, maxStock: 10, safetyStock: 1, currentStock: 3, rate: 3200, vendor: 'Apex Supplies Ltd' },
  { id: 'ITM004', name: 'Carton Box 5-Ply', code: 'CB5', category: 'Packing Materials', uom: 'Nos', minStock: 500, maxStock: 5000, safetyStock: 100, currentStock: 1200, rate: 45, vendor: 'Prime Packers' },
  { id: 'ITM005', name: 'BOPP Packing Tape 2"', code: 'BOP', category: 'Packing Materials', uom: 'Roll', minStock: 50, maxStock: 500, safetyStock: 10, currentStock: 80, rate: 65, vendor: 'Prime Packers' },
  { id: 'ITM006', name: 'Safety Gloves Latex', code: 'SGL', category: 'Safety Items', uom: 'Box', minStock: 15, maxStock: 100, safetyStock: 5, currentStock: 35, rate: 450, vendor: 'SafeWork Safety Goods' },
  { id: 'ITM007', name: 'Floor Cleaner Phenyl', code: 'FCP', category: 'Housekeeping', uom: 'Litre', minStock: 10, maxStock: 50, safetyStock: 2, currentStock: 25, rate: 85, vendor: 'Apex Supplies Ltd' }
];

const defaultRequests = [
  { id: 'REQ001', date: '2026-06-10', department: 'HR & Admin', requestedBy: 'Dinesh Kumar', priority: 'Medium', status: 'Approved', remarks: 'For new joiners setup', items: [{ itemId: 'ITM001', qty: 5, approvedQty: 5 }, { itemId: 'ITM002', qty: 2, approvedQty: 2 }] },
  { id: 'REQ002', date: '2026-06-12', department: 'Production', requestedBy: 'M. Selvam', priority: 'High', status: 'Pending', remarks: 'Urgent packing material replenishment', items: [{ itemId: 'ITM004', qty: 500, approvedQty: 0 }] }
];

const defaultPOs = [
  { id: 'PO001', date: '2026-06-08', vendor: 'Prime Packers', paymentTerms: '30 Days Credit', expectedDate: '2026-06-15', status: 'Ordered', items: [{ itemId: 'ITM004', qty: 1000, rate: 45, total: 45000 }] }
];

const defaultGRNs = [
  { id: 'GRN001', date: '2026-06-09', vendor: 'Prime Packers', poId: 'PO001', invoiceNo: 'INV-9921', status: 'Accepted', items: [{ itemId: 'ITM004', orderedQty: 1000, receivedQty: 1000, acceptedQty: 1000, rejectedQty: 0, rate: 45 }] }
];

const defaultIssues = [
  { id: 'ISS001', date: '2026-06-11', department: 'HR & Admin', employee: 'Dinesh Kumar', purpose: 'Office Stationery Setup', items: [{ itemId: 'ITM001', qty: 3, rate: 280 }, { itemId: 'ITM002', qty: 1, rate: 150 }] }
];

const defaultLedger = [
  { id: 'LED001', date: '2026-06-01', itemId: 'ITM001', refType: 'Opening', refId: '-', inQty: 48, outQty: 0, balance: 48 },
  { id: 'LED002', date: '2026-06-11', itemId: 'ITM001', refType: 'Issue', refId: 'ISS001', inQty: 0, outQty: 3, balance: 45 }
];

const defaultQuotations = [
  { id: 'QTN001', date: '2026-06-05', vendor: 'Apex Supplies Ltd', validityDate: '2026-07-05', paymentTerms: '30 Days Credit', status: 'Approved', items: [{ itemId: 'ITM001', qty: 10, rate: 270, total: 2700 }], quotation_file_path: '' }
];

const defaultRequisitions = [
  { id: 'PRQ001', date: '2026-06-11', requestedBy: 'M. Selvam', status: 'Pending', items: [{ itemId: 'ITM004', qty: 200, currentStock: 1200, minStock: 500 }] },
  { id: 'PRQ002', date: '2026-06-12', requestedBy: 'Dinesh Kumar', status: 'Approved', items: [{ itemId: 'ITM001', qty: 50, currentStock: 45, minStock: 20 }] }
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
  getOrSet('consumables_returns', []);
  getOrSet('consumables_transfers', []);
  getOrSet('consumables_adjustments', []);
  getOrSet('consumables_verifications', []);
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
