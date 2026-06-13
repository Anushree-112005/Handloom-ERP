import React, { useEffect, useMemo, useState } from 'react';
import { Target, Star, CheckCircle2, AlertTriangle, LogOut, Plus, Trash2, X, TrendingUp, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import hrService, { fetchEmployees, deletePerformance as deletePerformanceAPI, deleteOffboarding as deleteOffboardingAPI } from '../../../services/hrService';

// Helper to extract error message from API response
const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
  if (typeof detail === 'object') return detail.msg || detail.message || JSON.stringify(detail);
  return defaultMsg;
};

const calcScore = (goals) => {
  if (!goals || goals.length === 0) return 0;
  const total = goals.reduce((sum, g) => sum + (g.weight || 0) * (g.score || 0), 0);
  return Number(total.toFixed(2));
};

const PerformanceOffboarding = () => {
  const [activeTab, setActiveTab] = useState('performance');
  const [items, setItems] = useState([]);
  const [offboarding, setOffboarding] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showPerfForm, setShowPerfForm] = useState(false);
  const [showOffForm, setShowOffForm] = useState(false);
  const [form, setForm] = useState({ employee: '', goal: '', weight: 0.2, score: 0 });
  const [offForm, setOffForm] = useState({ employee: '', step: 'Asset clearance' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOffStatus, setFilterOffStatus] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [perfData, offData, empData] = await Promise.all([
        hrService.listPerformance(),
        hrService.listOffboarding(),
        fetchEmployees()
      ]);
      setItems(perfData);
      setOffboarding(offData);
      setEmployees(empData);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  const summary = useMemo(() => {
    const avg = items.length ? (items.reduce((sum, i) => sum + (i.final_score || calcScore(i.goals)), 0) / items.length).toFixed(2) : 0;
    const pendingOff = offboarding.filter((o) => o.status !== 'Completed').length;
    return { avg, pendingOff };
  }, [items, offboarding]);

  const filteredPerformance = useMemo(() => {
    return items.filter(item => !filterStatus || item.status === filterStatus);
  }, [items, filterStatus]);

  const filteredOffboarding = useMemo(() => {
    return offboarding.filter(item => !filterOffStatus || item.status === filterOffStatus);
  }, [offboarding, filterOffStatus]);

  const resetPerfForm = () => {
    setForm({ employee: '', goal: '', weight: 0.2, score: 0 });
    setShowPerfForm(false);
  };

  const resetOffForm = () => {
    setOffForm({ employee: '', step: 'Asset clearance' });
    setShowOffForm(false);
  };

  const addGoal = async (e) => {
    e.preventDefault();
    // Validate required fields and show specific missing fields
    const requiredFields = [
      { field: 'employee', label: 'Employee Name' },
      { field: 'goal', label: 'Goal Description' },
    ];
    const missingFields = requiredFields.filter(f => !form[f.field] || form[f.field].toString().trim() === '');
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` }); return;
    }
    setLoading(true);
    try {
      const existing = items.find((i) => i.employee === form.employee);
      const newGoal = { title: form.goal, weight: Number(form.weight), score: Number(form.score) };
      if (existing) {
        const updatedGoals = [...(existing.goals || []), newGoal];
        await hrService.updatePerformance(existing.id, { goals: updatedGoals });
      } else {
        await hrService.createPerformance({
          employee: form.employee,
          goals: [newGoal],
          status: 'Manager review'
        });
      }
      resetPerfForm();
      await loadData();
      setMessage({ type: 'success', text: 'Goal added!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add goal' });
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const deletePerformance = async (id) => {
    if (!window.confirm('Delete this performance record?')) return;
    try {
      await deletePerformanceAPI(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete performance record.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await hrService.updatePerformance(id, { status });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const addOffboarding = async (e) => {
    e.preventDefault();
    // Validate required fields and show specific missing fields
    if (!offForm.employee || offForm.employee.toString().trim() === '') {
      setMessage({ type: 'error', text: 'Missing required field: Employee Name' }); return;
    }
    setLoading(true);
    try {
      await hrService.createOffboarding({
        employee: offForm.employee,
        step: offForm.step,
        status: 'Pending',
        assets_cleared: false,
        ffs_ready: false,
      });
      resetOffForm();
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add offboarding' });
    }
    setLoading(false);
  };

  const deleteOffboarding = async (id) => {
    if (!window.confirm('Delete this offboarding record?')) return;
    try {
      await deleteOffboardingAPI(id);
      setOffboarding(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete offboarding record.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const completeOff = async (id) => {
    try {
      await hrService.updateOffboarding(id, { status: 'Completed', ffs_ready: true });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to complete' });
    }
  };

  const toggleAssets = async (id) => {
    const item = offboarding.find(o => o.id === id);
    try {
      await hrService.updateOffboarding(id, { assets_cleared: !item.assets_cleared });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update' });
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + stat badges */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">PERFORMANCE & OFFBOARDING</h1>
          <span className="btn btn-primary">
            Avg Score: {summary.avg}
          </span>
          {summary.pendingOff > 0 && (
            <span className="btn btn-danger">
              {summary.pendingOff} Pending Exits
            </span>
          )}
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
              {(filterStatus || filterOffStatus) && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => { setFilterStatus(''); setFilterOffStatus(''); }} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                {activeTab === 'performance' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control">
                      <option value="">All Status</option>
                      <option value="Manager review">Manager Review</option>
                      <option value="HR review">HR Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select value={filterOffStatus} onChange={(e) => setFilterOffStatus(e.target.value)}
                      className="form-control">
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="btn btn-secondary">
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>

          {activeTab === 'performance' ? (
            <button onClick={() => setShowPerfForm(true)}
              className="btn btn-primary">
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          ) : (
            <button onClick={() => setShowOffForm(true)}
              className="btn btn-danger">
              <Plus className="w-4 h-4" /> Add Exit
            </button>
          )}
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setActiveTab('performance')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'performance' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}>
            <Target className="w-4 h-4" /> Performance
          </button>
          <button onClick={() => setActiveTab('offboarding')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'offboarding' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}>
            <LogOut className="w-4 h-4" /> Offboarding
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <>
            {/* Performance Form Modal */}
            {showPerfForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
                <div className="card">
                  <div className="btn btn-secondary">
                    <h2 className="card-title">Add Goal/KPI</h2>
                    <button onClick={resetPerfForm} className="btn btn-secondary"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={addGoal} className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                      <input type="text" value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}
                        className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Goal *</label>
                      <input type="text" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                        className="form-control" />
                    </div>
                    <div className="form-row">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Weight (0-1)</label>
                        <input type="number" min={0} max={1} step={0.1} value={form.weight}
                          onChange={(e) => setForm({ ...form, weight: e.target.value })}
                          className="form-control" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Score (0-5)</label>
                        <input type="number" min={0} max={5} step={0.1} value={form.score}
                          onChange={(e) => setForm({ ...form, score: e.target.value })}
                          className="form-control" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetPerfForm}
                        className="btn btn-secondary">Cancel</button>
                      <button type="submit"
                        className="btn btn-primary">Add</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Performance Grid View */}
            {viewMode === 'grid' && (
              <div className="form-row">
                {filteredPerformance.length === 0 ? (
                  <div className="btn btn-secondary">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No performance reviews</p>
                  </div>
                ) : filteredPerformance.map((i) => {
                  const score = calcScore(i.goals);
                  return (
                    <div key={i.id} className="card">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{i.employee}</p>
                          <p className="text-sm text-slate-500">{i.status}</p>
                        </div>
                        <span className="text-lg font-bold text-indigo-600">{score}</span>
                      </div>
                      <div className="space-y-1">
                        {i.goals.map((g, idx) => (
                          <div key={idx} className="btn btn-secondary">
                            <span className="text-slate-700">{g.title}</span>
                            <span className="text-xs text-slate-500">W: {g.weight} • S: {g.score}</span>
                          </div>
                        ))}
                      </div>
                      <div className="btn btn-secondary">
                        <button onClick={() => updateStatus(i.id, 'Manager review')}
                          className="btn btn-secondary">Manager</button>
                        <button onClick={() => updateStatus(i.id, 'HR review')}
                          className="btn btn-secondary">HR</button>
                        <button onClick={() => updateStatus(i.id, 'Completed')}
                          className="btn btn-success">Complete</button>
                        <button onClick={() => deletePerformance(i.id)} className="btn btn-danger">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Performance List View */}
            {viewMode === 'list' && (
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead className="btn btn-secondary">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Goals</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Score</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredPerformance.map((i) => {
                        const score = calcScore(i.goals);
                        return (
                          <tr key={i.id} className="btn btn-secondary">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{i.employee}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{i.status}</td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-slate-600 space-y-1">
                                {i.goals.map((g, idx) => (
                                  <div key={idx} className="truncate">{g.title} (W:{g.weight} S:{g.score})</div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-lg font-bold text-indigo-600">{score}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => updateStatus(i.id, 'Manager review')}
                                  className="btn btn-secondary">Manager</button>
                                <button onClick={() => updateStatus(i.id, 'HR review')}
                                  className="btn btn-secondary">HR</button>
                                <button onClick={() => updateStatus(i.id, 'Completed')}
                                  className="btn btn-success">Complete</button>
                                <button onClick={() => deletePerformance(i.id)} className="btn btn-danger">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredPerformance.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No performance reviews</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Offboarding Tab */}
        {activeTab === 'offboarding' && (
          <>
            {/* Offboarding Form Modal */}
            {showOffForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
                <div className="card">
                  <div className="btn btn-secondary">
                    <h2 className="card-title">Add Exit</h2>
                    <button onClick={resetOffForm} className="btn btn-secondary"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={addOffboarding} className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                      <input type="text" value={offForm.employee} onChange={(e) => setOffForm({ ...offForm, employee: e.target.value })}
                        className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Step</label>
                      <select value={offForm.step} onChange={(e) => setOffForm({ ...offForm, step: e.target.value })}
                        className="form-control">
                        <option>Asset clearance</option><option>Exit interview</option><option>Knowledge transfer</option><option>Final settlement</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetOffForm}
                        className="btn btn-secondary">Cancel</button>
                      <button type="submit"
                        className="btn btn-danger">Add</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Offboarding Grid View */}
            {viewMode === 'grid' && (
              <div className="form-row">
                {filteredOffboarding.length === 0 ? (
                  <div className="btn btn-secondary">
                    <LogOut className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No offboarding cases</p>
                  </div>
                ) : filteredOffboarding.map((o) => (
                  <div key={o.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{o.employee}</p>
                        <p className="text-sm text-slate-500">{o.step}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>{o.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-lg ${o.assets_cleared ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        Assets {o.assets_cleared ? '✓' : 'Pending'}
                      </span>
                      <span className={`px-2 py-1 rounded-lg ${o.ffs_ready ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        F&F {o.ffs_ready ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                    <div className="btn btn-secondary">
                      <button onClick={() => toggleAssets(o.id)}
                        className="btn btn-secondary">Toggle Assets</button>
                      <button onClick={() => completeOff(o.id)}
                        className="btn btn-success">Complete</button>
                      <button onClick={() => deleteOffboarding(o.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Offboarding List View */}
            {viewMode === 'list' && (
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead className="btn btn-secondary">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Step</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Assets</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">F&F</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredOffboarding.map((o) => (
                        <tr key={o.id} className="btn btn-secondary">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{o.employee}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{o.step}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded ${o.assets_cleared ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {o.assets_cleared ? '✓ Cleared' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded ${o.ffs_ready ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {o.ffs_ready ? 'Ready' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => toggleAssets(o.id)}
                                className="btn btn-secondary">Toggle Assets</button>
                              <button onClick={() => completeOff(o.id)}
                                className="btn btn-success">Complete</button>
                              <button onClick={() => deleteOffboarding(o.id)} className="btn btn-danger">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOffboarding.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <LogOut className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No offboarding cases</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>{/* END DATA AREA */}
    </div>
  );
};

export default PerformanceOffboarding;
