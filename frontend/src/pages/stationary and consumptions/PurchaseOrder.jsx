import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Trash2, X, PlusCircle } from 'lucide-react';

export default function PurchaseOrder() {
  const [view, setView] = useState('list');
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [formData, setFormData] = useState({
    vendor: '', paymentTerms: '30 Days Credit', expectedDate: '', items: []
  });

  useEffect(() => {
    setPOs(mockDb.get('consumables_pos'));
    setVendors(mockDb.get('consumables_vendors'));
    setItemsList(mockDb.get('consumables_items'));
  }, [view]);

  const handleAddField = () => {
    const itm = itemsList[0];
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: itm?.id || '', qty: 1, rate: itm?.rate || 0, total: itm?.rate || 0 }]
    });
  };

  const handleItemChange = (index, itemId) => {
    const selected = itemsList.find(x => x.id === itemId);
    const updated = [...formData.items];
    updated[index] = {
      ...updated[index],
      itemId: selected.id,
      rate: selected.rate || 0,
      total: selected.rate * updated[index].qty
    };
    setFormData({ ...formData, items: updated });
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...formData.items];
    updated[index].qty = qty;
    updated[index].total = updated[index].rate * qty;
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
      alert('Add items to PO.');
      return;
    }
    const newPo = {
      id: 'PO' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      vendor: formData.vendor || vendors[0]?.name || 'Apex Supplies Ltd',
      paymentTerms: formData.paymentTerms,
      expectedDate: formData.expectedDate,
      status: 'Ordered',
      items: formData.items
    };
    mockDb.add('consumables_pos', newPo);
    setView('list');
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Purchase Order</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Issue Purchase Orders for replenishment of stock</p>
            </div>
            <button onClick={() => {
              setFormData({ vendor: vendors[0]?.name || '', paymentTerms: '30 Days Credit', expectedDate: '', items: [] });
              setView('form');
            }} className="btn btn-primary">
              <Plus size={16} /> Create PO
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th >PO No</th>
                  <th >Date</th>
                  <th >Vendor</th>
                  <th >Payment Terms</th>
                  <th >Expected Date</th>
                  <th style={{ textAlign: "right" }}>Value</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody >
                {pos.map(po => {
                  const val = po.items.reduce((acc, i) => acc + i.total, 0);
                  return (
                    <tr key={po.id} >
                      <td style={{ fontFamily: "monospace" }}>{po.id}</td>
                      <td >{po.date}</td>
                      <td style={{ fontWeight: 600 }}>{po.vendor}</td>
                      <td >{po.paymentTerms}</td>
                      <td >{po.expectedDate || '-'}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">₹{val.toLocaleString()}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card animate-fade">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Purchase Order</h2>
            <button onClick={() => setView('list')} style={{ padding: 4, borderRadius: "var(--radius-sm)", cursor: "pointer", background: "none", border: "none" }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="form-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div>
                <label >Select Vendor *</label>
                <select 
                  value={formData.vendor} 
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})} 
                  className="form-control"
                >
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label >Payment Terms</label>
                <input 
                  type="text" value={formData.paymentTerms} 
                  onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Expected Delivery Date *</label>
                <input 
                  type="date" required value={formData.expectedDate} 
                  onChange={(e) => setFormData({...formData, expectedDate: e.target.value})} 
                  className="form-control" 
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="card-title">PO Line Items</h3>
                <button type="button" onClick={handleAddField} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold text-sm">
                  <PlusCircle size={16} /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((field, idx) => (
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
                    <div className="w-28">
                      <label className="block text-slate-500 mb-1">Qty</label>
                      <input 
                        type="number" required min="1" value={field.qty} 
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))} 
                        className="form-control" 
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-slate-500 mb-1">Rate (₹)</label>
                      <input type="text" readOnly value={field.rate} className="form-control" />
                    </div>
                    <div className="w-36">
                      <label className="block text-slate-500 mb-1">Total (₹)</label>
                      <input type="text" readOnly value={field.total} className="form-control" />
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
                <Save size={16} /> Save Purchase Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
