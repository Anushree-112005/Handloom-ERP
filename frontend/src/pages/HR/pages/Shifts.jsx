import React, { useState, useEffect } from 'react';
import { Clock, Plus, Search, X, Save, Edit2, Trash2, Sun, Moon, Coffee, Users, LayoutList, LayoutGrid, Filter } from 'lucide-react';
import { fetchShifts, createShift, updateShift, deleteShift } from '../../../services/hrService';

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterShiftType, setFilterShiftType] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const initialForm = {
    name: '',
    code: '',
    start_time: '09:00',
    end_time: '18:00',
    break_duration: 60,
    shift_type: 'Day',
    color: '#10B981',
    grace_period: 15,
    half_day_hours: 4
  };
  const [form, setForm] = useState(initialForm);

  const shiftTypes = ['Day', 'Night', 'Flexible', 'Rotational'];
  const colors = ['#10B981', '#FBBF24', '#F97316', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#14B8A6'];

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const data = await fetchShifts();
      setShifts(data || []);
    } catch (e) {
      console.error('Failed to load shifts:', e);
    }
    setLoading(false);
  };

  const calculateWorkingHours = (start, end, breakMins) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMins < 0) totalMins += 24 * 60; // overnight shift
    return ((totalMins - breakMins) / 60).toFixed(1);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      alert('Please fill required fields');
      return;
    }

    const workingHours = calculateWorkingHours(form.start_time, form.end_time, form.break_duration);
    const payload = { ...form, working_hours: parseFloat(workingHours) };

    try {
      if (editingId) {
        await updateShift(editingId, payload);
      } else {
        await createShift(payload);
      }
      loadShifts();
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (e) {
      console.error('Failed to save shift:', e);
      alert('Failed to save shift');
    }
  };

  const handleEdit = (shift) => {
    setForm({
      name: shift.name,
      code: shift.code,
      start_time: shift.start_time || '09:00',
      end_time: shift.end_time || '18:00',
      break_duration: shift.break_duration || 60,
      shift_type: shift.shift_type || 'Day',
      color: shift.color || '#10B981',
      grace_period: shift.grace_period || 15,
      half_day_hours: shift.half_day_hours || 4
    });
    setEditingId(shift.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shift?')) return;
    try {
      await deleteShift(id);
      loadShifts();
    } catch (e) {
      console.error('Failed to delete shift:', e);
      alert('Failed to delete shift');
    }
  };

  const filteredShifts = shifts.filter(shift => {
    if (filterShiftType && shift.shift_type !== filterShiftType) return false;
    return true;
  });

  const stats = {
    total: shifts.length,
    dayShifts: shifts.filter(s => s.shift_type === 'Day').length,
    nightShifts: shifts.filter(s => s.shift_type === 'Night').length,
    totalEmployees: shifts.reduce((sum, s) => sum + (s.employee_count || 0), 0)
  };

  const getShiftIcon = (type) => {
    switch (type) {
      case 'Night': return <Moon className="w-4 h-4" />;
      case 'Flexible': return <Coffee className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
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
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">SHIFT MANAGEMENT</h1>
          <span className="btn btn-primary">
            {filteredShifts.length} Records
          </span>
        </div>

        {/* RIGHT: Filter dropdown + view toggle + Add button */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {filterShiftType && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => setFilterShiftType('')} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Shift Type</label>
                  <select value={filterShiftType} onChange={(e) => setFilterShiftType(e.target.value)}
                    className="form-control">
                    <option value="">All Types</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                    <option value="Flexible">Flexible</option>
                    <option value="Rotational">Rotational</option>
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
            <Plus className="w-4 h-4" /> Add Shift
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
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Shifts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.dayShifts}</p>
              <p className="text-xs text-slate-500">Day Shifts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Moon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.nightShifts}</p>
              <p className="text-xs text-slate-500">Night Shifts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalEmployees}</p>
              <p className="text-xs text-slate-500">Assigned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shifts List/Grid */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredShifts.map(shift => (
          <div key={shift.id} className="card">
            {/* Color Bar */}
            <div className="h-2" style={{ backgroundColor: shift.color }} />
            
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: shift.color }}
                  >
                    {getShiftIcon(shift.shift_type)}
                  </div>
                  <div>
                    <h3 className="card-title">{shift.name}</h3>
                    <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{shift.code}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(shift)} className="btn btn-secondary">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(shift.id)} className="btn btn-danger">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Time Display */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{formatTime(shift.start_time)}</p>
                  <p className="text-xs text-slate-500">Start</p>
                </div>
                <div className="flex-1 px-4">
                  <div className="h-0.5 bg-slate-200 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full" />
                  </div>
                  <p className="text-center text-xs text-slate-500 mt-1">{shift.working_hours} hrs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800">{formatTime(shift.end_time)}</p>
                  <p className="text-xs text-slate-500">End</p>
                </div>
              </div>

              {/* Details */}
              <div className="btn btn-secondary">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    shift.shift_type === 'Night' ? 'bg-purple-100 text-purple-700' :
                    shift.shift_type === 'Flexible' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {shift.shift_type}
                  </span>
                  <span className="text-slate-500">{shift.break_duration} min break</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{shift.employee_count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredShifts.length === 0 && (
          <div className="card">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No shifts found</p>
          </div>
        )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="form-row">
          {filteredShifts.map(shift => (
            <div key={shift.id} className="card">
              {/* Color Bar */}
              <div className="h-2" style={{ backgroundColor: shift.color }} />
              
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: shift.color }}
                    >
                      {getShiftIcon(shift.shift_type)}
                    </div>
                    <div>
                      <h3 className="card-title">{shift.name}</h3>
                      <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{shift.code}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(shift)} className="btn btn-secondary">
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(shift.id)} className="btn btn-danger">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Time Display */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{formatTime(shift.start_time)}</p>
                    <p className="text-xs text-slate-500">Start</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="h-0.5 bg-slate-200 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full" />
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-1">{shift.working_hours} hrs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-800">{formatTime(shift.end_time)}</p>
                    <p className="text-xs text-slate-500">End</p>
                  </div>
                </div>

                {/* Details */}
                <div className="btn btn-secondary">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      shift.shift_type === 'Night' ? 'bg-purple-100 text-purple-700' :
                      shift.shift_type === 'Flexible' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {shift.shift_type}
                    </span>
                    <span className="text-slate-500">{shift.break_duration} min break</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{shift.employee_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredShifts.length === 0 && (
            <div className="btn btn-secondary">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No shifts found</p>
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
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Shift</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-control"
                    placeholder="Morning Shift"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="form-control"
                    placeholder="MS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift Type</label>
                  <select
                    value={form.shift_type}
                    onChange={(e) => setForm({ ...form, shift_type: e.target.value })}
                    className="form-control"
                  >
                    {shiftTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Break Duration (mins)</label>
                  <input
                    type="number"
                    value={form.break_duration}
                    onChange={(e) => setForm({ ...form, break_duration: parseInt(e.target.value) || 0 })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grace Period (mins)</label>
                  <input
                    type="number"
                    value={form.grace_period}
                    onChange={(e) => setForm({ ...form, grace_period: parseInt(e.target.value) || 0 })}
                    className="form-control"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-300' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: form.color }}
                  >
                    {getShiftIcon(form.shift_type)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{form.name || 'Shift Name'}</p>
                    <p className="text-sm text-slate-500">
                      {formatTime(form.start_time)} - {formatTime(form.end_time)} • {calculateWorkingHours(form.start_time, form.end_time, form.break_duration)} hrs
                    </p>
                  </div>
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
