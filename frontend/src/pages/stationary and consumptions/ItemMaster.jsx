import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Edit2, Trash2, Search, X } from 'lucide-react';

export default function ItemMaster() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '', code: '', category: '', uom: '', brand: '', hsnCode: '', gstPercent: 18, status: 'Active',
    minStock: 10, maxStock: 100, safetyStock: 5, reorderQty: 20, vendor: '', rate: 0
  });

  useEffect(() => {
    setItems(mockDb.get('consumables_items'));
    setCategories(mockDb.get('consumables_categories'));
    setUoms(mockDb.get('consumables_uoms'));
    setVendors(mockDb.get('consumables_vendors'));
  }, [view]);

  const handleOpenForm = (item = null) => {
    if (item) {
      setFormData(item);
      setEditingId(item.id);
    } else {
      setFormData({
        name: '', code: '', category: categories[0]?.name || '', uom: uoms[0]?.name || '', brand: '', hsnCode: '', gstPercent: 18, status: 'Active',
        minStock: 10, maxStock: 100, safetyStock: 5, reorderQty: 20, vendor: vendors[0]?.name || '', rate: 0
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      mockDb.delete('consumables_items', id);
      setItems(mockDb.get('consumables_items'));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...formData,
      currentStock: editingId ? (items.find(x => x.id === editingId)?.currentStock || 0) : 0
    };
    if (editingId) {
      mockDb.update('consumables_items', editingId, updated);
    } else {
      mockDb.add('consumables_items', {
        id: 'ITM' + Math.floor(Math.random() * 1000),
        ...updated
      });
    }
    setView('list');
  };

  const filtered = items.filter(itm => 
    itm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    itm.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Item Master</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Register stationery, packaging, and safety supplies</p>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary">
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card" style={{ padding: "12px 20px", marginBottom: 0, borderRadius: 0, display: "flex", alignItems: "center", gap: 16, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="form-control" style={{ paddingLeft: 38 }} 
                />
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th >Item Code</th>
                  <th >Item Name</th>
                  <th >Category</th>
                  <th >UOM</th>
                  <th style={{ textAlign: "right" }}>Stock</th>
                  <th style={{ textAlign: "right" }}>Min Stock</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody >
                {filtered.map(itm => (
                  <tr key={itm.id} >
                    <td style={{ fontFamily: "monospace" }}>{itm.code || itm.id}</td>
                    <td style={{ fontWeight: 600 }}>{itm.name}</td>
                    <td >{itm.category}</td>
                    <td >{itm.uom}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{itm.currentStock || 0}</td>
                    <td style={{ textAlign: "right" }}>{itm.minStock}</td>
                    <td style={{ textAlign: "right" }}>₹{itm.rate}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(itm)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--primary)", cursor: "pointer", background: "none", border: "none" }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(itm.id)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--danger)", cursor: "pointer", background: "none", border: "none" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Item' : 'Add New Item'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save Item
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="form-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              <div>
                <label >Item Name *</label>
                <input 
                  type="text" required value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Item Code / Short Name *</label>
                <input 
                  type="text" required value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Category *</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  className="form-control"
                >
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label >UOM *</label>
                <select 
                  value={formData.uom} 
                  onChange={(e) => setFormData({...formData, uom: e.target.value})} 
                  className="form-control"
                >
                  {uoms.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label >GST % *</label>
                <input 
                  type="number" required value={formData.gstPercent} 
                  onChange={(e) => setFormData({...formData, gstPercent: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Standard Cost / Rate *</label>
                <input 
                  type="number" required value={formData.rate} 
                  onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Min Stock *</label>
                <input 
                  type="number" required value={formData.minStock} 
                  onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Preferred Vendor *</label>
                <select 
                  value={formData.vendor} 
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})} 
                  className="form-control"
                >
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
