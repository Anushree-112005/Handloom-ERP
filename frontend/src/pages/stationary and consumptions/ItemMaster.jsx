import React, { useState, useEffect } from 'react';
import { stationaryService } from '../../services/stationaryService';
import { Plus, Save, Edit2, Trash2, Search, X, Box } from 'lucide-react';

export default function ItemMaster() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    item_name: '', item_code: '', category_id: '', base_uom_id: '',
    min_stock: 10, purchase_rate: 0, is_active: true
  });

  const fetchData = async () => {
    try {
      const [matRes, catRes, uomRes] = await Promise.all([
        stationaryService.getMaterials(),
        stationaryService.getCategories(),
        stationaryService.getUOMs()
      ]);
      setItems(matRes.data || []);
      setCategories(catRes.data || []);
      setUoms(uomRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchData();
    }
  }, [view]);

  const handleOpenForm = (item = null) => {
    if (item) {
      setFormData({
        item_name: item.item_name,
        item_code: item.item_code,
        category_id: item.category_id || '',
        base_uom_id: item.base_uom_id || '',
        min_stock: item.min_stock || 0,
        purchase_rate: item.purchase_rate || 0,
        is_active: item.is_active
      });
      setEditingId(item.id);
    } else {
      setFormData({
        item_name: '', item_code: '', 
        category_id: categories[0]?.id || '', 
        base_uom_id: uoms[0]?.id || '',
        min_stock: 10, purchase_rate: 0, is_active: true
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await stationaryService.deleteMaterial(id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Failed to delete item');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        base_uom_id: formData.base_uom_id ? parseInt(formData.base_uom_id) : null,
      };

      if (editingId) {
        await stationaryService.updateMaterial(editingId, payload);
      } else {
        await stationaryService.createMaterial(payload);
      }
      setView('list');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save item');
    }
  };

  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '';
  const getUOMName = (id) => uoms.find(u => u.id === id)?.name || '';

  const filtered = items.filter(itm => 
    (itm?.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (itm?.item_code || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                  <th style={{ textAlign: "right" }}>Min Stock</th>
                  <th style={{ textAlign: "right" }}>Rate</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                 ) : filtered.map(itm => (
                  <tr key={itm.id}>
                    <td style={{ fontFamily: "monospace", color: '#4f46e5', fontWeight: 600 }}>{itm.item_code}</td>
                    <td style={{ fontWeight: 600 }}>{itm.item_name}</td>
                    <td>{getCategoryName(itm.category_id)}</td>
                    <td>{getUOMName(itm.base_uom_id)}</td>
                    <td style={{ textAlign: "right" }}>{itm.min_stock || 0}</td>
                    <td style={{ textAlign: "right" }}>₹{itm.purchase_rate || 0}</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(itm)} style={{ padding: 6, borderRadius: 8, color: '#4f46e5', background: '#e0e7ff', cursor: "pointer", border: "none" }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(itm.id)} style={{ padding: 6, borderRadius: 8, color: '#ef4444', background: '#fef2f2', cursor: "pointer", border: "none" }}>
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
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Item' : 'New Item'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={16} /> {editingId ? 'Update' : 'Save'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X size={16} /> Close
              </button>
            </div>
          </div>

          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
            <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Item Details
            </legend>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Item Name *</label>
                <input 
                  type="text" required value={formData.item_name} 
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})} 
                  className="form-control" placeholder="E.g., Packing Tape"
                />
              </div>
              <div className="form-group">
                <label>Item Code / Short Name *</label>
                <input 
                  type="text" required value={formData.item_code} 
                  onChange={(e) => setFormData({...formData, item_code: e.target.value})} 
                  className="form-control" placeholder="E.g., PT-001"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={formData.category_id} 
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})} 
                  className="form-control"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>UOM</label>
                <select 
                  value={formData.base_uom_id} 
                  onChange={(e) => setFormData({...formData, base_uom_id: e.target.value})} 
                  className="form-control"
                >
                  <option value="">Select UOM</option>
                  {uoms.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Standard Cost / Rate</label>
                <input 
                  type="number" required value={formData.purchase_rate} 
                  onChange={(e) => setFormData({...formData, purchase_rate: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label>Min Stock Level</label>
                <input 
                  type="number" required value={formData.min_stock} 
                  onChange={(e) => setFormData({...formData, min_stock: Number(e.target.value)})} 
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label>Active *</label>
                <select 
                  value={formData.is_active ? 'Yes' : 'No'} 
                  onChange={(e) => setFormData({...formData, is_active: e.target.value === 'Yes'})} 
                  className="form-control"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
