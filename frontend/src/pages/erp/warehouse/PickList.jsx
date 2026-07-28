import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Search, ListChecks, MapPin, Package, CheckCircle, Clock } from 'lucide-react';
import { warehouseInwardOutwardAPI } from '../../../services/api';

export default function PickList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pickLists, setPickLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPickLists();
  }, []);

  const fetchPickLists = async () => {
    try {
      setLoading(true);
      const res = await warehouseInwardOutwardAPI.getPickList();
      if (res.data) setPickLists(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = pickLists.filter(item => 
    (item.pick_list_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.reference_doc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.item_to_pick || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLists = pickLists.length;
  const pendingPicks = pickLists.filter(i => i.status === 'Pending').length;
  const totalQty = pickLists.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const completedPicks = pickLists.filter(i => i.status === 'Completed').length;

  return (
    <div className="animate-fade p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpRight size={24} color="#ef4444" /> Pick List (Dispatch Staging)
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Pull stock from physical locations and stage them at the dispatch dock.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <ListChecks size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Pick Lists</h3>
            <div className="value">{totalLists}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h3>Pending Picks</h3>
            <div className="value">{pendingPicks}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Quantity</h3>
            <div className="value">{totalQty}</div>
          </div>
        </div>
        <div className="card stat-card" style={{ border: 'none', boxShadow: 'none', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Completed Picks</h3>
            <div className="value">{completedPicks}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)', border: 'none', boxShadow: 'none' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search Pick List ID, Ref Doc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading pick lists...</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Pick List ID</th>
                  <th>Reference Doc</th>
                  <th>Item to Pick</th>
                  <th>Quantity</th>
                  <th>Source Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.pick_list_id}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.reference_doc}</td>
                    <td>{item.item_to_pick}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, fontSize: 13 }}>
                        <MapPin size={14} className="text-gray-500" /> {item.source_location}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'Pending' ? 'badge-secondary' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                        <ListChecks size={14} /> Confirm Pick
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No pending pick lists.
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
