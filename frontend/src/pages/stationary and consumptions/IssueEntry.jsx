import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, PlusCircle } from 'lucide-react';

export default function IssueEntry() {
  const [view, setView] = useState('list');
  const [issues, setIssues] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [formData, setFormData] = useState({
    department: '', employee: '', purpose: '', items: []
  });

  useEffect(() => {
    setIssues(mockDb.get('consumables_issues'));
    setItemsList(mockDb.get('consumables_items'));
    setDepartments(mockDb.get('consumables_departments'));
  }, [view]);

  const handleAddField = () => {
    const itm = itemsList[0];
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: itm?.id || '', qty: 1, rate: itm?.rate || 0 }]
    });
  };

  const handleItemChange = (index, itemId) => {
    const selected = itemsList.find(x => x.id === itemId);
    const updated = [...formData.items];
    updated[index] = {
      ...updated[index],
      itemId: selected.id,
      rate: selected.rate || 0
    };
    setFormData({ ...formData, items: updated });
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...formData.items];
    updated[index].qty = qty;
    setFormData({ ...formData, items: updated });
  };

  const handleRemoveField = (index) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Add items to issue.');
      return;
    }

    // Check availability
    for (let item of formData.items) {
      const dbItem = itemsList.find(x => x.id === item.itemId);
      if ((dbItem?.currentStock || 0) < item.qty) {
        alert(`Insufficient stock for ${dbItem?.name || 'item'}. Available: ${dbItem?.currentStock || 0}`);
        return;
      }
    }

    const newIssue = {
      id: 'ISS' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      department: formData.department || departments[0]?.name || 'Production',
      employee: formData.employee,
      purpose: formData.purpose,
      items: formData.items
    };

    // Save Issue
    mockDb.add('consumables_issues', newIssue);

    // Update Stock & Ledger (OUT)
    formData.items.forEach(item => {
      mockDb.postToLedger(item.itemId, 'Issue', newIssue.id, item.qty, 'OUT');
    });

    alert('Stock issued successfully!');
    setView('list');
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Issue Entry</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Issue consumable items to departments and employees</p>
            </div>
            <button onClick={() => {
              setFormData({ department: departments[0]?.name || '', employee: '', purpose: '', items: [] });
              setView('form');
            }} className="btn btn-primary">
              <Plus size={16} /> New Issue Entry
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th >Issue No</th>
                  <th >Date</th>
                  <th >Department</th>
                  <th >Issued To</th>
                  <th >Purpose</th>
                  <th style={{ textAlign: "right" }}>Total Items</th>
                </tr>
              </thead>
              <tbody >
                {issues.map(iss => (
                  <tr key={iss.id} >
                    <td style={{ fontFamily: "monospace" }}>{iss.id}</td>
                    <td >{iss.date}</td>
                    <td style={{ fontWeight: 600 }}>{iss.department}</td>
                    <td >{iss.employee}</td>
                    <td >{iss.purpose || '-'}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{iss.items.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New Store Issue Entry</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Process Issue
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 24 }}>
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
                <label >Employee Name *</label>
                <input 
                  type="text" required value={formData.employee} 
                  onChange={(e) => setFormData({...formData, employee: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Purpose / Remarks</label>
                <input 
                  type="text" value={formData.purpose} 
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})} 
                  className="form-control" 
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="card-title">Items to Issue</h3>
                <button type="button" onClick={handleAddField} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold text-sm">
                  <PlusCircle size={16} /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((field, idx) => {
                  const dbItem = itemsList.find(x => x.id === field.itemId);
                  return (
                    <div key={idx} className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-dashed text-xs">
                      <div className="flex-1">
                        <label className="block text-slate-500 mb-1">Item</label>
                        <select 
                          value={field.itemId} 
                          onChange={(e) => handleItemChange(idx, e.target.value)} 
                          className="form-control"
                        >
                          {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-slate-500 mb-1">Available Stock</label>
                        <input type="text" readOnly value={dbItem?.currentStock || 0} className="form-control" />
                      </div>
                      <div className="w-32">
                        <label className="block text-slate-500 mb-1">Issue Qty</label>
                        <input 
                          type="number" required min="1" max={dbItem?.currentStock || 1} value={field.qty} 
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))} 
                          className="form-control" 
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
