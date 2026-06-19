import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, PlusCircle, FileText } from 'lucide-react';

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredIssues = issues.filter(iss => 
    iss.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iss.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iss.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: '#6366f1' }} /> Issue Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Issue consumable items to departments and employees</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setFormData({ department: departments[0]?.name || '', employee: '', purpose: '', items: [] });
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New Issue Entry
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Issue Entries ({filteredIssues.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Issue No</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Issued To</th>
                  <th>Purpose</th>
                  <th style={{ textAlign: "right" }}>Total Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredIssues.map(iss => (
                  <tr key={iss.id}>
                    <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{iss.id}</td>
                    <td>{iss.date}</td>
                    <td style={{ fontWeight: 600 }}>{iss.department}</td>
                    <td>{iss.employee}</td>
                    <td style={{ color: '#64748b' }}>{iss.purpose || '-'}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {iss.items.length} items
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>New Store Issue Entry</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Record items issued to an employee or department</p>
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
                <label>Employee Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" required value={formData.employee} 
                  onChange={(e) => setFormData({...formData, employee: e.target.value})} 
                  className="form-control" placeholder="E.g., John Doe"
                />
              </div>
              <div className="form-group">
                <label>Purpose / Remarks</label>
                <input 
                  type="text" value={formData.purpose} 
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})} 
                  className="form-control" placeholder="Reason for issue..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Items to Issue</h4>
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
                  {formData.items.map((field, idx) => {
                    const dbItem = itemsList.find(x => x.id === field.itemId);
                    return (
                      <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div className="form-group" style={{ flex: 2, margin: 0 }}>
                          <label>Item</label>
                          <select 
                            value={field.itemId} 
                            onChange={(e) => handleItemChange(idx, e.target.value)} 
                            className="form-control"
                          >
                            {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label>Available Stock</label>
                          <input type="text" readOnly value={dbItem?.currentStock || 0} className="form-control" style={{ background: '#f8fafc', color: dbItem?.currentStock > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }} />
                        </div>
                        <div className="form-group" style={{ flex: 1, margin: 0 }}>
                          <label>Issue Qty</label>
                          <input 
                            type="number" required min="1" max={dbItem?.currentStock || 1} value={field.qty} 
                            onChange={(e) => handleQtyChange(idx, Number(e.target.value))} 
                            className="form-control" 
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-secondary" style={{ padding: '10px 12px', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Process Issue
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
