import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, PlusCircle, FileText } from 'lucide-react';

export default function MaterialRequest() {
  const [view, setView] = useState('list');
  const [requests, setRequests] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    department: '', requestedBy: '', priority: 'Medium', remarks: '', items: []
  });

  useEffect(() => {
    setRequests(mockDb.get('consumables_requests'));
    setItemsList(mockDb.get('consumables_items'));
    setDepartments(mockDb.get('consumables_departments'));
  }, [view]);

  const handleAddField = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: itemsList[0]?.id || '', qty: 1 }]
    });
  };

  const handleRemoveField = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item.');
      return;
    }
    const newReq = {
      id: 'REQ' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      department: formData.department || departments[0]?.name || 'Production',
      requestedBy: formData.requestedBy,
      priority: formData.priority,
      status: 'Pending',
      remarks: formData.remarks,
      items: formData.items.map(i => ({ ...i, approvedQty: 0 }))
    };
    mockDb.add('consumables_requests', newReq);
    setView('list');
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req => 
    req.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: '#6366f1' }} /> Department Request
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Raise material requests for your department consumables</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setFormData({ department: departments[0]?.name || '', requestedBy: '', priority: 'Medium', remarks: '', items: [] });
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Raise Request
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Requests ({filteredRequests.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search requests..."
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
                  <th>Request No</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Requested By</th>
                  <th style={{ textAlign: "center" }}>Priority</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Total Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRequests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{req.id}</td>
                    <td>{req.date}</td>
                    <td style={{ fontWeight: 600 }}>{req.department}</td>
                    <td>{req.requestedBy}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 12,
                        background: req.priority === 'High' ? '#ffe4e6' : req.priority === 'Low' ? '#f1f5f9' : '#e0e7ff',
                        color: req.priority === 'High' ? '#e11d48' : req.priority === 'Low' ? '#475569' : '#4f46e5'
                      }}>
                        {req.priority}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ 
                        color: req.status === 'Pending' ? '#d97706' : req.status === 'Approved' ? '#047857' : '#e11d48', 
                        fontWeight: 600, 
                        backgroundColor: req.status === 'Pending' ? '#fef3c7' : req.status === 'Approved' ? '#d1fae5' : '#ffe4e6', 
                        padding: '4px 10px', borderRadius: 12, fontSize: 12 
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {req.items.length} items
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: 10, background: '#6366f115', borderRadius: 10, color: '#6366f1' }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Raise Material Request</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Fill out the request details for your department</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label>Department <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.department} 
                  onChange={(e) => setFormData({...formData, department: e.target.value})} 
                  className="form-control"
                >
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Requested By <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" required value={formData.requestedBy} 
                  onChange={(e) => setFormData({...formData, requestedBy: e.target.value})} 
                  className="form-control" placeholder="E.g., John Doe"
                />
              </div>
              <div className="form-group">
                <label>Priority <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData({...formData, priority: e.target.value})} 
                  className="form-control"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Remarks / Notes</label>
              <textarea 
                value={formData.remarks} 
                onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
                className="form-control" 
                rows="2"
                placeholder="Any special instructions or context..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Requested Items Grid</h4>
                <button type="button" onClick={handleAddField} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <PlusCircle size={14} /> Add Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  No items added yet. Click 'Add Item'.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {formData.items.map((field, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Item</label>
                        <select 
                          value={field.itemId} 
                          onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)} 
                          className="form-control"
                        >
                          {itemsList.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock || 0})</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ width: '150px', margin: 0 }}>
                        <label>Request Qty</label>
                        <input 
                          type="number" required min="1" value={field.qty} 
                          onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))} 
                          className="form-control" 
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-secondary" style={{ padding: '10px 12px', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
