import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, PlusCircle, FileText, RotateCcw, Users, CheckCircle } from 'lucide-react';

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredReturns = returns.filter(ret => 
    ret.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: '#6366f1' }} /> Return Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Deposit unused or extra items back to the main stores</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setFormData({ department: departments[0]?.name || '', employee: '', itemId: itemsList[0]?.id || '', qty: 1, reason: '' });
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New Return Entry
          </button>
        ) : (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-icon purple">
                <RotateCcw size={24} />
              </div>
              <div className="stat-info">
                <h3>{returns.length}</h3>
                <p>Total Returns</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon emerald">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{returns.reduce((sum, r) => sum + r.qty, 0)}</h3>
                <p>Items Returned</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon cyan">
                <PlusCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{new Set(returns.map(r => r.itemId)).size}</h3>
                <p>Unique Items</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon amber">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <h3>{new Set(returns.map(r => r.employee)).size}</h3>
                <p>Employees Returned</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Returns ({filteredReturns.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search returns..."
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
                  <th>Return No</th>
                  <th>Date</th>
                  <th>Department</th>
                  <th>Employee</th>
                  <th>Item</th>
                  <th style={{ textAlign: "right" }}>Returned Qty</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredReturns.map(ret => {
                  const itm = itemsList.find(x => x.id === ret.itemId);
                  return (
                    <tr key={ret.id}>
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{ret.id}</td>
                      <td>{ret.date}</td>
                      <td style={{ fontWeight: 600 }}>{ret.department}</td>
                      <td>{ret.employee}</td>
                      <td style={{ fontWeight: 600 }}>{itm?.name || 'Item'}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          {ret.qty}
                        </span>
                      </td>
                      <td style={{ color: '#64748b' }}>{ret.reason || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
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
            </div>

            <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Select Returned Item <span style={{ color: '#ef4444' }}>*</span></label>
                  <select 
                    value={formData.itemId} 
                    onChange={(e) => setFormData({...formData, itemId: e.target.value})} 
                    className="form-control"
                  >
                    {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Returned Qty <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" required min="1" value={formData.qty} 
                    onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} 
                    className="form-control" 
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Return</label>
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
