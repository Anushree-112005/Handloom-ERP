import React, { useState, useEffect } from 'react';
import { Clock, Plus, Search, Calendar, CheckCircle, Play, Pause, Save, X, Edit2, Trash2, ChevronLeft, ChevronRight, BarChart3, Eye } from 'lucide-react';
import { fetchTimesheets, createTimesheet, updateTimesheet, deleteTimesheet, fetchEmployees, fetchShifts, fetchAttendance } from '../../../services/hrService';
import { getProjects } from '../../../services/projectService';

const statusColors = {
  'Draft': 'bg-slate-100 text-slate-600',
  'Submitted': 'bg-blue-100 text-blue-700',
  'Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700'
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Timesheet() {
  const [timesheets, setTimesheets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list, calendar
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart(new Date()));
  const [currentTimer, setCurrentTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [viewingId, setViewingId] = useState(null);
  const [presentEmployees, setPresentEmployees] = useState([]);
  const [isEmployeeAbsent, setIsEmployeeAbsent] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const initialForm = {
    employee_id: '',
    employee_name: '',
    date: new Date().toISOString().split('T')[0],
    project_id: '',
    shift_id: '',
    shift_name: '',
    shift_working_hours: 0,
    shift_break_duration: 0,
    remarks: '',
    hours_worked: '',
    break_hours: 0,
    overtime_hours: 0
  };
  const [form, setForm] = useState(initialForm);

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval;
    if (currentTimer) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentTimer]);

  useEffect(() => {
    if (!showForm) {
      setShowEmployeeDropdown(false);
      setEmployeeSearchTerm('');
    }
  }, [showForm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tsData, empData, projRes, shiftsData, attData] = await Promise.all([
        fetchTimesheets(),
        fetchEmployees(),
        getProjects({ limit: 100 }).catch(() => ({ data: { projects: [] } })),
        fetchShifts().catch(() => []),
        fetchAttendance().catch(() => [])
      ]);
      
      // Get projects list
      const projectsList = projRes?.data?.projects || [];
      setProjects(Array.isArray(projectsList) ? projectsList : []);
      
      // Set shifts data
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      
      // Set attendance data
      setAttendance(Array.isArray(attData) ? attData : []);
      
      // Enrich timesheet data with project names and overtime calculation
      const enrichedTimesheets = (tsData || []).map(ts => {
        const project = projectsList.find(p => p.project_id === ts.project_id);
        const projectName = project?.project_name || 'No Project';
        const hoursWorked = parseFloat(ts.hours_worked) || 0;
        const overtimeHours = hoursWorked > 8 ? hoursWorked - 8 : 0;
        
        return {
          ...ts,
          project_name: projectName,
          overtime_hours: overtimeHours,
          working_hours: hoursWorked
        };
      });
      
      setTimesheets(enrichedTimesheets);
      setEmployees(empData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setTimesheets([]);
      setEmployees([]);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.date || !form.hours_worked || !form.project_id) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        employee_id: parseInt(form.employee_id),
        project_id: parseInt(form.project_id),
        shift_id: form.shift_id ? parseInt(form.shift_id) : null,
        hours_worked: parseFloat(form.hours_worked) || 0,
        remarks: form.remarks || '',
        date: new Date(form.date).toISOString()
      };

      if (editingId) {
        await updateTimesheet(editingId, payload);
      } else {
        await createTimesheet(payload);
      }

      setShowForm(false);
      setEditingId(null);
      setViewingId(null);
      setForm(initialForm);
      setIsEmployeeAbsent(false);
      loadData();
    } catch (error) {
      console.error('Error saving timesheet:', error);
      alert('Error saving timesheet: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (ts) => {
    const selectedShift = ts.shift_id ? shifts.find(s => s.id === ts.shift_id) : null;
    const breakHours = selectedShift ? ((selectedShift.break_duration || 0) / 60).toFixed(1) : 0;
    const shiftWorkingHours = selectedShift?.working_hours || 0;
    const hoursWorked = parseFloat(ts.hours_worked) || 0;
    const overtimeHours = hoursWorked > shiftWorkingHours ? (hoursWorked - shiftWorkingHours).toFixed(1) : 0;
    
    setForm({
      employee_id: ts.employee_id,
      employee_name: ts.employee_name,
      date: ts.date?.split('T')[0] || '',
      project_id: ts.project_id || '',
      shift_id: ts.shift_id || '',
      shift_name: selectedShift?.name || '',
      shift_working_hours: shiftWorkingHours,
      shift_break_duration: selectedShift?.break_duration || 0,
      remarks: ts.remarks || '',
      hours_worked: ts.hours_worked || '',
      break_hours: parseFloat(breakHours),
      overtime_hours: parseFloat(overtimeHours)
    });
    setEditingId(ts.timesheet_id || ts.id);
    setShowForm(true);
  };

  const handleView = (ts) => {
    const selectedShift = ts.shift_id ? shifts.find(s => s.id === ts.shift_id) : null;
    const breakHours = selectedShift ? ((selectedShift.break_duration || 0) / 60).toFixed(1) : 0;
    const shiftWorkingHours = selectedShift?.working_hours || 0;
    const hoursWorked = parseFloat(ts.hours_worked) || 0;
    const overtimeHours = hoursWorked > shiftWorkingHours ? (hoursWorked - shiftWorkingHours).toFixed(1) : 0;
    
    setForm({
      employee_id: ts.employee_id,
      employee_name: ts.employee_name,
      date: ts.date?.split('T')[0] || '',
      project_id: ts.project_id || '',
      shift_id: ts.shift_id || '',
      shift_name: selectedShift?.name || '',
      shift_working_hours: shiftWorkingHours,
      shift_break_duration: selectedShift?.break_duration || 0,
      remarks: ts.remarks || '',
      hours_worked: ts.hours_worked || '',
      break_hours: parseFloat(breakHours),
      overtime_hours: parseFloat(overtimeHours)
    });
    setViewingId(ts.timesheet_id || ts.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timesheet entry?')) return;
    try {
      await deleteTimesheet(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateTimesheet(id, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e.id === parseInt(empId));
    setForm({
      ...form,
      employee_id: empId,
      employee_name: emp ? emp.name : ''
    });
  };

  const handleShiftChange = (e) => {
    const shiftId = e.target.value;
    const selectedShift = shifts.find(s => s.id === parseInt(shiftId));
    
    if (selectedShift) {
      const breakMinutes = selectedShift.break_duration || 0;
      const breakHours = (breakMinutes / 60).toFixed(1);
      const shiftWorkingHours = selectedShift.working_hours || 0;
      
      // Calculate overtime based on current hours worked
      const hoursWorked = parseFloat(form.hours_worked) || 0;
      const overtimeHours = hoursWorked > shiftWorkingHours ? (hoursWorked - shiftWorkingHours).toFixed(1) : 0;
      
      setForm({
        ...form,
        shift_id: shiftId,
        shift_name: selectedShift.name,
        shift_working_hours: shiftWorkingHours,
        shift_break_duration: breakMinutes,
        break_hours: parseFloat(breakHours),
        overtime_hours: parseFloat(overtimeHours)
      });
    } else {
      setForm({
        ...form,
        shift_id: '',
        shift_name: '',
        shift_working_hours: 0,
        shift_break_duration: 0,
        break_hours: 0,
        overtime_hours: 0
      });
    }
  };

  const handleHoursChange = (value) => {
    const hoursWorked = parseFloat(value) || 0;
    const shiftWorkingHours = form.shift_working_hours || 8; // Default to 8 if no shift selected
    const overtimeHours = hoursWorked > shiftWorkingHours ? (hoursWorked - shiftWorkingHours).toFixed(1) : 0;
    
    setForm({
      ...form,
      hours_worked: value,
      overtime_hours: parseFloat(overtimeHours)
    });
  };

  const startTimer = () => {
    setCurrentTimer(new Date());
    setTimerSeconds(0);
  };

  const stopTimer = () => {
    const hours = timerSeconds / 3600;
    setForm({
      ...form,
      hours_worked: hours.toFixed(2)
    });
    setCurrentTimer(null);
    setShowForm(true);
  };

  const getPresentEmployeesOnDate = (selectedDate) => {
    // Format the date for comparison (YYYY-MM-DD)
    const dateStr = selectedDate || form.date;
    
    // Find all attendance records for this date
    const attendanceOnDate = attendance.filter(att => {
      const attDate = att.date ? att.date.split('T')[0] : '';
      return attDate === dateStr;
    });

    // Get unique employees from attendance records
    const presentEmpIds = [...new Set(attendanceOnDate.map(att => att.employee))];
    
    // Get employee details for present employees
    const present = presentEmpIds.map(empId => {
      const empData = employees.find(e => e.employee_id === empId || String(e.id) === String(empId));
      const attRecord = attendanceOnDate.find(att => att.employee === empId);
      return {
        id: empData?.id || empId,
        employee_id: empId,
        name: empData?.name || empId,
        attendance: attRecord
      };
    });

    return present;
  };

  const fillAttendanceData = (employee) => {
    // Get the attendance record for this employee on the selected date
    const dateStr = form.date;
    const attRecord = attendance.find(att => 
      (att.employee === employee.employee_id || att.employee === employee.id) &&
      (att.date?.split('T')[0] === dateStr)
    );

    if (!attRecord) return;

    // Get shift details if available
    const shiftName = attRecord.shift;
    const shiftData = shifts.find(s => s.name === shiftName);
    
    // Calculate hours and overtime based on check-in/check-out
    const checkIn = attRecord.check_in;
    const checkOut = attRecord.check_out;
    let hoursWorked = 0;
    let overtimeHours = 0;

    if (checkIn && checkOut) {
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      
      // Subtract break duration if shift exists
      const breakDuration = shiftData?.break_duration || 1;
      const actualWorkMinutes = totalMinutes - (breakDuration * 60);
      hoursWorked = actualWorkMinutes / 60;
      
      const shiftWorkingHours = shiftData?.working_hours || 8;
      overtimeHours = hoursWorked > shiftWorkingHours ? hoursWorked - shiftWorkingHours : 0;
    }

    // Update form with attendance data
    setForm({
      ...form,
      employee_id: employee.id || employee.employee_id,
      employee_name: employee.name,
      shift_id: shiftData?.id || '',
      shift_name: shiftName || '',
      shift_working_hours: shiftData?.working_hours || 8,
      shift_break_duration: shiftData?.break_duration || 60,
      break_hours: ((shiftData?.break_duration || 60) / 60),
      hours_worked: hoursWorked.toFixed(2),
      overtime_hours: overtimeHours.toFixed(2)
    });
  };

  const handleDateChange = (selectedDate) => {
    setForm({ ...form, date: selectedDate });
    const presentEmps = getPresentEmployeesOnDate(selectedDate);
    setPresentEmployees(presentEmps);
  };

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredTimesheets = timesheets.filter(ts => {
    const matchesSearch = !searchTerm ||
      ts.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const weekDates = getWeekDates(selectedWeek);
  const weekTimesheets = timesheets.filter(ts => {
    if (!ts.date) return false;
    const tsDate = new Date(ts.date);
    return tsDate >= weekDates[0] && tsDate <= weekDates[6];
  });

  const stats = {
    totalHours: timesheets.reduce((sum, ts) => sum + (parseFloat(ts.hours_worked) || 0), 0),
    thisWeek: weekTimesheets.reduce((sum, ts) => sum + (parseFloat(ts.hours_worked) || 0), 0),
    pending: timesheets.filter(ts => ts.status === 'Submitted').length,
    approved: timesheets.filter(ts => ts.status === 'Approved').length
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Loading State */}
      {loading && timesheets.length === 0 && employees.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Timesheet</h1>
              <p className="text-slate-500 text-sm mt-1">Track work hours and projects</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); setIsEmployeeAbsent(false); setEmployeeSearchTerm(''); setShowEmployeeDropdown(false); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="form-row">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="btn btn-primary">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalHours.toFixed(1)}h</p>
                  <p className="text-xs text-slate-500">Total Hours</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="btn btn-success">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.thisWeek.toFixed(1)}h</p>
                  <p className="text-xs text-slate-500">This Week</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                  <p className="text-xs text-slate-500">Pending Approval</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="btn btn-primary">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stats.approved}</p>
                  <p className="text-xs text-slate-500">Approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600'}`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${viewMode === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-600'}`}
              >
                Week View
              </button>
            </div>
            {viewMode === 'list' && (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search timesheets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>
            )}
          </div>

          {/* Week Navigation (Calendar View) */}
          {viewMode === 'calendar' && (
            <div className="card">
              <div className="card-header">
                <button
                  onClick={() => setSelectedWeek(new Date(selectedWeek.setDate(selectedWeek.getDate() - 7)))}
                  className="btn btn-secondary"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="card-title">
                  {weekDates[0].toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setSelectedWeek(new Date(selectedWeek.setDate(selectedWeek.getDate() + 7)))}
                  className="btn btn-secondary"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="form-row">
                {weekDates.map((date, idx) => {
                  const dayEntries = weekTimesheets.filter(ts => {
                    const tsDate = new Date(ts.date);
                    return tsDate.toDateString() === date.toDateString();
                  });
                  const dayHours = dayEntries.reduce((sum, ts) => sum + (parseFloat(ts.hours_worked) || 0), 0);
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg border transition-all ${dayEntries.length > 0 ? 'hover:shadow-md hover:border-indigo-300' : ''} ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                    >
                      <div className="text-center mb-2">
                        <p className="text-xs text-slate-500">{weekDays[idx]}</p>
                        <p className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>{date.getDate()}</p>
                      </div>
                      <div className="text-center mb-2">
                        <p className="text-2xl font-bold text-slate-800">{dayHours.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">hours</p>
                      </div>
                      {dayEntries.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                          {dayEntries.map(entry => (
                            <button 
                              key={entry.timesheet_id || entry.id}
                              onClick={() => handleView(entry)}
                              className="form-control"
                            >
                              <p className="font-semibold text-indigo-900">{entry.employee_name}</p>
                              <p className="text-indigo-700">{entry.project_name}</p>
                              <p className="text-indigo-600 font-medium">{entry.hours_worked || 0}h</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead className="btn btn-secondary">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Employee</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Project</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Working Hours</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Overtime</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTimesheets.map(ts => (
                      <tr key={ts.timesheet_id || ts.id} className="btn btn-secondary">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-700">{formatDate(ts.date)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{ts.employee_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{ts.project_name || 'No Project'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-slate-800">{parseFloat(ts.hours_worked || 0).toFixed(1)}h</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-orange-600">{(ts.overtime_hours || 0).toFixed(1)}h</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ts.status] || 'bg-gray-100 text-gray-600'}`}>
                            {ts.status || 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleView(ts)}
                              className="btn btn-primary"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-indigo-600" />
                            </button>
                            <button onClick={() => handleEdit(ts)} className="btn btn-secondary">
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </button>
                            <button onClick={() => handleDelete(ts.timesheet_id || ts.id)} className="btn btn-danger">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTimesheets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No timesheet entries found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
              <div className="card">
                {/* Header with Gradient */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{viewingId ? 'View' : editingId ? 'Edit' : 'New'} Timesheet</h2>
                          <p className="text-white/80 text-sm">Track your work hours and project allocation</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setShowForm(false); setEditingId(null); setViewingId(null); setIsEmployeeAbsent(false); setEmployeeSearchTerm(''); setShowEmployeeDropdown(false); }} className="p-2 hover:bg-white/20 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Form Content */}
                <div className="p-6 space-y-5">
                  <div className="form-row">
                    <div className="relative">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Employee *</label>
                      <input
                        type="text"
                        placeholder="Type to search employee..."
                        value={employeeSearchTerm || (form.employee_id ? employees.find(e => String(e.id) === String(form.employee_id))?.name || '' : '')}
                        onChange={(e) => {
                          setEmployeeSearchTerm(e.target.value);
                          setShowEmployeeDropdown(true);
                        }}
                        onFocus={() => setShowEmployeeDropdown(true)}
                        disabled={viewingId}
                        className="form-control"
                      />
                      
                      {/* Custom Dropdown */}
                      {showEmployeeDropdown && !viewingId && (
                        <div className="btn btn-secondary">
                          {presentEmployees.length > 0 && (
                            <>
                              <div className="btn btn-success">
                                Present Today
                              </div>
                              {presentEmployees.filter(emp => emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase())).map(emp => (
                                <button
                                  key={emp.id}
                                  type="button"
                                  onClick={() => {
                                    setForm({ ...form, employee_id: emp.id });
                                    setEmployeeSearchTerm('');
                                    setShowEmployeeDropdown(false);
                                    if (emp.attendance) {
                                      fillAttendanceData(emp);
                                    }
                                  }}
                                  className="form-control"
                                >
                                  {emp.name} <span className="text-xs text-emerald-600">✓ Present</span>
                                </button>
                              ))}
                            </>
                          )}
                          <div className="btn btn-secondary">
                            All Employees
                          </div>
                          {employees.filter(emp => emp.name.toLowerCase().includes(employeeSearchTerm.toLowerCase())).map(emp => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setForm({ ...form, employee_id: emp.id });
                                setEmployeeSearchTerm('');
                                setShowEmployeeDropdown(false);
                                const presentEmp = presentEmployees.find(p => p.id === emp.id);
                                if (presentEmp && presentEmp.attendance) {
                                  fillAttendanceData(presentEmp);
                                }
                              }}
                              className="form-control"
                            >
                              {emp.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        disabled={viewingId}
                        className="form-control"
                      />
                      {presentEmployees.length > 0 && (
                        <p className="text-xs text-emerald-600 mt-1">✓ {presentEmployees.length} employee(s) present on this date</p>
                      )}
                    </div>
                  </div>

                  {isEmployeeAbsent && form.employee_id && (
                    <div className="btn btn-danger">
                      <p className="text-sm font-semibold text-red-700">⚠️ Employee Absent or On Leave</p>
                      <p className="text-xs text-red-600">Cannot create timesheet for absent/leave employees on this date</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Project *</label>
                    <select
                      value={form.project_id}
                      onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                      disabled={viewingId || isEmployeeAbsent}
                      className="form-control"
                    >
                      <option value="">{isEmployeeAbsent ? 'N/A - Employee Absent' : 'Select Project'}</option>
                      {!isEmployeeAbsent && projects.length > 0 ? (
                        projects.map(p => (
                          <option key={p.project_id} value={p.project_id}>
                            {p.project_name || 'Unnamed Project'}
                          </option>
                        ))
                      ) : null}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Shift {isEmployeeAbsent ? '(Auto-filled if Present)' : ''}</label>
                    <select
                      value={form.shift_id}
                      onChange={handleShiftChange}
                      disabled={viewingId || isEmployeeAbsent}
                      className="form-control"
                    >
                      <option value="">{isEmployeeAbsent ? 'N/A - Employee Absent' : form.shift_name || 'Select Shift'}</option>
                      {!isEmployeeAbsent && shifts.length > 0 ? (
                        shifts.map(shift => (
                          <option key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_time} - {shift.end_time})
                          </option>
                        ))
                      ) : null}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Remarks</label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      disabled={viewingId}
                      rows={3}
                      className="form-control"
                      placeholder="What did you work on today?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Hours Worked *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.hours_worked}
                      onChange={(e) => handleHoursChange(e.target.value)}
                      disabled={viewingId}
                      className="form-control"
                      placeholder="8"
                      min="0"
                      max="24"
                    />
                  </div>

                  {form.hours_worked && (
                    <div className="space-y-4 bg-slate-50 rounded-lg p-4">
                      <div className="form-row">
                        <div>
                          <p className="text-xs text-slate-600 font-semibold mb-1">Shift Working Hours</p>
                          <p className="text-lg font-bold text-slate-800">{form.shift_working_hours > 0 ? form.shift_working_hours.toFixed(1) : '—'}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold mb-1">Break Hours</p>
                          <p className="text-lg font-bold text-blue-600">{form.break_hours > 0 ? form.break_hours.toFixed(1) : '—'}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 font-semibold mb-1">Overtime Hours</p>
                          <p className="text-lg font-bold text-orange-600">{form.overtime_hours > 0 ? form.overtime_hours.toFixed(1) : '0.0'}h</p>
                        </div>
                      </div>
                      {form.shift_id && (
                        <div className="btn btn-secondary">
                          <p className="text-xs text-slate-600 font-semibold mb-1">Summary</p>
                          <p className="text-sm text-slate-700">
                            Worked <span className="font-bold">{parseFloat(form.hours_worked || 0).toFixed(1)}h</span> 
                            {form.shift_working_hours > 0 && (
                              <> ({form.shift_working_hours.toFixed(1)}h shift + {form.overtime_hours > 0 ? form.overtime_hours.toFixed(1) : '0.0'}h overtime)</>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="btn btn-secondary">
                  <button onClick={() => { setShowForm(false); setEditingId(null); setViewingId(null); setEmployeeSearchTerm(''); setShowEmployeeDropdown(false); }} className="btn btn-secondary">
                    {viewingId ? 'Close' : 'Cancel'}
                  </button>
                  {!viewingId && (
                    <button onClick={handleSubmit} className="btn btn-primary">
                      <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
