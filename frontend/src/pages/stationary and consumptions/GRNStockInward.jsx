import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X } from 'lucide-react';

export default function GRNStockInward() {
  const [view, setView] = useState('list');
  const [grns, setGrns] = useState([]);
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  
  const [selectedPoId, setSelectedPoId] = useState('');
  const [formData, setFormData] = useState({
    vendor: '', poId: '', invoiceNo: '', invoiceDate: '', items: []
  });

  useEffect(() => {
    setGrns(mockDb.get('consumables_grns'));
    setPOs(mockDb.get('consumables_pos'));
    setVendors(mockDb.get('consumables_vendors'));
    setItemsList(mockDb.get('consumables_items'));
  }, [view]);

  const handleLoadPO = (poId) => {
    setSelectedPoId(poId);
    const po = pos.find(p => p.id === poId);
    if (po) {
      setFormData({
        vendor: po.vendor,
        poId: po.id,
        invoiceNo: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: po.items.map(item => {
          const detail = itemsList.find(x => x.id === item.itemId);
          return {
            itemId: item.itemId,
            name: detail?.name || 'Item',
            orderedQty: item.qty,
            receivedQty: item.qty,
            acceptedQty: item.qty,
            rejectedQty: 0,
            rate: item.rate
          };
        })
      });
    }
  };

  const handleQtyChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = Number(value);
    if (field === 'receivedQty') {
      updated[index].acceptedQty = Number(value);
      updated[index].rejectedQty = 0;
    } else if (field === 'acceptedQty') {
      updated[index].rejectedQty = updated[index].receivedQty - Number(value);
    }
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('No items to inward.');
      return;
    }
    const newGrn = {
      id: 'GRN' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      vendor: formData.vendor,
      poId: formData.poId,
      invoiceNo: formData.invoiceNo,
      status: 'Accepted',
      items: formData.items
    };

    // Save GRN
    mockDb.add('consumables_grns', newGrn);

    // Update Stock Levels & post to Stock Ledger
    formData.items.forEach(item => {
      mockDb.postToLedger(item.itemId, 'GRN (Receipt)', newGrn.id, item.acceptedQty, 'IN');
    });

    // Update PO status to Completed
    if (formData.poId) {
      mockDb.update('consumables_pos', formData.poId, { status: 'Completed' });
    }

    alert('Stock Inwarded successfully! Stock levels updated.');
    setView('list');
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Goods Receipt Note (GRN)</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Inward received supplies and update stock counts</p>
            </div>
            <button onClick={() => {
              setFormData({ vendor: '', poId: '', invoiceNo: '', invoiceDate: '', items: [] });
              setSelectedPoId('');
              setView('form');
            }} className="btn btn-primary">
              <Plus size={16} /> New Stock Inward
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th >GRN No</th>
                  <th >Date</th>
                  <th >Vendor</th>
                  <th >PO Reference</th>
                  <th >Invoice Number</th>
                  <th style={{ textAlign: "right" }}>Total Items</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody >
                {grns.map(g => (
                  <tr key={g.id} >
                    <td style={{ fontFamily: "monospace" }}>{g.id}</td>
                    <td >{g.date}</td>
                    <td style={{ fontWeight: 600 }}>{g.vendor}</td>
                    <td className="px-6 py-4 text-sm font-mono">{g.poId || '-'}</td>
                    <td >{g.invoiceNo || '-'}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{g.items.length}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="btn btn-success">{g.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Goods Receipt Note Entry</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save GRN
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="form-row">
              <div>
                <label >Select Pending PO</label>
                <select 
                  value={selectedPoId} 
                  onChange={(e) => handleLoadPO(e.target.value)} 
                  className="form-control"
                >
                  <option value="">-- Select PO --</option>
                  {pos.filter(po => po.status === 'Ordered').map(po => (
                    <option key={po.id} value={po.id}>{po.id} ({po.vendor})</option>
                  ))}
                </select>
              </div>
              <div>
                <label >Vendor *</label>
                <input type="text" readOnly value={formData.vendor} className="form-control" />
              </div>
              <div>
                <label >Invoice Number *</label>
                <input 
                  type="text" required value={formData.invoiceNo} 
                  onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Invoice Date *</label>
                <input 
                  type="date" required value={formData.invoiceDate} 
                  onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})} 
                  className="form-control" 
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="card-title">Items Received</h3>
              <table className="form-control">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2 border-r">Item Name</th>
                    <th className="px-4 py-2 border-r text-center w-28">Ordered Qty</th>
                    <th className="px-4 py-2 border-r text-center w-28">Received Qty</th>
                    <th className="px-4 py-2 border-r text-center w-28">Accepted Qty</th>
                    <th className="px-4 py-2 border-r text-center w-28">Rejected Qty</th>
                    <th className="px-4 py-2 text-right w-32">Rate (₹)</th>
                  </tr>
                </thead>
                <tbody >
                  {formData.items.map((item, idx) => (
                    <tr key={idx} >
                      <td className="px-4 py-2 border-r font-semibold">{item.name}</td>
                      <td className="px-4 py-2 border-r text-center font-bold bg-slate-100">{item.orderedQty}</td>
                      <td className="px-4 py-2 border-r text-center">
                        <input 
                          type="number" required min="0" value={item.receivedQty} 
                          onChange={(e) => handleQtyChange(idx, 'receivedQty', e.target.value)} 
                          className="form-control" 
                        />
                      </td>
                      <td className="btn btn-success">
                        <input 
                          type="number" required min="0" max={item.receivedQty} value={item.acceptedQty} 
                          onChange={(e) => handleQtyChange(idx, 'acceptedQty', e.target.value)} 
                          className="form-control" 
                        />
                      </td>
                      <td className="btn btn-danger">{item.rejectedQty}</td>
                      <td className="px-4 py-2 text-right font-semibold">₹{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
