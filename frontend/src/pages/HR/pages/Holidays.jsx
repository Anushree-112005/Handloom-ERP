import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, X, Save, Edit2, Trash2, PartyPopper, Building2, ChevronLeft, ChevronRight, LayoutList, LayoutGrid, Filter } from 'lucide-react';
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../../services/hrService';

export default function Holidays() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedHolidays, setSelectedHolidays] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const initialForm = {
    name: '',
    date: '',
    holiday_type: 'National',
    is_optional: false,
    description: '',
    applicable_locations: ''
  };
  const [form, setForm] = useState(initialForm);

  const holidayTypes = ['National', 'Religious', 'Company', 'Regional'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    loadHolidays();
  }, [year]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await fetchHolidays();
      // Filter holidays by selected year
      const filtered = (data || []).filter(h => {
        const holidayYear = new Date(h.date).getFullYear();
        return holidayYear === year;
      });
      setHolidays(filtered);
    } catch (e) {
      console.error('Failed to load holidays:', e);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date) {
      alert('Please fill required fields');
      return;
    }

    try {
      // Prepare data for backend - extract year from date and map fields
      const holidayData = {
        name: form.name,
        date: form.date,
        year: new Date(form.date).getFullYear(),
        holiday_type: form.holiday_type,
        is_paid: !form.is_optional, // is_optional is inverse of is_paid
        applies_to: form.applicable_locations || 'All'
      };

      if (editingId) {
        await updateHoliday(editingId, holidayData);
      } else {
        await createHoliday(holidayData);
      }
      loadHolidays();
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (e) {
      console.error('Failed to save holiday:', e);
      alert('Failed to save holiday');
    }
  };

  const handleEdit = (holiday) => {
    setForm({
      name: holiday.name,
      date: holiday.date,
      holiday_type: holiday.holiday_type || 'National',
      is_optional: !holiday.is_paid, // is_paid from backend maps to is_optional in frontend
      description: holiday.description || '',
      applicable_locations: holiday.applies_to || ''
    });
    setEditingId(holiday.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      await deleteHoliday(id);
      loadHolidays();
    } catch (e) {
      console.error('Failed to delete holiday:', e);
      alert('Failed to delete holiday');
    }
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesType = !filterType || holiday.holiday_type === filterType;
    return matchesType;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const holidaysByMonth = months.map((month, idx) => ({
    month,
    holidays: filteredHolidays.filter(h => new Date(h.date).getMonth() === idx)
  })).filter(m => m.holidays.length > 0);

  const stats = {
    total: holidays.length,
    mandatory: holidays.filter(h => h.is_paid).length,
    optional: holidays.filter(h => !h.is_paid).length,
    upcoming: holidays.filter(h => new Date(h.date) > new Date()).length
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  };

  const isUpcoming = (dateStr) => new Date(dateStr) > new Date();
  const isPast = (dateStr) => new Date(dateStr) < new Date();

  const getTypeColor = (type) => {
    switch (type) {
      case 'National': return 'bg-orange-100 text-orange-700';
      case 'Religious': return 'bg-purple-100 text-purple-700';
      case 'Company': return 'bg-blue-100 text-blue-700';
      case 'Regional': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
      {!showForm && (
        <div style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        {/* LEFT: Title + badge */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">HOLIDAY CALENDAR</h1>
          <span className="btn btn-primary">
            {filteredHolidays.length} Records
          </span>
        </div>

          {/* RIGHT: Year nav + Filter dropdown + view toggle + Add button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Year Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px' }}>
              <button onClick={() => setYear(y => y - 1)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4 }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 14, minWidth: 48, textAlign: 'center' }}>{year}</span>
              <button onClick={() => setYear(y => y + 1)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4 }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Filter size={16} /> Filter
                {filterType && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />}
              </button>
              {showFilters && (
                <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 200, zIndex: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filters</span>
                    <button onClick={() => setFilterType('')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Holiday Type</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="form-control">
                      <option value="">All Types</option>
                      {holidayTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px' }}>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 8px', borderRadius: 4, border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                <LayoutList size={16} />
              </button>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px 8px', borderRadius: 4, border: 'none', background: viewMode === 'grid' ? '#fff' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                <LayoutGrid size={16} />
              </button>
            </div>

            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} /> Add Holiday
            </button>
          </div>
        </div>


        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          {[
            { label: 'Total Holidays', value: stats.total, color: 'rgba(99,102,241,0.1)', text: '#6366f1', icon: Calendar },
            { label: 'Mandatory', value: stats.mandatory, color: 'rgba(249,115,22,0.1)', text: '#f97316', icon: Building2 },
            { label: 'Optional', value: stats.optional, color: 'rgba(168,85,247,0.1)', text: '#a855f7', icon: PartyPopper },
            { label: 'Upcoming', value: stats.upcoming, color: 'rgba(16,185,129,0.1)', text: '#10b981', icon: Calendar },
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

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
                <tr>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Date</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Holiday</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Day</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Type</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Status</th>
                  <th className="text-right px-6 py-4 text-xs uppercase font-bold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolidays.map(holiday => (
                  <tr key={holiday.id} className={`hover:bg-slate-50 cursor-pointer group transition-colors ${isPast(holiday.date) ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">{formatDate(holiday.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PartyPopper className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">{holiday.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{getDayOfWeek(holiday.date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(holiday.holiday_type)}`}>
                        {holiday.holiday_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!holiday.is_paid ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Optional</span>
                      ) : (
                        <span className="btn btn-success">Mandatory</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(holiday)} className="btn btn-secondary">
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(holiday.id)} className="btn btn-danger">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHolidays.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No holidays found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      )}

      {/* Grid View (Month View) */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {holidaysByMonth.map(({ month, holidays }) => (
            <div key={month} className="card">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
                <h3 className="text-white font-semibold">{month} {year}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {holidays.map(holiday => (
                  <div key={holiday.id} className={`p-4 flex items-center justify-between ${isPast(holiday.date) ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center">
                        <span className="text-xs text-slate-500 uppercase">{new Date(holiday.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                        <span className="text-xl font-bold text-slate-800">{new Date(holiday.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{holiday.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(holiday.holiday_type)}`}>
                            {holiday.holiday_type}
                          </span>
                          {!holiday.is_paid && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Optional</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(holiday)} className="btn btn-secondary">
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(holiday.id)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {holidaysByMonth.length === 0 && (
            <div className="card">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No holidays found for {year}</p>
            </div>
          )}
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
                {editingId ? 'Edit Holiday' : 'Add Holiday'}
              </h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X size={16} /> Close
                </button>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={16} /> {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
            <div style={{ padding: 24, background: '#fff' }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Holiday Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="form-control"
                  placeholder="New Year"
                />
              </div>
              
              <div className="form-row" style={{ marginTop: 16 }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={form.holiday_type}
                    onChange={(e) => setForm({ ...form, holiday_type: e.target.value })}
                    className="form-control"
                  >
                    {holidayTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2" style={{ marginTop: 16 }}>
                <input
                  type="checkbox"
                  id="optional"
                  checked={form.is_optional}
                  onChange={(e) => setForm({ ...form, is_optional: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                />
                <label htmlFor="optional" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Optional / Restricted Holiday
                </label>
              </div>
              
              <div style={{ marginTop: 16 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="form-control"
                  placeholder="Description of the holiday..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
