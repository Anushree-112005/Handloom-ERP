import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X } from 'lucide-react';

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

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Adjustment Entry</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Reconcile stock deviations due to damages, expiration, breakage, or loss</p>
            </div>
            <button onClick={() => {
              setFormData({ itemId: itemsList[0]?.id || '', type: 'Damage', qty: 1, remarks: '' });
              setView('form');
            }} className="btn btn-primary">
              <Plus size={16} /> New Adjustment
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th >Adjustment No</th>
                  <th >Date</th>
                  <th >Item</th>
                  <th >Reason Type</th>
                  <th style={{ textAlign: "right" }}>Qty Adjusted</th>
                  <th >Remarks</th>
                </tr>
              </thead>
              <tbody >
                {adjustments.map(adj => {
                  const itm = itemsList.find(x => x.id === adj.itemId);
                  return (
                    <tr key={adj.id} >
                      <td style={{ fontFamily: "monospace" }}>{adj.id}</td>
                      <td >{adj.date}</td>
                      <td style={{ fontWeight: 600 }}>{itm?.name || 'Item'}</td>
                      <td >
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700`}>
                          {adj.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-red-600">-{adj.qty}</td>
                      <td >{adj.remarks || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card animate-fade" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Stock Adjustment</h2>
            <button onClick={() => setView('list')} style={{ padding: 4, borderRadius: "var(--radius-sm)", cursor: "pointer", background: "none", border: "none" }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label >Select Item *</label>
              <select 
                value={formData.itemId} 
                onChange={(e) => setFormData({...formData, itemId: e.target.value})} 
                className="form-control"
              >
                {itemsList.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock || 0})</option>)}
              </select>
            </div>
            <div>
              <label >Reason Type *</label>
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
            <div>
              <label >Adjusted Qty *</label>
              <input 
                type="number" required min="1" value={formData.qty} 
                onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} 
                className="form-control" 
              />
            </div>
            <div>
              <label >Remarks / Audit Notes *</label>
              <input 
                type="text" required value={formData.remarks} 
                onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
                className="form-control" 
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 20 }}>
              <button type="button" onClick={() => setView('list')} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
