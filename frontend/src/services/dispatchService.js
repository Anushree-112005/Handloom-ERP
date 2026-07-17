import api from './api';

export const getDispatches = async () => {
  const getMockData = () => {
    const defaultMock = [
      { id: 1, dispatchId: 'DSP-001', issueDocumentNumber: 'DOC-001', sourceWarehouse: 'Coimbatore Main Warehouse', destinationWarehouse: 'Chennai Depot', vehicleNumber: 'TN-37-BY-8822', date: '2026-06-12' },
      { id: 2, dispatchId: 'DSP-002', issueDocumentNumber: 'DOC-002', sourceWarehouse: 'Tiruppur Unit 2', destinationWarehouse: 'Coimbatore Main Warehouse', vehicleNumber: 'TN-38-CZ-5510', date: '2026-06-12' }
    ];
    const local = localStorage.getItem('fleet_dispatches');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem('fleet_dispatches', JSON.stringify(defaultMock));
    return defaultMock;
  };

  try {
    let response = await api.get('/buyer-orders/dispatches/').catch(() => null);
    if (!response) {
      response = await api.get('/buyer_orders/dispatches/');
    }
    
    if (response && response.data && response.data.length > 0) {
      return response.data;
    } else {
      console.warn('API returned empty dispatches, using mock data for demo');
      return getMockData();
    }
  } catch (error) {
    console.error('All dispatch endpoints failed or returned empty, using mock/local storage data.');
    return getMockData();
  }
};
