import axios from 'axios';

export const FINANCE_API_BASE = '/api/finance';

const financeApi = axios.create({
  baseURL: FINANCE_API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
financeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
financeApi.interceptors.response.use(
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

export const ledgersAPI = {
  list: (params) => financeApi.get('/ledgers/', { params }),
  create: (data) => financeApi.post('/ledgers/', data),
  get: (id) => financeApi.get(`/ledgers/${id}`),
};

export const vouchersAPI = {
  list: (params) => financeApi.get('/vouchers/', { params }),
  create: (data) => financeApi.post('/vouchers/', data),
  get: (id) => financeApi.get(`/vouchers/${id}`),
  update: (id, data) => financeApi.put(`/vouchers/${id}`, data),
};

export const reportsAPI = {
  trialBalance: (params) => financeApi.get('/reports/trial-balance', { params }),
  profitLoss: (params) => financeApi.get('/reports/profit-loss', { params }),
  balanceSheet: (params) => financeApi.get('/reports/balance-sheet', { params }),
};
