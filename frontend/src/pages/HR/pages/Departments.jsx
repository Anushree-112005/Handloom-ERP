import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, X, Save, Edit2, Trash2, Users, ChevronRight, LayoutList, LayoutGrid, Filter, Eye, Award, DollarSign, FileText } from 'lucide-react';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../../services/hrService';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);

  const initialForm = {
    name: '',
    code: '',
    head_name: '',
    headcount: '',
    budget: '',
    parent_id: '',
    description: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data || []);
    } catch (e) {
      console.error('Failed to load departments:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        head_name: form.head_name || null,
        headcount: form.headcount ? parseInt(form.headcount) : 0
      };
      if (editingId) {
        await updateDepartment(editingId, payload);
      } else {
        await createDepartment(payload);
      }
      loadDepartments();
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (e) {
      console.error('Failed to save department:', e);
      alert('Failed to save department');
    }
  };

  const handleEdit = (dept) => {
    setForm({
      name: dept.name || '',
      head_name: dept.head_name || '',
      headcount: dept.headcount || '',
      description: dept.description || ''
    });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleView = (dept) => {
    setViewingDepartment(dept);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (e) {
      console.error('Failed to delete department:', e);
      alert('Failed to delete department');
    }
  };

  const filteredDepartments = departments.filter(dept => {
    return !searchTerm ||
      dept.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const parentDepartments = departments.filter(d => !d.parent_id);
  const getSubDepartments = (parentId) => departments.filter(d => d.parent_id === parentId);

  const stats = {
    total: departments.length,
    totalEmployees: departments.reduce((sum, d) => sum + (d.employee_count || 0), 0)
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* DATA AREA */}
      {!showForm && !showViewModal && (
        <div className="animate-fade" style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={24} color="var(--primary)" /> Departments
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage organization structure, employees, and budgets.</p>
            </div>

            {/* RIGHT: Filter dropdown + view toggle + Add button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Filter size={16} /> Filter
                  {searchTerm && <span className="badge badge-active" style={{ padding: '2px 6px', fontSize: 10 }}>1</span>}
                </button>
                {showFilters && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 16, zIndex: 100, minWidth: 280 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filters</span>
                      <button onClick={() => setSearchTerm('')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="form-group">
                        <label>Search</label>
                        <input
                          type="text"
                          placeholder="Search departments..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
                <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', background: viewMode === 'list' ? '#fff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  <LayoutList size={16} />
                </button>
                <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', background: viewMode === 'grid' ? '#fff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  <LayoutGrid size={16} />
                </button>
              </div>

              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary"
              >
                <Plus size={16} /> Add Department
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <Building2 size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Departments</h3>
                <div className="value">{stats.total}</div>
              </div>
            </div>
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Users size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Employees</h3>
                <div className="value">{stats.totalEmployees}</div>
              </div>
            </div>
          </div>

          {/* LIST VIEW - Table */}
          {viewMode === 'list' && (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Head</th>
                    <th>Employees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepartments.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No departments found</td></tr>
                  ) : filteredDepartments.map((dept) => (
                    <tr key={dept.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{dept.name}</td>
                      <td>{dept.head_name || '—'}</td>
                      <td>{dept.employee_count || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleView(dept)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="View">
                            <Eye size={14} color="var(--primary)" />
                          </button>
                          <button onClick={() => handleEdit(dept)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(dept.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Delete">
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GRID VIEW - Cards */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {filteredDepartments.map(dept => (
                <div key={dept.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 0', color: 'var(--text-primary)' }}>{dept.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleView(dept)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Eye size={14} color="var(--primary)" />
                      </button>
                      <button onClick={() => handleEdit(dept)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Head</p>
                      <p className="text-sm font-medium text-slate-700">{dept.head_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Employees</p>
                      <p className="text-sm font-medium text-slate-700">{dept.employee_count || 0}</p>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}

      </div>
      )}
      {/* END DATA AREA */}

      {/* Form Inline */}
      {showForm && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit' : 'Add'} Department</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={16} /> Close
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  <Save size={16} /> {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
            <div style={{ padding: 24, background: '#fff' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-control"
                    placeholder="Engineering"
                  />
                </div>
                <div className="form-group">
                  <label>Department Head</label>
                  <input
                    type="text"
                    value={form.head_name}
                    onChange={(e) => setForm({ ...form, head_name: e.target.value })}
                    className="form-control"
                    placeholder="Name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Headcount</label>
                  <input
                    type="number"
                    value={form.headcount}
                    onChange={(e) => setForm({ ...form, headcount: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Department description..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Inline */}
      {showViewModal && viewingDepartment && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{viewingDepartment.name}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                  <X size={16} /> Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingDepartment);
                  }}
                  className="btn btn-primary"
                >
                  <Edit2 size={16} /> Edit Department
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Row */}
              <div className="form-row">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="btn btn-primary">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-900">{viewingDepartment.employee_count || 0}</p>
                      <p className="text-xs text-indigo-600">Employees</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="form-row">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Award className="w-4 h-4" />
                    <span>Department Head</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">{viewingDepartment.head_name || 'Not Assigned'}</p>
                </div>
              </div>

              {/* Description */}
              {viewingDepartment.description && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Description</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed pl-6">{viewingDepartment.description}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
