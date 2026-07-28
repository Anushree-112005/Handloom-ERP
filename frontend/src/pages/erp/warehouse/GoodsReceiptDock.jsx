import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, Search, Filter, Clock } from 'lucide-react';
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

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)' }}>
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

      <div className="card" style={{ padding: 0 }}>
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
