import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, X, Save, Edit2, Trash2, Users, TrendingUp, ChevronUp, ChevronDown, Eye, Building2, Award, DollarSign, FileText, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchDesignations, createDesignation, updateDesignation, deleteDesignation } from '../../../services/hrService';

export default function Designations() {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDesignation, setViewingDesignation] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);

  const initialForm = {
    title: '',
    code: '',
    level: '',
    department: '',
    grade: '',
    min_salary: '',
    max_salary: '',
    description: ''
  };
  const [form, setForm] = useState(initialForm);

  const grades = ['E1', 'E2', 'M1', 'M2', 'L4', 'L3', 'L2', 'L1'];

  useEffect(() => {
    loadDesignations();
  }, []);

  const loadDesignations = async () => {
    setLoading(true);
    try {
      const data = await fetchDesignations();
      setDesignations(data || []);
    } catch (e) {
      console.error('Failed to load designations:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.code || !form.level) {
      alert('Please fill required fields');
      return;
    }

    const payload = { ...form };
    
    // Clean up empty strings for numbers and optionals
    if (payload.min_salary === '') payload.min_salary = null;
    if (payload.max_salary === '') payload.max_salary = null;
    if (payload.department === '') payload.department = null;
    if (payload.grade === '') payload.grade = null;
    if (payload.description === '') payload.description = null;

    try {
      if (editingId) {
        await updateDesignation(editingId, payload);
      } else {
        await createDesignation(payload);
      }
      loadDesignations();
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (e) {
      console.error('Failed to save designation:', e);
      alert('Failed to save designation');
    }
  };

  const handleEdit = (des) => {
    setForm({
      title: des.title,
      code: des.code,
      level: des.level,
      department: des.department || '',
      grade: des.grade || '',
      min_salary: des.min_salary || '',
      max_salary: des.max_salary || '',
      description: des.description || ''
    });
    setEditingId(des.id);
    setShowForm(true);
  };

  const handleView = (des) => {
    setViewingDesignation(des);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this designation?')) return;
    try {
      await deleteDesignation(id);
      loadDesignations();
    } catch (e) {
      console.error('Failed to delete designation:', e);
      alert('Failed to delete designation');
    }
  };

  const departments = [...new Set(designations.map(d => d.department).filter(Boolean))];

  const filteredDesignations = designations.filter(des => {
    const matchesSearch = !searchTerm || 
      des.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      des.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDepartment || des.department === filterDepartment;
    return matchesSearch && matchesDept;
  }).sort((a, b) => a.level - b.level);

  const stats = {
    total: designations.length,
    totalEmployees: designations.reduce((sum, d) => sum + (d.employee_count || 0), 0),
    avgSalary: designations.length > 0 
      ? Math.round(designations.reduce((sum, d) => sum + (((d.min_salary || 0) + (d.max_salary || 0)) / 2), 0) / designations.length)
      : 0
  };

  const formatSalary = (amount) => {
    if (!amount) return '—';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
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
                <Briefcase size={24} color="var(--primary)" /> Designations
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage job titles, grades, and salary bands.</p>
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
                  {(searchTerm || filterDepartment) && <span className="badge badge-active" style={{ padding: '2px 6px', fontSize: 10 }}>1</span>}
                </button>
                {showFilters && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 16, zIndex: 100, minWidth: 280 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filters</span>
                      <button onClick={() => { setSearchTerm(''); setFilterDepartment(''); }} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="form-group">
                        <label>Search</label>
                        <input
                          type="text"
                          placeholder="Search designations..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="form-control"
                        >
                          <option value="">All Departments</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Grade</label>
                        <select className="form-control">
                          <option value="">All Grades</option>
                          {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
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
                <Plus size={16} /> Add Designation
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <Briefcase size={24} />
              </div>
              <div className="stat-details">
                <h3>Designations</h3>
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
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-details">
                <h3>Avg Salary</h3>
                <div className="value">{formatSalary(stats.avgSalary)}</div>
              </div>
            </div>
          </div>

          {/* LIST VIEW - Table */}
          {viewMode === 'list' && (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Designation</th>
                    <th>Code</th>
                    <th>Department</th>
                    <th>Grade</th>
                    <th>Salary Range</th>
                    <th>Employees</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDesignations.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No designations found</td></tr>
                  ) : filteredDesignations.map((des, idx) => (
                    <tr key={des.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="badge badge-active">{des.level}</span>
                          {idx > 0 && filteredDesignations[idx - 1].level < des.level && <ChevronDown size={12} color="var(--text-muted)" />}
                          {idx > 0 && filteredDesignations[idx - 1].level > des.level && <ChevronUp size={12} color="var(--text-muted)" />}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{des.title}</td>
                      <td><span className="badge badge-inactive">{des.code}</span></td>
                      <td>{des.department || '—'}</td>
                      <td>{des.grade ? <span className="badge badge-success">{des.grade}</span> : '—'}</td>
                      <td>{formatSalary(des.min_salary)} - {formatSalary(des.max_salary)}</td>
                      <td>{des.employee_count || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleView(des)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="View">
                            <Eye size={14} color="var(--primary)" />
                          </button>
                          <button onClick={() => handleEdit(des)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(des.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Delete">
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
              {filteredDesignations.map(des => (
                <div key={des.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-active">L{des.level}</span>
                        {des.grade && <span className="badge badge-success">{des.grade}</span>}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>{des.title}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{des.code}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleView(des)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Eye size={14} color="var(--primary)" />
                      </button>
                      <button onClick={() => handleEdit(des)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(des.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    {des.department && (
                      <span className="badge badge-inactive">
                        <Building2 size={12} style={{ marginRight: 4 }} /> {des.department}
                      </span>
                    )}
                    <span className="badge badge-inactive">
                      <Users size={12} style={{ marginRight: 4 }} /> {des.employee_count || 0}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Salary Range</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                      {formatSalary(des.min_salary)} - {formatSalary(des.max_salary)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Form Inline */}
      {showForm && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit' : 'Add'} Designation</h2>
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
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Job Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-control"
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="form-control"
                    placeholder="SSE"
                  />
                </div>
                <div className="form-group">
                  <label>Level *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="1-10"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="form-control"
                    placeholder="Engineering"
                  />
                </div>
                <div className="form-group">
                  <label>Grade</label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Min Salary (₹)</label>
                  <input
                    type="number"
                    value={form.min_salary}
                    onChange={(e) => setForm({ ...form, min_salary: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="800000"
                  />
                </div>
                <div className="form-group">
                  <label>Max Salary (₹)</label>
                  <input
                    type="number"
                    value={form.max_salary}
                    onChange={(e) => setForm({ ...form, max_salary: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="1500000"
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
                  placeholder="Job description and responsibilities..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Inline */}
      {showViewModal && viewingDesignation && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{viewingDesignation.title}</h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                      Code: {viewingDesignation.code}
                    </span>
                    {viewingDesignation.grade && (
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600">
                        Grade: {viewingDesignation.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                  <X size={16} /> Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingDesignation);
                  }}
                  className="btn btn-primary"
                >
                  <Edit2 size={16} /> Edit Designation
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Row */}
              <div className="form-row">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div style={{ background: '#fff', padding: 8, borderRadius: 8 }}>
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-900">{viewingDesignation.employee_count || 0}</p>
                      <p className="text-xs text-indigo-600">Employees</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div style={{ background: '#fff', padding: 8, borderRadius: 8 }}>
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-900">
                        {formatSalary(viewingDesignation.min_salary)} - {formatSalary(viewingDesignation.max_salary)}
                      </p>
                      <p className="text-xs text-green-600">Salary Range</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="form-row">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Department</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">{viewingDesignation.department || 'Not Assigned'}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Award className="w-4 h-4" />
                    <span>Grade</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">{viewingDesignation.grade || 'Not Set'}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Briefcase className="w-4 h-4" />
                    <span>Job Code</span>
                  </div>
                  <p className="text-slate-900 font-medium font-mono pl-6">{viewingDesignation.code}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>Hierarchy Level</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">{viewingDesignation.level || 'Not Set'}</p>
                </div>
              </div>

              {/* Description */}
              {viewingDesignation.description && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-6">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Description</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed pl-6">{viewingDesignation.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
