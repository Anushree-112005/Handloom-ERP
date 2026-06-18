import React, { useState, useEffect } from 'react';
import { Layers, Search, Save, ArrowLeft, Plus, Trash2, Eye, Edit2 } from 'lucide-react';
import { ppcAPI, buyerOrderAPI } from '../../services/api';

export default function OrderAllocation() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: null,
    allocation_id: '',
    order_id: '',
    loom_id: '',
    fabric_type: '',
    allocated_meters: '',
    priority: 'Normal',
    allocation_date: new Date().toISOString().split('T')[0],
    allocated_by: 'Login User', // Default / mock for now
    status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, ordRes, loomsRes] = await Promise.all([
        ppcAPI.getAllocations().catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setRecords(allocRes?.data || []);
      
      const fetchedOrders = ordRes?.data || [];
      if (fetchedOrders.length === 0) {
        setOrders([{ id: 'ORD-2024-001', order_no: 'ORD-2024-001', fabric_quality: 'Cotton Poplin' }]);
      } else {
        setOrders(fetchedOrders);
      }

      setLooms(loomsRes?.data || []);
    } catch (err) {
      if (err?.message !== 'Request aborted' && err?.code !== 'ERR_CANCELED') {
        console.error("Failed to fetch data", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (e) => {
    const selectedOrderId = e.target.value;
    const order = orders.find(o => o.order_no === selectedOrderId || o.id.toString() === selectedOrderId);
    
    setFormData(prev => ({
      ...prev,
      order_id: selectedOrderId,
      fabric_type: order ? (order.fabric_quality || order.quality || 'Cotton Poplin') : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const actualLoom = looms.find(l => l.loom_name === formData.loom_id || l.id.toString() === formData.loom_id);
      const payload = {
        loom_id: actualLoom ? actualLoom.id : 1, // Fallback if mismatched
        order_id: formData.order_id,
        fabric_type: formData.fabric_type,
        assigned_meters: parseFloat(formData.allocated_meters),
        // Additional mock fields to satisfy DB if required:
        warp_ends: 0,
        weft_density: 0,
        allocation_status: formData.status
      };
      
      if (formData.id) {
        await ppcAPI.updateAllocation(formData.id, payload);
      } else {
        await ppcAPI.createAllocation(payload);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating allocation.');
    }
  };

  const handleEdit = (record) => {
    setFormData({
      id: record.id,
      allocation_id: `LA-${record.id.toString().padStart(3, '0')}`,
      order_id: record.order_id,
      loom_id: record.loom_name || record.loom_id,
      fabric_type: record.fabric_type || '',
      allocated_meters: record.assigned_meters,
      priority: 'Normal',
      allocation_date: new Date().toISOString().split('T')[0],
      allocated_by: 'Login User',
      status: record.allocation_status || 'Pending'
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allocation?')) return;
    try {
      await ppcAPI.deleteAllocation(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete allocation');
    }
  };

  const filteredRecords = records.filter(r => 
    r.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.fabric_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers style={{ color: '#10b981' }} /> Loom Allocation
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Assign verified orders directly to specific looms</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                id: null,
                allocation_id: `LA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                order_id: '', loom_id: '', fabric_type: '', allocated_meters: '',
                priority: 'Normal', allocation_date: new Date().toISOString().split('T')[0],
                allocated_by: 'Login User', status: 'Pending'
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#10b981', borderColor: '#10b981' }}
          >
            <Plus size={16} /> New Allocation
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#10b98118', borderRadius: 10, color: '#10b981' }}>
                <Layers size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Create New Loom Allocation</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Assign target meters to a specific machine</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#10b98118', color: '#047857', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.allocation_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" name="order_id" value={formData.order_id} onChange={handleOrderChange} required>
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Fabric Type (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.fabric_type} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={e => setFormData({...formData, loom_id: e.target.value})} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.loom_name}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Allocated Meters</label>
                <input type="number" className="form-control" value={formData.allocated_meters} onChange={e => setFormData({...formData, allocated_meters: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Allocation Date</label>
                <input type="date" className="form-control" value={formData.allocation_date} onChange={e => setFormData({...formData, allocation_date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Status (Auto)</label>
                <input type="text" className="form-control" value={formData.status} readOnly style={{ backgroundColor: '#f59e0b18', borderColor: '#f59e0b', color: '#b45309', fontWeight: 600 }} />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: 300 }}>
              <label>Allocated By (Auto)</label>
              <input type="text" className="form-control" value={formData.allocated_by} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Create Allocation
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Allocations ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search allocations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Fabric Type</th>
                  <th>Assigned Meters</th>
                  <th>Loom ID</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>{record.order_id}</td>
                    <td>{record.fabric_type}</td>
                    <td><span style={{ color: '#10b981', fontWeight: 600 }}>{record.assigned_meters} m</span></td>
                    <td><span style={{ backgroundColor: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>{record.loom_id}</span></td>
                    <td>
                       <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        backgroundColor: record.allocation_status === 'Completed' ? '#10b98120' : '#f59e0b20',
                        color: record.allocation_status === 'Completed' ? '#10b981' : '#b45309'
                      }}>
                        {record.allocation_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn-icon" onClick={() => handleEdit(record)} title="View/Edit">
                          <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button className="btn-icon" onClick={() => handleEdit(record)} title="Edit">
                          <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(record.id)} title="Delete">
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
