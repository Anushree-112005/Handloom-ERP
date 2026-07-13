import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Loader, Layers, AlertCircle } from 'lucide-react';

export default function CategoryMaster() {
  const [view, setView] = useState('list');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category_code: '',
    category_name: '',
    description: '',
    status: 'Active'
  });

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storesService.getCategories(searchTerm);
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [searchTerm, view]);

  const handleOpenForm = (cat = null) => {
    setError('');
    if (cat) {
      setFormData({
        category_code: cat.category_code,
        category_name: cat.category_name,
        description: cat.description || '',
        status: cat.status || 'Active'
      });
      setEditingId(cat.id);
    } else {
      setFormData({
        category_code: '',
        category_name: '',
        description: '',
        status: 'Active'
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This will soft delete the record.')) {
      try {
        setLoading(true);
        await storesService.deleteCategory(id);
        await fetchCategories();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to delete category.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_code.trim() || !formData.category_name.trim()) {
      setError('Category Code and Category Name are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await storesService.updateCategory(editingId, formData);
      } else {
        await storesService.createCategory(formData);
      }
      setView('list');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the category. Code might be duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header Card */}
          <div className="card" style={{ 
            padding: "24px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 0,
            background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)",
            border: "1px solid var(--border)"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'rgb(99, 102, 241)',
                padding: '12px',
                borderRadius: '12px'
              }}>
                <Layers size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Category Master</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14, margin: '4px 0 0 0' }}>Group consumable items into logical categories</p>
              </div>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
              <Plus size={16} /> Add Category
            </button>
          </div>

          {/* Search & Table Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
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
              {loading && <Loader className="animate-spin" size={18} style={{ color: 'var(--primary)' }} />}
            </div>

            {error && (
              <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: 14 }}>{error}</span>
              </div>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category Code</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {loading ? 'Loading categories...' : 'No categories found. Click Add Category to create one.'}
                      </td>
                    </tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: 'var(--primary)' }}>{cat.category_code}</td>
                        <td style={{ fontWeight: 600 }}>{cat.category_name}</td>
                        <td>{cat.description || '-'}</td>
                        <td>
                          <span className={`badge ${cat.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ borderRadius: '6px', fontWeight: 'bold' }}>
                            {cat.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <button onClick={() => handleOpenForm(cat)} style={{ padding: 6, borderRadius: "8px", color: "var(--primary)", background: "rgba(99, 102, 241, 0.1)", cursor: "pointer", border: "none" }} title="Edit Category">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(cat.id)} style={{ padding: 6, borderRadius: "8px", color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", border: "none" }} title="Delete Category">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                {editingId ? 'Update' : 'Save'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                <X size={16} /> Close
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0 }}>
            <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Category Information
            </legend>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Category Code *</label>
                <input 
                  type="text" 
                  required 
                  disabled={!!editingId}
                  value={formData.category_code} 
                  onChange={(e) => setFormData({...formData, category_code: e.target.value.toUpperCase().replace(/\s+/g, '-')})} 
                  placeholder="E.g. CAT-CHEM"
                  className="form-control" 
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Unique identifier (uppercase, no spaces)</small>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Category Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.category_name} 
                  onChange={(e) => setFormData({...formData, category_name: e.target.value})} 
                  placeholder="E.g. Chemicals & Dyes"
                  className="form-control" 
                />
              </div>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Status *</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})} 
                  className="form-control"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-row" style={{ marginTop: 20 }}>
              <div className="form-group" style={{ width: '100%' }}>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Describe the usage or types of items under this category..."
                  className="form-control" 
                  rows="4"
                />
              </div>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
