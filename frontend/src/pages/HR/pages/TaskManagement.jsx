import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Plus, X, Edit2, Trash2, Users, Calendar, User,
  CheckCircle2, Clock, AlertTriangle, Eye, MessageSquare, ChevronDown,
  ChevronUp, Briefcase, Target, Filter, LayoutList, LayoutGrid
} from 'lucide-react';
import hrService, { fetchEmployees, fetchDepartments } from '../../../services/hrService';

// Helper to extract error message from API response
const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
  if (typeof detail === 'object') return detail.msg || detail.message || JSON.stringify(detail);
  return defaultMsg;
};

const priorityColors = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusColors = {
  Open: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const taskTypes = ['General', 'Project', 'Training', 'Review', 'Audit', 'Meeting', 'Documentation', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

const initialForm = {
  title: '', description: '', task_type: 'General', priority: 'Medium', status: 'Open',
  created_by: '', assigned_to: [], start_date: '', due_date: '',
  estimated_hours: 0, department: '', tags: []
};

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeesWithTasks, setEmployeesWithTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEmployeeView, setShowEmployeeView] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [taskData, empData, deptData, empWithTasks] = await Promise.all([
        hrService.listTasks(),
        fetchEmployees(),
        fetchDepartments(),
        hrService.getEmployeesWithTasks()
      ]);
      setTasks(taskData);
      setEmployees(empData);
      setDepartments(deptData);
      setEmployeesWithTasks(empWithTasks);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  const stats = useMemo(() => {
    const open = tasks.filter(t => t.status === 'Open').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed').length;
    return { open, inProgress, completed, overdue, total: tasks.length };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;
      if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return employees;
    return employees.filter(e =>
      e.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.employee_id?.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedEmployees([]);
    setEditingId(null);
    setShowForm(false);
    setEmployeeSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    const requiredFields = [
      { field: 'title', label: 'Task Title' },
      { field: 'created_by', label: 'Created By' },
    ];
    const missingFields = requiredFields.filter(f => !form[f.field] || form[f.field].toString().trim() === '');
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` });
      return;
    }
    if (selectedEmployees.length === 0) {
      setMessage({ type: 'error', text: 'Please assign at least one employee to this task' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        assigned_to: selectedEmployees.map(emp => ({
          id: emp.id,
          name: emp.name,
          employee_id: emp.employee_id,
          role: emp.role || 'Assignee'
        }))
      };

      if (editingId) {
        await hrService.updateTask(editingId, payload);
        setMessage({ type: 'success', text: 'Task updated!' });
      } else {
        await hrService.createTask(payload);
        setMessage({ type: 'success', text: 'Task created!' });
      }
      resetForm();
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to save task') });
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title || '',
      description: task.description || '',
      task_type: task.task_type || 'General',
      priority: task.priority || 'Medium',
      status: task.status || 'Open',
      created_by: task.created_by || '',
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours || 0,
      department: task.department || '',
      tags: task.tags || []
    });
    setSelectedEmployees(task.assigned_to || []);
    setEditingId(task.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await hrService.deleteTask(id);
      setMessage({ type: 'success', text: 'Task deleted!' });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete task' });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await hrService.updateTask(id, { status: newStatus });
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const addEmployee = (emp) => {
    if (!selectedEmployees.find(e => e.id === emp.id)) {
      setSelectedEmployees([...selectedEmployees, { ...emp, role: 'Assignee' }]);
    }
    setEmployeeSearch('');
    setShowEmployeeDropdown(false);
  };

  const removeEmployee = (empId) => {
    setSelectedEmployees(selectedEmployees.filter(e => e.id !== empId));
  };

  const updateEmployeeRole = (empId, role) => {
    setSelectedEmployees(selectedEmployees.map(e =>
      e.id === empId ? { ...e, role } : e
    ));
  };

  const handleAddComment = async (taskId) => {
    if (!newComment.trim()) return;
    try {
      await hrService.addTaskComment(taskId, { user: 'HR', message: newComment });
      setNewComment('');
      await loadData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add comment' });
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Task Management</h1>
          <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
            {filteredTasks.length} Records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmployeeView(!showEmployeeView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
              showEmployeeView ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={14} /> Employee View
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

      {/* Stats Cards */}
      <div className="form-row">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Open', value: stats.open, color: 'bg-blue-50 text-blue-700' },
          { label: 'In Progress', value: stats.inProgress, color: 'bg-amber-50 text-amber-700' },
          { label: 'Completed', value: stats.completed, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Overdue', value: stats.overdue, color: 'bg-rose-50 text-rose-700' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-xl p-3 text-center`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Employee View - Shows who works on what */}
      {showEmployeeView && (
        <div className="card">
          <div className="btn btn-secondary">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4" /> Employee Task Overview
            </h3>
            <p className="text-xs text-slate-500 mt-1">View which employees work on which tasks and their reporting structure</p>
          </div>
          <div className="divide-y divide-slate-100">
            {employeesWithTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No employees found. Add employees first.</p>
              </div>
            ) : (
              employeesWithTasks.map((emp) => (
                <div key={emp.id} className="btn btn-secondary">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="btn btn-primary">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{emp.name}</h4>
                          <p className="text-xs text-slate-500">{emp.employee_id} • {emp.designation || 'No designation'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Department & Manager */}
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="text-slate-500">Dept:</span>
                        <span className="ml-1 font-medium text-slate-700">{emp.department || 'Unassigned'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">Reports to:</span>
                        <span className="ml-1 font-medium text-indigo-600">
                          {emp.reporting_manager_name || 'No manager assigned'}
                        </span>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="flex-1">
                      {emp.tasks.length === 0 ? (
                        <span className="text-sm text-slate-400 italic">No tasks assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {emp.tasks.map((task, idx) => (
                            <span key={idx} className={`px-2 py-1 rounded text-xs font-medium ${statusColors[task.status] || 'bg-slate-100 text-slate-700'}`}>
                              {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Task Count */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${emp.task_count > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {emp.task_count} Task{emp.task_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      {viewMode === 'list' ? (
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="card">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No tasks found. Create your first task!</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="card">
              {/* Task Header */}
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="card-title">{task.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status]}`}>
                        {task.status}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {task.task_type}
                      </span>
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'Completed' ? 'text-rose-600 font-medium' : ''
                          }`}>
                          <Calendar className="w-3 h-3" /> Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> By: {task.created_by}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Employees */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {(task.assigned_to || []).slice(0, 3).map((emp, idx) => (
                        <div key={idx} className="btn btn-primary" title={emp.name || emp}>
                          {(emp.name || emp).charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {(task.assigned_to || []).length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                          +{task.assigned_to.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="btn btn-secondary">
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      className="btn btn-secondary" title="View details">
                      {expandedTask === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleEdit(task)} className="btn btn-secondary" title="Edit">
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="btn btn-danger" title="Delete">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTask === task.id && (
                <div className="btn btn-secondary">
                  {/* Assigned Employees Detail */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Assigned Employees ({(task.assigned_to || []).length})
                    </h4>
                    <div className="form-row">
                      {(task.assigned_to || []).map((emp, idx) => {
                        const empDetails = employeesWithTasks.find(e => e.id === emp.id);
                        return (
                          <div key={idx} className="card">
                            <div className="flex items-center gap-2">
                              <div className="btn btn-primary">
                                {(emp.name || emp).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-slate-900 truncate">{emp.name || emp}</div>
                                <div className="text-xs text-slate-500">
                                  {emp.role || 'Assignee'}
                                  {empDetails?.reporting_manager_name && (
                                    <span className="ml-2">• Reports to: <span className="text-indigo-600">{empDetails.reporting_manager_name}</span></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Comments ({(task.comments || []).length})
                    </h4>
                    <div className="space-y-2 mb-3">
                      {(task.comments || []).map((c, idx) => (
                        <div key={idx} className="card">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-medium text-slate-700">{c.user}</span>
                            <span>•</span>
                            <span>{new Date(c.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-700">{c.message}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="btn btn-secondary"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(task.id)} />
                      <button onClick={() => handleAddComment(task.id)}
                        className="btn btn-primary">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      ) : (
        <div className="form-row">
          {filteredTasks.length === 0 ? (
            <div className="btn btn-secondary">
              <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No tasks found. Create your first task!</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="card">
                {/* Task Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{task.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status]}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(task)} className="btn btn-secondary" title="Edit">
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="btn btn-danger" title="Delete">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
                )}

                {/* Task Info */}
                <div className="btn btn-secondary">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{task.task_type}</span>
                  </div>
                  {task.due_date && (
                    <div className={`flex items-center gap-2 text-xs ${
                      new Date(task.due_date) < new Date() && task.status !== 'Completed' 
                        ? 'text-rose-600 font-medium' 
                        : 'text-slate-600'
                    }`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <User className="w-3.5 h-3.5" />
                    <span>By: {task.created_by}</span>
                  </div>
                </div>

                {/* Assigned Employees */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {(task.assigned_to || []).slice(0, 4).map((emp, idx) => (
                      <div key={idx} className="btn btn-primary" title={emp.name || emp}>
                        {(emp.name || emp).charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(task.assigned_to || []).length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                        +{task.assigned_to.length - 4}
                      </div>
                    )}
                  </div>
                  <select 
                    value={task.status} 
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="btn btn-secondary"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* Create/Edit Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="card-title">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
              <button onClick={resetForm} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Basic Info */}
              <div className="form-row">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-control" placeholder="Enter task title" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-control" rows={3} placeholder="Task description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
                  <select value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                    className="form-control">
                    {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="form-control">
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Created By *</label>
                  <input type="text" value={form.created_by} onChange={(e) => setForm({ ...form, created_by: e.target.value })}
                    className="form-control" placeholder="HR name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="form-control">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="form-control" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="form-control" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Hours</label>
                  <input type="number" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: Number(e.target.value) })}
                    className="form-control" min="0" step="0.5" />
                </div>
              </div>

              {/* Assign Employees */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Employees *</label>
                <div className="relative">
                  <input type="text" value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className="form-control"
                    placeholder="Search employees by name or ID..." />
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <ul className="btn btn-secondary">
                      {filteredEmployees.slice(0, 10).map(emp => (
                        <li key={emp.id} onClick={() => addEmployee(emp)}
                          className="btn btn-primary">
                          <div>
                            <span className="font-medium">{emp.name}</span>
                            <span className="text-slate-400 ml-2 text-xs">{emp.employee_id}</span>
                          </div>
                          <span className="text-xs text-slate-500">{emp.department || 'No dept'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Selected Employees */}
                {selectedEmployees.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedEmployees.map((emp) => {
                      const empDetails = employeesWithTasks.find(e => e.id === emp.id);
                      return (
                        <div key={emp.id} className="btn btn-secondary">
                          <div className="btn btn-primary">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-slate-900">{emp.name}</div>
                            <div className="text-xs text-slate-500">
                              {emp.employee_id}
                              {empDetails?.reporting_manager_name && (
                                <span className="ml-2">• Reports to: <span className="text-indigo-600">{empDetails.reporting_manager_name}</span></span>
                              )}
                            </div>
                          </div>
                          <select value={emp.role || 'Assignee'} onChange={(e) => updateEmployeeRole(emp.id, e.target.value)}
                            className="btn btn-secondary">
                            <option value="Assignee">Assignee</option>
                            <option value="Lead">Lead</option>
                            <option value="Reviewer">Reviewer</option>
                          </select>
                          <button type="button" onClick={() => removeEmployee(emp.id)}
                            className="btn btn-danger">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {message.text && message.type === 'error' && (
                <div className="btn btn-danger">
                  <AlertTriangle className="w-4 h-4" /> {message.text}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="btn btn-secondary">
              <button type="button" onClick={resetForm}
                className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="btn btn-primary">
                {loading ? 'Saving...' : (editingId ? 'Update Task' : 'Create Task')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
