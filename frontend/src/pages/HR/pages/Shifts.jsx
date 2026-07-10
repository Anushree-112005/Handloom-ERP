import React, { useState, useEffect } from 'react';
import { Clock, Plus, Search, X, Save, Edit2, Trash2, Sun, Moon, Coffee, Users, LayoutList, LayoutGrid, Filter, Eye } from 'lucide-react';
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingShift, setViewingShift] = useState(null);

  const initialForm = {
    name: '',
    code: '',
    start_time: '09:00',
    end_time: '18:00',
    break_duration: 60,
    shift_type: 'Day',
    color: '#10B981',
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

  const calculateDefaultBreakDuration = (start, end) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let totalMins = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMins < 0) totalMins += 24 * 60; // overnight shift
    
    if (totalMins >= 9 * 60) return 60;
    if (totalMins >= 6 * 60) return 45;
    if (totalMins >= 4 * 60) return 30;
    return 0;
  };

  const handleSubmit = async () => {
    if (!form.name) {
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
      half_day_hours: shift.half_day_hours || 4
    });
    setEditingId(shift.id);
    setShowForm(true);
  };

  const handleView = (shift) => {
    setViewingShift(shift);
    setShowViewModal(true);
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

  const StatCard = ({ icon: Icon, label, value, theme, onClick, active }) => (
    <div
      onClick={onClick}
      className={`card transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer ${active ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`}
      style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderTop: `4px solid ${theme.border}`,
        backgroundColor: active ? theme.bg : '#fff',
        borderRadius: '8px'
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: '12px', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={28} color={theme.text} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '4px' }}>
          {label}
        </div>
      </div>
    </div>
  );

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
      {!showForm && !showViewModal && (
        <div className="animate-fade" style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={24} color="var(--primary)" /> Shift Management
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage working hours, break durations, and shift types.</p>
            </div>

            {/* RIGHT: Add button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setShowViewModal(false); setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary"
              >
                <Plus size={16} /> Add Shift
              </button>
            </div>
          </div>

      {/* DATA AREA */}
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
            <StatCard 
              icon={Clock} 
              label="Total Shifts" 
              value={stats.total} 
              theme={{ bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', border: '#6366f1' }} 
              onClick={() => setFilterShiftType('')}
              active={filterShiftType === ''}
            />
            <StatCard 
              icon={Sun} 
              label="Day Shifts" 
              value={stats.dayShifts} 
              theme={{ bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: '#f59e0b' }} 
              onClick={() => setFilterShiftType('Day')}
              active={filterShiftType === 'Day'}
            />
            <StatCard 
              icon={Moon} 
              label="Night Shifts" 
              value={stats.nightShifts} 
              theme={{ bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: '#a855f7' }} 
              onClick={() => setFilterShiftType('Night')}
              active={filterShiftType === 'Night'}
            />
            <StatCard 
              icon={Users} 
              label="Assigned" 
              value={stats.totalEmployees} 
              theme={{ bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: '#10b981' }} 
              onClick={() => setFilterShiftType('')}
            />
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
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Working Hours</th>
                    <th>Break (min)</th>
                    <th>Assigned</th>
                    <th>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShifts.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No shifts found</td></tr>
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
                      <td style={{ fontWeight: 600 }}>{formatTime(shift.start_time)}</td>
                      <td style={{ fontWeight: 600 }}>{formatTime(shift.end_time)}</td>
                      <td>{shift.working_hours} hrs</td>
                      <td>{shift.break_duration}</td>
                      <td>{shift.employee_count || 0}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleView(shift)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                            <Eye size={14} color="#6366f1" />
                          </button>
                          <button onClick={() => handleEdit(shift)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                            <Edit2 size={14} color="#3b82f6" />
                          </button>
                          <button onClick={() => handleDelete(shift.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
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
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleView(shift)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                          <Eye size={14} color="#6366f1" />
                        </button>
                        <button onClick={() => handleEdit(shift)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                          <Edit2 size={14} color="#3b82f6" />
                        </button>
                        <button onClick={() => handleDelete(shift.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
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
            <form style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Shift Details
                </legend>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Shift Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="form-control"
                      placeholder="Morning Shift"
                    />
                  </div>
                  <div className="form-group">
                    <label>Shift Type</label>
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
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        const autoBreak = calculateDefaultBreakDuration(newStart, form.end_time);
                        setForm({ ...form, start_time: newStart, break_duration: autoBreak });
                      }}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={form.end_time}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        const autoBreak = calculateDefaultBreakDuration(form.start_time, newEnd);
                        setForm({ ...form, end_time: newEnd, break_duration: autoBreak });
                      }}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Break Duration (mins)</label>
                    <input
                      type="number"
                      step="any"
                      value={form.break_duration}
                      onChange={(e) => setForm({ ...form, break_duration: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 4' }}>
                    <label>Color</label>
                    <div className="flex gap-2 flex-wrap mt-1">
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
                </div>

                {/* Preview */}
                <div className="bg-slate-50 rounded-lg p-4 mt-2">
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
              </fieldset>
            </form>
          </div>
        </div>
      )}

      {/* View Inline Form */}
      {showViewModal && viewingShift && (
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
          <div className="card animate-fade" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>View Shift</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  <X size={16} /> Close
                </button>
                <button className="btn btn-primary" onClick={() => { setShowViewModal(false); handleEdit(viewingShift); }}>
                  <Edit2 size={16} /> Edit
                </button>
              </div>
            </div>
            <form style={{ padding: 24, background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Shift Details
                </legend>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 3' }}>
                    <label>Shift Name</label>
                    <input type="text" value={viewingShift.name || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Shift Type</label>
                    <input type="text" value={viewingShift.shift_type || ''} disabled className="form-control" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" value={viewingShift.start_time || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" value={viewingShift.end_time || ''} disabled className="form-control" />
                  </div>
                  <div className="form-group">
                    <label>Break Duration (mins)</label>
                    <input type="number" value={viewingShift.break_duration || ''} disabled className="form-control" />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-50 rounded-lg p-4 mt-2">
                  <p className="text-xs font-medium text-slate-500 mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: viewingShift.color || '#10B981' }}
                    >
                      {getShiftIcon(viewingShift.shift_type)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{viewingShift.name || 'Shift Name'}</p>
                      <p className="text-sm text-slate-500">
                        {formatTime(viewingShift.start_time)} - {formatTime(viewingShift.end_time)} • {calculateWorkingHours(viewingShift.start_time || '00:00', viewingShift.end_time || '00:00', viewingShift.break_duration || 0)} hrs
                      </p>
                    </div>
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
