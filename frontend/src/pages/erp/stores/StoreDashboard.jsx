import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Package, AlertCircle } from 'lucide-react';
import { storeDashboardAPI } from '../../../services/api';

export default function StoreDashboard() {
  const [metrics, setMetrics] = useState({ pending_requests: 0, items_below_reorder: 0, total_store_value: '0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await storeDashboardAPI.getMetrics();
      if (res.data) setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade p-6">
      <h1 className="text-2xl font-bold mb-6">Store Dashboard (DDD)</h1>
      
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading metrics...</div>
      ) : (
        <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">Pending Requests</h3>
              <FileText size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{metrics.pending_requests}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">Items Below Reorder</h3>
              <Package size={20} className="text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{metrics.items_below_reorder}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-500 font-medium">Total Store Value</h3>
              <LayoutDashboard size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold">₹ {metrics.total_store_value}</p>
          </div>
        </div>
      )}
    </div>
  );
}
