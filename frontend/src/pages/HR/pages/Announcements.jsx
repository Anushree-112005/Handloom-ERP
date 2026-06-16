import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, X, Save, Edit2, Trash2, Calendar, Pin, Users, Eye, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../../services/hrService';

const priorityColors = {
  'High': 'bg-red-100 text-red-700 border-red-200',
  'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Low': 'bg-green-100 text-green-700 border-green-200'
};

const statusColors = {
  'Active': 'bg-green-100 text-green-700',
  'Scheduled': 'bg-blue-100 text-blue-700',
  'Expired': 'bg-slate-100 text-slate-600',
  'Draft': 'bg-yellow-100 text-yellow-700'
};

const announcementTypes = ['General', 'Policy Update', 'Event', 'Holiday', 'Achievement', 'Urgent', 'Training', 'System Update'];
const targetAudiences = ['All Employees', 'Management', 'HR Team', 'Engineering', 'Sales', 'Marketing', 'Operations', 'Finance'];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterType, setFilterType] = useState('');
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null);

  const initialForm = {
    title: '',
    content: '',
    announcement_type: 'General',
    priority: 'Medium',
    target_audience: 'All Employees',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_pinned: false,
    created_by: 'HR Admin'
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = { ...form };

      if (editingId) {
        await updateAnnouncement(editingId, payload);
      } else {
        await createAnnouncement(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const handleEdit = (ann) => {
    setForm({
      title: ann.title,
      content: ann.content,
      announcement_type: ann.announcement_type,
      priority: ann.priority,
      target_audience: ann.target_audience,
      start_date: ann.start_date?.split('T')[0] || '',
      end_date: ann.end_date?.split('T')[0] || '',
      is_pinned: ann.is_pinned,
      created_by: ann.created_by
    });
    setEditingId(ann.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const togglePin = async (ann) => {
    try {
      await updateAnnouncement(ann.id, { is_pinned: !ann.is_pinned });
      loadData();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesType = !filterType || ann.announcement_type === filterType;
    return matchesType;
  });

  // Sort: pinned first, then by date
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.start_date) - new Date(a.start_date);
  });

  const stats = {
    total: announcements.length,
    active: announcements.filter(a => a.status === 'Active').length,
    pinned: announcements.filter(a => a.is_pinned).length,
    urgent: announcements.filter(a => a.priority === 'High').length
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', marginBottom: 24 }}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Announcements</h1>
          <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
            {sortedAnnouncements.length} Records
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Filter size={16} /> Filter
              {filterType && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />}
            </button>
            {showFilters && (
              <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 220, zIndex: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button
                    onClick={() => { setFilterType(''); setShowFilters(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--primary)' }}
                  >
                    Reset
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">All Types</option>
                    {announcementTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: 4, background: viewMode === 'list' ? 'var(--bg-primary)' : 'none', border: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center' }}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: 4, background: viewMode === 'grid' ? 'var(--bg-primary)' : 'none', border: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center' }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> New Announcement
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div style={{ padding: '0 24px 24px 24px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Total</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#10b98118', color: '#047857', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.active}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Active</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#3b82f618', color: '#1d4ed8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pin className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.pinned}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Pinned</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#ef444418', color: '#b91c1c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.urgent}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Urgent</p>
          </div>
        </div>
      </div>

      {/* Announcements Content */}
      {viewMode === 'list' ? (
      <div className="space-y-4">
        {sortedAnnouncements.map(ann => (
          <div 
            key={ann.id} 
            className={`bg-white border rounded-xl p-4 hover:shadow-lg transition-shadow ${ann.is_pinned ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {ann.is_pinned && (
                    <Pin className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[ann.priority]}`}>
                    {ann.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                    {ann.announcement_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ann.status]}`}>
                    {ann.status}
                  </span>
                </div>
                
                <h3 className="font-semibold text-slate-800 text-lg mb-1">{ann.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-2 mb-3">{ann.content}</p>
                
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(ann.start_date)}</span>
                    {ann.end_date && <span> - {formatDate(ann.end_date)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{ann.target_audience}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button onClick={() => setViewingAnnouncement(ann)} className="btn btn-secondary" style={{ padding: 6 }}>
                  <Eye className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => togglePin(ann)} className={`p-1.5 rounded-lg ${ann.is_pinned ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}>
                  <Pin className={`w-4 h-4 ${ann.is_pinned ? 'text-indigo-600 fill-indigo-600' : 'text-slate-500'}`} />
                </button>
                <button onClick={() => handleEdit(ann)} className="btn btn-secondary" style={{ padding: 6 }}>
                  <Edit2 className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => handleDelete(ann.id)} className="btn btn-danger" style={{ padding: 6 }}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {sortedAnnouncements.length === 0 && (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>No announcements found</p>
          </div>
        )}
      </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {sortedAnnouncements.map(ann => (
            <div 
              key={ann.id} 
              className={`bg-white border rounded-xl p-4 hover:shadow-lg transition-shadow flex flex-col gap-3 ${ann.is_pinned ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.is_pinned && (
                    <Pin className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[ann.priority]}`}>
                    {ann.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ann.status]}`}>
                    {ann.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePin(ann)} className={`p-1 rounded-lg ${ann.is_pinned ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}>
                    <Pin className={`w-3.5 h-3.5 ${ann.is_pinned ? 'text-indigo-600 fill-indigo-600' : 'text-slate-500'}`} />
                  </button>
                  <button onClick={() => handleEdit(ann)} className="btn btn-secondary" style={{ padding: 6 }}>
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(ann.id)} className="btn btn-danger" style={{ padding: 6 }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              
              <div>
                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium mb-2">
                  {ann.announcement_type}
                </span>
                <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2" style={{ margin: 0 }}>{ann.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-3" style={{ margin: '8px 0 0 0' }}>{ann.content}</p>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(ann.start_date)}</span>
                  {ann.end_date && <span className="text-slate-400">→</span>}
                  {ann.end_date && <span>{formatDate(ann.end_date)}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{ann.target_audience}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setViewingAnnouncement(ann)} 
                className="form-control"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
          {sortedAnnouncements.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 24px' }}>
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>No announcements found</p>
            </div>
          )}
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card" style={{ width: '100%', maxWidth: 600, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{editingId ? 'Edit' : 'New'} Announcement</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-control"
                  placeholder="Announcement title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="form-control"
                  placeholder="Write your announcement here..."
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={form.announcement_type}
                    onChange={(e) => setForm({ ...form, announcement_type: e.target.value })}
                    className="form-control"
                  >
                    {announcementTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="form-control"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Audience</label>
                  <select
                    value={form.target_audience}
                    onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                    className="form-control"
                  >
                    {targetAudiences.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-slate-700">Pin this announcement</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2">
                {viewingAnnouncement.is_pinned && <Pin className="w-4 h-4 text-indigo-600 fill-indigo-600" />}
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[viewingAnnouncement.priority]}`}>
                  {viewingAnnouncement.priority}
                </span>
              </div>
              <button onClick={() => setViewingAnnouncement(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-800" style={{ margin: 0 }}>{viewingAnnouncement.title}</h2>
              
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="px-2 py-0.5 rounded bg-slate-100">{viewingAnnouncement.announcement_type}</span>
                <span>By {viewingAnnouncement.created_by}</span>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-600 whitespace-pre-wrap" style={{ margin: 0 }}>{viewingAnnouncement.content}</p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t" style={{ marginTop: 16 }}>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Published: {formatDate(viewingAnnouncement.start_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{viewingAnnouncement.target_audience}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
