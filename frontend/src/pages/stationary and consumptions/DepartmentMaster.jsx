import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Loader, Building, AlertCircle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function DepartmentMaster() {
  const [view, setView] = useState('list');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    department_code: '',
    department_name: '',
    department_head: '',
    description: '',
    status: ''
  });

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storesService.getDepartments(searchTerm);
      setDepartments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [searchTerm, view]);

  const handleOpenForm = (dept = null) => {
    setError('');
    if (dept) {
      setFormData({
        department_code: dept.department_code || '',
        department_name: dept.department_name || '',
        department_head: dept.department_head || '',
        description: dept.description || '',
        status: dept.status || ''
      });
      setEditingId(dept.id);
    } else {
      setFormData({
        department_code: '',
        department_name: '',
        department_head: '',
        description: '',
        status: ''
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department? This will soft delete the record.')) {
      try {
        setLoading(true);
        await storesService.deleteDepartment(id);
        await fetchDepartments();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to delete department.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_code.trim() || !formData.department_name.trim()) {
      setError('Department Code and Department Name are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await storesService.updateDepartment(editingId, formData);
        alert('Department updated successfully!');
      } else {
        await storesService.createDepartment(formData);
        alert('Department saved successfully!');
      }
      setView('list');
      await fetchDepartments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the department. Code might be duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'Total Departments', value: departments.length, icon: <Building size={24} />, color: '#6366f1' },
    { label: 'Active Departments', value: departments.filter(d => d.status === 'Active').length, icon: <CheckCircle size={24} />, color: '#10b981' },
    { label: 'Inactive Departments', value: departments.filter(d => d.status !== 'Active').length, icon: <XCircle size={24} />, color: '#ef4444' }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building style={{ color: '#6366f1' }} /> Department Master
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Configure company departments for material issue tracking</p>
        </div>
        {view === 'list' && (
          <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Add Department
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
                  placeholder="Search departments..."
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
                    <th>Department Code</th>
                    <th>Department Name</th>
                    <th>Department Head</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {loading ? 'Loading departments...' : 'No departments found. Click Add Department to create one.'}
                      </td>
                    </tr>
                  ) : (
                    departments.map(dept => (
                      <tr key={dept.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: 'var(--primary)' }}>{dept.department_code}</td>
                        <td style={{ fontWeight: 600 }}>{dept.department_name}</td>
                        <td style={{ fontWeight: 600 }}>{dept.department_head || '-'}</td>
                        <td>{dept.description || '-'}</td>
                        <td>
                          <span className={`badge ${dept.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ borderRadius: '6px', fontWeight: 'bold' }}>
                            {dept.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <button onClick={() => handleOpenForm(dept)} style={{ padding: 6, borderRadius: "8px", color: "var(--primary)", background: "rgba(99, 102, 241, 0.1)", cursor: "pointer", border: "none" }} title="Edit Department">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(dept.id)} style={{ padding: 6, borderRadius: "8px", color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", border: "none" }} title="Delete Department">
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
              {editingId ? 'Edit Department Details' : 'Add New Department'}
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
                Department Details
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
                        <label>Department Code *</label>
                        <input
                          type="text" required disabled={!!editingId} value={formData.department_code}
                          onChange={(e) => setFormData({ ...formData, department_code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                          placeholder="Enter Department Code"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Department Name *</label>
                        <input
                          type="text" required value={formData.department_name}
                          onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                          placeholder="Enter Department Name"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Department Head</label>
                        <input
                          type="text" value={formData.department_head}
                          onChange={(e) => setFormData({ ...formData, department_head: e.target.value })}
                          placeholder="Enter Department Head"
                          className="form-control"
                        />
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
                          rows="4"
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
