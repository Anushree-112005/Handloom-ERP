import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Save, PlusCircle, Trash2, Settings, ShoppingCart, Clock, CheckCircle, FileText, Layers } from 'lucide-react';

export default function PurchaseRequisition() {
  const [requisitions, setRequisitions] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [gridItems, setGridItems] = useState([]);
  const [requisitioner, setRequisitioner] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setItemsList(mockDb.get('consumables_items') || []);
    setRequisitions(mockDb.get('consumables_requisitions') || []);
  }, []);

  const handleAutoReorder = () => {
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
    if (itemsList.length === 0) return;
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
      status: 'Pending',
      items: gridItems
    };
    const current = mockDb.get('consumables_requisitions') || [];
    current.push(newReq);
    mockDb.set('consumables_requisitions', current);
    alert('Purchase Requisition saved!');
    setGridItems([]);
    setRequisitioner('');
    setRequisitions(current);
    setIsFormOpen(false);
  };

  const filteredRecords = requisitions.filter(r => 
    r.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart style={{ color: '#6366f1' }} /> Purchase Requisitions
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Manage consumable requests and approvals</p>
        </div>
        {!isFormOpen ? (
          <button onClick={() => setIsFormOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusCircle size={16} /> New Requisition
          </button>
        ) : (
          <button onClick={() => setIsFormOpen(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to List
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#6366f115', borderRadius: 10, color: '#6366f1' }}>
                <PlusCircle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>New Requisition Form</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Request items manually or auto-load low stock</p>
              </div>
            </div>
            <button onClick={handleAutoReorder} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4f46e5', borderColor: '#c7d2fe', background: '#e0e7ff' }}>
              <Settings size={16} /> Auto-Load Low Stock
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ maxWidth: 400 }}>
              <label>Requisitioner Name / Store In-charge <span style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" required value={requisitioner} 
                onChange={(e) => setRequisitioner(e.target.value)} 
                className="form-control" 
                placeholder="Enter full name"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Items List</h4>
                <button type="button" onClick={handleAddField} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <PlusCircle size={14} /> Add Manual Item
                </button>
              </div>

              {gridItems.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  No items added yet. Click 'Add Manual Item' or 'Auto-Load Low Stock'.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {gridItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div className="form-group" style={{ flex: 2, margin: 0 }}>
                        <label>Select Item</label>
                        <select 
                          value={item.itemId} 
                          onChange={(e) => handleItemChange(idx, e.target.value)} 
                          className="form-control"
                        >
                          {itemsList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Stock</label>
                        <input type="text" readOnly value={item.currentStock} className="form-control" style={{ background: '#f8fafc', fontWeight: 600 }} />
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Min Level</label>
                        <input type="text" readOnly value={item.minStock} className="form-control" style={{ background: '#f8fafc' }} />
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label>Qty to Order</label>
                        <input 
                          type="number" required min="1" value={item.qty} 
                          onChange={(e) => handleQtyChange(idx, Number(e.target.value))} 
                          className="form-control" 
                          style={{ borderColor: '#6366f1' }}
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveField(idx)} className="btn btn-secondary" style={{ padding: '10px 12px', color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 8, gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Save Requisition
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-icon purple">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <h3>{requisitions.length}</h3>
                <p>Total Requisitions</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon amber">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>{requisitions.filter(r => r.status === 'Pending').length}</h3>
                <p>Pending Requisitions</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon emerald">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{requisitions.filter(r => r.status !== 'Pending').length}</h3>
                <p>Approved / Completed</p>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-icon cyan">
                <Layers size={24} />
              </div>
              <div className="stat-info">
                <h3>{requisitions.reduce((sum, r) => sum + (r.items?.length || 0), 0)}</h3>
                <p>Total Items Requested</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Requisitions ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search..."
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
                  <th>Req. ID</th>
                  <th>Date</th>
                  <th>Requested By</th>
                  <th>Total Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((req, idx) => (
                  <tr key={req.id || idx}>
                    <td style={{ fontWeight: 600, color: '#4f46e5' }}>{req.id}</td>
                    <td>{req.date}</td>
                    <td>{req.requestedBy}</td>
                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{req.items?.length || 0} items</span></td>
                    <td>
                      <span style={{ 
                        color: req.status === 'Pending' ? '#d97706' : '#047857', 
                        fontWeight: 600, 
                        backgroundColor: req.status === 'Pending' ? '#fef3c7' : '#d1fae5', 
                        padding: '4px 10px', borderRadius: 12, fontSize: 12 
                      }}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
