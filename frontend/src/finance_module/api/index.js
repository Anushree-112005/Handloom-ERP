import api from './client';
import * as vouchersModule from './vouchers';
import * as reports from './reports';
import * as companies from './companies';

const createCRUD = (endpoint) => ({
  list: (params) => {
    // If a primitive is passed instead of an object, assume it's company_id
    if (typeof params === 'number' || typeof params === 'string') {
      params = { company_id: params };
    }
    return api.get(endpoint, { params });
  },
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
const stockGroups = createCRUD('/inventory/stock-groups/');
const stockCategories = createCRUD('/inventory/stock-categories/');
const stockItems = createCRUD('/stock-items/');
const units = createCRUD('/inventory/units/');
const locations = createCRUD('/inventory/locations/');
const users = createCRUD('/users/');
const payroll = createCRUD('/payroll/');
const banking = createCRUD('/banking/');

export { 
  auth, reports, companies, vouchers, ledgers, ledgerGroups, 
  stockGroups, stockCategories, stockItems, units, locations, 
  users, payroll, banking 
};

