import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Check, AlertTriangle, Trash2, X, Eye, MapPin, Briefcase, Calendar, Users, FileText, Filter, LayoutGrid, LayoutList, Sparkles } from 'lucide-react';
import hrService, { fetchDepartments, deleteRequisition as deleteRequisitionAPI } from '../../../services/hrService';

// Helper to extract error message from API response
const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
  if (typeof detail === 'object') return detail.msg || detail.message || JSON.stringify(detail);
  return defaultMsg;
};

const statusColors = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Open: 'bg-blue-50 text-blue-700 border-blue-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

const priorities = ['Critical', 'High', 'Medium', 'Low'];
const statuses = ['Draft', 'Pending Approval', 'Approved', 'Rejected'];
const workModes = ['On-site', 'Hybrid', 'Remote'];
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Intern', 'Freelance'];

const initialForm = {
  title: '', department: '', location: '', employment_type: 'Full-time', work_mode: 'On-site',
  skills: '', experience_min: '', experience_max: '', headcount: 1, salary_min: '', salary_max: '',
  requested_by: '', reporting_to: '', priority: 'Medium', status: 'Draft', budget_ok: true,
  description: '', qualifications: '', responsibilities: '', benefits: '',
  target_hire_date: '', reason_for_hiring: 'Replacement', education_required: '', certifications: '',
  interview_rounds: 3, notes: ''
};

