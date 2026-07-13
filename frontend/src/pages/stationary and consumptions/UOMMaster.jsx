import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Loader, Ruler, AlertCircle } from 'lucide-react';

export default function UOMMaster() {
  const [view, setView] = useState('list');
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    uom_code: '',
    uom_name: '',
    symbol: '',
    category: 'Count',
    description: '',
    status: 'Active'
  });

  const uomCategories = [
    "Weight", "Length", "Volume", "Count", "Area", "Packaging"
  ];

  const fetchUOMs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storesService.getUOMs(searchTerm);
      setUoms(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load UOMs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUOMs();
  }, [searchTerm, view]);

  const handleOpenForm = (uom = null) => {
    setError('');
    if (uom) {
      setFormData({
        uom_code: uom.uom_code,
        uom_name: uom.uom_name,
        symbol: uom.symbol || '',
        category: uom.category || 'Count',
        description: uom.description || '',
        status: uom.status || 'Active'
      });
      setEditingId(uom.id);
    } else {
      setFormData({
        uom_code: '',
        uom_name: '',
        symbol: '',
        category: 'Count',
        description: '',
        status: 'Active'
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this UOM? This will soft delete the record.')) {
      try {
        setLoading(true);
        await storesService.deleteUOM(id);
        await fetchUOMs();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to delete UOM.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.uom_code.trim() || !formData.uom_name.trim()) {
      setError('UOM Code and UOM Name are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await storesService.updateUOM(editingId, formData);
      } else {
        await storesService.createUOM(formData);
      }
      setView('list');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the UOM. Code might be duplicate.');
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
            background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(16, 185, 129, 0.05) 100%)",
            border: "1px solid var(--border)"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'rgb(16, 185, 129)',
                padding: '12px',
                borderRadius: '12px'
              }}>
                <Ruler size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>UOM Master</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14, margin: '4px 0 0 0' }}>Standardize units of measurements</p>
              </div>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
              <Plus size={16} /> Add UOM
            </button>
          </div>

          {/* Search & Table Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                <input 
                  type="text" 
                  placeholder="Search UOMs..." 
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
                    <th>UOM Code</th>
                    <th>UOM Name</th>
                    <th>Symbol</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uoms.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {loading ? 'Loading UOMs...' : 'No UOMs found. Click Add UOM to create one.'}
                      </td>
                    </tr>
                  ) : (
                    uoms.map(uom => (
                      <tr key={uom.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: 'var(--primary)' }}>{uom.uom_code}</td>
                        <td style={{ fontWeight: 600 }}>{uom.uom_name}</td>
                        <td style={{ fontFamily: "monospace" }}>{uom.symbol || '-'}</td>
                        <td>{uom.category || '-'}</td>
                        <td>{uom.description || '-'}</td>
                        <td>
                          <span className={`badge ${uom.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ borderRadius: '6px', fontWeight: 'bold' }}>
                            {uom.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <button onClick={() => handleOpenForm(uom)} style={{ padding: 6, borderRadius: "8px", color: "var(--primary)", background: "rgba(99, 102, 241, 0.1)", cursor: "pointer", border: "none" }} title="Edit UOM">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(uom.id)} style={{ padding: 6, borderRadius: "8px", color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", border: "none" }} title="Delete UOM">
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
              {editingId ? 'Edit UOM' : 'New UOM'}
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
              UOM Information
            </legend>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>UOM Code *</label>
                <input 
                  type="text" 
                  required 
                  disabled={!!editingId}
                  value={formData.uom_code} 
                  onChange={(e) => setFormData({...formData, uom_code: e.target.value.toUpperCase().replace(/\s+/g, '-')})} 
                  placeholder="E.g. UOM-KG"
                  className="form-control" 
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Unique identifier (uppercase, no spaces)</small>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>UOM Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.uom_name} 
                  onChange={(e) => setFormData({...formData, uom_name: e.target.value})} 
                  placeholder="E.g. Kilogram"
                  className="form-control" 
                />
              </div>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Symbol (Short Representation)</label>
                <input 
                  type="text" 
                  value={formData.symbol} 
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})} 
                  placeholder="E.g. Kg"
                  className="form-control" 
                />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Measurement Category *</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  className="form-control"
                >
                  {uomCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
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
                  placeholder="Describe the unit of measurement or decimal rounding standards..."
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
