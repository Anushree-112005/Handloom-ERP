import api from './client';
import * as vouchersModule from './vouchers';
import * as reports from './reports';
import * as companies from './companies';

const createCRUD = (endpoint) => ({
  list: (params) => api.get(endpoint, { params }),
  get: (id) => api.get(`${endpoint}${id}`),
  create: (data) => api.post(endpoint, data),
  update: (id, data) => api.put(`${endpoint}${id}`, data),
  delete: (id) => api.delete(`${endpoint}${id}`),
});

const auth = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

const vouchers = {
  ...vouchersModule,
  ...createCRUD('/vouchers/')
};

const ledgers = createCRUD('/ledgers/');
const ledgerGroups = createCRUD('/ledger-groups/');
const stockGroups = createCRUD('/stock-groups/');
const stockCategories = createCRUD('/stock-categories/');
const stockItems = createCRUD('/stock-items/');
const units = createCRUD('/units/');
const locations = createCRUD('/locations/');
const users = createCRUD('/users/');
const payroll = createCRUD('/payroll/');
const banking = createCRUD('/banking/');

export { 
  auth, reports, companies, vouchers, ledgers, ledgerGroups, 
  stockGroups, stockCategories, stockItems, units, locations, 
  users, payroll, banking 
};

