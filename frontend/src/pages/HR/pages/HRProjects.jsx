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
        <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
            {!showForm && (
                <div style={{ padding: 24 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FolderOpen size={24} color="var(--primary)" /> Projects
                            </h2>
                            <p style={{ color: 'var(--text-muted)' }}>Manage team projects and assignments</p>
                        </div>
                        <button
                            onClick={() => { setForm(initialForm); setEditingId(null); setShowForm(true); }}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <Plus size={16} /> New Project
                        </button>
                    </div>

                    {/* Message */}
                    {message.text && (
                        <div style={{ marginBottom: 16, padding: 12, borderRadius: 6, fontSize: 14, background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: message.type === 'success' ? '#10b981' : '#ef4444', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                            {message.text}
                        </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
                        {[
                            { label: 'Total Projects', value: stats.total, color: 'rgba(99,102,241,0.1)', text: '#6366f1', icon: FolderOpen },
                            { label: 'In Progress', value: stats.active, color: 'rgba(59,130,246,0.1)', text: '#3b82f6', icon: TrendingUp },
                            { label: 'Completed', value: stats.completed, color: 'rgba(16,185,129,0.1)', text: '#10b981', icon: CheckCircle2 },
                            { label: 'Planning', value: stats.planning, color: 'rgba(139,92,246,0.1)', text: '#8b5cf6', icon: Clock },
                        ].map(({ label, value, color, text, icon: Icon }) => (
                            <div key={label} className="card stat-card" style={{ padding: 20 }}>
                                <div className="stat-icon" style={{ background: color, color: text }}>
                                    <Icon size={24} />
                                </div>
                                <div className="stat-details">
                                    <h3>{label}</h3>
                                    <div className="value">{value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="card" style={{ padding: '12px 24px', display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search projects or manager..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="form-control"
                                style={{ paddingLeft: 40, width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="form-control"
                                style={{ width: 140 }}
                            >
                                <option value="">All Status</option>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Priority:</span>
                            <select
                                value={filterPriority}
                                onChange={e => setFilterPriority(e.target.value)}
                                className="form-control"
                                style={{ width: 140 }}
                            >
                                <option value="">All Priority</option>
                                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Project Name</th>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Manager</th>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Start Date</th>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>End Date</th>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Priority</th>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Status</th>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Progress</th>
                                        <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(proj => (
                                        <tr key={proj.project_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{proj.project_name}</p>
                                                    {proj.description && (
                                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
                                                        {(proj.manager_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{proj.manager_name || '—'}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 500 }}>{formatDate(proj.start_date)}</td>
                                            <td style={{ padding: '16px 24px', fontWeight: 500 }}>{formatDate(proj.end_date)}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span className={`badge ${proj.priority === 'High' || proj.priority === 'Critical' ? 'badge-inactive' : 'badge-active'}`}>
                                                    {proj.priority}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span className="badge badge-active" style={{ background: proj.status === 'Completed' ? 'rgba(16,185,129,0.1)' : 'var(--bg-secondary)', color: proj.status === 'Completed' ? '#10b981' : 'var(--text-primary)' }}>
                                                    {proj.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 6, minWidth: 80 }}>
                                                        <div
                                                            style={{ background: 'var(--primary)', height: '100%', borderRadius: 4, width: `${Math.min(proj.progress || 0, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{proj.progress || 0}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                    <button
                                                        onClick={() => handleEdit(proj)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 10px' }}
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(proj.project_id)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 10px' }}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                                                <FolderOpen size={48} color="var(--border)" style={{ margin: '0 auto 16px' }} />
                                                <p style={{ fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>No projects found</p>
                                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Create your first project using the button above</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Form Inline */}
            {showForm && (
                <div style={{ padding: 24 }}>
                    <div className="card" style={{ padding: 0 }}>
                        {/* Form Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {editingId ? 'Edit Project' : 'New Project'}
                            </h2>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <X size={16} /> Close
                                </button>
                                <button onClick={handleSubmit} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Save size={16} /> {saving ? 'Saving...' : editingId ? 'Update Project' : 'Save Project'}
                                </button>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div style={{ padding: 24, background: '#fff' }}>
                            <div className="form-row">
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
                            </div>

                            {/* Description */}
                            <div style={{ marginTop: 16 }}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="form-control"
                                    placeholder="Brief project overview..."
                                />
                            </div>

                            {/* Manager (Employee Dropdown) */}
                            <div className="form-row" style={{ marginTop: 16 }}>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Users size={16} /> Project Manager (Employee)
                                    </label>
                                    {employees.length === 0 ? (
                                        <div style={{ padding: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: 6, fontSize: 13 }}>
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
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Selected Manager</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                                                {(form.manager_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{form.manager_name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="form-row" style={{ marginTop: 16 }}>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={16} /> Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="form-control"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={16} /> End Date
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
                            <div className="form-row" style={{ marginTop: 16 }}>
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
                            <div className="form-row" style={{ marginTop: 16 }}>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={form.progress}
                                            onChange={e => setForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                                            style={{ flex: 1, accentColor: 'var(--primary)' }}
                                        />
                                        <span style={{ fontWeight: 600, fontSize: 14 }}>{form.progress}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                                <label className="block text-sm font-medium text-slate-700 mb-2" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Users size={16} /> Project Team Members
                                </label>
                                <select
                                    onChange={handleAddTeamMember}
                                    value=""
                                    className="form-control"
                                    style={{ maxWidth: 400 }}
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
                                    <div style={{ marginTop: 16 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Selected Team Members ({form.team_members.length})</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                            {form.team_members.map(memberId => {
                                                const emp = employees.find(e => String(e.id) === String(memberId));
                                                return emp ? (
                                                    <div key={memberId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 20 }}>
                                                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                                                            {(emp.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTeamMember(memberId)}
                                                            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                                            title="Remove"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
