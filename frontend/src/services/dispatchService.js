import api from './api';

export const getDispatches = async () => {
  try {
    const response = await api.get('/buyer-orders/dispatches/');
    return response.data;
  } catch (error) {
    console.error('Failed to get dispatches from API, trying alternative endpoint:', error);
    try {
      const response = await api.get('/buyer_orders/dispatches/');
      return response.data;
    } catch (err) {
      console.error('All dispatch endpoints failed, using mock/local storage data.');
      const local = localStorage.getItem('fleet_dispatches');
      if (local) return JSON.parse(local);
      const defaultMock = [
        { id: 1, dispatchId: 'DSP-001', issueDocumentNumber: 'DOC-001', sourceWarehouse: 'Coimbatore Main Warehouse', destinationWarehouse: 'Chennai Depot', vehicleNumber: 'TN-37-BY-8822', date: '2026-06-12' },
        { id: 2, dispatchId: 'DSP-002', issueDocumentNumber: 'DOC-002', sourceWarehouse: 'Tiruppur Unit 2', destinationWarehouse: 'Coimbatore Main Warehouse', vehicleNumber: 'TN-38-CZ-5510', date: '2026-06-12' }
      ];
      localStorage.setItem('fleet_dispatches', JSON.stringify(defaultMock));
      return defaultMock;
    }
  }
};
