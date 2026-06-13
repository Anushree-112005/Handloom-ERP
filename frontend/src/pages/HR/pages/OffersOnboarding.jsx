import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Send, CheckCircle2, AlertTriangle, Plus, ClipboardCheck, KeyRound, Trash2, X, Users, CheckSquare, Calendar, MapPin, Eye, Briefcase, Building, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import hrService, { fetchCandidates, fetchDepartments, fetchEmployees, deleteOnboardingTask, deleteOffer as deleteOfferAPI } from '../../../services/hrService';

// Helper to extract error message from API response
const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
  if (typeof detail === 'object') return detail.msg || detail.message || JSON.stringify(detail);
  return defaultMsg;
};

const initialOfferForm = {
  candidate_name: '', email: '', phone: '', position: '', department: '',
  joiningDate: '', reportingManager: '', workLocation: '',
  gross: 0, allowances: 0, deductions: 0,
  probationPeriod: 3, noticePeriod: 30, offerValidUntil: '', notes: '',
  status: 'Draft', documents_ok: false
};

const initialTaskForm = {
  title: '', reporting_to: '', due_date: '', category: 'Documentation', priority: 'Medium',
  employee_id: '', department_id: '', client_name: '', description: '', requires_attachment: false, status: 'Pending'
};

const taskCategories = ['Documentation', 'IT Setup', 'HR Induction', 'Training', 'Access & Permissions', 'Project', 'Other'];
const taskPriorities = ['High', 'Medium', 'Low'];

