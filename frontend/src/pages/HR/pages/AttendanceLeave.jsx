import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, AlertTriangle, Plus, Trash2, X, Clock, Calendar, User, Eye, MapPin, Info, Edit2, Filter, LayoutList, LayoutGrid, Search, Download, FileText, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { fetchAttendance, createAttendance, updateAttendance, deleteAttendance, fetchLeaves, createLeave, updateLeave, deleteLeave, fetchEmployees, fetchShifts } from '../../../services/hrService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

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

  const totalPages = Math.ceil((activeTab === 'attendance' ? filteredRows.length : filteredLeaves.length) / itemsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportPDF = () => {
    const doc = new jsPDF();
    if (activeTab === 'attendance') {
      doc.text("Attendance Report", 14, 15);
      const tableColumn = ["#", "Employee", "Shift", "Check In", "Check Out", "Hours", "OT"];
      const tableRows = [];
      filteredRows.forEach((r, index) => {
        tableRows.push([
          index + 1,
          r.employee,
          r.shift || '-',
          r.check_in || '-',
          r.check_out || '-',
          r.hours || 0,
          r.ot_hours || 0
        ]);
      });
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
      doc.save(`Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } else {
      doc.text("Leave Report", 14, 15);
      const tableColumn = ["#", "Employee", "Type", "Days", "Status", "Approver"];
      const tableRows = [];
      filteredLeaves.forEach((l, index) => {
        tableRows.push([
          index + 1,
          l.employee,
          l.leave_type || '-',
          l.days || 1,
          l.status || 'Pending',
          l.approver || '-'
        ]);
      });
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
      doc.save(`Leave_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const exportExcel = () => {
    let data;
    let filename;
    if (activeTab === 'attendance') {
      data = filteredRows.map((r, index) => ({
        "#": index + 1,
        "Employee": r.employee,
        "Shift": r.shift || '-',
        "Check In": r.check_in || '-',
        "Check Out": r.check_out || '-',
        "Hours": r.hours || 0,
        "OT": r.ot_hours || 0
      }));
      filename = `Attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      data = filteredLeaves.map((l, index) => ({
        "#": index + 1,
        "Employee": l.employee,
        "Type": l.leave_type || '-',
        "Days": l.days || 1,
        "Status": l.status || 'Pending',
        "Approver": l.approver || '-'
      }));
      filename = `Leaves_${new Date().toISOString().split('T')[0]}.xlsx`;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, filename);
  };

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
            {/* LEFT: Title */}
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <CalendarClock size={24} color="var(--primary)" /> Attendance & Leave
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage daily employee attendance and leave requests.</p>
            </div>

            {/* RIGHT: Add dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Create New
                </button>
                {showAddMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 180, overflow: 'hidden' }}>
                    <button
                      onClick={() => { setShowAttendanceForm(true); setShowAddMenu(false); }}
                      style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#475569', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500 }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Clock size={16} color="#6366f1" /> Log Attendance
                    </button>
                    <button
                      onClick={() => { setShowLeaveForm(true); setShowAddMenu(false); }}
                      style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 500 }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Calendar size={16} color="#10b981" /> Request Leave
                    </button>
                  </div>
                )}
              </div>
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



        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by Employee Name..." 
              value={filterEmployee}
              onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', height: 44 }} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              value={activeTab} 
              onChange={(e) => { setActiveTab(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, height: 44, outline: 'none', background: '#f8fafc', fontWeight: 600, color: '#334155', minWidth: 160, cursor: 'pointer' }}
            >
              <option value="attendance">Daily Attendance</option>
              <option value="leave">Leave Requests</option>
            </select>

            {activeTab === 'attendance' ? (
              <select 
                value={filterShift} 
                onChange={(e) => { setFilterShift(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 160 }}
              >
                <option value="">All Shifts</option>
                {shifts.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            ) : (
              <>
                <select 
                  value={filterLeaveType} 
                  onChange={(e) => { setFilterLeaveType(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 160 }}
                >
                  <option value="">All Leave Types</option>
                  <option value="Annual">Annual</option>
                  <option value="Sick">Sick</option>
                  <option value="Casual">Casual</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Paternity">Paternity</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
                <select 
                  value={filterLeaveStatus} 
                  onChange={(e) => { setFilterLeaveStatus(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 160 }}
                >
                  <option value="">All Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </>
            )}

            <button
              onClick={() => {
                setFilterEmployee('');
                setFilterShift('');
                setFilterLeaveType('');
                setFilterLeaveStatus('');
                setCurrentPage(1);
              }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 14, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
            >
              <RefreshCw size={16} /> Reset
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)} 
                style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', height: 44, padding: '0 20px', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
              >
                <Download size={16} /> Export
              </button>
              {showExportMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 150, overflow: 'hidden' }}>
                  <button
                    onClick={() => { exportPDF(); setShowExportMenu(false); }}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#475569', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 500 }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FileText size={16} color="#ef4444" /> PDF Report
                  </button>
                  <button
                    onClick={() => { exportExcel(); setShowExportMenu(false); }}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13, fontWeight: 500 }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FileSpreadsheet size={16} color="#10b981" /> Excel Sheet
                  </button>
                </div>
              )}
            </div>
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
              <div className="card overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 rounded-2xl" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">Employee</th>
                      <th className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">Shift & Time</th>
                      <th className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedRows.map(r => (
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
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-emerald-100/60 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 shadow-sm backdrop-blur-md">{r.hours?.toFixed(1)}h</span>
                            {r.ot_hours > 0 && <span className="bg-indigo-100/60 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 shadow-sm backdrop-blur-md">OT {r.ot_hours}h</span>}
                            {r.leave_days > 0 && <span className="bg-amber-100/60 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 shadow-sm backdrop-blur-md">Leave {r.leave_days}d</span>}
                            {r.lop_days > 0 && <span className="bg-red-100/60 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 shadow-sm backdrop-blur-md">LOP {r.lop_days}d</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleViewAttendance(r)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                              <Eye size={14} color="#6366f1" />
                            </button>
                            <button onClick={() => handleEditAttendance(r)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                              <Edit2 size={14} color="#3b82f6" />
                            </button>
                            <button onClick={() => handleDeleteAttendance(r.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                              <Trash2 size={14} color="#ef4444" />
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      Showing <span style={{ fontWeight: 600, color: '#1e293b' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(currentPage * itemsPerPage, filteredRows.length)}</span> of <span style={{ fontWeight: 600, color: '#1e293b' }}>{filteredRows.length}</span> results
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        Previous
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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
              <div className="card overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 rounded-2xl" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 backdrop-blur-sm">
                    <tr>
                      <th className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">Employee</th>
                      <th className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">Leave Details</th>
                      <th className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">Approver</th>
                      <th className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">Status</th>
                      <th className="px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedLeaves.map(l => (
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
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {l.status === 'Pending' && (
                              <div className="flex gap-1 mr-2 border-r pr-2">
                                <button onClick={() => approveLeave(l.id)} disabled={loading} className="btn btn-success text-xs px-2 py-1 h-auto" style={{ height: 32 }}>Approve</button>
                                <button onClick={() => rejectLeave(l.id)} disabled={loading} className="btn btn-danger text-xs px-2 py-1 h-auto" style={{ height: 32 }}>Reject</button>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleViewLeave(l)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View">
                                <Eye size={14} color="#6366f1" />
                              </button>
                              <button onClick={() => handleEditLeave(l)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                                <Edit2 size={14} color="#3b82f6" />
                              </button>
                              <button onClick={() => handleDeleteLeave(l.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                                <Trash2 size={14} color="#ef4444" />
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      Showing <span style={{ fontWeight: 600, color: '#1e293b' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(currentPage * itemsPerPage, filteredLeaves.length)}</span> of <span style={{ fontWeight: 600, color: '#1e293b' }}>{filteredLeaves.length}</span> results
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        Previous
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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
            <form onSubmit={addAttendance} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Attendance Details
                </legend>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Employee *</label>
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
                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" className="form-control"
                      value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Shift</label>
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
                  <div className="form-group">
                    <label>Source</label>
                    <select className="form-control"
                      value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                      <option>Manual</option><option>Biometric</option><option>GPS</option><option>System</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Check-In *</label>
                    <input type="time" className="form-control"
                      value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Check-Out *</label>
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
                  <div className="form-group">
                    <label>Leave Days</label>
                    <input type="number" step="0.5" min="0" className="form-control"
                      value={form.leave_days} onChange={(e) => setForm({ ...form, leave_days: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label>LOP Days</label>
                    <input type="number" step="0.5" min="0" className="form-control"
                      value={form.lop_days} onChange={(e) => setForm({ ...form, lop_days: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </fieldset>

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
            <form onSubmit={addLeave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
                <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Leave Request
                </legend>
                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Employee *</label>
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
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>From Date *</label>
                    <input type="date" className="form-control"
                      value={leaveForm.from_date} onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>To Date *</label>
                    <input type="date" className="form-control"
                      value={leaveForm.to_date} onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Leave Type</label>
                    <select className="form-control"
                      value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}>
                      <option>Annual</option><option>Sick</option><option>Casual</option><option>Maternity</option><option>Paternity</option><option>Compensatory</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Total Days</label>
                    <div className="form-control" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center' }}>
                      {leaveForm.from_date && leaveForm.to_date ? (
                        Math.ceil((new Date(leaveForm.to_date) - new Date(leaveForm.from_date)) / (1000 * 60 * 60 * 24)) + 1
                      ) : (
                        '—'
                      )} 
                      <span className="text-xs text-slate-500 ml-2">day(s)</span>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Approver</label>
                    <input className="form-control" placeholder="Manager name"
                      value={leaveForm.approver} onChange={(e) => setLeaveForm({ ...leaveForm, approver: e.target.value })} />
                  </div>
                </div>
              </fieldset>

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