import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, Calendar, Building, Briefcase, Clock,
  CreditCard, FileText, Award, CheckCircle2, XCircle, ArrowLeft,
  Edit, Users, DollarSign, ClipboardList, GraduationCap, AlertTriangle,
  TrendingUp, Shield, Heart, Globe, Car, Wallet, BadgeCheck, Timer,
  ChevronRight, BarChart3, Target, Star, Download, UserCheck, IndianRupee, Sparkles, X
} from 'lucide-react';
import hrService from '../../../services/hrService';

// Helper to calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Calculate tenure
const calculateTenure = (joiningDate) => {
  if (!joiningDate) return 'N/A';
  const today = new Date();
  const joinDate = new Date(joiningDate);
  const diff = today - joinDate;
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
  const days = Math.floor((diff % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
  return `${years} years ${months} months ${days} days`;
};

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [predictingAttrition, setPredictingAttrition] = useState(false);
  const [attritionData, setAttritionData] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    loadEmployeeData();
  }, [id]);

  const loadEmployeeData = async () => {
    setLoading(true);
    try {
      // Fetch employee details
      const empData = await hrService.getEmployee(id);
      setEmployee(empData);

      // Fetch related data in parallel
      const [attendanceData, leavesData, tasksData, payrollData, leaveBalData, trainingData] = await Promise.all([
        hrService.fetchEmployeeAttendance(id).catch(() => []),
        hrService.fetchEmployeeLeaves(id).catch(() => []),
        hrService.fetchEmployeeTasks(id).catch(() => []),
        hrService.fetchEmployeePayroll(id).catch(() => []),
        hrService.fetchLeaveBalances(id, new Date().getFullYear()).catch(() => []),
        hrService.fetchEmployeeTrainings(id).catch(() => []),
      ]);

      setAttendance(attendanceData);
      setLeaves(leavesData);
      setTasks(tasksData);
      setPayroll(payrollData);
      setLeaveBalances(leaveBalData);
      setTrainings(trainingData);
    } catch (e) {
      console.error('Failed to load employee data:', e);
    }
    setLoading(false);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const totalWorkDays = attendance.length;
    const presentDays = attendance.filter(a => parseFloat(a.hours) > 0).length;
    const totalLeaves = leaves.length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalOtHours = attendance.reduce((sum, a) => sum + (parseFloat(a.ot_hours) || 0), 0);

    return { totalWorkDays, presentDays, totalLeaves, pendingTasks, completedTasks, totalOtHours };
  }, [attendance, leaves, tasks]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
    { id: 'salary', label: 'Salary', icon: IndianRupee },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Employee Not Found</h2>
        <p className="text-slate-500 mt-2">The employee you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/hr/employees')} className="btn btn-primary">
          Go Back to Employees
        </button>
      </div>
    );
  }

  const age = calculateAge(employee.date_of_birth);
  const tenure = calculateTenure(employee.date_of_joining);

  const handlePredictAttrition = async () => {
    setPredictingAttrition(true);
    try {
      const dataToAnalyze = {
        employee: { ...employee },
        performance: performance,
        leave_balances: leaveBalances,
        recent_payroll: payroll.slice(0, 3)
      };
      const res = await hrService.predictAttrition(dataToAnalyze);
      if (res.analysis) {
        setAttritionData(res.analysis);
        setShowAiModal(true);
      }
    } catch (e) {
      console.error(e);
      alert('AI Attrition Prediction Failed.');
    }
    setPredictingAttrition(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/hr/employees')} className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Profile</h1>
          <p className="text-slate-500 text-sm">View and manage employee information</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 bg-white/20 rounded-2xl flex items-center justify-center border-4 border-white/30 shadow-lg">
              {employee.profile_photo_url ? (
                <img src={employee.profile_photo_url} alt={employee.name} className="form-control" />
              ) : (
                <span className="text-5xl font-bold text-white/90">{employee.name?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${employee.employment_status === 'Active' ? 'bg-emerald-500' :
              employee.employment_status === 'Probation' ? 'bg-amber-500' : 'bg-slate-400'
              }`}>
              {employee.employment_status === 'Active' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl font-bold">{employee.name}</h2>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">{employee.employee_id}</span>
            </div>
            <p className="text-lg text-white/90">{employee.designation || 'No Designation'}</p>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {employee.department || 'No Department'}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {employee.work_location || 'Not Set'}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Reports to: {employee.reporting_manager || 'N/A'}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="form-row">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{age || '—'}</p>
              <p className="text-xs text-white/70">Age</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{employee.gender?.charAt(0) || '—'}</p>
              <p className="text-xs text-white/70">Gender</p>
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate(`/hr/employees?edit=${employee.id}`)}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-lg">
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={handlePredictAttrition} disabled={predictingAttrition}
              className="btn btn-primary">
              <Sparkles className={`w-4 h-4 ${predictingAttrition ? 'animate-spin' : ''}`} /> 
              {predictingAttrition ? 'Analyzing...' : 'AI Attrition Risk'}
            </button>
          </div>
        </div>

        {/* Tenure & Joining Info */}
        <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-white/60">Joined</p>
            <p className="font-medium">{employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-white/60">Tenure</p>
            <p className="font-medium">{tenure}</p>
          </div>
          <div>
            <p className="text-white/60">Employment Type</p>
            <p className="font-medium">{employee.employment_type || 'Full-time'}</p>
          </div>
          <div>
            <p className="text-white/60">Status</p>
            <p className={`font-medium ${employee.employment_status === 'Active' ? 'text-emerald-300' : 'text-amber-300'}`}>
              {employee.employment_status || 'Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.presentDays}</p>
              <p className="text-xs text-slate-500">Days Present</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalLeaves}</p>
              <p className="text-xs text-slate-500">Leaves Taken</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingTasks}</p>
              <p className="text-xs text-slate-500">Pending Tasks</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.completedTasks}</p>
              <p className="text-xs text-slate-500">Tasks Done</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Timer className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalOtHours.toFixed(1)}</p>
              <p className="text-xs text-slate-500">OT Hours</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-danger">
              <GraduationCap className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{trainings.length}</p>
              <p className="text-xs text-slate-500">Trainings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="form-row">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" /> Personal Information
                </h3>
                <div className="form-row">
                  <div><p className="text-slate-500">Full Name</p><p className="font-medium text-slate-900">{employee.name}</p></div>
                  <div><p className="text-slate-500">Email</p><p className="font-medium text-slate-900">{employee.email}</p></div>
                  <div><p className="text-slate-500">Phone</p><p className="font-medium text-slate-900">{employee.phone || '—'}</p></div>
                  <div><p className="text-slate-500">Personal Email</p><p className="font-medium text-slate-900">{employee.personal_email || '—'}</p></div>
                  <div><p className="text-slate-500">Date of Birth</p><p className="font-medium text-slate-900">{employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : '—'}</p></div>
                  <div><p className="text-slate-500">Gender</p><p className="font-medium text-slate-900">{employee.gender || '—'}</p></div>
                  <div><p className="text-slate-500">Blood Group</p><p className="font-medium text-slate-900">{employee.blood_group || '—'}</p></div>
                  <div><p className="text-slate-500">Marital Status</p><p className="font-medium text-slate-900">{employee.marital_status || '—'}</p></div>
                  <div><p className="text-slate-500">Nationality</p><p className="font-medium text-slate-900">{employee.nationality || 'Indian'}</p></div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600" /> Emergency Contact
                </h3>
                <div className="btn btn-danger">
                  <div><p className="text-slate-500 text-sm">Contact Name</p><p className="font-medium text-slate-900">{employee.emergency_contact_name || 'Not Provided'}</p></div>
                  <div><p className="text-slate-500 text-sm">Contact Phone</p><p className="font-medium text-slate-900">{employee.emergency_contact_phone || 'Not Provided'}</p></div>
                  <div><p className="text-slate-500 text-sm">Relationship</p><p className="font-medium text-slate-900">{employee.emergency_contact_relation || 'Not Provided'}</p></div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" /> Address Information
                </h3>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Current Address</p>
                    <p className="text-sm font-medium text-slate-900">
                      {employee.current_address || 'Not Provided'}
                      {employee.current_city && `, ${employee.current_city}`}
                      {employee.current_state && `, ${employee.current_state}`}
                      {employee.current_pincode && ` - ${employee.current_pincode}`}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Permanent Address</p>
                    <p className="text-sm font-medium text-slate-900">
                      {employee.permanent_address || 'Not Provided'}
                      {employee.permanent_city && `, ${employee.permanent_city}`}
                      {employee.permanent_state && `, ${employee.permanent_state}`}
                      {employee.permanent_pincode && ` - ${employee.permanent_pincode}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank & Financial Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Bank & Financial Details
                </h3>
                <div className="form-row">
                  <div><p className="text-slate-500">Bank Name</p><p className="font-medium text-slate-900">{employee.bank_name || '—'}</p></div>
                  <div><p className="text-slate-500">Account Number</p><p className="font-medium text-slate-900">{employee.account_number ? `****${employee.account_number.slice(-4)}` : '—'}</p></div>
                  <div><p className="text-slate-500">IFSC Code</p><p className="font-medium text-slate-900">{employee.ifsc_code || '—'}</p></div>
                  <div><p className="text-slate-500">PAN Number</p><p className="font-medium text-slate-900">{employee.pan_number || '—'}</p></div>
                  <div><p className="text-slate-500">UAN Number</p><p className="font-medium text-slate-900">{employee.uan_number || '—'}</p></div>
                </div>
              </div>

              {/* Identity Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" /> Identity Documents
                </h3>
                <div className="form-row">
                  <div><p className="text-slate-500">Aadhar Number</p><p className="font-medium text-slate-900">{employee.aadhar_number ? `****${employee.aadhar_number.slice(-4)}` : '—'}</p></div>
                  <div><p className="text-slate-500">Passport Number</p><p className="font-medium text-slate-900">{employee.passport_number || '—'}</p></div>
                  <div><p className="text-slate-500">Passport Expiry</p><p className="font-medium text-slate-900">{employee.passport_expiry ? new Date(employee.passport_expiry).toLocaleDateString() : '—'}</p></div>
                  <div><p className="text-slate-500">Driving License</p><p className="font-medium text-slate-900">{employee.driving_license || '—'}</p></div>
                </div>
              </div>

              {/* Leave Balances */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" /> Leave Balances ({new Date().getFullYear()})
                </h3>
                {leaveBalances.length > 0 ? (
                  <div className="form-row">
                    {leaveBalances.map((lb, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">{lb.leave_type || 'Leave'}</p>
                        <p className="text-lg font-bold text-slate-900">{lb.current_balance || 0} <span className="text-xs font-normal text-slate-500">days</span></p>
                        <p className="text-xs text-slate-400">Used: {lb.used || 0} | Accrued: {lb.accrued || 0}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No leave balances found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="p-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-slate-900">Attendance Records</h3>
              <span className="text-sm text-slate-500">{attendance.length} records</span>
            </div>
            {attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Shift</th>
                      <th className="px-4 py-3 text-left font-medium">Check In</th>
                      <th className="px-4 py-3 text-left font-medium">Check Out</th>
                      <th className="px-4 py-3 text-left font-medium">Hours</th>
                      <th className="px-4 py-3 text-left font-medium">OT Hours</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((a, idx) => (
                      <tr key={idx} className="btn btn-secondary">
                        <td className="px-4 py-3 font-medium">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">{a.shift || 'General'}</td>
                        <td className="px-4 py-3 text-emerald-600">{a.check_in || '—'}</td>
                        <td className="px-4 py-3 text-rose-600">{a.check_out || '—'}</td>
                        <td className="px-4 py-3 font-medium">{a.hours || 0}h</td>
                        <td className="px-4 py-3 text-purple-600">{a.ot_hours || 0}h</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${parseFloat(a.hours) >= 8 ? 'bg-emerald-100 text-emerald-700' :
                            parseFloat(a.hours) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {parseFloat(a.hours) >= 8 ? 'Full Day' : parseFloat(a.hours) > 0 ? 'Partial' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No attendance records found</p>
              </div>
            )}
          </div>
        )}

        {/* Leaves Tab */}
        {activeTab === 'leaves' && (
          <div className="p-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-slate-900">Leave History</h3>
              <span className="text-sm text-slate-500">{leaves.length} requests</span>
            </div>
            {leaves.length > 0 ? (
              <div className="space-y-3">
                {leaves.map((leave, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${leave.status === 'Approved' ? 'bg-emerald-100' :
                        leave.status === 'Pending' ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                        <Calendar className={`w-5 h-5 ${leave.status === 'Approved' ? 'text-emerald-600' :
                          leave.status === 'Pending' ? 'text-amber-600' : 'text-red-600'
                          }`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{leave.leave_type || 'Leave'}</p>
                        <p className="text-sm text-slate-500">{leave.days} day(s) • {leave.created_at ? new Date(leave.created_at).toLocaleDateString() : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        leave.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{leave.status}</span>
                      {leave.approver && <p className="text-xs text-slate-400 mt-1">By: {leave.approver}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No leave requests found</p>
              </div>
            )}
          </div>
        )}


        {/* Salary Tab */}
        {activeTab === 'salary' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" /> Salary Details
            </h3>
            <div className="form-row">
              <div className="btn btn-primary">
                <p className="text-xs text-indigo-500 mb-1">Basic Salary</p>
                <p className="text-2xl font-bold text-indigo-700">₹{(employee.basic_salary || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="btn btn-success">
                <p className="text-xs text-emerald-500 mb-1">Allowances</p>
                <p className="text-2xl font-bold text-emerald-700">+₹{(employee.allowances || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="btn btn-danger">
                <p className="text-xs text-rose-500 mb-1">Deductions</p>
                <p className="text-2xl font-bold text-rose-700">-₹{(employee.deductions || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="btn btn-primary">
                <p className="text-xs text-purple-500 mb-1">Net Salary</p>
                <p className="text-2xl font-bold text-purple-700">₹{(employee.net_salary || ((employee.basic_salary || 0) + (employee.allowances || 0) - (employee.deductions || 0))).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500">
              <p>💡 Salary breakdown is based on the offer letter details at the time of conversion or manual updates.</p>
            </div>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
          <div className="p-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-slate-900">Payroll History</h3>
              <span className="text-sm text-slate-500">{payroll.length} records</span>
            </div>
            {payroll.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Period</th>
                      <th className="px-4 py-3 text-right font-medium">Basic</th>
                      <th className="px-4 py-3 text-right font-medium">Allowances</th>
                      <th className="px-4 py-3 text-right font-medium">Deductions</th>
                      <th className="px-4 py-3 text-right font-medium">Net Pay</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payroll.map((p, idx) => (
                      <tr key={idx} className="btn btn-secondary">
                        <td className="px-4 py-3 font-medium">{p.period || 'Monthly'}</td>
                        <td className="px-4 py-3 text-right">₹{(p.basic || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">+₹{(p.allowances || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-rose-600">-₹{(p.deductions || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold">₹{((p.basic || 0) + (p.allowances || 0) - (p.deductions || 0)).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No payroll records found</p>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Employee Documents</h3>
            <div className="form-row">
              {[
                { name: 'Aadhar Card', icon: Shield, status: employee.aadhar_number ? 'Uploaded' : 'Pending' },
                { name: 'PAN Card', icon: CreditCard, status: employee.pan_number ? 'Uploaded' : 'Pending' },
                { name: 'Passport', icon: Globe, status: employee.passport_number ? 'Uploaded' : 'Pending' },
                { name: 'Driving License', icon: Car, status: employee.driving_license ? 'Uploaded' : 'Pending' },
                { name: 'Bank Passbook', icon: Wallet, status: employee.account_number ? 'Uploaded' : 'Pending' },
                { name: 'Offer Letter', icon: FileText, status: 'Uploaded' },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.status === 'Uploaded' ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                      <doc.icon className={`w-5 h-5 ${doc.status === 'Uploaded' ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{doc.name}</p>
                      <p className={`text-xs ${doc.status === 'Uploaded' ? 'text-emerald-600' : 'text-amber-600'}`}>{doc.status}</p>
                    </div>
                  </div>
                  {doc.status === 'Uploaded' && (
                    <button className="btn btn-secondary">
                      <Download className="w-4 h-4 text-slate-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Attrition Risk Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="card">
            <div className="btn btn-secondary">
              <div className="flex items-center gap-3">
                <div className="btn btn-primary">
                  <Sparkles size={16} />
                </div>
                <h2 className="card-title">AI Attrition Prediction</h2>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {attritionData ? (
                <div className="space-y-6">
                  {/* Score Card */}
                  <div className={`p-6 rounded-xl border flex items-center justify-between ${
                    attritionData.risk_level === 'High' ? 'bg-red-50 border-red-200' :
                    attritionData.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200' :
                    'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div>
                      <p className="text-sm font-semibold capitalize opacity-80 mb-1">Risk Level</p>
                      <h3 className={`text-3xl font-bold ${
                        attritionData.risk_level === 'High' ? 'text-red-700' :
                        attritionData.risk_level === 'Medium' ? 'text-amber-700' :
                        'text-emerald-700'
                      }`}>{attritionData.risk_level} Attrition Risk</h3>
                    </div>
                    <div className="text-center bg-white px-4 py-3 rounded-lg shadow-sm">
                      <p className="text-4xl font-black text-slate-800">{attritionData.risk_score}<span className="text-lg text-slate-400">%</span></p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Score</p>
                    </div>
                  </div>

                  {/* Factors */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Key Contributing Factors</h4>
                    <ul className="space-y-2">
                      {(attritionData.factors || []).map((factor, idx) => (
                        <li key={idx} className="btn btn-secondary">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {(attritionData.recommended_actions || []).map((action, idx) => (
                        <li key={idx} className="btn btn-primary">
                          <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Analysis unavailable.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