const OffersOnboarding = () => {
  const [activeTab, setActiveTab] = useState('offers');
  const [offers, setOffers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formTab, setFormTab] = useState('basic');
  const [form, setForm] = useState(initialOfferForm);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [viewingOffer, setViewingOffer] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  // Combobox state for Candidate Name in Offer form
  const [candQuery, setCandQuery] = useState('');
  const [showCandDrop, setShowCandDrop] = useState(false);
  // Combobox state for Employee Name in Onboarding Task form
  const [onbQuery, setOnbQuery] = useState('');
  const [showOnbDrop, setShowOnbDrop] = useState(false);
  // Employees list for Reporting To combobox
  const [employees, setEmployees] = useState([]);
  const [rptQuery, setRptQuery] = useState('');
  const [showRptDrop, setShowRptDrop] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [offersData, tasksData, candData, deptData, empData] = await Promise.all([
        hrService.listOffers(),
        hrService.listOnboardingTasks(),
        fetchCandidates(),
        fetchDepartments(),
        fetchEmployees().catch(() => [])
      ]);
      setOffers(offersData);
      setTasks(tasksData);
      setCandidates(candData);
      setDepartments(deptData);
      setEmployees(empData);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  const totals = useMemo(() => {
    const employees = offers.filter((o) => o.employee_id).length;
    const pending = offers.filter((o) => !o.employee_id).length;
    const tasksPending = tasks.filter(t => t.status !== 'Completed').length;
    return { employees, pending, tasksPending };
  }, [offers, tasks]);

  const computeSalary = (o) => {
    const gross = Number(o.gross) || 0;
    const allowances = Number(o.allowances) || 0;
    const deductions = Number(o.deductions) || 0;
    return { gross: gross + allowances, deductions, net: gross + allowances - deductions };
  };

  const resetOfferForm = () => {
    setForm(initialOfferForm);
    setFormTab('basic');
    setCandQuery('');
    setShowCandDrop(false);
    setShowOfferForm(false);
  };

  const resetTaskForm = () => {
    setTaskForm(initialTaskForm);
    setOnbQuery('');
    setShowOnbDrop(false);
    setRptQuery('');
    setShowRptDrop(false);
    setShowTaskForm(false);
  };

  const addOffer = async (e) => {
    e.preventDefault();
    // Validate required fields and show specific missing fields
    const requiredFields = [
      { field: 'candidate_name', label: 'Candidate Name' },
      { field: 'position', label: 'Position' },
      { field: 'gross', label: 'Gross Salary' },
    ];
    const missingFields = requiredFields.filter(f => !form[f.field] || form[f.field].toString().trim() === '' || (f.field === 'gross' && Number(form[f.field]) <= 0));
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` }); return;
    }
    setLoading(true);
    try {
      await hrService.createOffer({
        candidate_name: form.candidate_name,
        position: form.position,
        gross: Number(form.gross) || 0,
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
        status: 'Offer Sent',
        documents_ok: false,
      });
      resetOfferForm();
      setMessage({ type: 'success', text: 'Offer created!' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to create offer') });
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await deleteOfferAPI(id);
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete offer. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const convertToEmployee = async (id) => {
    if (!window.confirm('Convert this offer to an employee?')) return;
    try {
      await hrService.convertOffer(id);
      await loadData();
      setMessage({ type: 'success', text: 'Converted to employee successfully!' });
      setActiveTab('onboarding');
      setViewingOffer(null);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to convert offer') });
    }
  };

  const toggleDocs = async (id) => {
    const offer = offers.find(o => o.id === id);
    try {
      await hrService.updateOffer(id, { documents_ok: !offer.documents_ok });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };

  const markAccepted = async (id) => {
    try {
      await hrService.updateOffer(id, { status: 'Accepted' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    // Validate required fields
    const requiredFields = [
      { field: 'reporting_to', label: 'Reporting To' },
    ];
    // If category is Project, client_name is required
    if (taskForm.category === 'Project') {
      requiredFields.push({ field: 'client_name', label: 'Client Name' });
    }
    const missingFields = requiredFields.filter(f => !taskForm[f.field] || taskForm[f.field].toString().trim() === '');
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` }); return;
    }
    setLoading(true);
    try {
      await hrService.createOnboardingTask({
        title: taskForm.employeeName || taskForm.reporting_to || 'Onboarding Task',
        owner: taskForm.reporting_to,
        due_date: taskForm.due_date || null,
        employee_id: taskForm.employee_id || null,
        department_id: taskForm.department_id ? parseInt(taskForm.department_id) : null,
        client_name: taskForm.category === 'Project' ? taskForm.client_name : null,
        category: taskForm.category,
        priority: taskForm.priority,
        description: taskForm.description,
        status: 'Pending',
        requires_attachment: taskForm.requires_attachment,
      });
      resetTaskForm();
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create task' });
    }
    setLoading(false);
  };

  const updateTaskStatus = async (id, status) => {
    try {
      await hrService.updateOnboardingTask(id, { status });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update task' });
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this onboarding task?')) return;
    try {
      await deleteOnboardingTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete task. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const offerFormTabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'employment', label: 'Employment' },
    { id: 'salary', label: 'Salary' }
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title & Stats */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Offers & Onboarding</h1>
          <div className="flex items-center gap-2">
            <span className="btn btn-success">
              {totals.employees} Converted
            </span>
            <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200">
              {totals.pending} Pending Offers
            </span>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-md text-xs font-bold transition-all shadow-sm
                ${showFilters ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
              <Filter size={14} /> Filter
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="btn btn-secondary">
                  <span className="text-xs font-bold text-slate-500 uppercase">Filter</span>
                  <button onClick={() => setShowFilters(false)} className="text-xs text-indigo-600 hover:underline font-bold">Close</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">Status</label>
                    <select className="form-control">
                      <option>All Status</option>
                      <option>Draft</option>
                      <option>Offer Sent</option>
                      <option>Accepted</option>
                      <option>Rejected</option>
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
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
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

          {activeTab === 'offers' ? (
            <button onClick={() => setShowOfferForm(true)}
              className="btn btn-primary">
              <Plus size={16} /> New Offer
            </button>
          ) : (
            <button onClick={() => setShowTaskForm(true)}
              className="btn btn-primary">
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Tab Switcher */}
        <div className="btn btn-secondary">
          <button onClick={() => setActiveTab('offers')}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'offers' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}>
            <FileText className="w-4 h-4" /> Offers
          </button>
          <button onClick={() => setActiveTab('onboarding')}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'onboarding' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}>
            <ClipboardCheck className="w-4 h-4" /> Onboarding
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <>

            {/* Offer Form Modal */}
            {showOfferForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
                <div className="card">
                  <div className="btn btn-secondary">
                    <h2 className="card-title">Create Offer</h2>
                    <button onClick={resetOfferForm} className="btn btn-secondary"><X className="w-5 h-5" /></button>
                  </div>

                  {/* Form Tabs */}
                  <div className="btn btn-secondary">
                    {offerFormTabs.map((tab) => (
                      <button key={tab.id} onClick={() => setFormTab(tab.id)}
                        className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${formTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500'
                          }`}>{tab.label}</button>
                    ))}
                  </div>

                  <form onSubmit={addOffer} className="flex-1 overflow-y-auto p-4">
                    {/* Basic Info Tab */}
                    {formTab === 'basic' && (
                      <div className="space-y-4">
                        <div className="form-row">
                          {/* ── Candidate Name combobox ── */}
                          <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Name *</label>
                            <input
                              type="text"
                              value={candQuery !== '' ? candQuery : (form.candidate_name || '')}
                              placeholder="Select or type candidate name"
                              onChange={e => {
                                const val = e.target.value;
                                setCandQuery(val);
                                setForm(prev => ({ ...prev, candidate_name: val }));
                                setShowCandDrop(true);
                              }}
                              onFocus={() => setShowCandDrop(true)}
                              onBlur={() => setTimeout(() => setShowCandDrop(false), 180)}
                              className="form-control"
                            />
                            {showCandDrop && candidates.length > 0 && (
                              <ul className="btn btn-secondary">
                                {candidates
                                  .filter(c => !candQuery || c.name?.toLowerCase().includes(candQuery.toLowerCase()))
                                  .map(c => (
                                    <li
                                      key={c.id}
                                      className="btn btn-primary"
                                      onMouseDown={() => {
                                        setForm(prev => ({
                                          ...prev,
                                          candidate_name: c.name || '',
                                          email: prev.email || c.email || '',
                                          phone: prev.phone || c.phone || '',
                                          position: prev.position || c.position_applied || ''
                                        }));
                                        setCandQuery('');
                                        setShowCandDrop(false);
                                      }}
                                    >
                                      <span className="font-medium">{c.name}</span>
                                      {c.position_applied ? <span className="text-xs text-slate-400">— {c.position_applied}</span> : null}
                                    </li>
                                  ))}
                                {candidates.filter(c => !candQuery || c.name?.toLowerCase().includes(candQuery.toLowerCase())).length === 0 && (
                                  <li className="px-3 py-2 text-slate-400 italic">No matching candidates — type to add manually</li>
                                )}
                              </ul>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input type="text" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Position *</label>
                            <input type="text" value={form.position || ''} onChange={(e) => setForm({ ...form, position: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                            <input type="text" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Offer Valid Until</label>
                            <input type="date" value={form.offerValidUntil || ''} onChange={(e) => setForm({ ...form, offerValidUntil: e.target.value })}
                              className="form-control" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Employment Tab */}
                    {formTab === 'employment' && (
                      <div className="space-y-4">
                        <div className="form-row">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                            <input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reporting Manager</label>
                            <input type="text" value={form.reportingManager} onChange={(e) => setForm({ ...form, reportingManager: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Work Location</label>
                            <input type="text" value={form.workLocation} onChange={(e) => setForm({ ...form, workLocation: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Probation Period (Months)</label>
                            <input type="number" min={0} value={form.probationPeriod} onChange={(e) => setForm({ ...form, probationPeriod: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period (Days)</label>
                            <select value={form.noticePeriod} onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })}
                              className="form-control">
                              <option value={15}>15 days</option><option value={30}>30 days</option>
                              <option value={60}>60 days</option><option value={90}>90 days</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Any additional notes..."
                            className="form-control" />
                        </div>
                      </div>
                    )}

                    {/* Salary Tab */}
                    {formTab === 'salary' && (
                      <div className="space-y-4">
                        <p className="btn btn-success">Earnings (Monthly)</p>
                        <div className="form-row">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Gross Salary * (Monthly)</label>
                            <input type="number" value={form.gross || ''} onChange={(e) => setForm({ ...form, gross: e.target.value })}
                              className="form-control" placeholder="e.g., 50000" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Other Allowances</label>
                            <input type="number" value={form.allowances || ''} onChange={(e) => setForm({ ...form, allowances: e.target.value })}
                              className="form-control" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Deductions</label>
                            <input type="number" value={form.deductions || ''} onChange={(e) => setForm({ ...form, deductions: e.target.value })}
                              className="form-control" />
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg mt-4">
                          <p className="text-sm text-slate-600">Net Salary: <span className="font-bold text-slate-900">₹{((Number(form.gross) || 0) + (Number(form.allowances) || 0) - (Number(form.deductions) || 0)).toLocaleString()}</span></p>
                        </div>
                      </div>
                    )}
                  </form>

                  <div className="btn btn-secondary">
                    <button type="button" onClick={resetOfferForm}
                      className="btn btn-secondary">Cancel</button>
                    <button onClick={addOffer}
                      className="btn btn-primary">Create Offer</button>
                  </div>
                </div>
              </div>
            )}

            {/* View Offer Modal */}
            {viewingOffer && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
                <div className="card">
                  <div className="btn btn-secondary">
                    <h2 className="card-title">Offer Details</h2>
                    <button onClick={() => setViewingOffer(null)} className="btn btn-secondary"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="text-center pb-4 border-b">
                      <div className="btn btn-primary">
                        <Users className="w-7 h-7 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-lg">{viewingOffer.candidate_name}</h3>
                      <p className="text-sm text-slate-500">{viewingOffer.position}</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${viewingOffer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>{viewingOffer.status}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${viewingOffer.documents_ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          Docs {viewingOffer.documents_ok ? '✓' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div><span className="text-slate-500">Candidate:</span> <span className="block font-medium">{viewingOffer.candidate_name}</span></div>
                      <div><span className="text-slate-500">Position:</span> <span className="block font-medium">{viewingOffer.position}</span></div>
                      <div><span className="text-slate-500">Status:</span> <span className="block font-medium">{viewingOffer.status}</span></div>
                    </div>
                    <div className="btn btn-primary">
                      <div className="form-row">
                        <div><p className="text-slate-500">Gross</p><p className="font-semibold text-emerald-600">₹{(Number(viewingOffer.gross) || 0).toLocaleString()}</p></div>
                        <div><p className="text-slate-500">Deductions</p><p className="font-semibold text-rose-600">₹{(Number(viewingOffer.deductions) || 0).toLocaleString()}</p></div>
                        <div><p className="text-slate-500">Net</p><p className="font-bold text-indigo-600">₹{(Number(viewingOffer.gross) + Number(viewingOffer.allowances) - Number(viewingOffer.deductions) || 0).toLocaleString()}</p></div>
                      </div>
                    </div>
                    {viewingOffer.employee_id && (
                      <div className="btn btn-success">
                        <p className="text-xs text-emerald-600">Converted to Employee</p>
                        <p className="font-bold text-emerald-700">{viewingOffer.employee_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Offer Cards - List View */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {offers.length === 0 ? (
                  <div className="card">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No offers yet</p>
                  </div>
                ) : offers.map((o) => {
                  const salary = computeSalary(o);
                  return (
                    <div key={o.id} className="card">
                      <div className="flex items-start justify-between cursor-pointer" onClick={() => setViewingOffer(o)}>
                        <div className="flex items-center gap-3">
                          <div className="btn btn-primary">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{o.candidate_name}</p>
                            <p className="text-sm text-slate-500">{o.position}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>{o.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`px-2 py-1 rounded-lg ${o.documents_ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          Docs {o.documents_ok ? '✓' : 'Pending'}
                        </span>
                        <span className="btn btn-primary">Net ₹{salary.net.toLocaleString()}</span>
                        {o.employee_id && <span className="btn btn-success">{o.employee_id}</span>}
                      </div>
                      <div className="btn btn-secondary">
                        <button onClick={() => setViewingOffer(o)} className="btn btn-secondary">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {o.status !== 'Accepted' && (
                          <button onClick={() => markAccepted(o.id)} className="btn btn-secondary">
                            Accept
                          </button>
                        )}
                        <button onClick={() => toggleDocs(o.id)} className="btn btn-secondary">
                          Toggle Docs
                        </button>
                        <button
                          onClick={() => convertToEmployee(o.id)}
                          disabled={!!o.employee_id}
                          className="btn btn-success"
                        >
                          {o.employee_id ? 'Converted' : 'Convert → Onboard'}
                        </button>
                        <button onClick={() => deleteOffer(o.id)} className="btn btn-danger">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Offer Cards - Grid View */}
            {viewMode === 'grid' && (
              <div className="form-row">
                {offers.length === 0 ? (
                  <div className="btn btn-secondary">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No offers yet</p>
                  </div>
                ) : offers.map((o) => {
                  const sal = computeSalary(o);
                  return (
                    <div key={o.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="btn btn-primary">
                          <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${o.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          o.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>{o.status || 'Draft'}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1 truncate" title={o.candidate_name}>{o.candidate_name}</h3>
                      <p className="text-xs text-slate-500 mb-3 truncate">{o.position}</p>

                      <div className="btn btn-secondary">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Net Salary</span>
                          <span className="font-medium text-emerald-600">₹{sal.net.toLocaleString()}</span>
                        </div>
                        {o.joiningDate && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>{o.joiningDate}</span>
                          </div>
                        )}
                      </div>

                      <div className="btn btn-secondary">
                        <button onClick={() => setViewingOffer(o)} className="btn btn-secondary">
                          <Eye className="w-3 h-3 mx-auto" />
                        </button>
                        {!o.employee_id && (
                          <button onClick={() => convertToEmployee(o.id)} className="btn btn-success">
                            <CheckCircle2 className="w-3 h-3 mx-auto" />
                          </button>
                        )}
                        <button onClick={() => deleteOffer(o.id)} className="btn btn-danger">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Onboarding Tab */}
        {activeTab === 'onboarding' && (
          <>

            {/* Task Form Modal */}
            {showTaskForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
                <div className="card">
                  <div className="btn btn-secondary">
                    <h2 className="card-title">Add Onboarding Task</h2>
                    <button onClick={resetTaskForm} className="btn btn-secondary"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={addTask} className="p-4 space-y-4">
                    {/* ── Employee Name combobox (from offers) ── */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name</label>
                      <input
                        type="text"
                        value={onbQuery !== '' ? onbQuery : (taskForm.employeeName || '')}
                        placeholder="Select from offers or type manually"
                        onChange={e => {
                          const val = e.target.value;
                          setOnbQuery(val);
                          setTaskForm(prev => ({ ...prev, employeeName: val }));
                          setShowOnbDrop(true);
                        }}
                        onFocus={() => setShowOnbDrop(true)}
                        onBlur={() => setTimeout(() => setShowOnbDrop(false), 180)}
                        className="form-control"
                      />
                      {showOnbDrop && offers.length > 0 && (
                        <ul className="btn btn-secondary">
                          {offers
                            .filter(o => !onbQuery || o.candidate_name?.toLowerCase().includes(onbQuery.toLowerCase()))
                            .map(o => (
                              <li
                                key={o.id}
                                className="btn btn-primary"
                                onMouseDown={() => {
                                  setTaskForm(prev => ({ ...prev, employeeName: o.candidate_name || '' }));
                                  setOnbQuery('');
                                  setShowOnbDrop(false);
                                }}
                              >
                                <span className="font-medium">{o.candidate_name}</span>
                                <span className="text-xs text-slate-400">— {o.position || ''}</span>
                                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${o.employee_id ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>{o.employee_id ? 'Converted' : o.status}</span>
                              </li>
                            ))}
                          {offers.filter(o => !onbQuery || o.candidate_name?.toLowerCase().includes(onbQuery.toLowerCase())).length === 0 && (
                            <li className="px-3 py-2 text-slate-400 italic">No matching offers — type to add manually</li>
                          )}
                        </ul>
                      )}
                    </div>
                    <div className="form-row">
                      {/* Reporting To - employee combobox */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reporting To *</label>
                        <input
                          type="text"
                          value={rptQuery !== '' ? rptQuery : (taskForm.reporting_to || '')}
                          placeholder="Search manager name"
                          onChange={e => {
                            const val = e.target.value;
                            setRptQuery(val);
                            setTaskForm(prev => ({ ...prev, reporting_to: val }));
                            setShowRptDrop(true);
                          }}
                          onFocus={() => setShowRptDrop(true)}
                          onBlur={() => setTimeout(() => setShowRptDrop(false), 180)}
                          className="form-control"
                        />
                        {showRptDrop && employees.length > 0 && (
                          <ul className="btn btn-secondary">
                            {employees
                              .filter(e => !rptQuery || e.name?.toLowerCase().includes(rptQuery.toLowerCase()))
                              .map(e => (
                                <li
                                  key={e.id}
                                  className="btn btn-primary"
                                  onMouseDown={() => {
                                    setTaskForm(prev => ({ ...prev, reporting_to: e.name || '' }));
                                    setRptQuery('');
                                    setShowRptDrop(false);
                                  }}
                                >
                                  <span className="font-medium">{e.name}</span>
                                  {e.designation && <span className="text-xs text-slate-400">— {e.designation}</span>}
                                </li>
                              ))}
                            {employees.filter(e => !rptQuery || e.name?.toLowerCase().includes(rptQuery.toLowerCase())).length === 0 && (
                              <li className="px-3 py-2 text-slate-400 italic">No match — type manually</li>
                            )}
                          </ul>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                        <select value={taskForm.department_id || ''} onChange={(e) => setTaskForm({ ...taskForm, department_id: e.target.value })}
                          className="form-control">
                          <option value="">Select Department</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input type="date" value={taskForm.due_date || ''} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                          className="form-control" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select value={taskForm.category || 'Documentation'} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value, client_name: e.target.value !== 'Project' ? '' : taskForm.client_name })}
                          className="form-control">
                          {taskCategories.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select value={taskForm.priority || 'Medium'} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                          className="form-control">
                          {taskPriorities.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Client Name field - only shown when category is Project */}
                    {taskForm.category === 'Project' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
                        <input type="text" value={taskForm.client_name || ''} onChange={(e) => setTaskForm({ ...taskForm, client_name: e.target.value })}
                          placeholder="Enter client name"
                          className="form-control" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea rows={2} value={taskForm.description || ''} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        placeholder="Task details..."
                        className="form-control" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={taskForm.requiresAttachment || false}
                        onChange={(e) => setTaskForm({ ...taskForm, requiresAttachment: e.target.checked })}
                        className="w-4 h-4 rounded" />
                      Requires Attachment
                    </label>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetTaskForm}
                        className="btn btn-secondary">Cancel</button>
                      <button type="submit"
                        className="btn btn-primary">Add Task</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Task Cards - List View */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="card">
                    <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No onboarding tasks</p>
                  </div>
                ) : tasks.map((t) => (
                  <div key={t.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.category === 'IT Setup' ? 'bg-blue-100' :
                          t.category === 'Documentation' ? 'bg-amber-100' :
                            t.category === 'Training' ? 'bg-purple-100' :
                              'bg-slate-100'
                          }`}>
                          <ClipboardCheck className={`w-5 h-5 ${t.category === 'IT Setup' ? 'text-blue-600' :
                            t.category === 'Documentation' ? 'text-amber-600' :
                              t.category === 'Training' ? 'text-purple-600' :
                                'text-slate-600'
                            }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{t.title}</p>
                          <p className="text-sm text-slate-500">Reporting To: {t.owner || 'Unassigned'}</p>
                          {t.department_name && <p className="text-xs text-slate-500">Dept: {t.department_name}</p>}
                          {t.employeeName && <p className="text-xs text-indigo-600">For: {t.employeeName}</p>}
                          {t.client_name && <p className="text-xs text-emerald-600">Client: {t.client_name}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          t.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{t.status}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${t.priority === 'High' ? 'bg-red-100 text-red-700' :
                          t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>{t.priority}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">{t.category}</span>
                      {t.due && <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1"><Calendar className="w-3 h-3" />{t.due}</span>}
                      {t.requiresAttachment && (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">📎 Attachment required</span>
                      )}
                    </div>
                    {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
                    <div className="btn btn-secondary">
                      <button onClick={() => updateTaskStatus(t.id, 'In Progress')}
                        className="btn btn-secondary">In Progress</button>
                      <button onClick={() => updateTaskStatus(t.id, 'Completed')}
                        className="btn btn-success">Complete</button>
                      <button onClick={() => deleteTask(t.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Task Cards - Grid View */}
            {viewMode === 'grid' && (
              <div className="form-row">
                {tasks.length === 0 ? (
                  <div className="btn btn-secondary">
                    <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No onboarding tasks</p>
                  </div>
                ) : tasks.map((t) => (
                  <div key={t.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.category === 'IT Setup' ? 'bg-blue-100' :
                        t.category === 'Documentation' ? 'bg-amber-100' :
                          t.category === 'Training' ? 'bg-purple-100' :
                            'bg-slate-100'
                        }`}>
                        <ClipboardCheck className={`w-5 h-5 ${t.category === 'IT Setup' ? 'text-blue-600' :
                          t.category === 'Documentation' ? 'text-amber-600' :
                            t.category === 'Training' ? 'text-purple-600' :
                              'text-slate-600'
                          }`} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          t.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                            'bg-amber-100 text-amber-700 border-amber-200'
                          }`}>{t.status}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${t.priority === 'High' ? 'bg-red-100 text-red-700' :
                          t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>{t.priority}</span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-slate-900 mb-1 truncate" title={t.title}>{t.title}</h3>
                    <p className="text-xs text-slate-500 mb-2 truncate">Reporting To: {t.owner || 'Unassigned'}</p>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 truncate">{t.category}</span>
                      </div>
                      {t.department_name && (
                        <p className="text-slate-500 truncate">Dept: {t.department_name}</p>
                      )}
                      {t.employeeName && (
                        <p className="text-indigo-600 truncate">For: {t.employeeName}</p>
                      )}
                      {t.client_name && (
                        <p className="text-emerald-600 truncate">Client: {t.client_name}</p>
                      )}
                    </div>

                    <div className="btn btn-secondary">
                      <div className="flex gap-1">
                        <button onClick={() => updateTaskStatus(t.id, 'In Progress')}
                          className="btn btn-secondary">Progress</button>
                        <button onClick={() => updateTaskStatus(t.id, 'Completed')}
                          className="btn btn-success">Done</button>
                      </div>
                      <button onClick={() => deleteTask(t.id)} className="form-control">
                        <Trash2 className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OffersOnboarding;
