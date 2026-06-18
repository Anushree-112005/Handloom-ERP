import api from './client';

export const companies = {
  list:   ()         => api.get('/companies/').then(r => r.data),
  get:    (id)       => api.get(`/companies/${id}`).then(r => r.data),
  create: (data)     => api.post('/companies/', data).then(r => r.data),
  update: (id, data) => api.put(`/companies/${id}`, data).then(r => r.data),
  delete: (id)       => api.delete(`/companies/${id}`).then(r => r.data),
  seedTextile: ()    => api.post('/companies/seed-textile').then(r => r.data),
  seedVouchers: (id) => api.post(`/companies/${id}/seed-vouchers`).then(r => r.data),
};

export const financialYears = {
  list:       (companyId) => api.get('/financial-years/', { params: { company_id: companyId } }).then(r => r.data),
  create:     (data)      => api.post('/financial-years/', data).then(r => r.data),
  setCurrent: (id)        => api.put(`/financial-years/${id}/set-current`).then(r => r.data),
};

export const ledgerGroups = {
  list:   (companyId) => api.get('/ledger-groups/', { params: { company_id: companyId } }).then(r => r.data),
  tree:   (companyId) => api.get('/ledger-groups/tree', { params: { company_id: companyId } }).then(r => r.data),
  create: (data)      => api.post('/ledger-groups/', data).then(r => r.data),
  update: (id, data)  => api.put(`/ledger-groups/${id}`, data).then(r => r.data),
};

export const ledgers = {
  list:      (params)      => api.get('/ledgers/', { params }).then(r => r.data),
  get:       (id)          => api.get(`/ledgers/${id}`).then(r => r.data),
  create:    (data)        => api.post('/ledgers/', data).then(r => r.data),
  update:    (id, data)    => api.put(`/ledgers/${id}`, data).then(r => r.data),
  balance:   (id)          => api.get(`/ledgers/${id}/balance`).then(r => r.data),
  statement: (id, params)  => api.get(`/ledgers/${id}/statement`, { params }).then(r => r.data),
};

export const stockItems = {
  list:   (companyId) => api.get('/stock-items/', { params: { company_id: companyId } }).then(r => r.data),
  get:    (id)        => api.get(`/stock-items/${id}`).then(r => r.data),
  create: (data)      => api.post('/stock-items/', data).then(r => r.data),
  update: (id, data)  => api.put(`/stock-items/${id}`, data).then(r => r.data),
  delete: (id)        => api.delete(`/stock-items/${id}`).then(r => r.data),
};

export const stockGroups = {
  list:   (companyId) => api.get('/inventory/stock-groups/', { params: { company_id: companyId } }).then(r => r.data),
  get:    (id)        => api.get(`/inventory/stock-groups/${id}`).then(r => r.data),
  create: (data)      => api.post('/inventory/stock-groups/', data).then(r => r.data),
  update: (id, data)  => api.put(`/inventory/stock-groups/${id}`, data).then(r => r.data),
  delete: (id)        => api.delete(`/inventory/stock-groups/${id}`).then(r => r.data),
};

export const stockCategories = {
  list:   (companyId) => api.get('/inventory/stock-categories/', { params: { company_id: companyId } }).then(r => r.data),
  get:    (id)        => api.get(`/inventory/stock-categories/${id}`).then(r => r.data),
  create: (data)      => api.post('/inventory/stock-categories/', data).then(r => r.data),
  update: (id, data)  => api.put(`/inventory/stock-categories/${id}`, data).then(r => r.data),
  delete: (id)        => api.delete(`/inventory/stock-categories/${id}`).then(r => r.data),
};

export const units = {
  list:   (companyId) => api.get('/inventory/units/', { params: { company_id: companyId } }).then(r => r.data),
  get:    (id)        => api.get(`/inventory/units/${id}`).then(r => r.data),
  create: (data)      => api.post('/inventory/units/', data).then(r => r.data),
  update: (id, data)  => api.put(`/inventory/units/${id}`, data).then(r => r.data),
  delete: (id)        => api.delete(`/inventory/units/${id}`).then(r => r.data),
};

export const locations = {
  list:   (companyId) => api.get('/inventory/locations/', { params: { company_id: companyId } }).then(r => r.data),
  get:    (id)        => api.get(`/inventory/locations/${id}`).then(r => r.data),
  create: (data)      => api.post('/inventory/locations/', data).then(r => r.data),
  update: (id, data)  => api.put(`/inventory/locations/${id}`, data).then(r => r.data),
  delete: (id)        => api.delete(`/inventory/locations/${id}`).then(r => r.data),
};

