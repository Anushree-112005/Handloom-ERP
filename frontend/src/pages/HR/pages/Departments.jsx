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
    if (!form.name || !form.code) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description || null,
        head_name: form.head_name || null,
        headcount: form.headcount ? parseInt(form.headcount) : 0,
        budget: form.budget ? parseInt(form.budget) : 0,
        parent_department_id: form.parent_id ? parseInt(form.parent_id) : null
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
      code: dept.code || '',
      head_name: dept.head_name || '',
      headcount: dept.headcount || '',
      budget: dept.budget || '',
      parent_id: dept.parent_id || dept.parent_department_id || '',
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
      dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const parentDepartments = departments.filter(d => !d.parent_id);
  const getSubDepartments = (parentId) => departments.filter(d => d.parent_id === parentId);

  const stats = {
    total: departments.length,
    totalEmployees: departments.reduce((sum, d) => sum + (d.employee_count || 0), 0),
    totalBudget: departments.reduce((sum, d) => sum + (d.budget || 0), 0)
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

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + badge */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">DEPARTMENTS</h1>
          <span className="btn btn-primary">
            {filteredDepartments.length} Records
          </span>
        </div>

        {/* RIGHT: Filter dropdown + view toggle + Add button */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
                }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {searchTerm && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => setSearchTerm('')} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search departments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Parent Department</label>
                    <select className="form-control">
                      <option value="">All Departments</option>
                      {parentDepartments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="btn btn-secondary">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Stats */}
        <div className="form-row">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="btn btn-primary">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Departments</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="btn btn-success">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalEmployees}</p>
                <p className="text-xs text-slate-500">Total Employees</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="btn btn-primary">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">₹{(stats.totalBudget / 10000000).toFixed(1)}Cr</p>
                <p className="text-xs text-slate-500">Total Budget</p>
              </div>
            </div>
          </div>
        </div>



        {/* LIST VIEW - Table */}
        {viewMode === 'list' && (
          <div className="card">
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase font-bold text-slate-500">Department</th>
                  <th className="px-6 py-4 text-left text-xs uppercase font-bold text-slate-500">Code</th>
                  <th className="px-6 py-4 text-left text-xs uppercase font-bold text-slate-500">Head</th>
                  <th className="px-6 py-4 text-left text-xs uppercase font-bold text-slate-500">Employees</th>
                  <th className="px-6 py-4 text-left text-xs uppercase font-bold text-slate-500">Budget</th>
                  <th className="px-6 py-4 text-left text-xs uppercase font-bold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No departments found</td></tr>
                ) : filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="btn btn-secondary">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 group-hover:text-indigo-700">{dept.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="btn btn-primary">{dept.code}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{dept.head_name || '—'}</td>
                    <td className="px-6 py-4 text-slate-700">{dept.employee_count || 0}</td>
                    <td className="px-6 py-4 text-slate-700">{dept.budget ? `₹${(dept.budget / 100000).toFixed(1)}L` : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(dept)} className="btn btn-primary">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(dept)} className="btn btn-secondary">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(dept.id)} className="btn btn-danger">
                          <Trash2 className="w-4 h-4" />
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
          <div className="form-row">
            {filteredDepartments.filter(d => !d.parent_id).map(dept => (
              <div key={dept.id} className="card">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="btn btn-primary">{dept.code}</span>
                      <h3 className="font-semibold text-slate-800 mt-1">{dept.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleView(dept)} className="btn btn-primary">
                        <Eye className="w-4 h-4 text-indigo-500" />
                      </button>
                      <button onClick={() => handleEdit(dept)} className="btn btn-secondary">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="btn btn-secondary">
                    <div>
                      <p className="text-xs text-slate-500">Head</p>
                      <p className="text-sm font-medium text-slate-700">{dept.head_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Employees</p>
                      <p className="text-sm font-medium text-slate-700">{dept.employee_count || 0}</p>
                    </div>
                  </div>

                  {/* Sub-departments */}
                  {getSubDepartments(dept.id).length > 0 && (
                    <div className="btn btn-secondary">
                      <p className="text-xs text-slate-500 mb-2">Sub-departments</p>
                      {getSubDepartments(dept.id).map(sub => (
                        <div key={sub.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded mb-1">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            <span className="text-sm text-slate-700">{sub.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">{sub.employee_count || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Department</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-control"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="form-control"
                    placeholder="ENG"
                  />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department Head</label>
                  <input
                    type="text"
                    value={form.head_name}
                    onChange={(e) => setForm({ ...form, head_name: e.target.value })}
                    className="form-control"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent Department</label>
                  <select
                    value={form.parent_id}
                    onChange={(e) => setForm({ ...form, parent_id: e.target.value ? parseInt(e.target.value) : '' })}
                    className="form-control"
                  >
                    <option value="">None (Top Level)</option>
                    {parentDepartments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Headcount</label>
                  <input
                    type="number"
                    value={form.headcount}
                    onChange={(e) => setForm({ ...form, headcount: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Department description..."
                />
              </div>
            </div>
            <div className="btn btn-secondary">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingDepartment && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl md:rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{viewingDepartment.name}</h2>
                      <p className="text-white/80 text-sm">Department Details</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                      Code: {viewingDepartment.code}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
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
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="btn btn-success">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-900">
                        {viewingDepartment.budget ? `₹${(viewingDepartment.budget / 100000).toFixed(1)}L` : '—'}
                      </p>
                      <p className="text-xs text-green-600">Budget</p>
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

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Parent Department</span>
                  </div>
                  <p className="text-slate-900 font-medium pl-6">
                    {parentDepartments.find(d => d.id === (viewingDepartment.parent_id || viewingDepartment.parent_department_id))?.name || 'Top Level'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {viewingDepartment.description && (
                <div className="btn btn-secondary">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Description</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed pl-6">{viewingDepartment.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="btn btn-secondary">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingDepartment);
                  }}
                  className="btn btn-primary"
                >
                  <Edit2 className="w-4 h-4" /> Edit Department
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
