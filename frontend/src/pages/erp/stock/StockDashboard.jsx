import React, { useState, useEffect } from 'react';
import { Package, Layers, MapPin, CheckSquare, AlertTriangle, ClipboardList, BarChart2 } from 'lucide-react';
import { erpStockAPI } from '../../../services/api';

const StockDashboard = () => {
  const [stockSummary, setStockSummary] = useState({
    yarn: 0,
    greyFabric: 0,
    finishedFabric: 0,
    atJobWork: 0,
    lowStock: 2,
    pendingAudit: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockSummary();
  }, []);

  const fetchStockSummary = async () => {
    try {
      const response = await erpStockAPI.getCurrentStock();
      const currentStock = response.data || response; // Fallback in case interceptor changes
      let yarn = 0, grey = 0, finished = 0, jobWork = 0;
      
      currentStock.forEach(stock => {
        if (stock.status === 'AT_JOB_WORK') {
          jobWork += stock.quantity;
        } else if (stock.item_id.toLowerCase().includes('yarn')) {
          yarn += stock.quantity;
        } else if (stock.item_id.toLowerCase().includes('grey')) {
          grey += stock.quantity;
        } else {
          finished += stock.quantity;
        }
      });

      setStockSummary({
        ...stockSummary,
        yarn,
        greyFabric: grey,
        finishedFabric: finished,
        atJobWork: jobWork
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stock summary', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading Stock Dashboard...</div>;
  }

  return (
    <div className="animate-fade p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={24} color="var(--primary)" /> Stock Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Unified view of all materials across Godowns and WIP.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Layers size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Yarn Stock</h3>
            <div className="value">{stockSummary.yarn.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Kgs</span></div>
            <p style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontWeight: 500 }}>Available across Godowns</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <CheckSquare size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Grey Fabric</h3>
            <div className="value">{stockSummary.greyFabric.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Mtrs</span></div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>Pending Processing</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckSquare size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Finished Fabric</h3>
            <div className="value">{stockSummary.finishedFabric.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Mtrs</span></div>
            <p style={{ fontSize: 12, color: '#10b981', marginTop: 4, fontWeight: 500 }}>Ready for Dispatch</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <h3>Stock At Job Work</h3>
            <div className="value">{stockSummary.atJobWork.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Kgs</span></div>
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4, fontWeight: 500 }}>Currently with external vendors</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: '#ef4444' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 8, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Low Stock Alerts</h3>
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{stockSummary.lowStock} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>Items</span></p>
          <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>Below reorder level</p>
        </div>

        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid rgba(59, 130, 246, 0.3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: '#3b82f6' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 8, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <ClipboardList size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Pending Physical Audit</h3>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{stockSummary.pendingAudit ? 'Required' : 'Up to date'}</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Last done 15 days ago</p>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;
