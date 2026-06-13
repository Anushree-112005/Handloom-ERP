import React, { useState, useEffect } from 'react';
import {
    FolderOpen, Plus, Search, Edit2, Trash2, X, Save,
    Calendar, Users, TrendingUp, AlertCircle, CheckCircle2,
    Clock, ChevronDown, Filter
} from 'lucide-react';
import { fetchEmployees } from '../../../services/hrService';
import { getProjects, createProject, updateProject, deleteProject } from '../../../services/projectService';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_OPTIONS = ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

const PRIORITY_COLORS = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-amber-100 text-amber-700',
    Critical: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
    Planning: 'bg-purple-100 text-purple-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    'On Hold': 'bg-amber-100 text-amber-700',
    Cancelled: 'bg-red-100 text-red-700',
};

const STATS_COLOR_MAP = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

const generateProjectCode = (name) => {
    if (!name) return '';
    const timestamp = Date.now().toString().slice(-6);
    const code = name.split(' ').slice(0, 2).join('').toUpperCase().slice(0, 4);
    return `${code}-${timestamp}`;
};

const initialForm = {
    project_code: '',
    project_name: '',
    description: '',
    manager_id: '',
    manager_name: '',
    status: 'Planning',
    priority: 'Medium',
    start_date: '',
    end_date: '',
    budget: '',
    progress: 0,
    team_members: [],
};

function getErrorMessage(err) {
    return err?.response?.data?.detail || err?.message || 'An error occurred';
}

