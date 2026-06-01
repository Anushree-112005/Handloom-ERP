import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
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

// ---- Auth ----
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
};

// ---- Party Master ----
export const partyAPI = {
  list: (params) => api.get('/parties/', { params }),
  get: (id) => api.get(`/parties/${id}`),
  create: (data) => api.post('/parties/', data),
  update: (id, data) => api.put(`/parties/${id}`, data),
  summary: () => api.get('/parties/stats/summary'),
};

export const buyerOrderAPI = {
  list: (params) => api.get('/buyer-orders/', { params }),
  get: (id) => api.get(`/buyer-orders/${id}`),
  create: (data) => api.post('/buyer-orders/', data),
  update: (id, data) => api.put(`/buyer-orders/${id}`, data),
  delete: (id) => api.delete(`/buyer-orders/${id}`),
  
  // Schedules
  listSchedules: () => api.get('/buyer-orders/schedules/'),
  createSchedule: (data) => api.post('/buyer-orders/schedules/', data),
  deleteSchedule: (id) => api.delete(`/buyer-orders/schedules/${id}`),

  // Sequences
  listSequences: () => api.get('/buyer-orders/sequences/'),
  createSequence: (data) => api.post('/buyer-orders/sequences/', data),
  deleteSequence: (id) => api.delete(`/buyer-orders/sequences/${id}`),

  // Amendments
  listAmendments: () => api.get('/buyer-orders/amendments/'),
  createAmendment: (data) => api.post('/buyer-orders/amendments/', data),
  deleteAmendment: (id) => api.delete(`/buyer-orders/amendments/${id}`),

  // Completions
  listCompletions: () => api.get('/buyer-orders/completions/'),
  createCompletion: (data) => api.post('/buyer-orders/completions/', data),
  deleteCompletion: (id) => api.delete(`/buyer-orders/completions/${id}`),

  // Dispatches
  listDispatches: () => api.get('/buyer-orders/dispatches/'),
  createDispatch: (data) => api.post('/buyer-orders/dispatches/', data),
  deleteDispatch: (id) => api.delete(`/buyer-orders/dispatches/${id}`),

  // Expenses
  listExpenses: () => api.get('/buyer-orders/expenses/'),
  createExpense: (data) => api.post('/buyer-orders/expenses/', data),
  deleteExpense: (id) => api.delete(`/buyer-orders/expenses/${id}`)
};

export const designEntryAPI = {
  list: (params) => api.get('/design-entries/', { params }),
  get: (id) => api.get(`/design-entries/${id}`),
  create: (data) => api.post('/design-entries/', data),
  update: (id, data) => api.put(`/design-entries/${id}`, data),
  delete: (id) => api.delete(`/design-entries/${id}`),
};

export const yarnPurchaseOrderAPI = {
  list: (params) => api.get('/yarn-purchase-orders/', { params }),
  get: (id) => api.get(`/yarn-purchase-orders/${id}`),
  create: (data) => api.post('/yarn-purchase-orders/', data),
  update: (id, data) => api.put(`/yarn-purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/yarn-purchase-orders/${id}`),
};

export const yarnInwardAPI = {
  list: (params) => api.get('/yarn-inwards/', { params }),
  get: (id) => api.get(`/yarn-inwards/${id}`),
  create: (data) => api.post('/yarn-inwards/', data),
  update: (id, data) => api.put(`/yarn-inwards/${id}`, data),
  delete: (id) => api.delete(`/yarn-inwards/${id}`),
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

export default api;
