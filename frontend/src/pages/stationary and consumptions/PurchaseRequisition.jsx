import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Save, PlusCircle, Trash2, Settings } from 'lucide-react';

export default function PurchaseRequisition() {
  const [requisitions, setRequisitions] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [gridItems, setGridItems] = useState([]);
  const [requisitioner, setRequisitioner] = useState('');

  useEffect(() => {
    setItemsList(mockDb.get('consumables_items'));
    setRequisitions(mockDb.get('consumables_requisitions') || []);
  }, []);

  const handleAutoReorder = () => {
    // Filter items below min stock level
    const lowStock = itemsList.filter(i => (i.currentStock || 0) <= i.minStock);
    if (lowStock.length === 0) {
      alert('No items currently require auto-reorder.');
      return;
    }
    const newItems = lowStock.map(i => ({
      itemId: i.id,
      name: i.name,
      currentStock: i.currentStock || 0,
      minStock: i.minStock,
      qty: i.reorderQty || 50
    }));
    setGridItems(newItems);
  };

  const handleAddField = () => {
    const defaultItem = itemsList[0];
    setGridItems([...gridItems, {
      itemId: defaultItem.id,
      name: defaultItem.name,
      currentStock: defaultItem.currentStock || 0,
      minStock: defaultItem.minStock,
      qty: defaultItem.reorderQty || 20
    }]);
  };

  const handleItemChange = (index, itemId) => {
    const selected = itemsList.find(x => x.id === itemId);
    const updated = [...gridItems];
    updated[index] = {
      ...updated[index],
      itemId: selected.id,
      name: selected.name,
      currentStock: selected.currentStock || 0,
      minStock: selected.minStock,
      qty: selected.reorderQty || 20
    };
    setGridItems(updated);
  };

  const handleQtyChange = (index, qty) => {
    const updated = [...gridItems];
    updated[index].qty = qty;
    setGridItems(updated);
  };

  const handleRemoveField = (index) => {
    const updated = [...gridItems];
    updated.splice(index, 1);
    setGridItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (gridItems.length === 0) {
      alert('Add items to request.');
      return;
    }
    const newReq = {
      id: 'PRQ' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      requestedBy: requisitioner || 'Store Manager',
      status: 'Approved',
      items: gridItems
    };
    const current = mockDb.get('consumables_requisitions') || [];
    current.push(newReq);
    mockDb.set('consumables_requisitions', current);
    alert('Purchase Requisition saved!');
    setGridItems([]);
    setRequisitioner('');
    setRequisitions(current);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Purchase Requisition</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Request purchase of consumables manually or auto-generate from low stock</p>
        </div>
        <button onClick={handleAutoReorder} className="btn btn-primary">
          <Settings size={16} /> Auto-Load Low Stock
        </button>
      </div>

      <div className="form-row">
        <div className="lg:col-span-2 bg-white rounded-lg border p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Requisition Form</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label >Requisitioner Name / Store In-charge *</label>
              <input 
                type="text" required value={requisitioner} 
                onChange={(e) => setRequisitioner(e.target.value)} 
                className="form-control" 
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900">Items List</h4>
                <button type="button" onClick={handleAddField} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                  <PlusCircle size={14} /> Add Manual Item
                </button>
              </div>

              {gridItems.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-dashed text-xs">
                  <div className="flex-1">
                    <label className="block text-slate-500 mb-1">Select Item</label>
                    <select 
                      value={item.itemId} 
                      onChange={(e) => handleItemChange(idx, e.target.value)} 
                      className="form-control"
                    >
                      {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-slate-500 mb-1">Stock</label>
                    <input type="text" readOnly value={item.currentStock} className="form-control" />
                  </div>
                  <div className="w-24">
                    <label className="block text-slate-500 mb-1">Min Level</label>
                    <input type="text" readOnly value={item.minStock} className="form-control" />
                  </div>
                  <div className="w-24">
                    <label className="block text-slate-500 mb-1">Reorder Qty</label>
                    <input 
                      type="number" required min="1" value={item.qty} 
                      onChange={(e) => handleQtyChange(idx, Number(e.target.value))} 
                      className="form-control" 
                    />
                  </div>
                  <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 20 }}>
              <button type="submit" className="btn btn-success">
                <Save size={16} /> Save Requisition
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Recent Requisitions</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {requisitions.map(req => (
              <div key={req.id} className="p-3 bg-slate-50 rounded-lg border text-sm">
                <div className="card-header">
                  <span className="font-mono font-bold text-indigo-600">{req.id}</span>
                  <span className="text-xs text-slate-500">{req.date}</span>
                </div>
                <p className="text-xs text-slate-600">By: {req.requestedBy}</p>
                <div className="mt-2 text-xs font-semibold text-slate-700">
                  Items: {req.items.length} items requested
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
