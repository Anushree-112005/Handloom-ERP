import React, { useState } from 'react';
import { Package, Search, Save } from 'lucide-react';

export default function WarpWeftIssue() {
  const [requisitions, setRequisitions] = useState([
    { id: 'REQ-1001', order: 'PO-2026-101', loom: 'Loom L1', status: 'Pending', warp: 'Cotton 40s (12,000 ends)', weft: 'Polyester 150D', date: '2026-06-12' },
    { id: 'REQ-1002', order: 'PO-2026-205', loom: 'Loom L3', status: 'Issued', warp: 'Linen Blend (8,500 ends)', weft: 'Cotton 30s', date: '2026-06-11' },
  ]);

  const [formData, setFormData] = useState({
    order: '', loom: '', warp: '', weft: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setRequisitions([...requisitions, { 
      id: `REQ-${1000 + requisitions.length + 1}`, 
      order: formData.order, loom: formData.loom, 
      warp: formData.warp, weft: formData.weft, 
      status: 'Pending', 
      date: new Date().toISOString().split('T')[0] 
    }]);
    setFormData({ order: '', loom: '', warp: '', weft: '' });
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
                {requisitions.map((req, i) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 600, color: 'var(--primary)' }}>{req.id}</span></td>
                    <td>{req.order}</td>
                    <td>{req.loom}</td>
                    <td>{req.warp}</td>
                    <td>{req.weft}</td>
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
                          onClick={() => {
                            const newReq = [...requisitions];
                            newReq[i].status = 'Issued';
                            setRequisitions(newReq);
                          }}
                        >Mark Issued</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
          <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 16px 0' }}>New Requisition</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Order ID *</label>
              <input 
                type="text" className="form-control" 
                value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})}
                required placeholder="e.g. PO-2026-105"
              />
            </div>
            <div className="form-group">
              <label>Target Loom *</label>
              <input 
                type="text" className="form-control" 
                value={formData.loom} onChange={e => setFormData({...formData, loom: e.target.value})}
                required placeholder="e.g. Loom L2"
              />
            </div>
            <div className="form-group">
              <label>Warp Details *</label>
              <input 
                type="text" className="form-control" 
                value={formData.warp} onChange={e => setFormData({...formData, warp: e.target.value})}
                required placeholder="e.g. Cotton 40s (10,000 ends)"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Weft Details *</label>
              <input 
                type="text" className="form-control" 
                value={formData.weft} onChange={e => setFormData({...formData, weft: e.target.value})}
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
