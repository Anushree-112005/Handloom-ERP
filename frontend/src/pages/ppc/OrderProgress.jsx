import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, Save, ArrowLeft, Clock, Activity, CheckCircle, Percent, Trash2, Edit2, Eye } from 'lucide-react';
import { buyerOrderAPI, subMasterAPI } from '../../services/api';

export default function OrderProgress() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    order_id: '',
    buyer_name: '',
    total_ordered_meters: 0,
    total_produced: 0,
    remaining_meters: 0,
    completion_pct: 0,
    days_elapsed: 0,
    days_remaining: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes] = await Promise.all([
        subMasterAPI.list('ppc_order_progress').catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setOrders(ordRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (e) => {
    const oId = e.target.value;
    const order = orders.find(o => o.order_no === oId || o.id.toString() === oId);
    
    if (order) {
      // Mock metrics for the order progress based on order details
      const total = 30000; // Mock total, in reality fetch from order total meters
      const produced = Math.floor(total * (Math.random() * 0.4 + 0.3)); // 30-70% complete
      const remain = total - produced;
      const pct = (produced / total) * 100;
      
      const elapsed = Math.floor(Math.random() * 15) + 5;
      const remainingDays = Math.floor((remain / (produced / elapsed)) || 20); // Extrapolate

      setFormData({
        order_id: oId,
        buyer_name: order.party_name || 'H&M Sweden',
        total_ordered_meters: total,
        total_produced: produced,
        remaining_meters: remain,
        completion_pct: pct.toFixed(1),
        days_elapsed: elapsed,
        days_remaining: remainingDays
      });
    } else {
      setFormData({
        ...formData,
        order_id: '', buyer_name: '', total_ordered_meters: 0, total_produced: 0,
        remaining_meters: 0, completion_pct: 0, days_elapsed: 0, days_remaining: 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_order_progress', {
        name: formData.order_id,
        code: formData.buyer_name,
        extra_field_1: `${formData.completion_pct}%`,
        extra_field_2: `${formData.remaining_meters} m`,
        description: `Days Remaining: ${formData.days_remaining} | Produced: ${formData.total_produced}m`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating snapshot.');
    }
  };

  const handleEdit = (record) => {
    // Partial mock implementation for editing
    setFormData({
      id: record.id,
      order_id: record.name,
      buyer_name: record.code,
      total_ordered_meters: 30000,
      total_produced: parseFloat(record.description?.match(/Produced: (.*?)m/)?.[1] || 0),
      remaining_meters: parseFloat(record.extra_field_2) || 0,
      completion_pct: parseFloat(record.extra_field_1) || 0,
      days_elapsed: 5,
      days_remaining: parseFloat(record.description?.match(/Days Remaining: (.*?) \|/)?.[1] || 0)
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await subMasterAPI.delete('ppc_order_progress', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isFormOpen) {
    return (
      <div className="animate-fade" style={{ height: '100%' }}>
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#10b98118', borderRadius: 10, color: '#10b981' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Order Analysis</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Automated production calculation</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" value={formData.order_id} onChange={handleOrderChange} required>
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Buyer Name (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.buyer_name} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>Production Status</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Total Ordered Meters</label>
                <input type="text" className="form-control" value={formData.total_ordered_meters ? `${formData.total_ordered_meters.toLocaleString()} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Total Produced</label>
                <input type="text" className="form-control" value={formData.total_produced ? `${formData.total_produced.toLocaleString()} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Remaining Meters</label>
                <input type="text" className="form-control" value={formData.remaining_meters ? `${formData.remaining_meters.toLocaleString()} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ marginTop: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Completion Progress</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: 16 }}>{formData.completion_pct}%</span>
              </div>
              <div style={{ width: '100%', height: 16, backgroundColor: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ width: `${formData.completion_pct}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>Timeline</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Days Elapsed</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 8, fontWeight: 600 }}>
                  <Clock size={16} className="text-secondary" /> {formData.days_elapsed} days
                </div>
              </div>
              <div className="form-group">
                <label>Estimated Days Remaining</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: 8, fontWeight: 600 }}>
                  <TrendingUp size={16} className="text-secondary" /> {formData.days_remaining} days
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Snapshot
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }


  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp style={{ color: '#10b981' }} /> Order Progress View
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Track live completion metrics for active buyer orders</p>
        </div>
        {isFormOpen && (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {!isFormOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12, display: 'flex' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Tracked Orders</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#e0e7ff', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Percent size={24} style={{ color: '#4f46e5' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Avg Completion %</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.length ? (records.reduce((sum, r) => sum + (parseFloat(r.extra_field_1) || 0), 0) / records.length).toFixed(1) : 0}%
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#ffedd5', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Activity size={24} style={{ color: '#f97316' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Remaining (m)</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.reduce((sum, r) => sum + (parseFloat(r.extra_field_2) || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}


        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Tracked Orders ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setFormData({
                    order_id: '', buyer_name: '', total_ordered_meters: 0, total_produced: 0,
                    remaining_meters: 0, completion_pct: 0, days_elapsed: 0, days_remaining: 0
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#10b981', borderColor: '#10b981', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Search size={16} /> Analyze Order
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Order ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Buyer</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Completion %</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Remaining Meters</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Timeline</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{record.code}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: record.extra_field_1, height: '100%', background: '#10b981' }}></div>
                        </div>
                        <span style={{ fontWeight: 600, color: '#047857', fontSize: 12 }}>{record.extra_field_1}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}><span style={{ color: '#b45309', fontWeight: 600 }}>{record.extra_field_2}</span></td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button style={{ padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleEdit(record)} title="View/Edit">
                          <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button style={{ padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleEdit(record)} title="Edit">
                          <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button style={{ padding: '4px 6px', border: '1px solid #fee2e2', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleDelete(record.id)} title="Delete">
                          <Trash2 size={16} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