const JobRequisitions = () => {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formTab, setFormTab] = useState('basic');
  const [viewingRequisition, setViewingRequisition] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedRows, setSelectedRows] = useState([]);
  const [generatingJD, setGeneratingJD] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [reqData, deptData] = await Promise.all([
        hrService.listRequisitions(),
        fetchDepartments()
      ]);
      setRows(reqData);
      setDepartments(deptData);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  const visibleRows = useMemo(() => {
    if (filter === 'All') return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const resetForm = () => {
    setForm(initialForm);
    setFormTab('basic');
    setShowForm(false);
    setGeneratingJD(false);
  };

  const handleGenerateJD = async () => {
    if (!form.title || !form.department) {
      setError('Please enter Job Title and Department to generate JD.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setGeneratingJD(true);
    try {
      const res = await hrService.generateJD({ title: form.title, department: form.department });
      if (res.content) {
        setForm(prev => ({ ...prev, description: res.content }));
        setSuccess('JD Generated Successfully! Review and edit.');
      }
    } catch (err) {
      setError('Failed to generate JD via AI. Ensure backend service is running.');
    } finally {
      setGeneratingJD(false);
      setTimeout(() => setSuccess(''), 3000);
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields and show specific missing fields
    const requiredFields = [
      { field: 'title', label: 'Job Title' },
      { field: 'department', label: 'Department' },
      { field: 'location', label: 'Location' },
      { field: 'requested_by', label: 'Requested By' },
    ];
    const missingFields = requiredFields.filter(f => !form[f.field] || form[f.field].toString().trim() === '');
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        headcount: Number(form.headcount) || 1,
        salary_min: Number(form.salary_min) || 0,
        salary_max: Number(form.salary_max) || 0,
      };
      await hrService.createRequisition(payload);
      setSuccess('Requisition saved successfully!');
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save requisition'));
    }
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const updateStatus = async (id, status) => {
    try {
      await hrService.updateRequisition(id, { status });
      await loadData();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const deleteRequisition = async (id) => {
    if (!window.confirm('Delete this requisition?')) return;
    try {
      await deleteRequisitionAPI(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete requisition. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formTabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'details', label: 'Job Details' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'other', label: 'Other' }
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title & Count */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Job Requisitions</h1>
          <span className="btn btn-primary">
            {visibleRows.length} Records
          </span>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-md text-xs font-bold transition-all shadow-sm
                ${showFilters || filter !== 'All' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <Filter size={14} /> Filter
              {filter !== 'All' && (
                <span className="btn btn-primary" />
              )}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="btn btn-secondary">
                  <span className="text-xs font-bold text-slate-500 uppercase">Filter Requisitions</span>
                  <button onClick={() => { setFilter('All'); setShowFilters(false); }} className="text-xs text-indigo-600 hover:underline font-bold">Reset</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Status</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}
                      className="form-control">
                      <option value="All">All Statuses</option>
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Department</label>
                    <select className="form-control">
                      <option>All Departments</option>
                      {departments.map((d) => <option key={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Priority</label>
                    <select className="form-control">
                      <option>All Priorities</option>
                      {priorities.map((p) => <option key={p}>{p}</option>)}
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

          <button onClick={() => setShowForm(true)}
            className="btn btn-primary">
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {/* BULK ACTIONS FLOATING BAR */}
      {selectedRows.length > 0 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="btn btn-primary">{selectedRows.length}</span>
            <span className="text-sm font-bold text-slate-300">Selected</span>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <button onClick={() => setSelectedRows([])} className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors">
            <Trash2 size={16} /> Delete Selected
          </button>
          <button onClick={() => setSelectedRows([])} className="btn btn-secondary">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="btn btn-success">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="card-title">New Requisition</h2>
              <button onClick={resetForm} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="btn btn-secondary">
              {formTabs.map((tab) => (
                <button key={tab.id} onClick={() => setFormTab(tab.id)}
                  className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${formTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500'
                    }`}>{tab.label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
              {/* Basic Info Tab */}
              {formTab === 'basic' && (
                <div className="space-y-4">
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Position Title *</label>
                      <input className="form-control"
                        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                      <input className="form-control"
                        value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                      <input className="form-control"
                        value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Work Mode</label>
                      <select className="form-control"
                        value={form.work_mode} onChange={(e) => setForm({ ...form, work_mode: e.target.value })}>
                        {workModes.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                      <select className="form-control"
                        value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}>
                        {employmentTypes.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Headcount</label>
                      <input type="number" min={1} className="form-control"
                        value={form.headcount} onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Salary Min (₹) *</label>
                      <input type="number" className="form-control"
                        value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Salary Max (₹) *</label>
                      <input type="number" className="form-control"
                        value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Requested By *</label>
                      <input className="form-control"
                        value={form.requested_by} onChange={(e) => setForm({ ...form, requested_by: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Reporting To</label>
                      <input className="form-control"
                        value={form.reporting_to} onChange={(e) => setForm({ ...form, reporting_to: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                      <select className="form-control"
                        value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                        {priorities.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Hiring</label>
                      <select className="form-control"
                        value={form.reason_for_hiring} onChange={(e) => setForm({ ...form, reason_for_hiring: e.target.value })}>
                        <option>Replacement</option><option>New Position</option><option>Expansion</option><option>Project Based</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Details Tab */}
              {formTab === 'details' && (
                <div className="space-y-4">
                                    <div>
                    <div className="card-header">
                      <label className="block text-sm font-medium text-slate-700">Job Description</label>
                      <button 
                        type="button"
                        onClick={handleGenerateJD}
                        disabled={generatingJD}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded hover:bg-teal-100 transition-colors disabled:opacity-50"
                      >
                        <Sparkles size={12} className={generatingJD ? "animate-spin" : ""} />
                        {generatingJD ? "Generating..." : "Auto-Write with AI"}
                      </button>
                    </div>
                    <textarea rows={4} className="form-control"
                      placeholder="Describe the role and its objectives..."
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Key Responsibilities</label>
                    <textarea rows={4} className="form-control"
                      placeholder="List main responsibilities (one per line)..."
                      value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Benefits & Perks</label>
                    <textarea rows={3} className="form-control"
                      placeholder="Health insurance, PF, leaves, etc."
                      value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Requirements Tab */}
              {formTab === 'requirements' && (
                <div className="space-y-4">
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Experience Min (Years)</label>
                      <input type="number" min={0} className="form-control"
                        value={form.experience_min} onChange={(e) => setForm({ ...form, experience_min: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Experience Max (Years)</label>
                      <input type="number" min={0} className="form-control"
                        value={form.experience_max} onChange={(e) => setForm({ ...form, experience_max: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Education Required</label>
                      <input className="form-control"
                        placeholder="B.Tech, MBA, etc."
                        value={form.education_required} onChange={(e) => setForm({ ...form, education_required: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
                      <input className="form-control"
                        placeholder="AWS, PMP, etc."
                        value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills</label>
                    <textarea rows={2} className="form-control"
                      placeholder="e.g., React, Node.js, SQL, Communication..."
                      value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Qualifications</label>
                    <textarea rows={3} className="form-control"
                      placeholder="Additional qualifications and preferences..."
                      value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
                  </div>
                </div>
              )}

              {/* Other Tab */}
              {formTab === 'other' && (
                <div className="space-y-4">
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Target Hire Date</label>
                      <input type="date" className="form-control"
                        value={form.target_hire_date} onChange={(e) => setForm({ ...form, target_hire_date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Interview Rounds</label>
                      <input type="number" min={1} max={10} className="form-control"
                        value={form.interview_rounds} onChange={(e) => setForm({ ...form, interview_rounds: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                    <textarea rows={4} className="form-control"
                      placeholder="Any other notes for the hiring team..."
                      value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={form.budget_ok}
                        onChange={(e) => setForm({ ...form, budget_ok: e.target.checked })}
                        className="btn btn-secondary" />
                      Budget Approved
                    </label>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mt-4">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}
            </form>

            <div className="btn btn-secondary">
              <button type="button" onClick={resetForm}
                className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="btn btn-primary">
                Create Requisition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Requisition Modal */}
      {viewingRequisition && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="card-title">Requisition Details</h2>
              <button onClick={() => setViewingRequisition(null)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center pb-4 border-b">
                <div className="btn btn-primary">
                  <Briefcase className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg">{viewingRequisition.title}</h3>
                <p className="text-sm text-slate-500">{viewingRequisition.department}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[viewingRequisition.status]}`}>{viewingRequisition.status}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${viewingRequisition.priority === 'Critical' ? 'bg-purple-100 text-purple-700' :
                    viewingRequisition.priority === 'High' ? 'bg-red-100 text-red-700' :
                      viewingRequisition.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>{viewingRequisition.priority}</span>
                </div>
              </div>
              <div className="form-row">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /><span>{viewingRequisition.location}</span></div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /><span>{viewingRequisition.headcount} position(s)</span></div>
                <div><span className="text-slate-500">Work Mode:</span> <span className="block font-medium">{viewingRequisition.work_mode || 'On-site'}</span></div>
                <div><span className="text-slate-500">Type:</span> <span className="block font-medium">{viewingRequisition.employment_type}</span></div>
                <div><span className="text-slate-500">Salary:</span> <span className="block font-medium">₹{viewingRequisition.salary_min?.toLocaleString()} - ₹{viewingRequisition.salary_max?.toLocaleString()}</span></div>
                <div><span className="text-slate-500">Experience:</span> <span className="block font-medium">{viewingRequisition.experience_min || 0} - {viewingRequisition.experience_max || 0} yrs</span></div>
                <div><span className="text-slate-500">Requested By:</span> <span className="block font-medium">{viewingRequisition.requested_by}</span></div>
                <div><span className="text-slate-500">Target Date:</span> <span className="block font-medium">{viewingRequisition.target_hire_date || '—'}</span></div>
              </div>
              {viewingRequisition.skills && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Skills Required</p>
                  <p className="text-sm">{viewingRequisition.skills}</p>
                </div>
              )}
              {viewingRequisition.description && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Job Description</p>
                  <p className="text-sm whitespace-pre-wrap">{viewingRequisition.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Table/List View */}
        {viewMode === 'list' && (
          <>
            {/* Desktop Table View */}
            <div className="btn btn-secondary">
              <table className="form-control">
                <thead className="btn btn-secondary">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === visibleRows.length && visibleRows.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(visibleRows.map(r => r.id));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        className="btn btn-secondary"
                      />
                    </th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Experience</th>
                    <th className="px-6 py-4">Salary Range</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-sm">
                  {visibleRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm italic">No requisitions found</td></tr>
                  ) : visibleRows.map((row) => (
                    <tr key={row.id} className="btn btn-secondary">
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows([...selectedRows, row.id]);
                            } else {
                              setSelectedRows(selectedRows.filter(id => id !== row.id));
                            }
                          }}
                          className="btn btn-secondary"
                        />
                      </td>
                      <td className="px-6 py-4 cursor-pointer" onClick={() => setViewingRequisition(row)}>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{row.title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{row.location} • {row.work_mode || 'On-site'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{row.department}</td>
                      <td className="px-6 py-4 text-slate-700">{row.experience_min || 0}-{row.experience_max || 0} yrs</td>
                      <td className="px-6 py-4 text-slate-700">₹{row.salary_min?.toLocaleString()} - {row.salary_max?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded font-bold border ${row.priority === 'Critical' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          row.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                            row.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>{row.priority}</span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border ${statusColors[row.status]}`}>
                          {statuses.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewingRequisition(row)}
                            className="btn btn-secondary">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteRequisition(row.id)}
                            className="btn btn-danger">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {visibleRows.length === 0 ? (
                <div className="card">
                  No requisitions found. Tap + to create one.
                </div>
              ) : visibleRows.map((row) => (
                <div key={row.id} className="card">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setViewingRequisition(row)}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="btn btn-primary">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{row.title}</p>
                        <p className="text-sm text-slate-500">{row.department}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${row.priority === 'Critical' ? 'bg-purple-100 text-purple-700' :
                      row.priority === 'High' ? 'bg-red-100 text-red-700' :
                        row.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>{row.priority}</span>
                  </div>
                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{row.location}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{row.work_mode || 'On-site'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{row.experience_min || 0}-{row.experience_max || 0} yrs</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{row.headcount} pos</span>
                  </div>
                  <div className="text-sm text-emerald-600 font-medium">
                    ₹{row.salary_min?.toLocaleString()} - ₹{row.salary_max?.toLocaleString()}
                  </div>
                  <div className="btn btn-secondary">
                    <select value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)}
                      className={`text-sm px-3 py-2 rounded-lg border ${statusColors[row.status]}`}>
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewingRequisition(row)}
                        className="btn btn-secondary">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteRequisition(row.id)}
                        className="btn btn-danger">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Grid/Card View */}
        {viewMode === 'grid' && (
          <>
            {/* Desktop Grid View */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleRows.length === 0 ? (
                <div className="btn btn-secondary">
                  No requisitions found
                </div>
              ) : visibleRows.map((row) => {
                const isSelected = selectedRows.includes(row.id);
                return (
                  <div key={row.id} className={`relative bg-white border rounded-xl p-5 shadow-sm transition-all cursor-pointer group hover:shadow-md ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'border-slate-200 hover:border-indigo-300'}`}>
                    <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, row.id]);
                          } else {
                            setSelectedRows(selectedRows.filter(id => id !== row.id));
                          }
                        }}
                        className={`w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
                      />
                    </div>

                    <div className="mb-3 pr-8" onClick={() => setViewingRequisition(row)}>
                      <h3 className="text-base font-bold text-slate-900 truncate" title={row.title}>{row.title}</h3>
                      <p className="text-xs font-medium text-slate-500 uppercase mt-0.5">{row.department}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[row.status]}`}>{row.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${row.priority === 'Critical' ? 'bg-purple-100 text-purple-700 border-purple-200' : row.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' : row.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'} border`}>{row.priority}</span>
                    </div>

                    <div className="btn btn-secondary">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{row.location} • {row.work_mode || 'On-site'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{row.experience_min || 0}-{row.experience_max || 0} yrs</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{row.headcount} position(s)</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-600 pt-1">
                        ₹{row.salary_min?.toLocaleString()} - ₹{row.salary_max?.toLocaleString()}
                      </div>
                    </div>

                    <div className="btn btn-secondary" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setViewingRequisition(row)} className="btn btn-secondary">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRequisition(row.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Grid View */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {visibleRows.length === 0 ? (
                <div className="card">
                  No requisitions found. Tap + to create one.
                </div>
              ) : visibleRows.map((row) => {
                const isSelected = selectedRows.includes(row.id);
                return (
                  <div key={row.id} className={`relative bg-white border rounded-xl p-4 shadow-sm transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'border-slate-200'}`}>
                    <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, row.id]);
                          } else {
                            setSelectedRows(selectedRows.filter(id => id !== row.id));
                          }
                        }}
                        className="btn btn-secondary"
                      />
                    </div>

                    <div className="mb-3 pr-8" onClick={() => setViewingRequisition(row)}>
                      <h3 className="text-base font-bold text-slate-900" title={row.title}>{row.title}</h3>
                      <p className="text-xs font-medium text-slate-500 uppercase mt-0.5">{row.department}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[row.status]}`}>{row.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${row.priority === 'Critical' ? 'bg-purple-100 text-purple-700 border-purple-200' : row.priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' : row.priority === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'} border`}>{row.priority}</span>
                    </div>

                    <div className="btn btn-secondary">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{row.location} • {row.work_mode || 'On-site'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{row.experience_min || 0}-{row.experience_max || 0} yrs</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{row.headcount} position(s)</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-600 pt-1">
                        ₹{row.salary_min?.toLocaleString()} - ₹{row.salary_max?.toLocaleString()}
                      </div>
                    </div>

                    <div className="btn btn-secondary" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setViewingRequisition(row)} className="btn btn-secondary">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRequisition(row.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobRequisitions;
