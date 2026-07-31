import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, Search, Filter, Clock, Box, CheckCircle, AlertCircle } from 'lucide-react';
import { warehouseInwardOutwardAPI } from '../../../services/api';

export default function GoodsReceiptDock() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stagingItems, setStagingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaging();
  }, []);

  const fetchStaging = async () => {
    try {
      setLoading(true);
      const res = await warehouseInwardOutwardAPI.getStaging();
      if (res.data) setStagingItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = stagingItems.filter(item => 
    (item.grn_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.item_description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = stagingItems.length;
  const awaitingQC = stagingItems.filter(i => i.status === 'Awaiting QC').length;
  const readyItems = stagingItems.filter(i => i.status === 'Ready for Put-Away').length;
  const totalQty = stagingItems.reduce((acc, curr) => acc + (Number(curr.received_qty) || 0), 0);

  return (
    <div className="animate-fade p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownLeft size={24} color="#10b981" /> Goods Receipt Dock (Staging)
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage physical goods that have arrived at the gate but are not yet shelved.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Box size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Staging Items</h3>
            <div className="value">{totalItems}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Awaiting QC</h3>
            <div className="value">{awaitingQC}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Ready for Put-Away</h3>
            <div className="value">{readyItems}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <ArrowDownLeft size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Quantity</h3>
            <div className="value">{totalQty}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)', border: 'none', boxShadow: 'none' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search GRN, Vendor, Item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <select className="form-control" style={{ margin: 0, width: 160 }}>
            <option>All Status</option>
            <option>Awaiting QC</option>
            <option>Ready for Put-Away</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading staging items...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>GRN Number</th>
                  <th>Vendor</th>
                  <th>Item Description</th>
                  <th>Received Qty</th>
                  <th>Arrival Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.grn_number}</td>
                    <td>{item.vendor}</td>
                    <td>{item.item_description}</td>
                    <td style={{ fontWeight: 600 }}>{item.received_qty}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Clock size={14} /> {item.arrival_time}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'Awaiting QC' ? 'badge-warning' : 'badge-success'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} disabled={item.status === 'Awaiting QC'}>
                        Move to Put-Away
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No staging items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
