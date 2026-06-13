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
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + stats badges */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">ATTENDANCE & LEAVE</h1>
          <span className="btn btn-success">Records: {totals.presentDays}</span>
          <span className="btn btn-primary">OT: {totals.otHours}h</span>
          {totals.pendingLeaves > 0 && (
            <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-100">Pending: {totals.pendingLeaves}</span>
          )}
        </div>

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
                <span className="btn btn-primary" />
              )}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
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
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
          <button onClick={() => setActiveTab('attendance')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'attendance' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}>
            <Clock className="w-4 h-4" /> Attendance
          </button>
          <button onClick={() => setActiveTab('leave')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === 'leave' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              }`}>
            <Calendar className="w-4 h-4" /> Leave
            {totals.pendingLeaves > 0 && <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">{totals.pendingLeaves}</span>}
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="btn btn-success">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="btn btn-danger">
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
            {/* Attendance Form Modal */}
            {showAttendanceForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
                <div className="card">
                  <div className="btn btn-secondary">
                    <h2 className="card-title">Log Attendance</h2>
                    <button onClick={resetAttendanceForm} className="btn btn-secondary">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={addAttendance} className="p-4 space-y-4">
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

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                      <input type="date" className="form-control"
                        value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                    </div>

                    <div className="form-row">
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

                    <div className="form-row">
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
                      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4 space-y-2">
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

                    <div className="form-row">
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

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetAttendanceForm}
                        className="btn btn-secondary">Cancel</button>
                      <button type="submit" disabled={loading}
                        className="btn btn-primary">
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Attendance Cards */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredRows.length === 0 && !loading ? (
                  <div className="card">
                    <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No attendance records</p>
                  </div>
                ) : filteredRows.map((r) => (
                  <div key={r.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{r.employee} - {getEmployeeName(r.employee)}</p>
                          <p className="text-sm text-slate-500">{r.shift} Shift • {r.source}</p>
                        </div>
                      </div>
                      <span className="btn btn-success">{r.hours?.toFixed(1)}h</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">{r.check_in} - {r.check_out}</span>
                      {r.ot_hours > 0 && <span className="btn btn-primary">OT {r.ot_hours}h</span>}
                      {r.leave_days > 0 && <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700">Leave {r.leave_days}d</span>}
                      {r.lop_days > 0 && <span className="btn btn-danger">LOP {r.lop_days}d</span>}

                      <div className="flex items-center gap-1 ml-auto">
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
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="form-row">
                {filteredRows.length === 0 && !loading ? (
                  <div className="btn btn-secondary">
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
                        <span className="btn btn-success">{r.hours?.toFixed(1)}h</span>
                      </div>
                      {r.ot_hours > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">OT</span>
                          <span className="btn btn-primary">{r.ot_hours}h</span>
                        </div>
                      )}
                      {(r.leave_days > 0 || r.lop_days > 0) && (
                        <div className="flex items-center gap-1 flex-wrap pt-1">
                          {r.leave_days > 0 && <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-xs">Leave {r.leave_days}d</span>}
                          {r.lop_days > 0 && <span className="btn btn-danger">LOP {r.lop_days}d</span>}
                        </div>
                      )}
                      <div className="btn btn-secondary">
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
            {/* Leave Form Modal */}
            {showLeaveForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
                <div className="card">
                  <div className="btn btn-secondary">
                    <h2 className="card-title">Request Leave</h2>
                    <button onClick={resetLeaveForm} className="btn btn-secondary">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={addLeave} className="p-4 space-y-4">
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
                    <div className="form-row">
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
                    <div className="form-row">
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

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Approver</label>
                      <input className="form-control" placeholder="Manager name"
                        value={leaveForm.approver} onChange={(e) => setLeaveForm({ ...leaveForm, approver: e.target.value })} />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetLeaveForm}
                        className="btn btn-secondary">Cancel</button>
                      <button type="submit" disabled={loading}
                        className="btn btn-primary">
                        {loading ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Leave Cards */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredLeaves.length === 0 && !loading ? (
                  <div className="card">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No leave requests</p>
                  </div>
                ) : filteredLeaves.map((l) => (
                  <div key={l.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{l.employee} - {getEmployeeName(l.employee)}</p>
                        <p className="text-sm text-slate-500">{l.leave_type} • {l.days} day(s)</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(l.status)}`}>{l.status}</span>
                    </div>
                    {l.approver && <p className="text-xs text-slate-500">Approver: {l.approver}</p>}
                    <div className="flex items-center justify-between pt-2">
                      {l.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => approveLeave(l.id)} disabled={loading}
                            className="btn btn-success">
                            Approve
                          </button>
                          <button onClick={() => rejectLeave(l.id)} disabled={loading}
                            className="btn btn-danger">
                            Reject
                          </button>
                        </div>
                      ) : <div></div>}

                      <div className="flex items-center gap-1 ml-auto">
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
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="form-row">
                {filteredLeaves.length === 0 && !loading ? (
                  <div className="btn btn-secondary">
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
                        <div className="btn btn-secondary">
                          Approver: {l.approver}
                        </div>
                      )}
                      <div className="btn btn-secondary">
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

      {/* VIEW MODALS */}
      {viewingAttendance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card">
            <div className="btn btn-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">{viewingAttendance.employee} - {getEmployeeName(viewingAttendance.employee)}</h3>
                  <p className="text-xs text-indigo-100">Attendance Details</p>
                </div>
              </div>
              <button onClick={() => setViewingAttendance(null)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="form-row">
                <div className="btn btn-secondary">
                  <p className="text-xs text-slate-500 mb-1">Date</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.date ? new Date(viewingAttendance.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                </div>
                <div className="btn btn-secondary">
                  <p className="text-xs text-slate-500 mb-1">Shift</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.shift}</p>
                </div>
                <div className="btn btn-secondary">
                  <p className="text-xs text-slate-500 mb-1">Source</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.source}</p>
                </div>
                <div className="btn btn-secondary">
                  <p className="text-xs text-slate-500 mb-1">Time In</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.check_in}</p>
                </div>
                <div className="btn btn-secondary">
                  <p className="text-xs text-slate-500 mb-1">Time Out</p>
                  <p className="font-medium text-slate-900">{viewingAttendance.check_out}</p>
                </div>
                <div className="btn btn-success">
                  <p className="text-xs text-emerald-600 mb-1">Total Hours</p>
                  <p className="font-bold text-emerald-800">{viewingAttendance.hours?.toFixed(2)}h</p>
                </div>
                <div className="btn btn-primary">
                  <p className="text-xs text-indigo-600 mb-1">OT Hours</p>
                  <p className="font-bold text-indigo-800">{viewingAttendance.ot_hours?.toFixed(2)}h</p>
                </div>
              </div>

              {(viewingAttendance.leave_days > 0 || viewingAttendance.lop_days > 0) && (
                <div className="flex gap-2">
                  {viewingAttendance.leave_days > 0 && <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm font-medium">Leave: {viewingAttendance.leave_days}d</span>}
                  {viewingAttendance.lop_days > 0 && <span className="btn btn-danger">LOP: {viewingAttendance.lop_days}d</span>}
                </div>
              )}
            </div>
            <div className="btn btn-secondary">
              <button onClick={() => { setViewingAttendance(null); handleEditAttendance(viewingAttendance); }}
                className="btn btn-primary">Edit</button>
              <button onClick={() => setViewingAttendance(null)}
                className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {viewingLeave && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card">
            <div className="btn btn-success">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">{viewingLeave.employee} - {getEmployeeName(viewingLeave.employee)}</h3>
                  <p className="text-xs text-emerald-100">Leave Details</p>
                </div>
              </div>
              <button onClick={() => setViewingLeave(null)} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="card-header">
                <span className="text-slate-500 font-medium">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(viewingLeave.status)}`}>{viewingLeave.status}</span>
              </div>

              <div className="form-row">
                <div className="btn btn-secondary">
                  <p className="text-xs text-slate-500 mb-1">Leave Type</p>
                  <p className="font-medium text-slate-900">{viewingLeave.leave_type}</p>
                </div>
                <div className="btn btn-success">
                  <p className="text-xs text-emerald-600 mb-1">Duration</p>
                  <p className="font-bold text-emerald-800">{viewingLeave.days} Day(s)</p>
                </div>
              </div>

              {viewingLeave.approver && (
                <div className="btn btn-secondary">
                  <p className="text-xs text-slate-500 mb-1">Approver</p>
                  <p className="font-medium text-slate-900">{viewingLeave.approver}</p>
                </div>
              )}
            </div>

            <div className="btn btn-secondary">
              <button onClick={() => { setViewingLeave(null); handleEditLeave(viewingLeave); }}
                className="btn btn-success">Edit</button>
              <button onClick={() => setViewingLeave(null)}
                className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceLeave;