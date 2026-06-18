import React, { useState, useEffect } from 'react';
import { Target, Plus, Filter, LayoutList, LayoutGrid, CheckCircle, Clock, TrendingUp, X, Save, Edit2, Trash2, BarChart3, User } from 'lucide-react';
import { fetchGoals, createGoal, updateGoal, deleteGoal, fetchEmployees } from '../../../services/hrService';

const goalCategories = [
  'Performance', 'Learning & Development', 'Project', 'Sales', 
  'Customer Satisfaction', 'Innovation', 'Leadership', 'Teamwork'
];

const statusColors = {
  'Not Started': 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'On Track': 'bg-green-100 text-green-700',
  'At Risk': 'bg-yellow-100 text-yellow-700',
  'Behind': 'bg-red-100 text-red-700',
  'Completed': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-slate-100 text-slate-600'
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const initialForm = {
    employee_id: '',
    employee_name: '',
    title: '',
    description: '',
    category: '',
    target_value: '',
    current_value: '0',
    unit: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    weight: '100'
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalData, empData] = await Promise.all([
        fetchGoals(),
        fetchEmployees()
      ]);
      setGoals(goalData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.title || !form.target_value || !form.due_date) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        ...form,
        employee_id: parseInt(form.employee_id),
        target_value: parseFloat(form.target_value),
        current_value: parseFloat(form.current_value) || 0,
        weight: parseFloat(form.weight) || 100
      };

      if (editingId) {
        await updateGoal(editingId, payload);
      } else {
        await createGoal(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleEdit = (goal) => {
    setForm({
      employee_id: goal.employee_id,
      employee_name: goal.employee_name,
      title: goal.title,
      description: goal.description || '',
      category: goal.category || '',
      target_value: goal.target_value || '',
      current_value: goal.current_value || '0',
      unit: goal.unit || '',
      start_date: goal.start_date?.split('T')[0] || '',
      due_date: goal.due_date?.split('T')[0] || '',
      weight: goal.weight || '100'
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await deleteGoal(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateGoal(id, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateProgress = async (id, newValue) => {
    try {
      await updateGoal(id, { current_value: parseFloat(newValue) });
      loadData();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e.id === parseInt(empId));
    setForm({
      ...form,
      employee_id: empId,
      employee_name: emp?.name || ''
    });
  };

  const getProgress = (current, target) => {
    if (!target || target === 0) return 0;
    const progress = (current / target) * 100;
    return Math.min(progress, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-green-400';
    if (progress >= 50) return 'bg-yellow-400';
    if (progress >= 25) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const filteredGoals = goals.filter(goal => {
    const matchesStatus = !filterStatus || goal.status === filterStatus;
    const matchesCategory = !filterCategory || goal.category === filterCategory;
    return matchesStatus && matchesCategory;
  });

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'Completed').length,
    inProgress: goals.filter(g => g.status === 'In Progress' || g.status === 'On Track').length,
    avgProgress: goals.length > 0 
      ? Math.round(goals.reduce((sum, g) => sum + getProgress(g.current_value, g.target_value), 0) / goals.length)
      : 0
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const diff = new Date(dueDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        {/* LEFT: Title + record count */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">GOALS & KPIs</h1>
          <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
            {filteredGoals.length} Records
          </span>
        </div>

        {/* RIGHT: Add button */}
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Goal
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
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Goals</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.completed}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.avgProgress}%</p>
              <p className="text-xs text-slate-500">Avg Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredGoals.map(goal => {
          const progress = getProgress(goal.current_value, goal.target_value);
          const daysRemaining = getDaysRemaining(goal.due_date);
          
          return (
            <div key={goal.id} className="card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="card-title">{goal.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
                      {goal.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{goal.employee_name}</span>
                    </div>
                    {goal.category && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{goal.category}</span>
                    )}
                    {goal.weight && (
                      <span className="text-xs">Weight: {goal.weight}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(goal)} className="btn btn-secondary">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="btn btn-danger">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              
              {goal.description && (
                <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
              )}
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">Progress</span>
                  <span className="font-semibold text-slate-800">
                    {goal.current_value} / {goal.target_value} {goal.unit}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-500">{progress.toFixed(0)}% complete</span>
                  {daysRemaining !== null && (
                    <span className={`text-xs ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : 'text-slate-500'}`}>
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Quick Update */}
              <div className="btn btn-secondary">
                <span className="text-xs text-slate-500">Quick update:</span>
                <input
                  type="number"
                  className="btn btn-secondary"
                  placeholder="Value"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateProgress(goal.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex-1" />
                <span className="text-xs text-slate-500">Due: {formatDate(goal.due_date)}</span>
              </div>
            </div>
          );
        })}
          {filteredGoals.length === 0 && (
            <div className="card">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No goals found</p>
            </div>
          )}
        </div>
      )}

      {/* Goals Grid View */}
      {viewMode === 'grid' && (
        <div className="form-row">
          {filteredGoals.length === 0 ? (
            <div className="btn btn-secondary">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No goals found</p>
            </div>
          ) : filteredGoals.map(goal => {
            const progress = getProgress(goal.current_value, goal.target_value);
            const daysRemaining = getDaysRemaining(goal.due_date);
            
            return (
              <div key={goal.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate text-sm">{goal.title}</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{goal.employee_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[goal.status]}`}>
                    {goal.status}
                  </span>
                </div>
                
                {goal.category && (
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-600 mb-2">{goal.category}</span>
                )}
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">Progress</span>
                    <span className="font-semibold text-slate-800">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${getProgressColor(progress)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {goal.current_value} / {goal.target_value} {goal.unit}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Due: {formatDate(goal.due_date)}</span>
                  {daysRemaining !== null && (
                    <span className={daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : ''}>
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d late` : `${daysRemaining}d left`}
                    </span>
                  )}
                </div>
                
                <div className="btn btn-secondary">
                  <button onClick={() => handleEdit(goal)} className="btn btn-secondary">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="btn btn-danger">
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Goal</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                  <select
                    value={form.employee_id}
                    onChange={handleEmployeeChange}
                    className="form-control"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Category</option>
                    {goalCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-control"
                  placeholder="e.g., Increase sales by 20%"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Detailed description of the goal..."
                />
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Value *</label>
                  <input
                    type="number"
                    value={form.target_value}
                    onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                    className="form-control"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    value={form.current_value}
                    onChange={(e) => setForm({ ...form, current_value: e.target.value })}
                    className="form-control"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="form-control"
                    placeholder="%"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (%)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="form-control"
                    placeholder="100"
                  />
                </div>
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
    </div>
  );
}
