import React, { useState, useEffect } from 'react';
import { Target, Search, Save, ArrowLeft, Plus, AlertTriangle, CheckCircle, Clock, Trash2, Edit2, Eye } from 'lucide-react';
import { subMasterAPI, buyerOrderAPI } from '../../services/api';

export default function PriorityScheduling() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    order_id: '',
    buyer_name: '',
    delivery_date: '',
    priority_level: 'Normal',
    priority_reason: '',
    scheduled_position: '',
    days_to_delivery: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes] = await Promise.all([
        subMasterAPI.list('ppc_priority_schedule').catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      
      const fetchedOrders = ordRes?.data || [];
      if (fetchedOrders.length === 0) {
        setOrders([{ id: 'ORD-2024-001', order_no: 'ORD-2024-001', buyer_name: 'H&M Sweden', expected_delivery_date: '2026-07-10' }]);
      } else {
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (delDateStr) => {
    if (!delDateStr) return '';
    const today = new Date();
    const target = new Date(delDateStr);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculatePosition = (priority, days) => {
    if (priority === 'High') return '1st in queue';
    if (days < 10) return '2nd in queue';
    if (days < 20) return '3rd in queue';
    return '4th in queue';
  };

  const handleOrderChange = (e) => {
    const selectedOrderId = e.target.value;
    const order = orders.find(o => o.order_no === selectedOrderId || o.id.toString() === selectedOrderId);
    if (!order) {
      setFormData(prev => ({ ...prev, order_id: '', buyer_name: '', delivery_date: '', days_to_delivery: '', scheduled_position: '' }));
      return;
    }
    
    const delDate = order.expected_delivery_date || '2026-07-10';
    const buyer = order.buyer_name || order.party_name || 'H&M Sweden';
    const days = calculateDays(delDate);
    const pos = calculatePosition(formData.priority_level, days);

    setFormData(prev => ({
      ...prev,
      order_id: selectedOrderId,
      buyer_name: buyer,
      delivery_date: delDate,
      days_to_delivery: days,
      scheduled_position: pos
    }));
  };

  const handlePriorityChange = (e) => {
    const p = e.target.value;
    const pos = calculatePosition(p, formData.days_to_delivery);
    setFormData(prev => ({ ...prev, priority_level: p, scheduled_position: pos }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_priority_schedule', {
        name: formData.order_id,
        code: formData.priority_level,
        extra_field_1: formData.scheduled_position,
        extra_field_2: `${formData.days_to_delivery} days`,
        description: `Reason: ${formData.priority_reason}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating schedule.');
    }
  };

  const handleEdit = (record) => {
    const reasonMatch = record.description?.match(/Reason: (.*)/);
    setFormData({
      id: record.id,
      order_id: record.name,
      buyer_name: '', // Requires fetch
      delivery_date: '',
      priority_level: record.code,
      priority_reason: reasonMatch ? reasonMatch[1] : '',
      scheduled_position: record.extra_field_1,
      days_to_delivery: record.extra_field_2 ? record.extra_field_2.replace(' days', '') : ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this priority setting?')) return;
    try {
      await subMasterAPI.delete('ppc_priority_schedule', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target style={{ color: '#d946ef' }} /> Priority Scheduling
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage production queue based on urgency and delivery dates</p>
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
            <div style={{ background: '#fae8ff', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Target size={24} style={{ color: '#d946ef' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Queue</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>High Priority</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.filter(r => r.code === 'High').length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#e0e7ff', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Clock size={24} style={{ color: '#4f46e5' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Normal Priority</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.filter(r => r.code === 'Normal').length}</div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#d946ef18', borderRadius: 10, color: '#d946ef' }}>
                <Target size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Configure Queue Priority</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Elevate or demote orders in the production queue</p>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Delivery Date (Auto-fill)</label>
                <input type="date" className="form-control" value={formData.delivery_date} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Priority Level</label>
                <select className="form-control" value={formData.priority_level} onChange={handlePriorityChange} required>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority Reason</label>
                <input type="text" className="form-control" value={formData.priority_reason} onChange={e => setFormData({...formData, priority_reason: e.target.value})} placeholder="e.g. Urgent shipment" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Scheduled Position (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.scheduled_position} readOnly style={{ backgroundColor: formData.priority_level === 'High' ? '#ef444418' : '#d946ef18', borderColor: formData.priority_level === 'High' ? '#ef4444' : '#d946ef', color: formData.priority_level === 'High' ? '#b91c1c' : '#c026d3', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Days to Delivery (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.days_to_delivery ? `${formData.days_to_delivery} days` : ''} readOnly style={{ backgroundColor: formData.days_to_delivery < 10 ? '#ef444418' : 'var(--bg-secondary)', color: formData.days_to_delivery < 10 ? '#b91c1c' : 'inherit', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#d946ef', borderColor: '#d946ef' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Priority
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Active Queue ({filteredRecords.length})</h3>
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
                    order_id: '', buyer_name: '', delivery_date: '', priority_level: 'Normal',
                    priority_reason: '', scheduled_position: '', days_to_delivery: ''
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#d946ef', borderColor: '#d946ef', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> Assign Priority
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Order ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Priority Level</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Queue Position</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Time Left</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        backgroundColor: record.code === 'High' ? '#ef444420' : '#3b82f620',
                        color: record.code === 'High' ? '#b91c1c' : '#1d4ed8'
                      }}>
                        {record.code}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}><span style={{ color: '#c026d3', fontWeight: 600 }}>{record.extra_field_1}</span></td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{record.extra_field_2} <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({record.description})</span></td>
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
      )}
    </div>
  );
}
