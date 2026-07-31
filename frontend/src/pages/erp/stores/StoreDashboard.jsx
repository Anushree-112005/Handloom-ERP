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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <LayoutDashboard size={24} color="var(--primary)" /> Store Dashboard (DDD)
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Overview of store metrics and pending actions.</p>
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading metrics...</div>
      ) : (
        <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
          <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <FileText size={24} />
            </div>
            <div className="stat-details">
              <h3>Pending Requests</h3>
              <div className="value">{metrics.pending_requests}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Package size={24} />
            </div>
            <div className="stat-details">
              <h3>Items Below Reorder</h3>
              <div className="value">{metrics.items_below_reorder}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <LayoutDashboard size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Store Value</h3>
              <div className="value">₹ {metrics.total_store_value}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
