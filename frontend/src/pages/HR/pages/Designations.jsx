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

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + badge */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">DESIGNATIONS</h1>
          <span className="btn btn-primary">
            {filteredDesignations.length} Records
          </span>
        </div>

        {/* RIGHT: Filter dropdown + view toggle + Add button */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {(searchTerm || filterDepartment) && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => { setSearchTerm(''); setFilterDepartment(''); }} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search designations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="form-control">
                      <option value="">All Departments</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Grade</label>
                    <select className="form-control">
                      <option value="">All Grades</option>
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
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
            <Plus className="w-4 h-4" /> Add Designation
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
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Designations</p>
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
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{formatSalary(stats.avgSalary)}</p>
              <p className="text-xs text-slate-500">Avg Salary</p>
            </div>
          </div>
        </div>
      </div>



      {/* LIST VIEW - Table */}
      {viewMode === 'list' && (
        <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="btn btn-secondary">
              <tr>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Level</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Designation</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Code</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Department</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Grade</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Salary Range</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Employees</th>
                <th className="text-right px-6 py-4 text-xs uppercase font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDesignations.map((des, idx) => (
                <tr key={des.id} className="btn btn-secondary">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="btn btn-primary">
                        {des.level}
                      </span>
                      {idx > 0 && filteredDesignations[idx - 1].level < des.level && (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      )}
                      {idx > 0 && filteredDesignations[idx - 1].level > des.level && (
                        <ChevronUp className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">{des.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{des.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{des.department || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-indigo-600">{des.grade || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {formatSalary(des.min_salary)} - {formatSalary(des.max_salary)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">{des.employee_count || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleView(des)} className="btn btn-primary" title="View Details">
                        <Eye className="w-4 h-4 text-indigo-500" />
                      </button>
                      <button onClick={() => handleEdit(des)} className="btn btn-secondary" title="Edit">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(des.id)} className="btn btn-danger" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDesignations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No designations found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* GRID VIEW - Cards */}
      {viewMode === 'grid' && (
        <div className="form-row">
          {filteredDesignations.length === 0 ? (
            <div className="btn btn-secondary">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No designations found</p>
            </div>
          ) : filteredDesignations.map((des, idx) => (
            <div key={des.id} className="btn btn-secondary">
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="btn btn-primary">
                      {des.level}
                    </span>
                    {des.grade && (
                      <span className="btn btn-primary">
                        {des.grade}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{des.title}</h3>
                <p className="text-xs font-mono text-slate-500">{des.code}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {des.department && (
                  <span className="btn btn-secondary">
                    <Building2 className="w-3 h-3 inline mr-1" />
                    {des.department}
                  </span>
                )}
                <span className="btn btn-success">
                  <Users className="w-3 h-3 inline mr-1" />
                  {des.employee_count || 0}
                </span>
              </div>

              <div className="btn btn-secondary">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Salary Range</span>
                </div>
                <div className="text-sm font-bold text-emerald-600">
                  {formatSalary(des.min_salary)} - {formatSalary(des.max_salary)}
                </div>
              </div>

              <div className="btn btn-secondary">
                <button onClick={() => handleView(des)} className="btn btn-primary">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleEdit(des)} className="btn btn-secondary">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(des.id)} className="btn btn-danger">
                  <Trash2 className="w-4 h-4" />
                </button>
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
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Designation</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-control"
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="form-control"
                    placeholder="SSE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level *</label>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="form-control"
                    placeholder="Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Salary (₹)</label>
                  <input
                    type="number"
                    value={form.min_salary}
                    onChange={(e) => setForm({ ...form, min_salary: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="800000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Salary (₹)</label>
                  <input
                    type="number"
                    value={form.max_salary}
                    onChange={(e) => setForm({ ...form, max_salary: parseInt(e.target.value) || '' })}
                    className="form-control"
                    placeholder="1500000"
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
                  placeholder="Job description and responsibilities..."
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

      {/* View Modal */}
      {showViewModal && viewingDesignation && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl md:rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{viewingDesignation.title}</h2>
                      <p className="text-white/80 text-sm">Designation Details</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                      Code: {viewingDesignation.code}
                    </span>
                    {viewingDesignation.grade && (
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                        Grade: {viewingDesignation.grade}
                      </span>
                    )}
                    {viewingDesignation.level && (
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                        Level: {viewingDesignation.level}
                      </span>
                    )}
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
                      <p className="text-2xl font-bold text-indigo-900">{viewingDesignation.employee_count || 0}</p>
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
                <div className="btn btn-secondary">
                  <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
                    <FileText className="w-4 h-4" />
                    <span>Description</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed pl-6">{viewingDesignation.description}</p>
                </div>
              )}

              {/* Salary Details */}
              <div className="btn btn-secondary">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Salary Band</h3>
                <div className="form-row">
                  <div>
                    <p className="text-xs text-slate-500">Minimum Salary</p>
                    <p className="text-lg font-bold text-slate-900">{formatSalary(viewingDesignation.min_salary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Maximum Salary</p>
                    <p className="text-lg font-bold text-slate-900">{formatSalary(viewingDesignation.max_salary)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-1">Average</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {formatSalary((viewingDesignation.min_salary + viewingDesignation.max_salary) / 2)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="btn btn-secondary">
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingDesignation);
                  }}
                  className="btn btn-primary"
                >
                  <Edit2 className="w-4 h-4" /> Edit Designation
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
        </div>
      )}
    </div>
  );
}
