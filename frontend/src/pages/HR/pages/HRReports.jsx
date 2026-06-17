import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Clock, FileText, Download, Filter, RefreshCcw, ChevronDown } from 'lucide-react';
import hrService from '../../../services/hrService';

export default function HRReports() {
  const [selectedReport, setSelectedReport] = useState('headcount');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [department, setDepartment] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const reportCategories = [
    {
      title: 'Workforce Analytics',
      reports: [
        { id: 'headcount', name: 'Headcount Report', icon: Users, description: 'Employee count by department, location, and tenure' },
        { id: 'turnover', name: 'Turnover Analysis', icon: TrendingUp, description: 'Attrition rates and reasons' },
        { id: 'demographics', name: 'Demographics Report', icon: BarChart3, description: 'Age, gender, and diversity breakdown' },
      ]
    },
    {
      title: 'Time & Attendance',
      reports: [
        { id: 'attendance', name: 'Attendance Summary', icon: Clock, description: 'Attendance patterns and trends' },
        { id: 'leave', name: 'Leave Analysis', icon: Calendar, description: 'Leave utilization and balance report' },
        { id: 'overtime', name: 'Overtime Report', icon: Clock, description: 'Overtime hours and costs' },
      ]
    },
    {
      title: 'Compensation',
      reports: [
        { id: 'payroll', name: 'Payroll Summary', icon: DollarSign, description: 'Monthly payroll breakdown' },
        { id: 'salary', name: 'Salary Analysis', icon: TrendingUp, description: 'Salary distribution and bands' },
        { id: 'benefits', name: 'Benefits Utilization', icon: FileText, description: 'Employee benefits usage' },
      ]
    },
    {
      title: 'Recruitment',
      reports: [
        { id: 'hiring', name: 'Hiring Report', icon: Users, description: 'New hires and open positions' },
        { id: 'pipeline', name: 'Recruitment Pipeline', icon: BarChart3, description: 'Candidate pipeline status' },
        { id: 'costperhire', name: 'Cost Per Hire', icon: DollarSign, description: 'Recruitment cost analysis' },
      ]
    },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showReportDropdown && !event.target.closest('.report-dropdown')) {
        setShowReportDropdown(false);
      }
      if (showFilters && !event.target.closest('.filters-dropdown')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReportDropdown, showFilters]);

  const fetchAndAggregateExpenses = async (params = {}) => {
    const [allClaims, employees] = await Promise.all([
      hrService.fetchExpenseClaims().catch(() => []),
      hrService.fetchEmployees().catch(() => [])
    ]);

    const byCategory = {};
    const byStatus = {};
    let totalAmount = 0;

    allClaims.forEach(claim => {
      if (params.department) {
        const emp = employees.find(e => String(e.id) === String(claim.employee_id));
        const empDept = emp?.department?.toLowerCase() || '';
        if (empDept !== params.department.toLowerCase()) {
          return;
        }
      }

      if (params.start_date && claim.expense_date < params.start_date) {
        return;
      }
      if (params.end_date && claim.expense_date > params.end_date) {
        return;
      }

      const cat = claim.category || 'Other';
      const amt = parseFloat(claim.amount) || 0;
      const status = claim.status || 'Pending';
      
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, amount: 0 };
      }
      byCategory[cat].count += 1;
      byCategory[cat].amount += amt;
      
      if (!byStatus[status]) {
        byStatus[status] = { count: 0, amount: 0 };
      }
      byStatus[status].count += 1;
      byStatus[status].amount += amt;
      
      totalAmount += amt;
    });

    return {
      by_category: byCategory,
      by_status: byStatus,
      total: totalAmount
    };
  };

  const formatKAmount = (amount) => {
    if (!amount || amount === 0) return '0';
    if (amount < 1000) return `${amount.toLocaleString('en-IN')}`;
    const value = amount / 1000;
    return value % 1 === 0 ? `${value.toFixed(0)}K` : `${value.toFixed(1)}K`;
  };

  // Real-time data fetching
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        let data = null;
        const params = {};
        
        if (dateRange.start) params.start_date = dateRange.start;
        if (dateRange.end) params.end_date = dateRange.end;
        if (department) params.department = department;

        switch (selectedReport) {
          case 'headcount':
            data = await hrService.getReport('headcount', params);
            break;
          case 'turnover':
            data = await hrService.getReport('turnover', params);
            break;
          case 'demographics':
            data = await hrService.getReport('demographics', params);
            break;
          case 'leave':
            data = await hrService.getReport('leave-summary', params);
            break;
          case 'attendance':
            // Fetch attendance records and calculate metrics
            const attendanceRecords = await hrService.fetchAttendance().catch(() => []);
            data = { records: attendanceRecords };
            break;
          case 'overtime':
            data = await hrService.getReport('overtime', params);
            break;
          case 'payroll':
            // Fetch payroll records
            const payrollRecords = await hrService.fetchPayroll().catch(() => []);
            data = { records: payrollRecords };
            break;
          case 'salary':
            data = await hrService.getReport('salary-analysis', params);
            break;
          case 'benefits':
            data = await fetchAndAggregateExpenses(params);
            break;
          case 'hiring':
            data = await hrService.getReport('hiring', params);
            break;
          case 'pipeline':
            data = await hrService.getReport('recruitment-pipeline', params);
            break;
          case 'costperhire':
            data = await hrService.getReport('cost-per-hire', params);
            break;
          default:
            data = null;
        }

        setReportData(data);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchReportData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedReport, dateRange, department]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.start) params.start_date = dateRange.start;
      if (dateRange.end) params.end_date = dateRange.end;
      if (department) params.department = department;

      let data = null;
      switch (selectedReport) {
        case 'headcount':
          data = await hrService.getReport('headcount', params);
          break;
        case 'turnover':
          data = await hrService.getReport('turnover', params);
          break;
        case 'demographics':
          data = await hrService.getReport('demographics', params);
          break;
        case 'leave':
          data = await hrService.getReport('leave-summary', params);
          break;
        case 'attendance':
          const attendanceRecords = await hrService.fetchAttendance().catch(() => []);
          data = { records: attendanceRecords };
          break;
        case 'overtime':
          data = await hrService.getReport('overtime', params);
          break;
        case 'payroll':
          const payrollRecords = await hrService.fetchPayroll().catch(() => []);
          data = { records: payrollRecords };
          break;
        case 'salary':
          data = await hrService.getReport('salary-analysis', params);
          break;
        case 'benefits':
          data = await fetchAndAggregateExpenses(params);
          break;
        case 'hiring':
          data = await hrService.getReport('hiring', params);
          break;
        case 'pipeline':
          data = await hrService.getReport('recruitment-pipeline', params);
          break;
        case 'costperhire':
          data = await hrService.getReport('cost-per-hire', params);
          break;
        default:
          data = null;
      }

      setReportData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentReport = () => {
    return reportCategories.flatMap(c => c.reports).find(r => r.id === selectedReport);
  };

  // Transform API data to match chart format
  const getHeadcountData = () => {
    if (!reportData || !reportData.by_department) {
      return { byDepartment: [], total: 0, growth: 0, avgTenure: 0 };
    }

    const deptData = Object.entries(reportData.by_department).map(([name, count]) => ({
      name,
      count,
      growth: 0 // Growth calculation can be added later with historical data
    }));

    return {
      byDepartment: deptData,
      total: reportData.total_headcount || 0,
      growth: 0,
      avgTenure: 2.8 // This would come from a separate calculation
    };
  };

  const getLeaveData = () => {
    if (!reportData || !reportData.by_type) {
      return { byStatus: {}, byType: {} };
    }

    return {
      byStatus: reportData.by_status || {},
      byType: reportData.by_type || {}
    };
  };

  const getAttendanceData = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      return { totalRecords: 0, present: 0, absent: 0, late: 0, rate: 0 };
    }

    const records = reportData.records;
    const totalRecords = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const rate = totalRecords > 0 ? ((present / totalRecords) * 100).toFixed(1) : 0;

    return { totalRecords, present, absent, late, rate };
  };

  const getPayrollData = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      return { totalRecords: 0, totalAmount: 0, avgSalary: 0 };
    }

    const records = reportData.records;
    const totalRecords = records.length;
    const totalAmount = records.reduce((sum, r) => sum + (r.net_salary || 0), 0);
    const avgSalary = totalRecords > 0 ? totalAmount / totalRecords : 0;

    return { totalRecords, totalAmount, avgSalary, records };
  };

  const getExpenseData = () => {
    if (!reportData || !reportData.by_category) {
      return { byStatus: {}, byCategory: {}, total: 0, pendingAmount: 0, approvedAmount: 0 };
    }

    const total = Object.values(reportData.by_category).reduce((sum, cat) => sum + (cat.amount || 0), 0);

    const statusNormalized = {};
    Object.entries(reportData.by_status || {}).forEach(([k, v]) => {
      statusNormalized[k.toLowerCase()] = v;
    });

    const pendingAmount = statusNormalized['pending']?.amount || 0;
    const approvedAmount = (statusNormalized['manager approved']?.amount || 0) + 
                          (statusNormalized['finance approved']?.amount || 0) + 
                          (statusNormalized['paid']?.amount || 0);

    return {
      byStatus: reportData.by_status || {},
      byCategory: reportData.by_category || {},
      total: reportData.total !== undefined ? reportData.total : total,
      pendingAmount,
      approvedAmount
    };
  };

  const headcountData = getHeadcountData();
  const leaveData = getLeaveData();
  const attendanceData = getAttendanceData();
  const payrollData = getPayrollData();
  const expenseData = getExpenseData();

  // Sample data for turnover report (backend endpoint not yet available)
  const turnoverData = {
    rate: 12.5,
    voluntary: 8.2,
    involuntary: 4.3,
    byReason: [
      { reason: 'Better Opportunity', percent: 35 },
      { reason: 'Compensation', percent: 25 },
      { reason: 'Work-Life Balance', percent: 18 },
      { reason: 'Management', percent: 12 },
      { reason: 'Other', percent: 10 },
    ]
  };

  const renderHeadcountReport = () => {
    if (loading) {
      return (
        <div className="card">
          <RefreshCcw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading report data...</p>
        </div>
      );
    }

    if (!headcountData.total) {
      return (
        <div className="card">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No Data Available</h3>
          <p className="text-sm text-slate-500">No employee data found for the selected filters</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
      {/* Summary Cards */}
      <div className="form-row">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Total Headcount</p>
          <p className="text-3xl font-bold">{headcountData.total}</p>
          <p className="text-sm mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +{headcountData.growth}% vs last year
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Avg. Tenure</p>
          <p className="text-3xl font-bold text-slate-800">{headcountData.avgTenure} yrs</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">New Hires (YTD)</p>
          <p className="text-3xl font-bold text-green-600">42</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Open Positions</p>
          <p className="text-3xl font-bold text-amber-600">18</p>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Headcount by Department</h3>
        <div className="space-y-4">
          {headcountData.byDepartment.map(dept => (
            <div key={dept.name} className="flex items-center gap-4">
              <div className="w-28 text-sm font-medium text-slate-600">{dept.name}</div>
              <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg transition-all duration-500"
                  style={{ width: `${(dept.count / headcountData.total) * 100 * 2.5}%` }}
                />
                <span className="absolute inset-0 flex items-center px-3 text-sm font-medium">
                  {dept.count}
                </span>
              </div>
              <div className={`w-16 text-sm font-medium ${dept.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dept.growth >= 0 ? '+' : ''}{dept.growth}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    );
  };

  const renderTurnoverReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="form-row">
        <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Overall Turnover Rate</p>
          <p className="text-3xl font-bold">{turnoverData.rate}%</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Voluntary</p>
          <p className="text-3xl font-bold text-amber-600">{turnoverData.voluntary}%</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Involuntary</p>
          <p className="text-3xl font-bold text-red-600">{turnoverData.involuntary}%</p>
        </div>
      </div>

      {/* Reasons */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Turnover by Reason</h3>
        <div className="space-y-4">
          {turnoverData.byReason.map(item => (
            <div key={item.reason} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-slate-600">{item.reason}</div>
              <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <div className="w-12 text-sm font-semibold text-slate-800">{item.percent}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAttendanceReport = () => {
    if (loading) {
      return (
        <div className="card">
          <RefreshCcw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading report data...</p>
        </div>
      );
    }

    if (!attendanceData.totalRecords) {
      return (
        <div className="card">
          <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No Attendance Data</h3>
          <p className="text-sm text-slate-500">No attendance records found</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="form-row">
          <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Attendance Rate</p>
            <p className="text-3xl font-bold">{attendanceData.rate}%</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Present</p>
            <p className="text-3xl font-bold text-green-600">{attendanceData.present}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Late</p>
            <p className="text-3xl font-bold text-amber-600">{attendanceData.late}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Absent</p>
            <p className="text-3xl font-bold text-red-600">{attendanceData.absent}</p>
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Attendance Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-slate-600">Total Records</div>
              <div className="flex-1 text-lg font-semibold text-slate-800">{attendanceData.totalRecords}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-slate-600">Present Rate</div>
              <div className="flex-1">
                <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full"
                    style={{ width: `${attendanceData.rate}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-sm font-semibold text-green-600">{attendanceData.rate}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLeaveReport = () => {
    if (loading) {
      return (
        <div className="card">
          <RefreshCcw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading report data...</p>
        </div>
      );
    }

    if (!leaveData.byStatus || Object.keys(leaveData.byStatus).length === 0) {
      return (
        <div className="card">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No Leave Data</h3>
          <p className="text-sm text-slate-500">No leave records found for the selected filters</p>
        </div>
      );
    }

    const totalLeaves = Object.values(leaveData.byStatus).reduce((sum, count) => sum + count, 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="form-row">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Total Leave Requests</p>
            <p className="text-3xl font-bold">{totalLeaves}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="text-3xl font-bold text-green-600">{leaveData.byStatus.approved || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-3xl font-bold text-amber-600">{leaveData.byStatus.pending || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{leaveData.byStatus.rejected || 0}</p>
          </div>
        </div>

        {/* Leave by Type */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Leave Breakdown by Type</h3>
          <div className="space-y-4">
            {Object.entries(leaveData.byType).map(([type, data]) => (
              <div key={type} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-slate-600 capitalize">{type}</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg transition-all duration-500"
                    style={{ width: `${Math.min((data.count / totalLeaves) * 100 * 2, 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-sm font-medium">
                    {data.count} requests ({data.total_days} days)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPayrollReport = () => {
    if (loading) {
      return (
        <div className="card">
          <RefreshCcw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading report data...</p>
        </div>
      );
    }

    if (!payrollData.totalRecords) {
      return (
        <div className="card">
          <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No Payroll Data</h3>
          <p className="text-sm text-slate-500">No payroll records found</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="form-row">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Total Payroll</p>
            <p className="text-3xl font-bold">₹{(payrollData.totalAmount / 1000).toFixed(0)}K</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Avg. Salary</p>
            <p className="text-3xl font-bold text-green-600">₹{(payrollData.avgSalary / 1000).toFixed(1)}K</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Total Employees</p>
            <p className="text-3xl font-bold text-blue-600">{payrollData.totalRecords}</p>
          </div>
        </div>

        {/* Payroll Details */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Payroll Summary</h3>
          <div className="text-sm text-slate-600">
            <p>Total payroll amount: ₹{payrollData.totalAmount.toLocaleString()}</p>
            <p className="mt-2">Average salary per employee: ₹{payrollData.avgSalary.toLocaleString()}</p>
            <p className="mt-2">Number of employees: {payrollData.totalRecords}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderBenefitsReport = () => {
    if (loading) {
      return (
        <div className="card">
          <RefreshCcw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading report data...</p>
        </div>
      );
    }

    if (!expenseData.total) {
      return (
        <div className="card">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No Expense Data</h3>
          <p className="text-sm text-slate-500">No expense records found</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="form-row">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Total Expenses</p>
            <p className="text-3xl font-bold">₹{formatKAmount(expenseData.total)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{formatKAmount(expenseData.approvedAmount)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-3xl font-bold text-amber-600">
              ₹{formatKAmount(expenseData.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Expense by Category */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Expenses by Category</h3>
          <div className="space-y-4">
            {Object.entries(expenseData.byCategory).map(([category, data]) => (
              <div key={category} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-slate-600 capitalize">{category}</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg transition-all duration-500"
                    style={{ width: `${Math.min((data.amount / expenseData.total) * 100 * 1.5, 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-sm font-medium">
                    {data.count} claims (₹{formatKAmount(data.amount)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDemographicsReport = () => {
    if (loading) {
      return (
        <div className="card">
          <RefreshCcw className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading report data...</p>
        </div>
      );
    }

    // Sample demographics data structure
    const demoData = reportData || {
      by_age: {
        '18-25': 15,
        '26-35': 45,
        '36-45': 28,
        '46-55': 10,
        '56+': 2
      },
      by_gender: {
        male: 58,
        female: 40,
        other: 2
      },
      total: 100
    };

    const totalEmployees = demoData.total || Object.values(demoData.by_age || {}).reduce((a, b) => a + b, 0);

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="form-row">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Total Employees</p>
            <p className="text-3xl font-bold">{totalEmployees}</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Average Age</p>
            <p className="text-3xl font-bold text-violet-600">32 yrs</p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-500">Diversity Index</p>
            <p className="text-3xl font-bold text-purple-600">78%</p>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Age Distribution</h3>
          <div className="space-y-4">
            {Object.entries(demoData.by_age || {}).map(([age, count]) => (
              <div key={age} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-slate-600">{age}</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(count / totalEmployees) * 100 * 2}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-sm font-medium">
                    {count} ({((count / totalEmployees) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Gender Distribution</h3>
          <div className="space-y-4">
            {Object.entries(demoData.by_gender || {}).map(([gender, count]) => (
              <div key={gender} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-slate-600 capitalize">{gender}</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(count / totalEmployees) * 100 * 2}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-sm font-medium">
                    {count} ({((count / totalEmployees) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    switch (selectedReport) {
      case 'headcount': return renderHeadcountReport();
      case 'turnover': return renderTurnoverReport();
      case 'demographics': return renderDemographicsReport();
      case 'attendance': return renderAttendanceReport();
      case 'leave': return renderLeaveReport();
      case 'payroll': return renderPayrollReport();
      case 'benefits': return renderBenefitsReport();
      default: return (
        <div className="card">
          <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">Report Coming Soon</h3>
          <p className="text-sm text-slate-500">This report is under development</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HR Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Insights and metrics for workforce management
            <span className="ml-2 text-xs text-slate-400">
              (Last updated: {lastRefresh.toLocaleTimeString()})
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {/* Report Selector Dropdown */}
          <select
            value={selectedReport}
            onChange={(e) => {
              setSelectedReport(e.target.value);
            }}
            className="form-control cursor-pointer"
            style={{ 
              minWidth: '240px', 
              backgroundColor: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 500,
              color: '#334155'
            }}
          >
            {reportCategories.map(cat => (
              <optgroup key={cat.title} label={cat.title}>
                {cat.reports.map(rep => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
 
          {/* Filters Dropdown */}
          <div className="relative filters-dropdown">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary"
            >
              <Filter className="w-4 h-4" /> Filters
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-1 w-[300px] bg-white rounded-sm shadow-md border border-slate-300 z-50 p-4 flex flex-col gap-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2" style={{ margin: 0, fontSize: 14 }}>
                  <Filter className="w-4 h-4" /> Filter Options
                </h3>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="block text-xs font-medium text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="block text-xs font-medium text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="block text-xs font-medium text-slate-500">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="form-control"
                  >
                    <option value="">All Departments</option>
                    <option value="engineering">Engineering</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                    <option value="hr">HR</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => {
                      setDateRange({ start: '', end: '' });
                      setDepartment('');
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
 
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-secondary"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
 
          {/* Export Button */}
          <button className="btn btn-primary">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Report Content - Full Width */}
      <div>
        {/* Report Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {getCurrentReport()?.name}
              </h2>
              <p className="text-sm text-slate-500">
                {getCurrentReport()?.description}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary">
                Last 30 days
              </button>
              <button className="btn btn-secondary">
                Last quarter
              </button>
              <button className="btn btn-secondary">
                YTD
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {renderReport()}
      </div>
    </div>
  );
}
