import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, FileText } from 'lucide-react';

export default function AdjustmentEntry() {
  const [view, setView] = useState('list');
  const [adjustments, setAdjustments] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [formData, setFormData] = useState({
    itemId: '', type: 'Damage', qty: 1, remarks: ''
  });

  useEffect(() => {
    setAdjustments(mockDb.get('consumables_adjustments') || []);
    setItemsList(mockDb.get('consumables_items'));
  }, [view]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAdj = {
      id: 'ADJ' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      itemId: formData.itemId || itemsList[0]?.id || '',
      type: formData.type,
      qty: formData.qty,
      remarks: formData.remarks
    };

    // Save adjustment record
    const current = mockDb.get('consumables_adjustments') || [];
    current.push(newAdj);
    mockDb.set('consumables_adjustments', current);

    // Update Stock (OUT for damages/loss, IN for surplus adjustments)
    const direction = (formData.type === 'Damage' || formData.type === 'Expired' || formData.type === 'Lost' || formData.type === 'Breakage') ? 'OUT' : 'IN';
    mockDb.postToLedger(newAdj.itemId, `Adjustment (${formData.type})`, newAdj.id, newAdj.qty, direction);

    alert('Stock adjustment saved and ledger posted!');
    setView('list');
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredAdjustments = adjustments.filter(adj => 
    adj.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: '#6366f1' }} /> Adjustment Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Reconcile stock deviations due to damages, expiration, breakage, or loss</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setFormData({ itemId: itemsList[0]?.id || '', type: 'Damage', qty: 1, remarks: '' });
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New Adjustment
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Adjustments ({filteredAdjustments.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search adjustments..."
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
                  <th>Adjustment No</th>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Reason Type</th>
                  <th style={{ textAlign: "right" }}>Qty Adjusted</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdjustments.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredAdjustments.map(adj => {
                  const itm = itemsList.find(x => x.id === adj.itemId);
                  const isNegative = ['Damage', 'Expired', 'Lost', 'Breakage'].includes(adj.type);
                  return (
                    <tr key={adj.id}>
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{adj.id}</td>
                      <td>{adj.date}</td>
                      <td style={{ fontWeight: 600 }}>{itm?.name || 'Item'}</td>
                      <td>
                        <span style={{ 
                          background: isNegative ? '#fff1f2' : '#f0fdf4', 
                          color: isNegative ? '#be123c' : '#15803d', 
                          padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 
                        }}>
                          {adj.type}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: isNegative ? '#ef4444' : '#10b981' }}>
                        {isNegative ? '-' : '+'}{adj.qty}
                      </td>
                      <td style={{ color: '#64748b' }}>{adj.remarks || '-'}</td>
                    </tr>
                  );
                })}
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Create Stock Adjustment</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Log missing, damaged or incorrectly counted items</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label>Select Item <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.itemId} 
                  onChange={(e) => setFormData({...formData, itemId: e.target.value})} 
                  className="form-control"
                >
                  {itemsList.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock || 0})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Reason Type <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})} 
                  className="form-control"
                >
                  <option value="Damage">Damage</option>
                  <option value="Expired">Expired</option>
                  <option value="Lost">Lost</option>
                  <option value="Breakage">Breakage</option>
                  <option value="Physical Difference">Physical Difference Correction</option>
                </select>
              </div>
            </div>

            <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Adjusted Qty <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" required min="1" value={formData.qty} 
                    onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} 
                    className="form-control" 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Remarks / Audit Notes <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="text" required value={formData.remarks} 
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
                    className="form-control" placeholder="E.g., Box damaged during transport"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
