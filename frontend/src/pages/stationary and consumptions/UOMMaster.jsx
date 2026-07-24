import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Loader, Ruler, AlertCircle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

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
    category: '',
    description: '',
    status: ''
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
        uom_code: uom.uom_code || '',
        uom_name: uom.uom_name || '',
        symbol: uom.symbol || '',
        category: uom.category || '',
        description: uom.description || '',
        status: uom.status || ''
      });
      setEditingId(uom.id);
    } else {
      setFormData({
        uom_code: '',
        uom_name: '',
        symbol: '',
        category: '',
        description: '',
        status: ''
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
        alert('UOM updated successfully!');
      } else {
        await storesService.createUOM(formData);
        alert('UOM saved successfully!');
      }
      setView('list');
      await fetchUOMs();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the UOM. Code might be duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'Total UOMs', value: uoms.length, icon: <Ruler size={24} />, color: '#10b981' },
    { label: 'Active UOMs', value: uoms.filter(u => u.status === 'Active').length, icon: <CheckCircle size={24} />, color: '#6366f1' },
    { label: 'Inactive UOMs', value: uoms.filter(u => u.status !== 'Active').length, icon: <XCircle size={24} />, color: '#ef4444' }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ruler style={{ color: '#10b981' }} /> UOM Master
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Standardize units of measurements</p>
        </div>
        {view === 'list' && (
          <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Add UOM
          </button>
        )}
        {view === 'form' && (
          <button onClick={() => setView('list')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to List
          </button>
        )}
      </div>

      {view === 'list' ? (
        <>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ '--stat-color': s.color }}>
                <div className="stat-icon" style={{ background: `${s.color}1a`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-info">
                  <h3>{s.value}</h3>
                  <p>{s.label}</p>
                </div>
              </div>
            ))}
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
        </>
      ) : (
        <div className="animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <button 
              type="button"
              onClick={() => setView('list')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit UOM Details' : 'Add New UOM'}
            </h2>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
              <button
                type="button"
                style={{
                  padding: '16px 24px', background: '#fff',
                  border: 'none', borderBottom: '3px solid var(--primary)',
                  fontWeight: 600, color: 'var(--primary)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Basic Information
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
                  </div>
                )}
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>UOM Code *</label>
                        <input
                          type="text"
                          required
                          disabled={!!editingId}
                          value={formData.uom_code}
                          onChange={(e) => setFormData({ ...formData, uom_code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                          placeholder="Enter UOM Code"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>UOM Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.uom_name}
                          onChange={(e) => setFormData({ ...formData, uom_name: e.target.value })}
                          placeholder="Enter UOM Name"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Symbol (Short Representation)</label>
                        <input
                          type="text"
                          value={formData.symbol}
                          onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                          placeholder="Enter Symbol"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Measurement Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="form-control"
                          required
                        >
                          <option value="">-- Select Category --</option>
                          {uomCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status *</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="form-control"
                          required
                        >
                          <option value="">-- Select Status --</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter Description"
                          className="form-control"
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                    <X size={16} /> Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

