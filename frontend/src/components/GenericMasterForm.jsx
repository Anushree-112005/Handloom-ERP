/**
 * GenericMasterForm — Reusable Type-1 Master Entry Component
 *
 * Accepts a configuration object and renders a full CRUD master form
 * with left-side form panel, right-side data table, and bottom action bar.
 * All data is persisted via the dynamic /api/v1/sub-masters/{entity} endpoints.
 *
 * Usage:
 *   <GenericMasterForm config={COLOR_MASTER_CONFIG} />
 */
import { useState, useEffect, useRef } from 'react';
import { Plus, Save, Trash2, X, Search, Edit2, ToggleLeft, ToggleRight, Database } from 'lucide-react';
import { subMasterAPI } from '../services/api';

export default function GenericMasterForm({ config }) {
  const {
    entity,
    title,
    icon: Icon,
    color = '#3b82f6',
    fields = [],
    description = '',
  } = config;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const firstInputRef = useRef(null);

  // Build initial form state from config fields
  const buildInitialForm = () => {
    const form = { name: '', code: '', description: '', is_active: true };
    fields.forEach(f => {
      if (!form.hasOwnProperty(f.name)) {
        form[f.name] = f.type === 'checkbox' ? true : '';
      }
    });
    return form;
  };

  const [formData, setFormData] = useState(buildInitialForm);

  // ── Data Fetching ──
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data } = await subMasterAPI.list(entity);
      setRecords(data);
    } catch (err) {
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, [entity]);

  // ── Form Handlers ──
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNew = () => {
    setFormData(buildInitialForm());
    setEditingId(null);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  };

  const handleEdit = (record) => {
    setFormData({
      name: record.name || '',
      code: record.code || '',
      description: record.description || '',
      extra_field_1: record.extra_field_1 || '',
      extra_field_2: record.extra_field_2 || '',
      extra_field_3: record.extra_field_3 || '',
      is_active: record.is_active !== false,
    });
    setEditingId(record.id);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Map config field names to the SubMaster column names
    const payload = {
      entity,
      name: formData.name,
      code: formData.code || null,
      description: formData.description || null,
      extra_field_1: formData.extra_field_1 || null,
      extra_field_2: formData.extra_field_2 || null,
      extra_field_3: formData.extra_field_3 || null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        await subMasterAPI.update(entity, editingId, payload);
      } else {
        await subMasterAPI.create(entity, payload);
      }
      handleNew();
      fetchRecords();
      fetchStats();
    } catch (err) {
      alert(`Error saving ${title}: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from ${title}?`)) return;
    try {
      await subMasterAPI.delete(entity, id);
      if (editingId === id) handleNew();
      fetchRecords();
      fetchStats();
    } catch (err) {
      alert('Error deleting record.');
    }
  };

  // ── Filtering ──
  const filteredRecords = records.filter(r =>
    searchTerm === '' ||
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Resolve which fields are displayed ──
  // Default: name is always present. code, description are optional.
  // extra_field_1/2/3 can be used for entity-specific columns.
  const displayFields = fields.length > 0
    ? fields
    : [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'code', label: 'Code', type: 'text' },
      ];

  // Map field names to DB columns for display
  const getRecordValue = (record, fieldName) => {
    return record[fieldName] ?? '';
  };

  // ── Render ──
  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {Icon && <Icon size={22} color={color} />}
            {title}
          </h2>
          {description && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{description}</p>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Records</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ToggleRight size={18} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{stats.active}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ToggleLeft size={18} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Inactive</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{stats.total - stats.active}</div>
          </div>
        </div>
      </div>

      {/* Split Layout: Form + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Form Panel */}
        <div className="card" style={{ padding: 0, position: 'sticky', top: 20 }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: `linear-gradient(135deg, ${color}08, ${color}15)`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              {editingId ? '✏️ Edit Entry' : '➕ New Entry'}
            </span>
            {editingId && (
              <button
                type="button"
                onClick={handleNew}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, textDecoration: 'underline' }}
              >
                Clear
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {displayFields.map((field, idx) => (
                <div className="form-group" key={field.name} style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
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
                      style={{ resize: 'vertical', fontSize: 13 }}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="form-control"
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      required={field.required}
                      ref={idx === 0 ? firstInputRef : null}
                      style={{ fontSize: 13 }}
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
                        style={{ width: 44, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder="#HEX"
                        style={{ fontSize: 13, flex: 1 }}
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
                      style={{ fontSize: 13 }}
                    />
                  )}
                </div>
              ))}

              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    style={{ width: 16, height: 16, accentColor: color }}
                  />
                  Active
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, background: color, borderColor: color }}>
                <Save size={14} /> {editingId ? 'Update' : 'Save'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleNew} style={{ flex: 1 }}>
                <Plus size={14} /> New
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Data Table */}
        <div className="card" style={{ padding: 0 }}>
          {/* Table Header */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--bg-primary)',
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              Records ({filteredRecords.length})
            </span>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 32, fontSize: 12, height: 34 }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={thStyle}>#</th>
                  {displayFields.filter(f => f.type !== 'textarea').map(f => (
                    <th key={f.name} style={thStyle}>{f.label}</th>
                  ))}
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 100 }}>Actions</th>
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
                        <p style={{ fontSize: 12 }}>Add your first {title} entry using the form.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr
                    key={record.id}
                    onClick={() => handleEdit(record)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: editingId === record.id ? `${color}10` : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => { if (editingId !== record.id) e.currentTarget.style.background = 'var(--bg-primary)'; }}
                    onMouseOut={(e) => { if (editingId !== record.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={tdStyle}>{idx + 1}</td>
                    {displayFields.filter(f => f.type !== 'textarea').map(f => (
                      <td key={f.name} style={tdStyle}>
                        {f.type === 'color' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 18, height: 18, borderRadius: 4, background: getRecordValue(record, f.name) || '#ccc', display: 'inline-block', border: '1px solid var(--border)' }} />
                            {getRecordValue(record, f.name)}
                          </div>
                        ) : (
                          <span style={{ fontWeight: f.name === 'name' ? 600 : 400 }}>
                            {getRecordValue(record, f.name) || '-'}
                          </span>
                        )}
                      </td>
                    ))}
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: record.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: record.is_active ? '#10b981' : '#ef4444',
                      }}>
                        {record.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                          title="Edit"
                          style={actionBtnStyle}
                        >
                          <Edit2 size={13} color="#3b82f6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(record.id, record.name); }}
                          title="Delete"
                          style={actionBtnStyle}
                        >
                          <Trash2 size={13} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──
const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: 11,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '2px solid var(--border)',
};

const tdStyle = {
  padding: '10px 14px',
  color: 'var(--text-primary)',
};

const actionBtnStyle = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '5px 7px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
};
