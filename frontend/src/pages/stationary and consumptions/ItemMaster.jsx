import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Edit2, Trash2, Search, X, Box } from 'lucide-react';

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
      const currentData = mockDb.get('consumables_items');
      const maxIdNum = currentData.reduce((max, item) => {
        const numMatch = item.id.match(/\d+/);
        return numMatch ? Math.max(max, parseInt(numMatch[0], 10)) : max;
      }, 0);
      const nextId = 'ITM' + String(maxIdNum + 1).padStart(3, '0');
      mockDb.add('consumables_items', {
        id: nextId,
        ...updated
      });
    }
    setView('list');
  };

  const filtered = items.filter(itm => 
    (itm?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (itm?.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box style={{ color: '#6366f1' }} /> Item Master
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Register stationery, packaging, and safety supplies</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New Item
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>All Items ({filtered.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</div>
              <input
                type="text"
                placeholder="Search items..."
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
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>UOM</th>
                  <th style={{ textAlign: "right" }}>Stock</th>
                  <th style={{ textAlign: "right" }}>Min Stock</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                 ) : filtered.map(itm => (
                  <tr key={itm?.id}>
                    <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{itm?.code || itm?.id}</td>
                    <td style={{ fontWeight: 600 }}>{itm?.name || ''}</td>
                    <td>{itm?.category || ''}</td>
                    <td>{itm?.uom || ''}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: (itm?.currentStock || 0) <= (itm?.minStock || 0) ? '#ef4444' : 'var(--text-primary)' }}>{itm?.currentStock || 0}</td>
                    <td style={{ textAlign: "right" }}>{itm?.minStock || 0}</td>
                    <td style={{ textAlign: "right" }}>₹{itm?.rate || 0}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(itm)} style={{ padding: 6, borderRadius: 8, color: '#4f46e5', background: '#e0e7ff', cursor: "pointer", border: "none" }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(itm?.id)} style={{ padding: 6, borderRadius: 8, color: '#ef4444', background: '#fef2f2', cursor: "pointer", border: "none" }}>
                          <Trash2 size={14} />
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
        <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: 10, background: '#6366f115', borderRadius: 10, color: '#6366f1' }}>
              {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{editingId ? 'Edit Item' : 'New Item Registration'}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Fill out the required information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label>Item Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" required value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="form-control" placeholder="E.g., Packing Tape"
                />
              </div>
              <div className="form-group">
                <label>Item Code / Short Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" required value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                  className="form-control" placeholder="E.g., PT-001"
                />
              </div>
              <div className="form-group">
                <label>Category <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  className="form-control"
                >
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>UOM <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.uom} 
                  onChange={(e) => setFormData({...formData, uom: e.target.value})} 
                  className="form-control"
                >
                  {uoms.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>GST % <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="number" required value={formData.gstPercent} 
                  onChange={(e) => setFormData({...formData, gstPercent: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label>Standard Cost / Rate <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="number" required value={formData.rate} 
                  onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label>Min Stock Level <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="number" required value={formData.minStock} 
                  onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label>Preferred Vendor <span style={{ color: '#ef4444' }}>*</span></label>
                <select 
                  value={formData.vendor} 
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})} 
                  className="form-control"
                >
                  {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 8 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Save Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
