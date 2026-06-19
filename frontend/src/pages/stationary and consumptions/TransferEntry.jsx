import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, FileText, ArrowRightLeft, CheckCircle, Layers, Home } from 'lucide-react';

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransfers = transfers.filter(trf => 
    trf.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trf.fromStore?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trf.toStore?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ color: '#6366f1' }} /> Transfer Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Transfer consumable stocks from main stores to sub-stores</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => {
            setFormData({ fromStore: 'Main Store', toStore: 'Production Store', itemId: itemsList[0]?.id || '', qty: 1 });
            setView('form');
          }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New Stock Transfer
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
                <ArrowRightLeft size={24} />
              </div>
              <div className="stat-info">
                <h3>{transfers.length}</h3>
                <p>Total Transfers</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon emerald">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{transfers.reduce((sum, t) => sum + t.qty, 0)}</h3>
                <p>Items Transferred</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon cyan">
                <Layers size={24} />
              </div>
              <div className="stat-info">
                <h3>{new Set(transfers.map(t => t.itemId)).size}</h3>
                <p>Unique Items</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon amber">
                <Home size={24} />
              </div>
              <div className="stat-info">
                <h3>{new Set(transfers.map(t => t.fromStore)).size}</h3>
                <p>Source Stores</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Transfers ({filteredTransfers.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search transfers..."
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
                  <th>Transfer No</th>
                  <th>Date</th>
                  <th>From Store</th>
                  <th>To Store</th>
                  <th>Item</th>
                  <th style={{ textAlign: "right" }}>Qty Transferred</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredTransfers.map(trf => {
                  const itm = itemsList.find(x => x.id === trf.itemId);
                  return (
                    <tr key={trf.id}>
                      <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{trf.id}</td>
                      <td>{trf.date}</td>
                      <td>{trf.fromStore}</td>
                      <td>{trf.toStore}</td>
                      <td style={{ fontWeight: 600 }}>{itm?.name || 'Item'}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        <span style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          {trf.qty}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: 10, background: '#6366f115', borderRadius: 10, color: '#6366f1' }}>
              <Plus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Create Transfer Entry</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Relocate items between stores and sub-stores</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label>From Store <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.fromStore} 
                  onChange={(e) => setFormData({...formData, fromStore: e.target.value})} 
                  className="form-control"
                >
                  <option value="Main Store">Main Store</option>
                  <option value="Admin Store">Admin Store</option>
                </select>
              </div>
              <div className="form-group">
                <label>To Store <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.toStore} 
                  onChange={(e) => setFormData({...formData, toStore: e.target.value})} 
                  className="form-control"
                >
                  <option value="Production Store">Production Store</option>
                  <option value="Housekeeping sub-store">Housekeeping sub-store</option>
                </select>
              </div>
            </div>

            <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Select Item <span style={{ color: '#ef4444' }}>*</span></label>
                  <select 
                    value={formData.itemId} 
                    onChange={(e) => setFormData({...formData, itemId: e.target.value})} 
                    className="form-control"
                  >
                    {itemsList.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock || 0})</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Qty to Transfer <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" required min="1" value={formData.qty} 
                    onChange={(e) => setFormData({...formData, qty: Number(e.target.value)})} 
                    className="form-control" 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Process Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
