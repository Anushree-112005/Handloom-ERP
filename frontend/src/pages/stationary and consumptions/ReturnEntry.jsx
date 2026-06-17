import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X } from 'lucide-react';

export default function ReturnEntry() {
  const [view, setView] = useState('list');
  const [returns, setReturns] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [formData, setFormData] = useState({
    department: '', employee: '', itemId: '', qty: 1, reason: ''
  });

  useEffect(() => {
    setReturns(mockDb.get('consumables_returns') || []);
    setItemsList(mockDb.get('consumables_items'));
    setDepartments(mockDb.get('consumables_departments'));
  }, [view]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newReturn = {
      id: 'RET' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      department: formData.department || departments[0]?.name || 'Production',
      employee: formData.employee,
      itemId: formData.itemId || itemsList[0]?.id || '',
      qty: formData.qty,
      reason: formData.reason
    };

    // Save Return
    const current = mockDb.get('consumables_returns') || [];
    current.push(newReturn);
    mockDb.set('consumables_returns', current);

    // Update Stock & Ledger (IN)
    mockDb.postToLedger(newReturn.itemId, 'Return (Deposit)', newReturn.id, newReturn.qty, 'IN');

    alert('Return processed successfully! Stock returned to store.');
    setView('list');
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Return Entry</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Deposit unused or extra items back to the main stores</p>
            </div>
            <button onClick={() => {
              setFormData({ department: departments[0]?.name || '', employee: '', itemId: itemsList[0]?.id || '', qty: 1, reason: '' });
              setView('form');
            }} className="btn btn-primary">
              <Plus size={16} /> New Return Entry
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th >Return No</th>
                  <th >Date</th>
                  <th >Department</th>
                  <th >Employee</th>
                  <th >Item</th>
                  <th style={{ textAlign: "right" }}>Returned Qty</th>
                  <th >Reason</th>
                </tr>
              </thead>
              <tbody >
                {returns.map(ret => {
                  const itm = itemsList.find(x => x.id === ret.itemId);
                  return (
                    <tr key={ret.id} >
                      <td style={{ fontFamily: "monospace" }}>{ret.id}</td>
                      <td >{ret.date}</td>
                      <td style={{ fontWeight: 600 }}>{ret.department}</td>
                      <td >{ret.employee}</td>
                      <td >{itm?.name || 'Item'}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{ret.qty}</td>
                      <td >{ret.reason || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Create Return Entry</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save Return
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 16 }}>
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
              <label >Select Returned Item *</label>
              <select 
                value={formData.itemId} 
                onChange={(e) => setFormData({...formData, itemId: e.target.value})} 
                className="form-control"
              >
                {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label >Returned Qty *</label>
              <input 
                type="number" required min="1" value={formData.qty} 
                onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} 
                className="form-control" 
              />
            </div>
            <div>
              <label >Reason for Return</label>
              <input 
                type="text" value={formData.reason} 
                onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                placeholder="E.g., unused extra boxes, wrong size safety gloves"
                className="form-control" 
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
