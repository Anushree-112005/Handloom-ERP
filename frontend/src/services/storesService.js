import api from './api';

/**
 * Stores & Consumables API Services
 */
export const storesService = {
  // ─── DASHBOARD STATS ───
  getDashboardStats: async () => {
    const response = await api.get('/stores-consumables/dashboard/stats');
    return response.data;
  },

  // ─── CATEGORY ENDPOINTS ───
  getCategories: async (search) => {
    const response = await api.get('/stores-consumables/categories', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getCategory: async (id) => {
    const response = await api.get(`/stores-consumables/categories/${id}`);
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post('/stores-consumables/categories', data);
    return response.data;
  },
  updateCategory: async (id, data) => {
    const response = await api.put(`/stores-consumables/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id) => {
    await api.delete(`/stores-consumables/categories/${id}`);
  },

  // ─── UOM ENDPOINTS ───
  getUOMs: async (search) => {
    const response = await api.get('/stores-consumables/uom', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  createUOM: async (data) => {
    const response = await api.post('/stores-consumables/uom', data);
    return response.data;
  },
  updateUOM: async (id, data) => {
    const response = await api.put(`/stores-consumables/uom/${id}`, data);
    return response.data;
  },
  deleteUOM: async (id) => {
    await api.delete(`/stores-consumables/uom/${id}`);
  },

  // ─── VENDOR ENDPOINTS ───
  getVendors: async (search) => {
    const response = await api.get('/stores-consumables/vendors', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  createVendor: async (data) => {
    const response = await api.post('/stores-consumables/vendors', data);
    return response.data;
  },
  updateVendor: async (id, data) => {
    const response = await api.put(`/stores-consumables/vendors/${id}`, data);
    return response.data;
  },
  deleteVendor: async (id) => {
    await api.delete(`/stores-consumables/vendors/${id}`);
  },

  // ─── DEPARTMENT ENDPOINTS ───
  getDepartments: async (search) => {
    const response = await api.get('/stores-consumables/departments', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  createDepartment: async (data) => {
    const response = await api.post('/stores-consumables/departments', data);
    return response.data;
  },
  updateDepartment: async (id, data) => {
    const response = await api.put(`/stores-consumables/departments/${id}`, data);
    return response.data;
  },
  deleteDepartment: async (id) => {
    await api.delete(`/stores-consumables/departments/${id}`);
  },

  // ─── ITEM ENDPOINTS ───
  getItems: async (search) => {
    const response = await api.get('/stores-consumables/items', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getLowStockItems: async () => {
    const response = await api.get('/stores-consumables/items/low-stock');
    return response.data;
  },
  getItem: async (id) => {
    const response = await api.get(`/stores-consumables/items/${id}`);
    return response.data;
  },
  createItem: async (data) => {
    const response = await api.post('/stores-consumables/items', data);
    return response.data;
  },
  updateItem: async (id, data) => {
    const response = await api.put(`/stores-consumables/items/${id}`, data);
    return response.data;
  },
  deleteItem: async (id) => {
    await api.delete(`/stores-consumables/items/${id}`);
  },

  // ─── SEED DATA ───
  seedData: async () => {
    const response = await api.post('/stores-consumables/seed');
    return response.data;
  },

  // ─── MATERIAL REQUEST ENDPOINTS ───
  getMaterialRequests: async (search) => {
    const response = await api.get('/stores-consumables/requests', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  createMaterialRequest: async (data) => {
    const response = await api.post('/stores-consumables/requests', data);
    return response.data;
  },
  deleteMaterialRequest: async (id) => {
    await api.delete(`/stores-consumables/requests/${id}`);
  },

  // ─── PURCHASE REQUISITION ENDPOINTS ───
  getSubcategories: async (categoryId) => {
    const response = await api.get('/stores-consumables/subcategories', {
      params: categoryId ? { category_id: categoryId } : {}
    });
    return response.data;
  },
  getWarehouses: async () => {
    const response = await api.get('/stores-consumables/warehouses');
    return response.data;
  },
  getCostCenters: async () => {
    const response = await api.get('/stores-consumables/cost-centers');
    return response.data;
  },
  getBudgets: async () => {
    const response = await api.get('/stores-consumables/budgets');
    return response.data;
  },
  getEmployees: async () => {
    const response = await api.get('/stores-consumables/employees');
    return response.data;
  },
  getPRStats: async () => {
    const response = await api.get('/stores-consumables/pr/stats');
    return response.data;
  },
  getPRList: async (search) => {
    const response = await api.get('/stores-consumables/pr', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getPRDetail: async (id) => {
    const response = await api.get(`/stores-consumables/pr/${id}`);
    return response.data;
  },
  createPR: async (data) => {
    const response = await api.post('/stores-consumables/pr', data);
    return response.data;
  },
  deletePR: async (id) => {
    await api.delete(`/stores-consumables/pr/${id}`);
  },
  approvePR: async (id, data) => {
    const response = await api.post(`/stores-consumables/pr/${id}/approve`, data);
    return response.data;
  },
  getItemPurchaseHistory: async (itemId) => {
    const response = await api.get(`/stores-consumables/items/${itemId}/purchase-history`);
    return response.data;
  },
  getItemVendorRecommendations: async (itemId) => {
    const response = await api.get(`/stores-consumables/items/${itemId}/vendor-recommendations`);
    return response.data;
  },

  // ─── VENDOR QUOTATION ENDPOINTS ───
  getQuotations: async (search) => {
    const response = await api.get('/stores-consumables/quotations', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getQuotation: async (id) => {
    const response = await api.get(`/stores-consumables/quotations/${id}`);
    return response.data;
  },
  createQuotation: async (data) => {
    const response = await api.post('/stores-consumables/quotations', data);
    return response.data;
  },
  deleteQuotation: async (id) => {
    await api.delete(`/stores-consumables/quotations/${id}`);
  },

  // ─── NEW PROCUREMENT VENDOR QUOTATION ENDPOINTS ───
  getProcurementVendors: async () => {
    const response = await api.get('/stores-consumables/procurement-vendors');
    return response.data;
  },
  createProcurementVendor: async (data) => {
    const response = await api.post('/stores-consumables/procurement-vendors', data);
    return response.data;
  },
  updateProcurementVendor: async (id, data) => {
    const response = await api.put(`/stores-consumables/procurement-vendors/${id}`, data);
    return response.data;
  },
  deleteProcurementVendor: async (id) => {
    await api.delete(`/stores-consumables/procurement-vendors/${id}`);
  },
  getProcurementQuotations: async (vendorId) => {
    const response = await api.get('/stores-consumables/procurement-quotations', {
      params: vendorId ? { vendor_id: vendorId } : {}
    });
    return response.data;
  },
  getProcurementQuotation: async (id) => {
    const response = await api.get(`/stores-consumables/procurement-quotations/${id}`);
    return response.data;
  },
  createProcurementQuotation: async (data) => {
    const response = await api.post('/stores-consumables/procurement-quotations', data);
    return response.data;
  },
  deleteProcurementQuotation: async (id) => {
    await api.delete(`/stores-consumables/procurement-quotations/${id}`);
  },
  addQuotationLineItem: async (quotationId, itemData) => {
    const response = await api.post(`/stores-consumables/procurement-quotations/${quotationId}/items`, itemData);
    return response.data;
  },
  editQuotationLineItem: async (lineItemId, itemData) => {
    const response = await api.put(`/stores-consumables/procurement-quotations/items/${lineItemId}`, itemData);
    return response.data;
  },
  deleteQuotationLineItem: async (lineItemId) => {
    await api.delete(`/stores-consumables/procurement-quotations/items/${lineItemId}`);
  },
  calculateTotals: async (items) => {
    const response = await api.post('/stores-consumables/procurement-quotations/calculate', { items });
    return response.data;
  },


  // ─── PURCHASE ORDER ENDPOINTS ───
  getPurchaseOrders: async (search) => {
    const response = await api.get('/stores-consumables/po', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getPurchaseOrder: async (id) => {
    const response = await api.get(`/stores-consumables/po/${id}`);
    return response.data;
  },
  createPurchaseOrder: async (data) => {
    const response = await api.post('/stores-consumables/po', data);
    return response.data;
  },
  deletePurchaseOrder: async (id) => {
    await api.delete(`/stores-consumables/po/${id}`);
  },

  // ─── STOCK INWARD (GRN) ENDPOINTS ───
  getStockInwards: async (search) => {
    const response = await api.get('/stores-consumables/grn', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getStockInward: async (id) => {
    const response = await api.get(`/stores-consumables/grn/${id}`);
    return response.data;
  },
  createStockInward: async (data) => {
    const response = await api.post('/stores-consumables/grn', data);
    return response.data;
  },
  deleteStockInward: async (id) => {
    await api.delete(`/stores-consumables/grn/${id}`);
  },

  // ─── ISSUE TO DEPARTMENT ENDPOINTS ───
  getDepartmentIssues: async (search) => {
    const response = await api.get('/stores-consumables/issues', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getDepartmentIssue: async (id) => {
    const response = await api.get(`/stores-consumables/issues/${id}`);
    return response.data;
  },
  createDepartmentIssue: async (data) => {
    const response = await api.post('/stores-consumables/issues', data);
    return response.data;
  },
  deleteDepartmentIssue: async (id) => {
    await api.delete(`/stores-consumables/issues/${id}`);
  },

  // ─── RETURN TO STORE ENDPOINTS ───
  getReturnsToStore: async (search) => {
    const response = await api.get('/stores-consumables/returns', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getReturnToStore: async (id) => {
    const response = await api.get(`/stores-consumables/returns/${id}`);
    return response.data;
  },
  createReturnToStore: async (data) => {
    const response = await api.post('/stores-consumables/returns', data);
    return response.data;
  },
  deleteReturnToStore: async (id) => {
    await api.delete(`/stores-consumables/returns/${id}`);
  },

  // ─── STORE TRANSFER ENDPOINTS ───
  getStoreTransfers: async (search) => {
    const response = await api.get('/stores-consumables/transfers', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getStoreTransfer: async (id) => {
    const response = await api.get(`/stores-consumables/transfers/${id}`);
    return response.data;
  },
  createStoreTransfer: async (data) => {
    const response = await api.post('/stores-consumables/transfers', data);
    return response.data;
  },
  deleteStoreTransfer: async (id) => {
    await api.delete(`/stores-consumables/transfers/${id}`);
  },

  // ─── STOCK ADJUSTMENT ENDPOINTS ───
  getStockAdjustments: async (search) => {
    const response = await api.get('/stores-consumables/adjustments', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getStockAdjustment: async (id) => {
    const response = await api.get(`/stores-consumables/adjustments/${id}`);
    return response.data;
  },
  createStockAdjustment: async (data) => {
    const response = await api.post('/stores-consumables/adjustments', data);
    return response.data;
  },
  deleteStockAdjustment: async (id) => {
    await api.delete(`/stores-consumables/adjustments/${id}`);
  },

  // ─── RETURNABLE DC ENDPOINTS ───
  getReturnableDCs: async (search) => {
    const response = await api.get('/stores-consumables/returnable-dc', {
      params: search ? { search } : {}
    });
    return response.data;
  },
  getReturnableDC: async (id) => {
    const response = await api.get(`/stores-consumables/returnable-dc/${id}`);
    return response.data;
  },
  createReturnableDC: async (data) => {
    const response = await api.post('/stores-consumables/returnable-dc', data);
    return response.data;
  },
  deleteReturnableDC: async (id) => {
    await api.delete(`/stores-consumables/returnable-dc/${id}`);
  },

  // ─── REPORTS ENDPOINTS ───
  getPOPrintReport: async (params) => {
    const response = await api.get('/stores-consumables/reports/po-print', { params });
    return response.data;
  },
  getPOStatusReport: async (params) => {
    const response = await api.get('/stores-consumables/reports/po-status', { params });
    return response.data;
  },
  getPurchaseReceivedReport: async (params) => {
    const response = await api.get('/stores-consumables/reports/purchase-received', { params });
    return response.data;
  },
  getConsumptionReport: async (params) => {
    const response = await api.get('/stores-consumables/reports/consumption', { params });
    return response.data;
  },
  getStockReport: async (params) => {
    const response = await api.get('/stores-consumables/reports/stock', { params });
    return response.data;
  }
};

export default storesService;

