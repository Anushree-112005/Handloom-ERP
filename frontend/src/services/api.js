import axios from 'axios';

export const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const createAPI = (endpoint) => ({
  list: (params) => api.get(endpoint + '/', { params }),
  get: (id) => api.get(`${endpoint}/${id}`),
  create: (data) => api.post(endpoint + '/', data),
  update: (id, data) => api.put(`${endpoint}/${id}`, data),
  delete: (id) => api.delete(`${endpoint}/${id}`),
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const notificationAPI = createAPI('/notifications');
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: () => api.get('/auth/me'),
};

// ---- Dashboard ----
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  stats: (params) => api.get('/dashboard/stats', { params }),
};

// ---- Party Master ----
export const partyAPI = {
  list: (params) => api.get('/parties/', { params }),
  get: (id) => api.get(`/parties/${id}`),
  create: (data) => api.post('/parties/', data),
  update: (id, data) => api.put(`/parties/${id}`, data),
  delete: (id) => api.delete(`/parties/${id}`),
  summary: () => api.get('/parties/stats/summary'),
};

export const buyerOrderAPI = {
  list: (params) => api.get('/buyer-orders/', { params }),
  statusUpdateOrders: () => api.get('/buyer-orders/status-update/orders'),
  getStatus: (id) => api.get(`/buyer-orders/${id}/status`),
  updateStatus: (id, data) => api.post(`/buyer-orders/${id}/status`, data),
  get: (id) => api.get(`/buyer-orders/${id}`),
  create: (data) => api.post('/buyer-orders/', data),
  update: (id, data) => api.put(`/buyer-orders/${id}`, data),
  delete: (id) => api.delete(`/buyer-orders/${id}`),
  uploadFile: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/buyer-orders/upload-file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Schedules
  listSchedules: () => api.get('/buyer-orders/schedules/'),
  createSchedule: (data) => api.post('/buyer-orders/schedules/', data),
  updateSchedule: (id, data) => api.put(`/buyer-orders/schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`/buyer-orders/schedules/${id}`),

  // Sequences
  listSequences: () => api.get('/buyer-orders/sequences/'),
  createSequence: (data) => api.post('/buyer-orders/sequences/', data),
  updateSequence: (id, data) => api.put(`/buyer-orders/sequences/${id}`, data),
  deleteSequence: (id) => api.delete(`/buyer-orders/sequences/${id}`),

  // Amendments
  listAmendments: () => api.get('/buyer-orders/amendments/'),
  createAmendment: (data) => api.post('/buyer-orders/amendments/', data),
  updateAmendment: (id, data) => api.put(`/buyer-orders/amendments/${id}`, data),
  deleteAmendment: (id) => api.delete(`/buyer-orders/amendments/${id}`),

  // Completions
  listCompletions: () => api.get('/buyer-orders/completions/'),
  createCompletion: (data) => api.post('/buyer-orders/completions/', data),
  updateCompletion: (id, data) => api.put(`/buyer-orders/completions/${id}`, data),
  deleteCompletion: (id) => api.delete(`/buyer-orders/completions/${id}`),

  // Dispatches
  listDispatches: () => api.get('/buyer-orders/dispatches/'),
  createDispatch: (data) => api.post('/buyer-orders/dispatches/', data),
  updateDispatch: (id, data) => api.put(`/buyer-orders/dispatches/${id}`, data),
  deleteDispatch: (id) => api.delete(`/buyer-orders/dispatches/${id}`),

  // Expenses
  listExpenses: () => api.get('/buyer-orders/expenses/'),
  createExpense: (data) => api.post('/buyer-orders/expenses/', data),
  updateExpense: (id, data) => api.put(`/buyer-orders/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/buyer-orders/expenses/${id}`)
};

export const designEntryAPI = {
  list: (params) => api.get('/design-entries/', { params }),
  get: (id) => api.get(`/design-entries/${id}`),
  create: (data) => api.post('/design-entries/', data),
  update: (id, data) => api.put(`/design-entries/${id}`, data),
  delete: (id) => api.delete(`/design-entries/${id}`),
  approve: (id) => api.put(`/design-entries/${id}/approve`),
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/design-entries/${id}/upload-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  extractDesign: (files) => {
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append('files', files[i]);
    }
    return api.post('/design-entries/extract-design', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ---- AI Textile Design ----
export const textileDesignAPI = {
  list: (params) => api.get('/textile-designs/', { params }),
  get: (id) => api.get(`/textile-designs/${id}`),
  create: (data) => api.post('/textile-designs/', data),
  update: (id, data) => api.put(`/textile-designs/${id}`, data),
  delete: (id) => api.delete(`/textile-designs/${id}`),
  uploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/textile-designs/${id}/upload-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  analyze: (id) => api.post(`/textile-designs/${id}/analyze`),
  analyzeImageOnly: (file, numColors = 'auto') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('num_colors', String(numColors));
    return api.post('/design-ai/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  calculateRequirement: (id) => api.post(`/textile-designs/${id}/calculate-requirement`),
  updateStatus: (id, status) => api.patch(`/textile-designs/${id}/status`, null, { params: { status } }),
  generatePdf: (payload) => api.post('/design-ai/generate-pdf', payload, { responseType: 'blob' }),
};

export const yarnPurchaseOrderAPI = {
  list: () => api.get('/yarn-purchase-orders'),
  get: (id) => api.get(`/yarn-purchase-orders/${id}`),
  create: (data) => api.post('/yarn-purchase-orders', data),
  update: (id, data) => api.put(`/yarn-purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/yarn-purchase-orders/${id}`)
};

export const twistingDoublingPOAPI = {
  list: () => api.get('/purchase/twisting-doubling'),
  create: (data) => api.post('/purchase/twisting-doubling', data),
  getById: (id) => api.get(`/purchase/twisting-doubling/${id}`),
  update: (id, data) => api.put(`/purchase/twisting-doubling/${id}`, data),
  delete: (id) => api.delete(`/purchase/twisting-doubling/${id}`)
};

export const yarnDyeingPOAPI = {
  list: () => api.get('/yarn-dyeing-po/'),
  create: (data) => api.post('/yarn-dyeing-po/', data),
  getById: (id) => api.get(`/yarn-dyeing-po/${id}`),
  update: (id, data) => api.put(`/yarn-dyeing-po/${id}`, data),
  delete: (id) => api.delete(`/yarn-dyeing-po/${id}`)
};

export const fabricDyeingPOAPI = {
  list: () => api.get('/fabric-dyeing-po/'),
  create: (data) => api.post('/fabric-dyeing-po/', data),
  getById: (id) => api.get(`/fabric-dyeing-po/${id}`),
  update: (id, data) => api.put(`/fabric-dyeing-po/${id}`, data),
  delete: (id) => api.delete(`/fabric-dyeing-po/${id}`)
};

export const warpingSizingPOAPI = {
  list: () => api.get('/warping-sizing-po'),
  create: (data) => api.post('/warping-sizing-po', data),
  getById: (id) => api.get(`/warping-sizing-po/${id}`),
  update: (id, data) => api.put(`/warping-sizing-po/${id}`, data),
  delete: (id) => api.delete(`/warping-sizing-po/${id}`)
};

export const weavingPOAPI = {
  list: () => api.get('/weaving-po'),
  create: (data) => api.post('/weaving-po', data),
  getById: (id) => api.get(`/weaving-po/${id}`),
  update: (id, data) => api.put(`/weaving-po/${id}`, data),
  delete: (id) => api.delete(`/weaving-po/${id}`)
};

export const processingPOAPI = {
  list: () => api.get('/processing-po'),
  create: (data) => api.post('/processing-po', data),
  getById: (id) => api.get(`/processing-po/${id}`),
  update: (id, data) => api.put(`/processing-po/${id}`, data),
  delete: (id) => api.delete(`/processing-po/${id}`)
};

export const clothPurchasePOAPI = {
  list: () => api.get('/cloth-purchase-po'),
  create: (data) => api.post('/cloth-purchase-po', data),
  getById: (id) => api.get(`/cloth-purchase-po/${id}`),
  update: (id, data) => api.put(`/cloth-purchase-po/${id}`, data),
  delete: (id) => api.delete(`/cloth-purchase-po/${id}`)
};

export const genericPurchaseOrderAPI = {
  list: (poType) => api.get(`/generic-po${poType ? `?po_type=${poType}` : ''}`),
  get: (id) => api.get(`/generic-po/${id}`),
  create: (data) => api.post('/generic-po', data),
  delete: (id) => api.delete(`/generic-po/${id}`)
};

export const yarnInwardAPI = {
  list: (params) => api.get('/yarn-inwards/', { params }),
  get: (id) => api.get(`/yarn-inwards/${id}`),
  create: (data) => api.post('/yarn-inwards/', data),
  update: (id, data) => api.put(`/yarn-inwards/${id}`, data),
  delete: (id) => api.delete(`/yarn-inwards/${id}`),
  confirm: (id) => api.post(`/yarn-inwards/${id}/confirm`),
};

export const greyYarnDeliveryAPI = {
  list: () => api.get('/grey-yarn-deliveries'),
  get: (id) => api.get(`/grey-yarn-deliveries/${id}`),
  create: (data) => api.post('/grey-yarn-deliveries', data),
  update: (id, data) => api.put(`/grey-yarn-deliveries/${id}`, data),
  delete: (id) => api.delete(`/grey-yarn-deliveries/${id}`)
};

export const dyedYarnReceiptAPI = {
  list: () => api.get('/dyed-yarn-receipts'),
  get: (id) => api.get(`/dyed-yarn-receipts/${id}`),
  create: (data) => api.post('/dyed-yarn-receipts', data),
  update: (id, data) => api.put(`/dyed-yarn-receipts/${id}`, data),
  delete: (id) => api.delete(`/dyed-yarn-receipts/${id}`)
};

export const dyedYarnDeliveryAPI = {
  list: () => api.get('/dyed-yarn-deliveries'),
  get: (id) => api.get(`/dyed-yarn-deliveries/${id}`),
  create: (data) => api.post('/dyed-yarn-deliveries', data),
  update: (id, data) => api.put(`/dyed-yarn-deliveries/${id}`, data),
  delete: (id) => api.delete(`/dyed-yarn-deliveries/${id}`)
};

export const warpBeamReceiptAPI = {
  list: () => api.get('/warp-beam-receipts'),
  get: (id) => api.get(`/warp-beam-receipts/${id}`),
  create: (data) => api.post('/warp-beam-receipts', data),
  update: (id, data) => api.put(`/warp-beam-receipts/${id}`, data),
  delete: (id) => api.delete(`/warp-beam-receipts/${id}`)
};

export const warpDeliveryAPI = {
  list: () => api.get('/warp-deliveries'),
  get: (id) => api.get(`/warp-deliveries/${id}`),
  create: (data) => api.post('/warp-deliveries', data),
  update: (id, data) => api.put(`/warp-deliveries/${id}`, data),
  delete: (id) => api.delete(`/warp-deliveries/${id}`)
};

// ---- Dropdowns ----
export const dropdownAPI = {
  getAll: () => api.get('/dropdowns/'),
};

// ---- Employees ----
export const employeeAPI = {
  list: (params) => api.get('/employees/', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees/', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// ---- Despatch Planning ----
export const despatchAPI = {
  list: (params) => api.get('/despatch-planning/', { params }),
  get: (id) => api.get(`/despatch-planning/${id}`),
  create: (data) => api.post('/despatch-planning/', data),
  update: (id, data) => api.put(`/despatch-planning/${id}`, data),
  delete: (id) => api.delete(`/despatch-planning/${id}`),
};

// ---- Sales Invoice ----
export const salesInvoiceAPI = {
  list: (params) => api.get('/sales-invoices/', { params }),
  get: (id) => api.get(`/sales-invoices/${id}`),
  create: (data) => api.post('/sales-invoices/', data),
  update: (id, data) => api.put(`/sales-invoices/${id}`, data),
  delete: (id) => api.delete(`/sales-invoices/${id}`),
  exportTallyXml: (invoiceIds) => api.get('/sales-invoices/export-tally-xml/', { params: { invoice_ids: invoiceIds }, responseType: 'blob' }),
  generateEwayBillJson: (id) => api.get(`/sales-invoices/${id}/eway-bill-json`),
};

// ---- Goods Release ----
export const goodsReleaseAPI = {
  list: (params) => api.get('/goods-releases/', { params }),
  get: (id) => api.get(`/goods-releases/${id}`),
  create: (data) => api.post('/goods-releases/', data),
  update: (id, data) => api.put(`/goods-releases/${id}`, data),
  delete: (id) => api.delete(`/goods-releases/${id}`),
};

// ---- Packing Slip ----
export const packingSlipAPI = {
  list: (params) => api.get('/packing-slips/', { params }),
  get: (id) => api.get(`/packing-slips/${id}`),
  create: (data) => api.post('/packing-slips/', data),
  update: (id, data) => api.put(`/packing-slips/${id}`, data),
  delete: (id) => api.delete(`/packing-slips/${id}`),
};

// ---- Finished Fabric Inward ----
export const finishedFabricAPI = {
  list: (params) => api.get('/finished-fabrics/', { params }),
  get: (id) => api.get(`/finished-fabrics/${id}`),
  create: (data) => api.post('/finished-fabrics/', data),
  update: (id, data) => api.put(`/finished-fabrics/${id}`, data),
  delete: (id) => api.delete(`/finished-fabrics/${id}`),
};

// ---- Cloth Delivery ----
export const clothDeliveryAPI = {
  list: (params) => api.get('/cloth-deliveries/', { params }),
  get: (id) => api.get(`/cloth-deliveries/${id}`),
  create: (data) => api.post('/cloth-deliveries/', data),
  update: (id, data) => api.put(`/cloth-deliveries/${id}`, data),
  delete: (id) => api.delete(`/cloth-deliveries/${id}`),
};

// ---- On-Table Checking ----
export const onTableCheckingAPI = {
  list: (params) => api.get('/on-table-checking/', { params }),
  get: (id) => api.get(`/on-table-checking/${id}`),
  create: (data) => api.post('/on-table-checking/', data),
  update: (id, data) => api.put(`/on-table-checking/${id}`, data),
  delete: (id) => api.delete(`/on-table-checking/${id}`),
};

// ---- Cloth Inward ----
export const clothInwardAPI = {
  list: (params) => api.get('/cloth-inwards/', { params }),
  get: (id) => api.get(`/cloth-inwards/${id}`),
  create: (data) => api.post('/cloth-inwards/', data),
  update: (id, data) => api.put(`/cloth-inwards/${id}`, data),
  delete: (id) => api.delete(`/cloth-inwards/${id}`),
};

// ---- Log Reports ----
export const logReportAPI = {
  list: (params) => api.get('/log-reports/', { params }),
  create: (data) => api.post('/log-reports/', data),
  delete: (id) => api.delete(`/log-reports/${id}`),
};

// ---- E-Way Bills ----
export const ewayBillAPI = {
  list: (params) => api.get('/eway-bills/', { params }),
  get: (id) => api.get(`/eway-bills/${id}`),
  create: (data) => api.post('/eway-bills/', data),
  update: (id, data) => api.put(`/eway-bills/${id}`, data),
  delete: (id) => api.delete(`/eway-bills/${id}`),
};

// ---- Company Settings ----
export const companySettingAPI = {
  get: () => api.get('/company-settings/'),
  save: (data) => api.post('/company-settings/', data),
};

// ---- Work Order Transactions ----
export const workOrderTransactionAPI = {
  list: (params) => api.get('/work-order-transactions/', { params }),
  getAll: () => api.get('/work-order-transactions/'),
  get: (id) => api.get(`/work-order-transactions/${id}`),
  create: (data) => api.post('/work-order-transactions/', data),
  update: (id, data) => api.put(`/work-order-transactions/${id}`, data),
  delete: (id) => api.delete(`/work-order-transactions/${id}`),
};

// ---- Sub Masters (Dynamic/Generic) ----
export const subMasterAPI = {
  list: (entity, params) => api.get(`/sub-masters/${entity}`, { params }),
  stats: (entity) => api.get(`/sub-masters/${entity}/stats`),
  create: (entity, data) => api.post(`/sub-masters/${entity}`, data),
  update: (entity, id, data) => api.put(`/sub-masters/${entity}/${id}`, data),
  delete: (entity, id) => api.delete(`/sub-masters/${entity}/${id}`),
  listEntities: () => api.get('/sub-masters/'),
  // Bulk-upsert AI-detected colors into color_master (skips existing names)
  syncColors: (colors) => api.post('/sub-masters/color_master/sync-colors', { colors }),
};

export const warehouseAPI = {
  getGodowns: () => api.get('/warehouse/godowns'),
  createGodown: (data) => api.post('/warehouse/godowns', data),
  updateGodown: (id, data) => api.put(`/warehouse/godowns/${id}`, data),
  deleteGodown: (id) => api.delete(`/warehouse/godowns/${id}`)
};

export const warehouseInwardOutwardAPI = {
  getStaging: () => api.get('/warehouse/staging'),
  createStaging: (data) => api.post('/warehouse/staging', data),
  getPutAway: () => api.get('/warehouse/put-away'),
  createPutAway: (data) => api.post('/warehouse/put-away', data),
  getPickList: () => api.get('/warehouse/pick-list'),
  createPickList: (data) => api.post('/warehouse/pick-list', data)
};

export const storeDashboardAPI = {
  getMetrics: () => api.get('/stores-consumables/dashboard/stats')
};


// ---- PPC ----
export const ppcAPI = {
  getLooms: () => api.get('/ppc/looms'),
  createLoom: (data) => api.post('/ppc/looms', data),
  updateLoom: (id, data) => api.put(`/ppc/looms/${id}`, data),
  deleteLoom: (id) => api.delete(`/ppc/looms/${id}`),
  updateLoomStatus: (id, status) => api.put(`/ppc/looms/${id}/status`, null, { params: { status } }),
  getAllocations: () => api.get('/ppc/allocations'),
  createAllocation: (data) => api.post('/ppc/allocations', data),
  updateAllocation: (id, data) => api.put(`/ppc/allocations/${id}`, data),
  deleteAllocation: (id) => api.delete(`/ppc/allocations/${id}`),
  logProduction: (data) => api.post('/ppc/logs', data),
  getOperators: () => api.get('/ppc/operators'),
  createOperator: (data) => api.post('/ppc/operators', data),
  updateOperator: (id, data) => api.put(`/ppc/operators/${id}`, data),
  deleteOperator: (id) => api.delete(`/ppc/operators/${id}`),
  getDashboard: () => api.get('/ppc/dashboard'),
  getDailyEntries: () => api.get('/ppc/daily-entries'),
  getEta: () => api.get('/ppc/eta'),
  getEfficiency: () => api.get('/ppc/efficiency'),
  getBreakdowns: () => api.get('/ppc/breakdowns'),
  logBreakdown: (data) => api.post('/ppc/breakdowns', data),
};

export const ppcWarpDeliveryAPI = {
  list: () => api.get('/ppc/warping-deliveries/'),
  create: (data) => api.post('/ppc/warping-deliveries/', data),
  getById: (id) => api.get(`/ppc/warping-deliveries/${id}`),
  update: (id, data) => api.put(`/ppc/warping-deliveries/${id}`, data),
  delete: (id) => api.delete(`/ppc/warping-deliveries/${id}`)
};

// ---- Calendar Events ----
export const calendarEventAPI = {
  list: (params) => api.get('/calendar-events/', { params }),
  create: (data) => api.post('/calendar-events/', data),
};

export const costingSheetAPI = {
  list: (params) => api.get('/costing-sheet/', { params }),
  getById: (id) => api.get(`/costing-sheet/${id}`),
  create: (data) => api.post('/costing-sheet/', data),
  update: (id, data) => api.put(`/costing-sheet/${id}`, data),
  delete: (id) => api.delete(`/costing-sheet/${id}`)
};

export const stockSheetAPI = {
  list: (params) => api.get('/stock-sheet/', { params }),
  create: (data) => api.post('/stock-sheet/', data),
};

export const rackAPI = {
  list: (params) => api.get('/racks/', { params }),
  get: (id) => api.get(`/racks/${id}`),
  create: (data) => api.post('/racks/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/racks/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const getBackendURL = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const base = window.location.port === '5173' ? 'http://localhost:8000' : window.location.origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export default api;
export const erpStockAPI = {
  getCurrentStock: (query = '') => api.get(`/erp/stock/current${query}`),
  getMovements: (query = '') => api.get(`/erp/stock/movements${query}`),
  getLowStockAlerts: () => api.get('/erp/stock/alerts'),
  submitAudit: (data) => api.post('/erp/stock/audit', data),
};
export const proformaInvoiceAPI = createAPI('/proforma-invoices');
export const buyerOrderScheduleAPI = createAPI('/buyer-order-schedules');
export const buyerOrderAmendmentAPI = createAPI('/buyer-order-amendments');
export const buyerOrderCompletionAPI = createAPI('/buyer-order-completions');
export const orderExpenseAPI = createAPI('/order-expenses');



