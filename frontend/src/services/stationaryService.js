import api from './api';

export const stationaryService = {
  // Categories
  getCategories: () => api.get('/stationary/categories'),
  createCategory: (data) => api.post('/stationary/categories', data),
  updateCategory: (id, data) => api.put(`/stationary/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/stationary/categories/${id}`),

  // UOMs
  getUOMs: () => api.get('/stationary/uoms'),
  createUOM: (data) => api.post('/stationary/uoms', data),
  updateUOM: (id, data) => api.put(`/stationary/uoms/${id}`, data),
  deleteUOM: (id) => api.delete(`/stationary/uoms/${id}`),

  // Materials
  getMaterials: () => api.get('/stationary/materials'),
  createMaterial: (data) => api.post('/stationary/materials', data),
  updateMaterial: (id, data) => api.put(`/stationary/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/stationary/materials/${id}`),

  // Goods Receipt Note (GRN)
  getGRNs: () => api.get('/stationary/grn'),
  createGRN: (data) => api.post('/stationary/grn', data),

  // Stock Issues
  getIssues: () => api.get('/stationary/issues'),
  createIssue: (data) => api.post('/stationary/issues', data),

  // Swatch Cards
  getSwatchCards: () => api.get('/stationary/swatches/all'),
  createSwatchCard: (data) => api.post('/stationary/swatches/create', data),
  updateSwatchCard: (id, data) => api.put(`/stationary/swatches/${id}`, data),
  deleteSwatchCard: (id) => api.delete(`/stationary/swatches/${id}`),
  uploadSwatchAttachment: (formData) => api.post('/stationary/swatches/upload-attachment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Fabric Inspection Rolls
  getInspectionRolls: (fabricInwardId) => api.get(`/stationary/inspection-rolls/${fabricInwardId}`),
  saveInspectionRoll: (data) => api.post('/stationary/inspection-rolls/save', data),
  deleteInspectionRoll: (id) => api.delete(`/stationary/inspection-rolls/${id}`),

  // Returnable DCs
  getReturnableDCs: () => api.get('/stationary/returnable-dc/all'),
  createReturnableDC: (data) => api.post('/stationary/returnable-dc/create', data),
  updateReturnableDC: (id, data) => api.put(`/stationary/returnable-dc/${id}`, data),
  deleteReturnableDC: (id) => api.delete(`/stationary/returnable-dc/${id}`)
};
