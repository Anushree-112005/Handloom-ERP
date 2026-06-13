import React, { useState, useEffect, useRef } from 'react';
import { Database, Plus, Search, Trash2, Edit2, ToggleRight, ToggleLeft, X, Save, ArrowLeft } from 'lucide-react';
import { subMasterAPI } from '../services/api';

export default function GenericMasterForm({ config }) {
  const { entity, title, color, icon: Icon, description, fields = [] } = config;

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [formData, setFormData] = useState({ is_active: true });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [colorPopup, setColorPopup] = useState({ show: false, hex: '', name: '' });

  const firstInputRef = useRef(null);

  useEffect(() => {
    fetchRecords();
    fetchStats();
    handleNew();
  }, [entity]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data } = await subMasterAPI.list(entity);
      setRecords(data);
    } catch (err) {
      if (err?.message === 'Request aborted' || err?.code === 'ERR_CANCELED') return;
      console.error(`Error fetching ${entity}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await subMasterAPI.stats(entity);
      setStats(data);
    } catch (err) {
      if (err?.message === 'Request aborted' || err?.code === 'ERR_CANCELED') return;
      console.error(`Error fetching stats for ${entity}:`, err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNew = () => {
    const initialData = { is_active: true };
    fields.forEach(f => { initialData[f.name] = f.type === 'color' ? '#000000' : ''; });
    setFormData(initialData);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openForm = () => {
    handleNew();
    setIsFormOpen(true);
  };

  const handleEdit = (record) => {
    const editData = { ...record };
    fields.forEach(f => {
      if (editData[f.name] === null || editData[f.name] === undefined) {
        editData[f.name] = '';
      }
    });
    setFormData(editData);
    setEditingId(record.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.name) {
        alert("Name is required");
        return;
      }
      if (editingId) {
        await subMasterAPI.update(entity, editingId, payload);
      } else {
        await subMasterAPI.create(entity, payload);
      }
      handleNew();
      fetchRecords();
      fetchStats();
    } catch (err) {
      console.error('Submit error:', err);
      alert('Error saving record. Check console.');
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ show: false, id: null, name: '' });
    try {
      await subMasterAPI.delete(entity, id);
      if (editingId === id) handleNew();
      fetchRecords();
      fetchStats();
    } catch (err) {
      alert('Error deleting record.');
    }
  };

  // Filter records by search term
  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fallback to name/code if no fields provided
  const displayFields = fields.length > 0 
    ? fields 
    : [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text' },
    ];

  const getRecordValue = (record, fieldName) => record[fieldName] ?? '';

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            {Icon && <Icon size={24} color={color} />}
            {title}
          </h2>
          {description && <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{description}</p>}
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={openForm}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: color, borderColor: color }}
          >
            <Plus size={16} /> New Entry
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {!isFormOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={24} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Total Records</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ToggleRight size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Active</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stats.active}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ToggleLeft size={24} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Inactive</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{stats.total - stats.active}</div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Form */}
      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: `${color}18`, borderRadius: 10, color: color }}>
                {Icon ? <Icon size={20} /> : <Database size={20} />}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editingId ? 'Edit Entry' : 'New Entry'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{title} Details</p>
              </div>
            </div>
          </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {displayFields.map((field, idx) => (
                  <div className="form-group" key={field.name} style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                      {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="form-control"
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        rows={3}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        style={{ resize: 'vertical' }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="form-control"
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        ref={idx === 0 ? firstInputRef : null}
                      >
                        <option value="">-- Select {field.label} --</option>
                        {(field.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'color' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="color"
                          name={field.name}
                          value={formData[field.name] || '#000000'}
                          onChange={handleChange}
                          style={{ width: 44, height: 38, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }}
                        />
                        <input
                          type="text"
                          className="form-control"
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                          placeholder="#HEX"
                          style={{ flex: 1 }}
                        />
                      </div>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        className="form-control"
                        name={field.name}
                        value={formData[field.name] || ''}
                        onChange={handleChange}
                        required={field.required}
                        ref={idx === 0 ? firstInputRef : null}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                      />
                    )}
                  </div>
                ))}

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 8 }}>
                  <label style={{ margin: 0, fontWeight: 600 }}>Status Active</label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: color }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: color, borderColor: color }}>
                  <Save size={16} style={{ marginRight: 8 }} /> {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
        </div>
      ) : (
      <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Records ({filteredRecords.length})</h3>
          <div className="search-bar" style={{ position: 'relative', width: 250 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
        
        <div className="table-responsive" style={{ flex: 1 }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                {displayFields.filter(f => f.type !== 'textarea').map(f => (
                  <th key={f.name}>{f.label}</th>
                ))}
                <th style={{ width: 100 }}>Status</th>
                <th style={{ textAlign: 'right', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={displayFields.length + 3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={displayFields.length + 3} style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Database size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ fontWeight: 600 }}>No records found</p>
                      <p style={{ fontSize: 12 }}>Add your first {title} entry using the New Entry button.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.map((record, idx) => (
                <tr key={record.id}>
                  <td>{idx + 1}</td>
                  {displayFields.filter(f => f.type !== 'textarea').map(f => (
                    <td key={f.name}>
                      {f.type === 'color' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            onClick={() => {
                              const hex = getRecordValue(record, f.name);
                              if (hex) setColorPopup({ show: true, hex, name: record.name });
                            }}
                            title="Click to preview color"
                            style={{
                              width: 24, height: 24, borderRadius: 6,
                              background: getRecordValue(record, f.name) || '#ccc',
                              display: 'inline-block',
                              border: '2px solid var(--border)',
                              cursor: 'pointer',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                            }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {getRecordValue(record, f.name)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: f.name === 'name' ? 600 : 400 }}>
                          {getRecordValue(record, f.name) || '-'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td>
                    <span style={{
                      padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      backgroundColor: record.is_active ? '#10b98120' : '#ef444420',
                      color: record.is_active ? '#10b981' : '#ef4444'
                    }}>
                      {record.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-icon" onClick={() => handleEdit(record)} style={{ color: '#3b82f6', marginRight: 8 }}><Edit2 size={16} /></button>
                    <button className="btn btn-icon" onClick={() => handleDeleteClick(record.id, record.name)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="card animate-scale" style={{ width: 420, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Confirm Deletion</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    await subMasterAPI.delete(entity, id);
                    if (editingId === id) handleNew();
                    fetchRecords();
                    fetchStats();
                  } catch (err) {
                    alert('Error deleting record.');
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Preview Popup */}
      {colorPopup.show && (
        <div
          onClick={() => setColorPopup({ show: false, hex: '', name: '' })}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: 28, textAlign: 'center', minWidth: 280 }}>
            <div style={{ width: 220, height: 160, borderRadius: 14, background: colorPopup.hex, margin: '0 auto 20px', border: '3px solid rgba(255,255,255,0.15)' }} />
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{colorPopup.name}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', marginBottom: 20 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: colorPopup.hex }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{colorPopup.hex}</span>
            </div>
            <br />
            <button className="btn btn-secondary" onClick={() => setColorPopup({ show: false, hex: '', name: '' })}>Close Preview</button>
          </div>
        </div>
      )}

    </div>
  );
}
