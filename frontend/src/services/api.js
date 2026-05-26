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

export default api;
