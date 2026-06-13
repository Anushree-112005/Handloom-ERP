import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X } from 'lucide-react';

export default function TransferEntry() {
  const [view, setView] = useState('list');
  const [transfers, setTransfers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [formData, setFormData] = useState({
    fromStore: 'Main Store', toStore: 'Production Store', itemId: '', qty: 1
  });

  useEffect(() => {
    setTransfers(mockDb.get('consumables_transfers') || []);
    setItemsList(mockDb.get('consumables_items'));
  }, [view]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dbItem = itemsList.find(x => x.id === formData.itemId);
    if ((dbItem?.currentStock || 0) < formData.qty) {
      alert(`Insufficient stock. Available in Main Store: ${dbItem?.currentStock || 0}`);
      return;
    }

    const newTransfer = {
      id: 'TRF' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      fromStore: formData.fromStore,
      toStore: formData.toStore,
      itemId: formData.itemId || itemsList[0]?.id || '',
      qty: formData.qty
    };

    // Save Transfer
    const current = mockDb.get('consumables_transfers') || [];
    current.push(newTransfer);
    mockDb.set('consumables_transfers', current);

    // Ledger adjustments
    mockDb.postToLedger(newTransfer.itemId, `Transfer to ${newTransfer.toStore}`, newTransfer.id, newTransfer.qty, 'OUT');

    alert('Stock transfer completed successfully!');
    setView('list');
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Transfer Entry</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Transfer consumable stocks from main stores to sub-stores</p>
            </div>
            <button onClick={() => {
              setFormData({ fromStore: 'Main Store', toStore: 'Production Store', itemId: itemsList[0]?.id || '', qty: 1 });
              setView('form');
            }} className="btn btn-primary">
              <Plus size={16} /> New Stock Transfer
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th >Transfer No</th>
                  <th >Date</th>
                  <th >From Store</th>
                  <th >To Store</th>
                  <th >Item</th>
                  <th style={{ textAlign: "right" }}>Qty Transferred</th>
                </tr>
              </thead>
              <tbody >
                {transfers.map(trf => {
                  const itm = itemsList.find(x => x.id === trf.itemId);
                  return (
                    <tr key={trf.id} >
                      <td style={{ fontFamily: "monospace" }}>{trf.id}</td>
                      <td >{trf.date}</td>
                      <td >{trf.fromStore}</td>
                      <td >{trf.toStore}</td>
                      <td style={{ fontWeight: 600 }}>{itm?.name || 'Item'}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{trf.qty}</td>
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
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Transfer Entry</h2>
            <button onClick={() => setView('list')} style={{ padding: 4, borderRadius: "var(--radius-sm)", cursor: "pointer", background: "none", border: "none" }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label >From Store *</label>
              <select 
                value={formData.fromStore} 
                onChange={(e) => setFormData({...formData, fromStore: e.target.value})} 
                className="form-control"
              >
                <option value="Main Store">Main Store</option>
                <option value="Admin Store">Admin Store</option>
              </select>
            </div>
            <div>
              <label >To Store *</label>
              <select 
                value={formData.toStore} 
                onChange={(e) => setFormData({...formData, toStore: e.target.value})} 
                className="form-control"
              >
                <option value="Production Store">Production Store</option>
                <option value="Housekeeping sub-store">Housekeeping sub-store</option>
              </select>
            </div>
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
              <label >Qty to Transfer *</label>
              <input 
                type="number" required min="1" value={formData.qty} 
                onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} 
                className="form-control" 
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 20 }}>
              <button type="button" onClick={() => setView('list')} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Process Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
