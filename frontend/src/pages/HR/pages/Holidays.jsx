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
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + badge */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">HOLIDAY CALENDAR</h1>
          <span className="btn btn-primary">
            {filteredHolidays.length} Records
          </span>
        </div>

        {/* RIGHT: Year nav + Filter dropdown + view toggle + Add button */}
        <div className="flex items-center gap-2">
          {/* Year Navigator */}
          <div className="btn btn-secondary">
            <button onClick={() => setYear(y => y - 1)} className="p-1 hover:bg-white rounded text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800 text-sm min-w-[48px] text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-1 hover:bg-white rounded text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {filterType && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => setFilterType('')} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Holiday Type</label>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                    className="form-control">
                    <option value="">All Types</option>
                    {holidayTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
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

          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Add Holiday
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
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Holidays</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.mandatory}</p>
              <p className="text-xs text-slate-500">Mandatory</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <PartyPopper className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.optional}</p>
              <p className="text-xs text-slate-500">Optional</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.upcoming}</p>
              <p className="text-xs text-slate-500">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="btn btn-secondary">
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

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Holiday</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
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
              
              <div className="form-row">
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
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="optional"
                  checked={form.is_optional}
                  onChange={(e) => setForm({ ...form, is_optional: e.target.checked })}
                  className="btn btn-secondary"
                />
                <label htmlFor="optional" className="text-sm text-slate-700">
                  Optional / Restricted Holiday
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Description of the holiday..."
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
          </div>
        </div>
      )}
    </div>
  );
}