export const vouchers = {
  list:   (params)     => api.get('/vouchers/', { params }).then(r => r.data),
  get:    (id)         => api.get(`/vouchers/${id}`).then(r => r.data),
  create: (data)       => api.post('/vouchers/', data).then(r => r.data),
  update: (id, data)   => api.put(`/vouchers/${id}`, data).then(r => r.data),
  cancel: (id)         => api.put(`/vouchers/${id}/cancel`).then(r => r.data),
  delete: (id)         => api.delete(`/vouchers/${id}`).then(r => r.data),
};

export const reports = {
  dayBook:           (params)      => api.get('/reports/day-book', { params }).then(r => r.data),
  trialBalance:      (params)      => api.get('/reports/trial-balance', { params }).then(r => r.data),
  profitLoss:        (params)      => api.get('/reports/profit-loss', { params }).then(r => r.data),
  balanceSheet:      (params)      => api.get('/reports/balance-sheet', { params }).then(r => r.data),
  ledgerStatement:   (params)      => api.get('/reports/ledger-statement', { params }).then(r => r.data),
  groupSummary:      (params)      => api.get('/reports/group-summary', { params }).then(r => r.data),
  cashBook:          (params)      => api.get('/reports/cash-book', { params }).then(r => r.data),
  bankBook:          (params)      => api.get('/reports/bank-book', { params }).then(r => r.data),
  outstanding:       (params)      => api.get('/reports/outstanding', { params }).then(r => r.data),
  salesRegister:     (params)      => api.get('/reports/sales-register', { params }).then(r => r.data),
  purchaseRegister:  (params)      => api.get('/reports/purchase-register', { params }).then(r => r.data),
  gstSummary:        (params)      => api.get('/reports/gst-summary', { params }).then(r => r.data),
  gstr1:             (params)      => api.get('/reports/gstr1', { params }).then(r => r.data),
  itcLedger:         (params)      => api.get('/reports/itc-ledger', { params }).then(r => r.data),
  ledgerSummary:     (params)      => api.get('/reports/ledger-summary', { params }).then(r => r.data),
  ratioAnalysis:     (params)      => api.get('/reports/ratio-analysis', { params }).then(r => r.data),
  stockMovement:     (params)      => api.get('/reports/stock-movement', { params }).then(r => r.data),
  godownSummary:     (params)      => api.get('/reports/godown-summary', { params }).then(r => r.data),
};

export const gst = {
  summary: (params) => api.get('/gst/summary', { params }).then(r => r.data),
};

export const auth = {
  login:  (data)    => api.post('/auth/login', data).then(r => r.data),
  seedAdmin: ()     => api.post('/auth/seed-admin').then(r => r.data),
};

export const users = {
  list:   ()            => api.get('/users/').then(r => r.data),
  create: (data)        => api.post('/users/', data).then(r => r.data),
  update: (id, data)    => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id)          => api.delete(`/users/${id}`).then(r => r.data),
};

export const auditLogs = {
  list: (params) => api.get('/audit/', { params }).then(r => r.data),
};

export const payroll = {
  // Employees
  listEmployees:   (company_id)      => api.get('/payroll/employees/', { params: { company_id } }).then(r => r.data),
  createEmployee:  (data)            => api.post('/payroll/employees/', data).then(r => r.data),
  updateEmployee:  (id, data)        => api.put(`/payroll/employees/${id}`, data).then(r => r.data),
  deleteEmployee:  (id)              => api.delete(`/payroll/employees/${id}`).then(r => r.data),
  // Salary Records
  listSalaryRecords: (params)        => api.get('/payroll/salary-records/', { params }).then(r => r.data),
  processSalary:   (data)            => api.post('/payroll/process-salary', data).then(r => r.data),
  disburseSalary:  (id, params)      => api.put(`/payroll/salary-records/${id}/disburse`, null, { params }).then(r => r.data),
  deleteSalaryRun: (params)          => api.delete('/payroll/salary-records/', { params }).then(r => r.data),
};

export const banking = {
  accounts:    (company_id)          => api.get('/banking/accounts/', { params: { company_id } }).then(r => r.data),
  unreconciled: (params)             => api.get('/banking/unreconciled/', { params }).then(r => r.data),
  reconcile:   (data)                => api.post('/banking/reconcile', data).then(r => r.data),
  unreconcile: (voucher_id)          => api.delete(`/banking/reconcile/${voucher_id}`).then(r => r.data),
  cheques:     (params)              => api.get('/banking/cheques/', { params }).then(r => r.data),
  reconciled:  (params)              => api.get('/banking/reconciled/', { params }).then(r => r.data),
  postDated:   (company_id)          => api.get('/banking/post-dated/', { params: { company_id } }).then(r => r.data),
};

