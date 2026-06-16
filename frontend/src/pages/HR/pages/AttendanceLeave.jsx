import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, AlertTriangle, Plus, Trash2, X, Clock, Calendar, User, Eye, MapPin, Info, Edit2, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchAttendance, createAttendance, updateAttendance, deleteAttendance, fetchLeaves, createLeave, updateLeave, deleteLeave, fetchEmployees, fetchShifts } from '../../../services/hrService';

const initialAttendanceForm = {
  employee: '', date: new Date().toISOString().split('T')[0], shift: '', check_in: '', check_out: '',
  hours: 0, ot_hours: 0, leave_days: 0, lop_days: 0, source: 'Manual'
};

const initialLeaveForm = {
  employee: '', leave_type: 'Annual', from_date: new Date().toISOString().split('T')[0], to_date: new Date().toISOString().split('T')[0], days: 1, status: 'Pending', approver: ''
};

const AttendanceLeave = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [rows, setRows] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [viewingAttendance, setViewingAttendance] = useState(null);
  const [viewingLeave, setViewingLeave] = useState(null);
  const [form, setForm] = useState(initialAttendanceForm);
  const [leaveForm, setLeaveForm] = useState(initialLeaveForm);
  const [editingAttendanceId, setEditingAttendanceId] = useState(null);
  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filterShift, setFilterShift] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterLeaveType, setFilterLeaveType] = useState('');
  const [filterLeaveStatus, setFilterLeaveStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendanceData, leavesData, empData, shiftsData] = await Promise.all([
        fetchAttendance(),
        fetchLeaves(),
        fetchEmployees(),
        fetchShifts().catch(() => [])
      ]);
      setRows(attendanceData || []);
      setLeaves(leavesData || []);
      setEmployees(empData || []);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.employee_id === employeeId || e.id === employeeId || String(e.id) === String(employeeId));
    return emp ? emp.name : employeeId;
  };

  const calculateOT = (checkIn, checkOut, shiftName) => {
    if (!checkIn || !checkOut) return 0;
    
    // Get shift working hours and break duration
    const shift = shifts.find(s => s.name === shiftName);
    const shiftWorkingHours = shift?.working_hours || 8;
    const breakDuration = shift?.break_duration || 1; // Default 1 hour if not found
    
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    // Subtract break duration from total time
    const actualWorkMinutes = totalMinutes - (breakDuration * 60);
    const actualWorkHours = actualWorkMinutes / 60;
    
    // OT = actual work hours - shift working hours
    return Math.max(0, parseFloat((actualWorkHours - shiftWorkingHours).toFixed(2)));
  };

  const calculateHours = (checkIn, checkOut, shiftName) => {
    if (!checkIn || !checkOut) return 0;
    
    // Get break duration from shift
    const shift = shifts.find(s => s.name === shiftName);
    const breakDuration = shift?.break_duration || 1; // Default 1 hour if not found
    
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    // Subtract break duration to get actual work hours
    const actualWorkMinutes = totalMinutes - (breakDuration * 60);
    return parseFloat((actualWorkMinutes / 60).toFixed(2));
  };

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (filterShift && r.shift !== filterShift) return false;
      if (filterEmployee && !r.employee?.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
      return true;
    });
  }, [rows, filterShift, filterEmployee]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      if (filterLeaveType && l.leave_type !== filterLeaveType) return false;
      if (filterLeaveStatus && l.status !== filterLeaveStatus) return false;
      if (filterEmployee && !l.employee?.toLowerCase().includes(filterEmployee.toLowerCase())) return false;
      return true;
    });
  }, [leaves, filterLeaveType, filterLeaveStatus, filterEmployee]);

  const totals = useMemo(() => {
    const otHours = rows.reduce((sum, r) => sum + (r.ot_hours || 0), 0);
    const lopDays = rows.reduce((sum, r) => sum + (r.lop_days || 0), 0);
    const presentDays = rows.length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
    return { otHours: otHours.toFixed(1), lopDays, presentDays, pendingLeaves };
  }, [rows, leaves]);

  const resetAttendanceForm = () => {
    setForm(initialAttendanceForm);
    setShowAttendanceForm(false);
    setEditingAttendanceId(null);
    setError('');
  };

  const resetLeaveForm = () => {
    setLeaveForm(initialLeaveForm);
    setShowLeaveForm(false);
    setEditingLeaveId(null);
    setError('');
  };

  const addAttendance = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.employee || !form.check_in || !form.check_out) {
      setError('Employee, Check-In and Check-Out are required');
      return;
    }

    setLoading(true);
    try {
      const hours = calculateHours(form.check_in, form.check_out, form.shift);
      const ot = calculateOT(form.check_in, form.check_out, form.shift);

      const payload = {
        ...form,
        hours: Number(hours.toFixed(2)),
        ot_hours: Number(ot.toFixed(2))
      };

      if (editingAttendanceId) {
        await updateAttendance(editingAttendanceId, payload);
        setSuccess('Attendance updated!');
      } else {
        await createAttendance(payload);
        setSuccess('Attendance saved!');
      }

      resetAttendanceForm();
      await loadData();
    } catch (err) {
      setError('Failed to save attendance');
    }
    setLoading(false);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const addLeave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!leaveForm.employee || !leaveForm.from_date || !leaveForm.to_date) {
      setError('Employee, From Date and To Date are required');
      return;
    }

    // Validate date range
    try {
      const fromDate = new Date(leaveForm.from_date);
      const toDate = new Date(leaveForm.to_date);
      
      if (fromDate > toDate) {
        setError('From Date cannot be after To Date');
        return;
      }

      // Calculate days between dates (inclusive)
      const diffTime = toDate - fromDate;
      const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const payload = {
        ...leaveForm,
        days: calculatedDays
      };

      setLoading(true);
      if (editingLeaveId) {
        await updateLeave(editingLeaveId, payload);
        setSuccess('Leave request updated!');
      } else {
        await createLeave(payload);
        setSuccess('Leave request submitted!');
      }

      resetLeaveForm();
      await loadData();
    } catch (err) {
      setError('Failed to process dates or save leave request');
    }
    setLoading(false);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const approveLeave = async (id) => {
    setLoading(true);
    try {
      await updateLeave(id, { status: 'Approved' });
      setSuccess('Leave approved!');
      await loadData();
    } catch (err) {
      setError('Failed to approve leave');
    }
    setLoading(false);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const rejectLeave = async (id) => {
    setLoading(true);
    try {
      await updateLeave(id, { status: 'Rejected' });
      setSuccess('Leave rejected');
      await loadData();
    } catch (err) {
      setError('Failed to reject leave');
    }
    setLoading(false);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleEditAttendance = (att) => {
    const emp = employees.find(e => e.name === att.employee);
    setForm({
      employee: emp ? (emp.employee_id || emp.id) : att.employee,
      date: att.date || new Date().toISOString().split('T')[0],
      shift: att.shift || '',
      check_in: att.check_in || '',
      check_out: att.check_out || '',
      hours: att.hours || 0,
      ot_hours: att.ot_hours || 0,
      leave_days: att.leave_days || 0,
      lop_days: att.lop_days || 0,
      source: att.source || 'Manual'
    });
    setEditingAttendanceId(att.id);
    setShowAttendanceForm(true);
  };

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) return;
    try {
      await deleteAttendance(id);
      setSuccess("Attendance record deleted");
      loadData();
    } catch (err) {
      setError("Failed to delete attendance");
    }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handleEditLeave = (lv) => {
    const emp = employees.find(e => e.name === lv.employee);
    setLeaveForm({
      employee: emp ? (emp.employee_id || emp.id) : lv.employee,
      leave_type: lv.leave_type || 'Annual',
      days: lv.days || 1,
      status: lv.status || 'Pending',
      approver: lv.approver || ''
    });
    setEditingLeaveId(lv.id);
    setShowLeaveForm(true);
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) return;
    try {
      await deleteLeave(id);
      setSuccess("Leave request deleted");
      loadData();
    } catch (err) {
      setError("Failed to delete leave request");
    }
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const handleViewAttendance = (att) => setViewingAttendance(att);
  const handleViewLeave = (lv) => setViewingLeave(lv);

  return (
    <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
      {(!showAttendanceForm && !showLeaveForm && !viewingAttendance && !viewingLeave) && (
        <div style={{ padding: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            {/* LEFT: Title + stats badges */}
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">ATTENDANCE & LEAVE</h1>

        {/* RIGHT: Filter dropdown + view toggle + refresh + add button */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
                }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {(filterShift || filterEmployee || filterLeaveType || filterLeaveStatus) && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1 right-1" />
              )}
            </button>
            {showFilters && (
              <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 220, zIndex: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button
                    onClick={() => { setFilterShift(''); setFilterEmployee(''); setFilterLeaveType(''); setFilterLeaveStatus(''); }}
                    className="text-xs text-indigo-600 hover:underline"
                  >Reset</button>
                </div>
                {activeTab === 'attendance' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Shift</label>
                      <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}
                        className="form-control">
                        <option value="">All Shifts</option>
                        <option value="General">General</option>
                        <option value="Morning">Morning</option>
                        <option value="Night">Night</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
                      <input type="text" placeholder="Search employee..."
                        value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
                        className="form-control" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Leave Type</label>
                      <select value={filterLeaveType} onChange={(e) => setFilterLeaveType(e.target.value)}
                        className="form-control">
                        <option value="">All Types</option>
                        <option value="Annual">Annual</option>
                        <option value="Sick">Sick</option>
                        <option value="Casual">Casual</option>
                        <option value="Maternity">Maternity</option>
                        <option value="Paternity">Paternity</option>
                        <option value="Compensatory">Compensatory</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                      <select value={filterLeaveStatus} onChange={(e) => setFilterLeaveStatus(e.target.value)}
                        className="form-control">
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
                      <input type="text" placeholder="Search employee..."
                        value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}
                        className="form-control" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px' }}>
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Add button */}
          {activeTab === 'attendance' ? (
            <button onClick={() => setShowAttendanceForm(true)}
              className="btn btn-primary">
              <Plus className="w-4 h-4" /> Log Attendance
            </button>
          ) : (
            <button onClick={() => setShowLeaveForm(true)}
              className="btn btn-primary">
              <Plus className="w-4 h-4" /> Request Leave
            </button>
          )}
        </div>
      </div>

      {/* DATA AREA */}
      <div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          {[
            { label: 'Total Records', value: totals.presentDays, color: 'rgba(16,185,129,0.1)', text: '#10b981', icon: CalendarClock },
            { label: 'Total OT (Hours)', value: totals.otHours, color: 'rgba(99,102,241,0.1)', text: '#6366f1', icon: Clock },
            { label: 'LOP Days', value: totals.lopDays, color: 'rgba(239,68,68,0.1)', text: '#ef4444', icon: AlertTriangle },
            { label: 'Pending Leaves', value: totals.pendingLeaves, color: 'rgba(245,158,11,0.1)', text: '#f59e0b', icon: Calendar },
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

        {/* Tab Switcher */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 shadow-sm" style={{ minWidth: '400px' }}>
            <button onClick={() => setActiveTab('attendance')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-base font-bold transition-all ${activeTab === 'attendance' ? 'bg-white shadow-md text-indigo-700 ring-1 ring-slate-200/50 scale-[1.02]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}>
              <Clock className="w-5 h-5" /> Attendance
            </button>
            <button onClick={() => setActiveTab('leave')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-base font-bold transition-all ${activeTab === 'leave' ? 'bg-white shadow-md text-indigo-700 ring-1 ring-slate-200/50 scale-[1.02]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}>
              <Calendar className="w-5 h-5" /> Leave
              {totals.pendingLeaves > 0 && <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center shadow-inner ml-1">{totals.pendingLeaves}</span>}
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg flex items-center gap-2 text-sm font-medium border border-emerald-100 mb-4">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm font-medium border border-red-100 mb-4">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && rows.length === 0 && leaves.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <>
            {/* Attendance Cards */}
            {viewMode === 'list' && (
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Employee</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Shift & Time</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Status</th>
                      <th className="text-right px-6 py-4 text-xs uppercase font-bold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{r.employee}</p>
                              <p className="text-xs text-slate-500">{getEmployeeName(r.employee)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-800">{r.shift} • {r.check_in} - {r.check_out}</p>
                          <p className="text-xs text-slate-500">Source: {r.source}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-100">{r.hours?.toFixed(1)}h</span>
                            {r.ot_hours > 0 && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold border border-indigo-100">OT {r.ot_hours}h</span>}
                            {r.leave_days > 0 && <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">Leave {r.leave_days}d</span>}
                            {r.lop_days > 0 && <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-lg text-xs font-medium border border-red-100">LOP {r.lop_days}d</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleViewAttendance(r)} className="btn btn-secondary">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEditAttendance(r)} className="btn btn-secondary">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteAttendance(r.id)} className="btn btn-danger">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRows.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No attendance records</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="form-row">
                {filteredRows.length === 0 && !loading ? (
                  <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
                    <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No attendance records</p>
                  </div>
                ) : filteredRows.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{r.employee} - {getEmployeeName(r.employee)}</p>
                        <p className="text-xs text-slate-500">{r.shift} Shift</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Time</span>
                        <span className="font-medium text-slate-700">{r.check_in} - {r.check_out}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Hours</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-100">{r.hours?.toFixed(1)}h</span>
                      </div>
                      {r.ot_hours > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">OT</span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">{r.ot_hours}h</span>
                        </div>
                      )}
                      {(r.leave_days > 0 || r.lop_days > 0) && (
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          {r.leave_days > 0 && <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-xs border border-amber-100">Leave {r.leave_days}d</span>}
                          {r.lop_days > 0 && <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-lg text-xs font-medium border border-red-100">LOP {r.lop_days}d</span>}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <span className="text-xs text-slate-400">{r.source}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleViewAttendance(r)} className="btn btn-secondary">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEditAttendance(r)} className="btn btn-secondary">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteAttendance(r.id)} className="btn btn-danger">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Leave Tab */}
        {activeTab === 'leave' && (
          <>
            {/* Leave Cards */}
            {viewMode === 'list' && (
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Employee</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Leave Details</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Approver</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Status</th>
                      <th className="text-right px-6 py-4 text-xs uppercase font-bold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeaves.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{l.employee}</p>
                              <p className="text-xs text-slate-500">{getEmployeeName(l.employee)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-800">{l.leave_type}</p>
                          <p className="text-xs text-slate-500">{l.days} day(s)</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">{l.approver || '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(l.status)}`}>{l.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {l.status === 'Pending' && (
                              <div className="flex gap-1 mr-2 border-r pr-2">
                                <button onClick={() => approveLeave(l.id)} disabled={loading} className="btn btn-success text-xs px-2 py-1 h-auto">Approve</button>
                                <button onClick={() => rejectLeave(l.id)} disabled={loading} className="btn btn-danger text-xs px-2 py-1 h-auto">Reject</button>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleViewLeave(l)} className="btn btn-secondary">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditLeave(l)} className="btn btn-secondary">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteLeave(l.id)} className="btn btn-danger">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLeaves.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No leave requests</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="form-row">
                {filteredLeaves.length === 0 && !loading ? (
                  <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No leave requests</p>
                  </div>
                ) : filteredLeaves.map((l) => (
                  <div key={l.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{l.employee} - {getEmployeeName(l.employee)}</p>
                        <p className="text-xs text-slate-500">{l.leave_type}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(l.status)}`}>{l.status}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Duration</span>
                        <span className="font-medium text-slate-700">{l.days} day(s)</span>
                      </div>
                      {l.approver && (
                        <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none', padding: '6px 10px', fontSize: 12 }}>
                          Approver: {l.approver}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        {l.status === 'Pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => approveLeave(l.id)} disabled={loading}
                              className="btn btn-success">
                              Approve
                            </button>
                            <button onClick={() => rejectLeave(l.id)} disabled={loading}
                              className="btn btn-danger">
                              Reject
                            </button>
                          </div>
                        ) : <div />}

                        <div className="flex items-center gap-0.5 ml-auto">
                          <button onClick={() => handleViewLeave(l)} className="btn btn-secondary">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEditLeave(l)} className="btn btn-secondary">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteLeave(l.id)} className="btn btn-danger">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>{/* END DATA AREA */}
      </div>
      )}

      {/* INLINE FORMS */}
      {showAttendanceForm && (
        <div style={{ padding: 24 }}>
          <div className="card" style={{ padding: 0, marginBottom: 24 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Log Attendance</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={resetAttendanceForm} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X className="w-4 h-4" /> Close
                </button>
                <button onClick={addAttendance} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </div>
            <form onSubmit={addAttendance} style={{ padding: 24 }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                <select className="form-control"
                  value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.employee_id || emp.id}>
                      {emp.name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input type="date" className="form-control"
                  value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>

              <div className="form-row" style={{ marginTop: 16 }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                  <select className="form-control"
                    value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                    <option value="">Select Shift</option>
                    {shifts.length > 0 ? (
                      shifts.map(shift => (
                        <option key={shift.id} value={shift.name}>
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </option>
                      ))
                    ) : (
                      <option value="">No shifts available</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                  <select className="form-control"
                    value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                    <option>Manual</option><option>Biometric</option><option>GPS</option><option>System</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: 16 }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check-In *</label>
                  <input type="time" className="form-control"
                    value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check-Out *</label>
                  <input type="time" className="form-control"
                    value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} required />
                </div>
              </div>

              {form.check_in && form.check_out && (
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4 space-y-2 mt-4">
                  <div className="form-row">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Total Time</p>
                      <p className="text-sm font-bold text-slate-900">{calculateHours(form.check_in, form.check_out, form.shift) + (shifts.find(s => s.name === form.shift)?.break_duration || 1)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Work Hours</p>
                      <p className="text-sm font-bold text-emerald-700">{calculateHours(form.check_in, form.check_out, form.shift)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">OT Hours</p>
                      <p className="text-sm font-bold text-indigo-700">{calculateOT(form.check_in, form.check_out, form.shift)}h</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row" style={{ marginTop: 16 }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Leave Days</label>
                  <input type="number" step="0.5" min="0" className="form-control"
                    value={form.leave_days} onChange={(e) => setForm({ ...form, leave_days: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">LOP Days</label>
                  <input type="number" step="0.5" min="0" className="form-control"
                    value={form.lop_days} onChange={(e) => setForm({ ...form, lop_days: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {showLeaveForm && (
        <div style={{ padding: 24 }}>
          <div className="card" style={{ padding: 0, marginBottom: 24 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Request Leave</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button type="button" onClick={resetLeaveForm} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <X className="w-4 h-4" /> Close
                </button>
                <button onClick={addLeave} disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Leave'}
                </button>
              </div>
            </div>
            <form onSubmit={addLeave} style={{ padding: 24 }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                <select className="form-control"
                  value={leaveForm.employee} onChange={(e) => setLeaveForm({ ...leaveForm, employee: e.target.value })} required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.employee_id || emp.id}>
                      {emp.name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row" style={{ marginTop: 16 }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Date *</label>
                  <input type="date" className="form-control"
                    value={leaveForm.from_date} onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To Date *</label>
                  <input type="date" className="form-control"
                    value={leaveForm.to_date} onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 16 }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                  <select className="form-control"
                    value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                    <option>Annual</option><option>Sick</option><option>Casual</option><option>Maternity</option><option>Paternity</option><option>Compensatory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Days</label>
                  <div className="form-control">
                    {leaveForm.from_date && leaveForm.to_date ? (
                      Math.ceil((new Date(leaveForm.to_date) - new Date(leaveForm.from_date)) / (1000 * 60 * 60 * 24)) + 1
                    ) : (
                      '—'
                    )} 
                    <span className="text-xs text-slate-500 ml-2">day(s)</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approver</label>
                <input className="form-control" placeholder="Manager name"
                  value={leaveForm.approver} onChange={(e) => setLeaveForm({ ...leaveForm, approver: e.target.value })} />
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW MODALS */}
      {viewingAttendance && (
        <div style={{ padding: 24 }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{viewingAttendance.employee} - {getEmployeeName(viewingAttendance.employee)}</h3>
                  <p className="text-xs text-slate-500">Attendance Details</p>
                </div>
              </div>
              <button onClick={() => setViewingAttendance(null)} className="btn btn-secondary">
                <X size={16} /> Close
              </button>
            </div>
            <div className="p-5 space-y-4 bg-white">
              <div className="form-row">
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.date ? new Date(viewingAttendance.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                </div>
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Shift</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.shift}</p>
                </div>
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Source</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.source}</p>
                </div>
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Time In</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.check_in}</p>
                </div>
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Time Out</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.check_out}</p>
                </div>
                <div className="card" style={{ background: 'rgba(16,185,129,0.1)', border: 'none' }}>
                  <p className="text-xs text-emerald-600 mb-1">Total Hours</p>
                  <p className="font-bold text-emerald-800">{viewingAttendance.hours?.toFixed(2)}h</p>
                </div>
                <div className="card" style={{ background: 'rgba(99,102,241,0.1)', border: 'none' }}>
                  <p className="text-xs text-indigo-600 mb-1">OT Hours</p>
                  <p className="font-bold text-indigo-800">{viewingAttendance.ot_hours?.toFixed(2)}h</p>
                </div>
              </div>

              {(viewingAttendance.leave_days > 0 || viewingAttendance.lop_days > 0) && (
                <div className="flex gap-2 mt-4">
                  {viewingAttendance.leave_days > 0 && <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm font-medium">Leave: {viewingAttendance.leave_days}d</span>}
                  {viewingAttendance.lop_days > 0 && <span className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm font-medium">LOP: {viewingAttendance.lop_days}d</span>}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--bg-secondary)' }}>
              <button onClick={() => { setViewingAttendance(null); handleEditAttendance(viewingAttendance); }} className="btn btn-primary">Edit</button>
            </div>
          </div>
        </div>
      )}

      {viewingLeave && (
        <div style={{ padding: 24 }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{viewingLeave.employee} - {getEmployeeName(viewingLeave.employee)}</h3>
                  <p className="text-xs text-slate-500">Leave Details</p>
                </div>
              </div>
              <button onClick={() => setViewingLeave(null)} className="btn btn-secondary">
                <X size={16} /> Close
              </button>
            </div>
            <div className="p-5 space-y-4 bg-white">
              <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-slate-500 font-medium">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(viewingLeave.status)}`}>{viewingLeave.status}</span>
              </div>

              <div className="form-row">
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Leave Type</p>
                  <p className="font-medium text-slate-900">{viewingLeave.leave_type}</p>
                </div>
                <div className="card" style={{ background: 'rgba(16,185,129,0.1)', border: 'none' }}>
                  <p className="text-xs text-emerald-600 mb-1">Duration</p>
                  <p className="font-bold text-emerald-800">{viewingLeave.days} Day(s)</p>
                </div>
              </div>

              {viewingLeave.approver && (
                <div className="card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                  <p className="text-xs text-slate-500 mb-1">Approver</p>
                  <p className="font-medium text-slate-900">{viewingLeave.approver}</p>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--bg-secondary)' }}>
              <button onClick={() => { setViewingLeave(null); handleEditLeave(viewingLeave); }} className="btn btn-primary">Edit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceLeave;