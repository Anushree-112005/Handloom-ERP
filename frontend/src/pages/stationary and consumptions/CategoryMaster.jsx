import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, ArrowLeft, Edit2, Trash2, Search, X } from 'lucide-react';

export default function CategoryMaster() {
  const [view, setView] = useState('list');
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', active: 'Yes' });

  useEffect(() => {
    setCategories(mockDb.get('consumables_categories'));
  }, [view]);

  const handleOpenForm = (cat = null) => {
    if (cat) {
      setFormData(cat);
      setEditingId(cat.id);
    } else {
      setFormData({ name: '', description: '', active: 'Yes' });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      mockDb.delete('consumables_categories', id);
      setCategories(mockDb.get('consumables_categories'));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      mockDb.update('consumables_categories', editingId, formData);
    } else {
      mockDb.add('consumables_categories', {
        id: 'CAT' + Math.floor(Math.random() * 1000),
        ...formData
      });
    }
    setView('list');
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Category Master</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Group consumable items into logical categories</p>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary">
              <Plus size={16} /> Add Category
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card" style={{ padding: "12px 20px", marginBottom: 0, borderRadius: 0, display: "flex", alignItems: "center", gap: 16, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                <input 
                  type="text" 
                  placeholder="Search categories..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="form-control" style={{ paddingLeft: 38 }} 
                />
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th >Category ID</th>
                  <th >Category Name</th>
                  <th >Description</th>
                  <th >Active</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody >
                {filtered.map(cat => (
                  <tr key={cat.id} >
                    <td style={{ fontFamily: "monospace" }}>{cat.id}</td>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td >{cat.description}</td>
                    <td >
                      <span className={`badge ${(cat.active === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}`}>
                        {cat.active}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(cat)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--primary)", cursor: "pointer", background: "none", border: "none" }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--danger)", cursor: "pointer", background: "none", border: "none" }}>
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
        <div className="card animate-fade" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{editingId ? 'Edit Category' : 'Add New Category'}</h2>
            <button onClick={() => setView('list')} style={{ padding: 4, borderRadius: "var(--radius-sm)", cursor: "pointer", background: "none", border: "none" }}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label >Category Name *</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="form-control" 
              />
            </div>
            <div>
              <label >Description</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="form-control" 
                rows="3"
              />
            </div>
            <div>
              <label >Active *</label>
              <select 
                value={formData.active} 
                onChange={(e) => setFormData({...formData, active: e.target.value})} 
                className="form-control"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: 20 }}>
              <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
