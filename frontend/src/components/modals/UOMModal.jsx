import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Save, X, Loader, AlertCircle } from 'lucide-react';

export default function UOMModal({ isOpen, onClose, onSave, editingId = null }) {
  const [formData, setFormData] = useState({
    uom_code: '',
    uom_name: '',
    symbol: '',
    category: '',
    description: '',
    status: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const uomCategories = [
    "Weight", "Length", "Volume", "Count", "Area", "Packaging"
  ];

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        fetchUOMDetails(editingId);
      } else {
        setFormData({
          uom_code: '',
          uom_name: '',
          symbol: '',
          category: '',
          description: '',
          status: ''
        });
        setError('');
      }
    }
  }, [isOpen, editingId]);

  const fetchUOMDetails = async (id) => {
    setLoading(true);
    try {
      // Assuming getUOMs returns a list, if there's no getUOM by ID endpoint
      // Let's use getUOMs and filter, or if there is getUOM use it.
      // storesService doesn't have getUOM in the example, but it does have getUOMs
      const data = await storesService.getUOMs();
      const uom = data.find(u => u.id === id);
      if (uom) {
        setFormData({
          uom_code: uom.uom_code || '',
          uom_name: uom.uom_name || '',
          symbol: uom.symbol || '',
          category: uom.category || '',
          description: uom.description || '',
          status: uom.status || ''
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch UOM details.');
    } finally {
      setLoading(false);
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
      let savedData;
      if (editingId) {
        savedData = await storesService.updateUOM(editingId, formData);
      } else {
        savedData = await storesService.createUOM(formData);
      }
      onSave(savedData);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 800, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {editingId ? 'Edit UOM' : 'Add New UOM'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader className="animate-spin text-primary" size={24} /></div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>UOM Code *</label>
                  <input
                    type="text" required disabled={!!editingId} value={formData.uom_code}
                    onChange={(e) => setFormData({ ...formData, uom_code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>UOM Name *</label>
                  <input
                    type="text" required value={formData.uom_name}
                    onChange={(e) => setFormData({ ...formData, uom_name: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Symbol</label>
                  <input
                    type="text" value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Measurement Category *</label>
                  <select
                    value={formData.category} required
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Category --</option>
                    {uomCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status} required
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
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
                    className="form-control"
                    rows="2"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