export default function HRProjects() {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            console.log('Starting loadData...');
            const [projRes, empData] = await Promise.all([
                getProjects({ limit: 100 }),
                fetchEmployees(),
            ]);
            
            console.log('API Responses:', { projRes, empData });
            
            // Handle projects
            const projects = Array.isArray(projRes?.data?.projects) ? projRes.data.projects : [];
            console.log('Processed projects:', projects);
            setProjects(projects);
            
            // Handle employees - fetchEmployees now always returns an array
            const employees = Array.isArray(empData) ? empData : [];
            console.log('Processed employees count:', employees.length);
            console.log('Employees data:', employees);
            setEmployees(employees);
        } catch (err) {
            console.error('Error loading data:', err);
            showMsg('error', 'Failed to load data: ' + (err?.message || 'Unknown error'));
            setEmployees([]);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleEmployeeChange = (e) => {
        const id = e.target.value;
        const emp = employees.find(em => String(em.id) === String(id));
        setForm(prev => ({ ...prev, manager_id: id, manager_name: emp ? emp.name : '' }));
    };

    const handleAddTeamMember = (e) => {
        const empId = e.target.value;
        if (!empId) return;
        
        if (!form.team_members.includes(empId)) {
            setForm(prev => ({
                ...prev,
                team_members: [...prev.team_members, empId]
            }));
        }
        e.target.value = '';
    };

    const handleRemoveTeamMember = (empId) => {
        setForm(prev => ({
            ...prev,
            team_members: prev.team_members.filter(id => id !== empId)
        }));
    };

    const handleSubmit = async () => {
        if (!form.project_name.trim()) {
            showMsg('error', 'Project Name is required.');
            return;
        }
        
        setSaving(true);
        try {
            const projectCode = form.project_code.trim() || generateProjectCode(form.project_name);
            const payload = {
                ...form,
                project_code: projectCode,
                manager_id: form.manager_id ? parseInt(form.manager_id) : null,
                budget: form.budget ? parseFloat(form.budget) : null,
                progress: parseInt(form.progress) || 0,
                start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
                end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
                team_members: Array.isArray(form.team_members) ? form.team_members.map(id => parseInt(id)) : [],
            };

            console.log('Submitting payload:', payload);

            let response;
            if (editingId) {
                response = await updateProject(editingId, payload);
                showMsg('success', 'Project updated successfully!');
            } else {
                response = await createProject(payload);
                showMsg('success', 'Project created successfully!');
            }
            
            console.log('Response:', response);

            // Close form and reload data
            setTimeout(() => {
                setShowForm(false);
                setEditingId(null);
                setForm(initialForm);
                loadData();
            }, 1000);
        } catch (err) {
            console.error('Submit error:', err);
            const errorMsg = getErrorMessage(err);
            showMsg('error', errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (proj) => {
        setForm({
            project_code: proj.project_code || '',
            project_name: proj.project_name || '',
            description: proj.description || '',
            manager_id: proj.manager_id ? String(proj.manager_id) : '',
            manager_name: proj.manager_name || '',
            status: proj.status || 'Planning',
            priority: proj.priority || 'Medium',
            start_date: proj.start_date ? proj.start_date.split('T')[0] : '',
            end_date: proj.end_date ? proj.end_date.split('T')[0] : '',
            budget: proj.budget || '',
            progress: proj.progress || 0,
            team_members: proj.team_members || [],
        });
        setEditingId(proj.project_id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this project? This action cannot be undone.')) return;
        try {
            await deleteProject(id);
            showMsg('success', 'Project deleted.');
            await loadData();
        } catch (err) {
            showMsg('error', getErrorMessage(err));
        }
    };

    const filtered = projects.filter(p => {
        const matchSearch = !searchTerm ||
            p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.manager_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = !filterStatus || p.status === filterStatus;
        const matchPriority = !filterPriority || p.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
    });

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'In Progress').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        planning: projects.filter(p => p.status === 'Planning').length,
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-indigo-600" /> Projects
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage team projects and assignments</p>
                </div>
                <button
                    onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="form-row">
                {[
                    { label: 'Total Projects', value: stats.total, color: 'indigo', icon: FolderOpen },
                    { label: 'In Progress', value: stats.active, color: 'blue', icon: TrendingUp },
                    { label: 'Completed', value: stats.completed, color: 'emerald', icon: CheckCircle2 },
                    { label: 'Planning', value: stats.planning, color: 'purple', icon: Clock },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="card">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${STATS_COLOR_MAP[color].bg} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${STATS_COLOR_MAP[color].text}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{value}</p>
                                <p className="text-xs text-slate-500">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects or manager..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="form-control"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="btn btn-secondary"
                >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="btn btn-secondary"
                >
                    <option value="">All Priority</option>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                </div>
            ) : (
                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead className="btn btn-secondary">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Project Name</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Manager</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Start Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">End Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Priority</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Progress</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(proj => (
                                    <tr key={proj.project_id} className="btn btn-secondary">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{proj.project_name}</p>
                                                {proj.description && (
                                                    <p className="text-xs text-slate-400 truncate max-w-xs">{proj.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="btn btn-primary">
                                                    {(proj.manager_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm text-slate-600">{proj.manager_name || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(proj.start_date)}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(proj.end_date)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[proj.priority] || 'bg-slate-100 text-slate-600'}`}>
                                                {proj.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[proj.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {proj.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-200 rounded-full h-1.5 w-20">
                                                    <div
                                                        className="btn btn-primary"
                                                        style={{ width: `${Math.min(proj.progress || 0, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500">{proj.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(proj)}
                                                    className="btn btn-secondary"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(proj.project_id)}
                                                    className="btn btn-danger"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-16 text-center">
                                            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium">No projects found</p>
                                            <p className="text-slate-400 text-sm mt-1">Create your first project using the button above</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
                    <div className="card">
                        {/* Modal Header */}
                        <div className="btn btn-secondary">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {editingId ? 'Edit Project' : 'New Project'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            {/* Project Code */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Project Code *</label>
                                <input
                                    type="text"
                                    value={form.project_code}
                                    onChange={e => setForm(prev => ({ ...prev, project_code: e.target.value }))}
                                    className="form-control"
                                    placeholder="e.g. WEB-123456 (auto-generated if left empty)"
                                />
                            </div>

                            {/* Project Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name *</label>
                                <input
                                    type="text"
                                    value={form.project_name}
                                    onChange={e => setForm(prev => ({ ...prev, project_name: e.target.value }))}
                                    className="form-control"
                                    placeholder="e.g. Website Redesign Q2"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="form-control"
                                    placeholder="Brief project overview..."
                                />
                            </div>

                            {/* Manager (Employee Dropdown) */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    Project Manager (Employee)
                                </label>
                                {employees.length === 0 ? (
                                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-700">
                                        No employees found. Please add employees first.
                                    </div>
                                ) : (
                                    <select
                                        value={form.manager_id}
                                        onChange={handleEmployeeChange}
                                        className="form-control"
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name || 'Unnamed'}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Manager Name Display */}
                            {form.manager_name && (
                                <div className="btn btn-primary">
                                    <p className="text-xs font-medium text-indigo-600 mb-1">Selected Manager</p>
                                    <div className="flex items-center gap-2">
                                        <div className="btn btn-primary">
                                            {(form.manager_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-slate-800">{form.manager_name}</span>
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="form-row">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        <Calendar className="w-4 h-4 inline mr-1" /> Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        <Calendar className="w-4 h-4 inline mr-1" /> End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            {/* Priority & Status */}
                            <div className="form-row">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <select
                                        value={form.priority}
                                        onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}
                                        className="form-control"
                                    >
                                        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                                        className="form-control"
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Budget & Progress */}
                            <div className="form-row">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Budget (₹)</label>
                                    <input
                                        type="number"
                                        value={form.budget}
                                        onChange={e => setForm(prev => ({ ...prev, budget: e.target.value }))}
                                        className="form-control"
                                        placeholder="e.g. 500000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Progress ({form.progress}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={form.progress}
                                        onChange={e => setForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                                        className="w-full mt-2 accent-indigo-600"
                                    />
                                </div>
                            </div>

                            {/* Team Members */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    Project Team Members
                                </label>
                                <select
                                    onChange={handleAddTeamMember}
                                    value=""
                                    className="form-control"
                                >
                                    <option value="">+ Add Team Member</option>
                                    {employees.map(emp => (
                                        <option 
                                            key={emp.id} 
                                            value={emp.id}
                                            disabled={form.team_members.includes(String(emp.id)) || String(emp.id) === String(form.manager_id)}
                                        >
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>

                                {/* Team Members List */}
                                {form.team_members.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-slate-500">Selected Team Members ({form.team_members.length})</p>
                                        <div className="form-row">
                                            {form.team_members.map(memberId => {
                                                const emp = employees.find(e => String(e.id) === String(memberId));
                                                return emp ? (
                                                    <div key={memberId} className="btn btn-secondary">
                                                        <div className="flex items-center gap-2">
                                                            <div className="btn btn-primary">
                                                                {(emp.name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTeamMember(memberId)}
                                                            className="btn btn-danger"
                                                            title="Remove"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="btn btn-secondary">
                            <button
                                onClick={() => setShowForm(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="btn btn-primary"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : editingId ? 'Update Project' : 'Save Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
