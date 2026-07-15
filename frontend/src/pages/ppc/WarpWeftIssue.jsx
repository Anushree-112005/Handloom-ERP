import React, { useState, useEffect } from 'react';
import { Package, Search, Save } from 'lucide-react';
import { ppcWarpDeliveryAPI, ppcAPI, buyerOrderAPI } from '../../services/api';

export default function WarpWeftIssue() {
  const [requisitions, setRequisitions] = useState([]);
  const [looms, setLooms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allocations, setAllocations] = useState([]);
  
  const [formData, setFormData] = useState({
    order_id: '', loom_id: '', warp_configuration: '', weft_configuration: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, loomRes, ordRes, allocRes] = await Promise.all([
        ppcWarpDeliveryAPI.list().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] })),
        ppcAPI.getAllocations().catch(() => ({ data: [] }))
      ]);
      setRequisitions(reqRes?.data || []);
      setLooms(loomRes?.data || []);
      setOrders(ordRes?.data || []);
      setAllocations(allocRes?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderChange = (e) => {
    const oId = e.target.value;
    setFormData(prev => ({ ...prev, order_id: oId }));
    
    // Auto-fill loom if order is already allocated
    const alloc = allocations.find(a => a.order_id === oId);
    if (alloc) {
      setFormData(prev => ({ ...prev, loom_id: alloc.loom_id.toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ppcWarpDeliveryAPI.create({
        requisition_id: `REQ-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        order_id: formData.order_id,
        loom_id: parseInt(formData.loom_id) || 1,
        warp_configuration: formData.warp_configuration,
        weft_configuration: formData.weft_configuration,
        status: 'Pending'
      });
      setFormData({ order_id: '', loom_id: '', warp_configuration: '', weft_configuration: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating requisition');
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package style={{ color: 'var(--primary)' }} /> Warp & Weft Issue (Yarn Requisition)
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage yarn material requests for assigned loom orders.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Requisitions</h3>
            <div className="search-bar" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search..." className="form-control" style={{ paddingLeft: 36, width: 200 }} />
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Order</th>
                  <th>Loom</th>
                  <th>Warp Configuration</th>
                  <th>Weft Configuration</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((req, i) => {
                  const loomName = looms.find(l => l.id === req.loom_id)?.loom_name || `ID:${req.loom_id}`;
                  return (
                  <tr key={req.id || i}>
                    <td><span style={{ fontWeight: 600, color: 'var(--primary)' }}>{req.requisition_id}</span></td>
                    <td>{req.order_id}</td>
                    <td>{loomName}</td>
                    <td>{req.warp_configuration}</td>
                    <td>{req.weft_configuration}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        backgroundColor: req.status === 'Pending' ? '#f59e0b20' : '#10b98120',
                        color: req.status === 'Pending' ? '#f59e0b' : '#10b981'
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'Pending' && (
                        <button 
                          className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={async () => {
                            try {
                              await warpDeliveryAPI.update(req.id, { ...req, status: 'Issued' });
                              fetchData();
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                        >Mark Issued</button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
          <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 16px 0' }}>New Requisition</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Order ID *</label>
              <select className="form-control" value={formData.order_id} onChange={handleOrderChange} required>
                <option value="">-- Select Order --</option>
                {orders.map(o => (
                  <option key={o.id} value={o.order_no || o.ibpo_number || o.id}>{o.order_no || o.ibpo_number}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Target Loom *</label>
              <select className="form-control" value={formData.loom_id} onChange={e => setFormData({...formData, loom_id: e.target.value})} required>
                <option value="">-- Select Loom --</option>
                {looms.map(l => (
                  <option key={l.id} value={l.id}>{l.loom_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Warp Details *</label>
              <input 
                type="text" className="form-control" 
                value={formData.warp_configuration} onChange={e => setFormData({...formData, warp_configuration: e.target.value})}
                required placeholder="e.g. Cotton 40s (10,000 ends)"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Weft Details *</label>
              <input 
                type="text" className="form-control" 
                value={formData.weft_configuration} onChange={e => setFormData({...formData, weft_configuration: e.target.value})}
                required placeholder="e.g. Linen 30s"
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
              <Save size={16} style={{ marginRight: 8 }} /> Generate Requisition
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
