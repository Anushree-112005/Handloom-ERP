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

      {/* DATA AREA */}
      {!showForm && (
        <div className="animate-fade" style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={24} color="var(--primary)" /> Shift Management
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage working hours, break durations, and shift types.</p>
            </div>

            {/* RIGHT: Filter dropdown + view toggle + Add button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Filter size={16} /> Filter
                  {filterShiftType && <span className="badge badge-active" style={{ padding: '2px 6px', fontSize: 10 }}>1</span>}
                </button>
                {showFilters && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 16, zIndex: 100, minWidth: 280 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filters</span>
                      <button onClick={() => setFilterShiftType('')} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Reset</button>
                    </div>
                    <div className="form-group">
                      <label>Shift Type</label>
                      <select value={filterShiftType} onChange={(e) => setFilterShiftType(e.target.value)} className="form-control">
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

              <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
                <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', background: viewMode === 'list' ? '#fff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  <LayoutList size={16} />
                </button>
                <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', background: viewMode === 'grid' ? '#fff' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                  <LayoutGrid size={16} />
                </button>
              </div>

              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary"
              >
                <Plus size={16} /> Add Shift
              </button>
            </div>
          </div>

      {/* DATA AREA */}
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <Clock size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Shifts</h3>
                <div className="value">{stats.total}</div>
              </div>
            </div>
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                <Sun size={24} />
              </div>
              <div className="stat-details">
                <h3>Day Shifts</h3>
                <div className="value">{stats.dayShifts}</div>
              </div>
            </div>
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                <Moon size={24} />
              </div>
              <div className="stat-details">
                <h3>Night Shifts</h3>
                <div className="value">{stats.nightShifts}</div>
              </div>
            </div>
            <div className="card stat-card" style={{ padding: 20 }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Users size={24} />
              </div>
              <div className="stat-details">
                <h3>Assigned</h3>
                <div className="value">{stats.totalEmployees}</div>
              </div>
            </div>
          </div>

      {/* Shifts List/Grid */}
          {/* Shifts List */}
          {viewMode === 'list' && (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shift Type</th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Working Hours</th>
                    <th>Break (min)</th>
                    <th>Assigned</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShifts.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No shifts found</td></tr>
                  ) : filteredShifts.map(shift => (
                    <tr key={shift.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: shift.color, color: '#fff' }}>
                            {getShiftIcon(shift.shift_type)}
                          </div>
                          <span className={`badge ${shift.shift_type === 'Night' ? 'badge-inactive' : 'badge-active'}`}>
                            {shift.shift_type}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{shift.name}</td>
                      <td><span className="badge badge-inactive">{shift.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{formatTime(shift.start_time)}</td>
                      <td style={{ fontWeight: 600 }}>{formatTime(shift.end_time)}</td>
                      <td>{shift.working_hours} hrs</td>
                      <td>{shift.break_duration}</td>
                      <td>{shift.employee_count || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleEdit(shift)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(shift.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Delete">
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* GRID VIEW - Cards */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {filteredShifts.map(shift => (
                <div key={shift.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ height: 4, backgroundColor: shift.color }} />
                  
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: shift.color, color: '#fff' }}>
                          {getShiftIcon(shift.shift_type)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>{shift.name}</h3>
                          <span className="badge badge-inactive">{shift.code}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleEdit(shift)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(shift.id)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{formatTime(shift.start_time)}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start</p>
                      </div>
                      <div style={{ flex: 1, padding: '0 16px', position: 'relative' }}>
                        <div style={{ height: 2, background: 'var(--border)', width: '100%' }} />
                        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{shift.working_hours} hrs</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{formatTime(shift.end_time)}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>End</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge ${shift.shift_type === 'Night' ? 'badge-inactive' : 'badge-active'}`}>
                          {shift.shift_type}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{shift.break_duration}m break</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                        <Users size={14} /> {shift.employee_count || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Inline */}
      {showForm && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit' : 'Add'} Shift</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  <X size={16} /> Close
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  <Save size={16} /> {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
            <div style={{ padding: 24, background: '#fff' }}>
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
          </div>
        </div>
      )}
    </div>
  );
}
