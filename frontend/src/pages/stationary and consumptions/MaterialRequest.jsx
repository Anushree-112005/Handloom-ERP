import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, PlusCircle } from 'lucide-react';

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

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Material Request</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Raise material requests for your department consumables</p>
            </div>
            <button onClick={() => {
              setFormData({ department: departments[0]?.name || '', requestedBy: '', priority: 'Medium', remarks: '', items: [] });
              setView('form');
            }} className="btn btn-primary">
              <Plus size={16} /> Raise Request
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th >Request No</th>
                  <th >Date</th>
                  <th >Department</th>
                  <th >Requested By</th>
                  <th >Priority</th>
                  <th >Status</th>
                  <th style={{ textAlign: "right" }}>Total Items</th>
                </tr>
              </thead>
              <tbody >
                {requests.map(req => (
                  <tr key={req.id} >
                    <td style={{ fontFamily: "monospace" }}>{req.id}</td>
                    <td >{req.date}</td>
                    <td style={{ fontWeight: 600 }}>{req.department}</td>
                    <td >{req.requestedBy}</td>
                    <td >
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${req.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td >
                      <span className={`badge ${(req.status === 'Approved' ? 'bg-green-100 text-green-800' : req.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')}`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{req.items.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card animate-fade">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Raise Material Request</h2>
            <button onClick={() => setView('list')} style={{ padding: 4, borderRadius: "var(--radius-sm)", cursor: "pointer", background: "none", border: "none" }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="form-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div>
                <label >Department *</label>
                <select 
                  value={formData.department} 
                  onChange={(e) => setFormData({...formData, department: e.target.value})} 
                  className="form-control"
                >
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label >Requested By *</label>
                <input 
                  type="text" required value={formData.requestedBy} 
                  onChange={(e) => setFormData({...formData, requestedBy: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Priority *</label>
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
            <div>
              <label >Remarks</label>
              <textarea 
                value={formData.remarks} 
                onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
                className="form-control" 
                rows="2"
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="card-title">Requested Items Grid</h3>
                <button type="button" onClick={handleAddField} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold text-sm">
                  <PlusCircle size={16} /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((field, idx) => (
                  <div key={idx} className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-dashed">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-500 font-semibold mb-1">Item</label>
                      <select 
                        value={field.itemId} 
                        onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)} 
                        className="form-control"
                      >
                        {itemsList.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock || 0})</option>)}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs text-slate-500 font-semibold mb-1">Request Qty</label>
                      <input 
                        type="number" required min="1" value={field.qty} 
                        onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))} 
                        className="form-control" 
                      />
                    </div>
                    <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 20 }}>
              <button type="button" onClick={() => setView('list')} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
