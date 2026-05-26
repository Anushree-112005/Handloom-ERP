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

// ---- Dropdowns ----
export const dropdownAPI = {
  getAll: () => api.get('/dropdowns/'),
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

// ---- Buyer Orders ----
export const buyerOrderAPI = {
  list: (params) => api.get('/buyer-orders/', { params }),
  get: (id) => api.get(`/buyer-orders/${id}`),
  create: (data) => api.post('/buyer-orders/', data),
};

// ---- Employee Master ----
export const employeeAPI = {
  list: () => api.get('/employees/'),
  create: (data) => api.post('/employees/', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

export default api;
