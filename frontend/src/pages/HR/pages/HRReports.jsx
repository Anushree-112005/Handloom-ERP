import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Calendar, Users, DollarSign, Clock, Download, Filter, 
  RefreshCw, Search, Eye, Printer, Mail, Activity, ChevronRight, X
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  fetchEmployees,
  fetchAttendance,
  fetchLeaves,
  fetchPayroll,
  fetchExpenseClaims,
  fetchDepartments,
  fetchDesignations,
  fetchShifts,
  fetchGoals,
  fetchPerformance,
  fetchCertifications,
  fetchRequisitions,
  fetchCandidates
} from '../../../services/hrService';

// =========================================================
// 1. REPORT CATEGORIES & DOMAINS DEFINITIONS
// =========================================================
const REPORT_CATEGORIES = [
  {
    id: 'workforce',
    name: 'Workforce Reports',
    icon: Users,
    color: '#4f46e5',
    count: 3,
    reports: [
      { id: 'headcount', name: 'Headcount Report' },
      { id: 'turnover', name: 'Turnover Analysis' },
      { id: 'demographics', name: 'Demographics Report' }
    ]
  },
  {
    id: 'attendance',
    name: 'Attendance & Leave',
    icon: Calendar,
    color: '#10b981',
    count: 3,
    reports: [
      { id: 'attendance', name: 'Attendance Summary' },
      { id: 'leave', name: 'Leave Analysis' },
      { id: 'overtime', name: 'Overtime Report' }
    ]
  },
  {
    id: 'compensation',
    name: 'Compensation & Benefits',
    icon: DollarSign,
    color: '#8b5cf6',
    count: 3,
    reports: [
      { id: 'payroll', name: 'Payroll Summary' },
      { id: 'salary', name: 'Salary Analysis' },
      { id: 'benefits', name: 'Benefits Utilization' }
    ]
  },
  {
    id: 'growth',
    name: 'Performance & Growth',
    icon: Activity,
    color: '#ec4899',
    count: 3,
    reports: [
      { id: 'performance', name: 'Performance Review' },
      { id: 'goals', name: 'Employee Goals' },
      { id: 'learning', name: 'Training & Development' }
    ]
  }
];

const REPORTS_CONFIG = {
  headcount: {
    title: 'Headcount Report',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'date_of_joining', label: 'Joining Date' },
      { key: 'phone', label: 'Phone' },
      { key: 'employment_status', label: 'Status' }
    ]
  },
  turnover: {
    title: 'Turnover Analysis',
    columns: [
      { key: 'department', label: 'Department' },
      { key: 'total_count', label: 'Active Employees' },
      { key: 'separated_count', label: 'Separated Employees' },
      { key: 'turnover_rate', label: 'Attrition Rate (%)' },
      { key: 'avg_tenure', label: 'Avg. Tenure (Yrs)' }
    ]
  },
  demographics: {
    title: 'Demographics Report',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
      { key: 'gender', label: 'Gender' },
      { key: 'current_city', label: 'City' },
      { key: 'current_state', label: 'State' },
      { key: 'phone', label: 'Phone' }
    ]
  },
  attendance: {
    title: 'Attendance Summary',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date' },
      { key: 'shift', label: 'Shift' },
      { key: 'in_time', label: 'In Time' },
      { key: 'out_time', label: 'Out Time' },
      { key: 'working_hours', label: 'Hours Worked' },
      { key: 'status', label: 'Status' }
    ]
  },
  leave: {
    title: 'Leave Analysis',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'leave_type', label: 'Leave Type' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'end_date', label: 'End Date' },
      { key: 'total_days', label: 'Total Days' },
      { key: 'status', label: 'Status' }
    ]
  },
  overtime: {
    title: 'Overtime Report',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'date', label: 'Date' },
      { key: 'regular_hours', label: 'Regular Hours' },
      { key: 'overtime_hours', label: 'OT Hours' },
      { key: 'overtime_pay', label: 'OT Pay (₹)' },
      { key: 'status', label: 'Status' }
    ]
  },
  payroll: {
    title: 'Payroll Summary',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'month', label: 'Month' },
      { key: 'basic_salary', label: 'Basic (₹)' },
      { key: 'allowances', label: 'Allowances (₹)' },
      { key: 'deductions', label: 'Deductions (₹)' },
      { key: 'net_salary', label: 'Net Salary (₹)' },
      { key: 'status', label: 'Status' }
    ]
  },
  salary: {
    title: 'Salary Analysis',
    columns: [
      { key: 'designation', label: 'Designation' },
      { key: 'min_salary', label: 'Min Salary (₹)' },
      { key: 'max_salary', label: 'Max Salary (₹)' },
      { key: 'avg_salary', label: 'Avg Salary (₹)' },
      { key: 'employee_count', label: 'Employees' }
    ]
  },
  benefits: {
    title: 'Benefits Utilization',
    columns: [
      { key: 'claim_id', label: 'Claim ID' },
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'expense_date', label: 'Date' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'status', label: 'Status' }
    ]
  },
  performance: {
    title: 'Performance Review',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'review_period', label: 'Review Period' },
      { key: 'manager_rating', label: 'Manager Rating' },
      { key: 'self_rating', label: 'Self Rating' },
      { key: 'overall_rating', label: 'Overall Rating' },
      { key: 'status', label: 'Status' }
    ]
  },
  goals: {
    title: 'Employee Goals',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'goal_description', label: 'Goal Description' },
      { key: 'target_date', label: 'Target Date' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'status', label: 'Status' }
    ]
  },
  learning: {
    title: 'Training & Development',
    columns: [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'name', label: 'Name' },
      { key: 'course_name', label: 'Course Name' },
      { key: 'status', label: 'Status' },
      { key: 'completion_date', label: 'Completion Date' },
      { key: 'certificate_no', label: 'Certificate No' }
    ]
  }
};

export default function HRReports() {
  // Database States
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [expenseClaims, setExpenseClaims] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // UI Navigation States
  const [activeCategory, setActiveCategory] = useState('workforce');
  const [activeReportId, setActiveReportId] = useState('headcount');
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [refreshing, setRefreshing] = useState(false);

  // Global Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedState, setSelectedState] = useState('All');

  // Interactive Modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRowViewModal, setShowRowViewModal] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(null);

  // Bulk Export State
  const [exportFormat, setExportFormat] = useState('Excel');
  const [exportSelectedModules, setExportSelectedModules] = useState(['workforce']);

  // Fetch Database records on load and refresh
  const loadDatabaseData = async () => {
    setRefreshing(true);
    try {
      const [
        empList, attList, leaveList, payrollList, claimList, deptList, 
        desigList, shiftList, goalList, perfList, certList, reqList, candList
      ] = await Promise.all([
        fetchEmployees().catch(() => []),
        fetchAttendance().catch(() => []),
        fetchLeaves().catch(() => []),
        fetchPayroll().catch(() => []),
        fetchExpenseClaims().catch(() => []),
        fetchDepartments().catch(() => []),
        fetchDesignations().catch(() => []),
        fetchShifts().catch(() => []),
        fetchGoals().catch(() => []),
        fetchPerformance().catch(() => []),
        fetchCertifications().catch(() => []),
        fetchRequisitions().catch(() => []),
        fetchCandidates().catch(() => [])
      ]);

      setEmployees(empList);
      setAttendance(attList);
      setLeaves(leaveList);
      setPayroll(payrollList);
      setExpenseClaims(claimList);
      setDepartments(deptList);
      setDesignations(desigList);
      setShifts(shiftList);
      setGoals(goalList);
      setPerformance(perfList);
      setCertifications(certList);
      setRequisitions(reqList);
      setCandidates(candList);
    } catch (e) {
      console.error('Error fetching HR report data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const handleRefreshData = () => {
    loadDatabaseData();
  };

  // Get current active report configuration
  const reportObj = useMemo(() => {
    return REPORTS_CONFIG[activeReportId] || REPORTS_CONFIG['headcount'];
  }, [activeReportId]);

  // Dynamic filter values extraction from actual employees data
  const citiesList = useMemo(() => {
    const cities = employees.map(e => e.current_city || e.address || e.current_address).filter(Boolean);
    return ['All', ...new Set(cities)];
  }, [employees]);

  const statesList = useMemo(() => {
    const states = employees.map(e => e.current_state || 'Tamil Nadu').filter(Boolean);
    return ['All', ...new Set(states)];
  }, [employees]);

  // Populate dynamic rows base data (REAL TIME ONLY - fallbacks removed)
  const rawRowsForActiveReport = useMemo(() => {
    switch (activeReportId) {
      case 'headcount': {
        return employees.map(emp => ({
          employee_id: emp.employee_id || emp.employee_code || '-',
          name: emp.name || '-',
          department: emp.department || '-',
          designation: emp.designation || '-',
          date_of_joining: emp.joining_date || emp.date_of_joining ? new Date(emp.joining_date || emp.date_of_joining).toLocaleDateString() : '-',
          phone: emp.phone || emp.mobile || '-',
          employment_status: emp.employment_status || emp.status || 'Active',
          raw_emp: emp
        }));
      }

      case 'turnover': {
        const depts = [...new Set(employees.map(e => e.department).filter(Boolean))];
        return depts.map(deptName => {
          const deptEmployees = employees.filter(e => String(e.department).toLowerCase() === deptName.toLowerCase());
          const active = deptEmployees.filter(e => e.employment_status === 'Active' || e.status === 'Active').length;
          const inactive = deptEmployees.filter(e => e.employment_status === 'Inactive' || e.status === 'Inactive').length;
          
          return {
            department: deptName,
            total_count: active,
            separated_count: inactive,
            turnover_rate: (active + inactive) > 0 ? parseFloat(((inactive / (active + inactive)) * 100).toFixed(1)) : 0,
            avg_tenure: 0
          };
        });
      }

      case 'demographics': {
        return employees.map(emp => {
          const dob = emp.date_of_birth || emp.dob;
          const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : (emp.age || '-');
          return {
            employee_id: emp.employee_id || emp.employee_code || '-',
            name: emp.name || '-',
            age: age,
            gender: emp.gender || '-',
            current_city: emp.current_city || '-',
            current_state: emp.current_state || '-',
            phone: emp.phone || emp.mobile || '-',
            raw_emp: emp
          };
        });
      }

      case 'attendance': {
        return attendance.map(att => {
          const emp = employees.find(e => String(e.id) === String(att.employee_id) || e.employee_id === att.employee);
          const hoursVal = Math.abs(parseFloat(att.hours || att.working_hours) || 0);
          return {
            employee_id: emp?.employee_id || att.employee || '-',
            name: emp?.name || att.employee_name || 'Employee',
            date: att.date ? new Date(att.date).toLocaleDateString() : '-',
            shift: att.shift || '-',
            in_time: att.check_in || att.in_time || '-',
            out_time: att.check_out || att.out_time || '-',
            working_hours: hoursVal,
            status: att.status || (hoursVal > 0 ? 'Present' : 'Absent'),
            raw_emp: emp
          };
        });
      }

      case 'leave': {
        return leaves.map(lv => {
          const emp = employees.find(e => String(e.id) === String(lv.employee_id) || e.employee_id === lv.employee);
          return {
            employee_id: emp?.employee_id || lv.employee || '-',
            name: emp?.name || lv.employee_name || 'Employee',
            leave_type: lv.leave_type || '-',
            start_date: lv.from_date || lv.start_date ? new Date(lv.from_date || lv.start_date).toLocaleDateString() : '-',
            end_date: lv.to_date || lv.end_date ? new Date(lv.to_date || lv.end_date).toLocaleDateString() : '-',
            total_days: lv.days || lv.total_days || 0,
            status: lv.status || 'Pending',
            raw_emp: emp
          };
        });
      }

      case 'overtime': {
        return []; // Overtime data is empty by default when there is no overtime database table
      }

      case 'payroll': {
        return payroll.map(p => {
          const emp = employees.find(e => String(e.id) === String(p.employee_id) || e.employee_id === p.employee);
          const basic = parseFloat(p.basic || p.basic_salary) || 0;
          const allowances = parseFloat(p.allowances) || 0;
          const deductions = parseFloat(p.deductions) || 0;
          const loanDeduct = parseFloat(p.loan_amount || p.loan_deduct) || 0;
          const advanceDeduct = parseFloat(p.advance) || 0;
          const netSalary = basic + allowances - deductions - loanDeduct - advanceDeduct;
          return {
            employee_id: emp?.employee_id || p.employee || '-',
            name: emp?.name || p.employee_name || 'Employee',
            month: p.month || '-',
            basic_salary: basic,
            allowances: allowances,
            deductions: deductions + loanDeduct + advanceDeduct,
            net_salary: netSalary,
            status: p.status || 'Paid',
            raw_emp: emp
          };
        });
      }

      case 'salary': {
        return designations.map(des => {
          const empList = employees.filter(e => e.designation === des.title || e.designation_id === des.id);
          const salaries = empList.map(e => parseFloat(e.basic_salary || e.salary) || 0).filter(s => s > 0);
          const avg = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
          return {
            designation: des.title || des.name,
            min_salary: salaries.length > 0 ? Math.min(...salaries) : 0,
            max_salary: salaries.length > 0 ? Math.max(...salaries) : 0,
            avg_salary: avg,
            employee_count: empList.length || 0
          };
        });
      }

      case 'benefits': {
        return expenseClaims.map(ec => {
          const emp = employees.find(e => String(e.id) === String(ec.employee_id) || e.employee_id === ec.employee);
          return {
            claim_id: ec.claim_no || ec.id || `CLM${ec.id}`,
            employee_id: emp?.employee_id || ec.employee_code || '-',
            name: emp?.name || ec.employee_name || 'Employee',
            expense_date: ec.expense_date || '-',
            category: ec.category || 'Travel',
            amount: parseFloat(ec.amount) || 0,
            status: ec.status || 'Pending',
            raw_emp: emp
          };
        });
      }

      case 'performance': {
        return performance.map(p => {
          const emp = employees.find(e => String(e.id) === String(p.employee_id));
          return {
            employee_id: emp?.employee_id || p.employee_id || '-',
            name: emp?.name || p.employee_name || 'Employee',
            review_period: p.review_period || '-',
            manager_rating: p.manager_rating || '0.0',
            self_rating: p.self_rating || '0.0',
            overall_rating: p.overall_rating || '0.0',
            status: p.status || '-',
            raw_emp: emp
          };
        });
      }

      case 'goals': {
        return goals.map(g => {
          const emp = employees.find(e => String(e.id) === String(g.employee_id));
          return {
            employee_id: emp?.employee_id || g.employee_id || '-',
            name: emp?.name || g.employee_name || 'Employee',
            goal_description: g.description || '-',
            target_date: g.target_date || '-',
            progress: g.progress || 0,
            status: g.status || '-',
            raw_emp: emp
          };
        });
      }

      case 'learning': {
        return certifications.map(c => {
          const emp = employees.find(e => String(e.id) === String(c.employee_id));
          return {
            employee_id: emp?.employee_id || c.employee_id || '-',
            name: emp?.name || c.employee_name || 'Employee',
            course_name: c.course_name || c.program_name || '-',
            status: c.status || '-',
            completion_date: c.completion_date || '-',
            certificate_no: c.certificate_no || '-',
            raw_emp: emp
          };
        });
      }

      default:
        return [];
    }
  }, [activeReportId, employees, attendance, leaves, payroll, expenseClaims, designations, goals, performance, certifications]);

  // Global filtering logic
  const filteredRows = useMemo(() => {
    let rows = [...rawRowsForActiveReport];

    // Search bar filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(row => {
        return Object.entries(row).some(([k, val]) => {
          if (k === 'raw_emp') return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Department filter
    if (selectedDept !== 'All') {
      rows = rows.filter(row => {
        const emp = row.raw_emp || employees.find(e => String(e.id) === String(row.employee_id) || e.employee_id === row.employee_id);
        const dept = row.department || emp?.department || '';
        return dept.toLowerCase() === selectedDept.toLowerCase();
      });
    }

    // Shift filter
    if (selectedShift !== 'All') {
      rows = rows.filter(row => {
        const emp = row.raw_emp || employees.find(e => String(e.id) === String(row.employee_id) || e.employee_id === row.employee_id);
        const shiftName = row.shift || '';
        const shiftId = row.shift_id || emp?.shift_id || '';
        const matchedShift = shifts.find(s => String(s.id) === String(shiftId));
        const sName = matchedShift?.name || shiftName || '';
        
        const matchMain = sName.toLowerCase().includes(selectedShift.toLowerCase());
        const matchDay = selectedShift === 'Day' && (sName.toLowerCase().includes('day') || sName.toLowerCase().includes('general'));
        const matchNight = selectedShift === 'Night' && sName.toLowerCase().includes('night');
        const matchGen = selectedShift === 'General' && (sName.toLowerCase().includes('general') || sName.toLowerCase().includes('day'));

        return matchMain || matchDay || matchNight || matchGen;
      });
    }

    // City filter
    if (selectedCity !== 'All') {
      rows = rows.filter(row => {
        const emp = row.raw_emp || employees.find(e => String(e.id) === String(row.employee_id) || e.employee_id === row.employee_id);
        const city = row.current_city || emp?.current_city || emp?.address || emp?.current_address || '';
        return city.toLowerCase() === selectedCity.toLowerCase();
      });
    }

    // State filter
    if (selectedState !== 'All') {
      rows = rows.filter(row => {
        const emp = row.raw_emp || employees.find(e => String(e.id) === String(row.employee_id) || e.employee_id === row.employee_id);
        const state = row.current_state || emp?.current_state || 'Tamil Nadu';
        return state.toLowerCase() === selectedState.toLowerCase();
      });
    }

    // Age Group filter
    if (selectedAgeGroup !== 'All') {
      rows = rows.filter(row => {
        const emp = row.raw_emp || employees.find(e => String(e.id) === String(row.employee_id) || e.employee_id === row.employee_id);
        const dob = emp?.date_of_birth || emp?.dob;
        const age = row.age || (dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null);
        if (age === null || isNaN(age)) return false;
        
        if (selectedAgeGroup === 'Under 25') return age < 25;
        if (selectedAgeGroup === '25-35') return age >= 25 && age <= 35;
        if (selectedAgeGroup === '36-45') return age >= 36 && age <= 45;
        if (selectedAgeGroup === 'Over 45') return age > 45;
        return true;
      });
    }

    // Date Range filters
    if (fromDate) {
      rows = rows.filter(row => {
        const emp = row.raw_emp || employees.find(e => String(e.id) === String(row.employee_id) || e.employee_id === row.employee_id);
        const dateStr = row.date || row.expense_date || row.start_date || row.target_date || row.completion_date || emp?.joining_date || emp?.date_of_joining || '';
        if (!dateStr || dateStr === '-') return true;
        return new Date(dateStr) >= new Date(fromDate);
      });
    }
    if (toDate) {
      rows = rows.filter(row => {
        const emp = row.raw_emp || employees.find(e => String(e.id) === String(row.employee_id) || e.employee_id === row.employee_id);
        const dateStr = row.date || row.expense_date || row.start_date || row.target_date || row.completion_date || emp?.joining_date || emp?.date_of_joining || '';
        if (!dateStr || dateStr === '-') return true;
        const limitDate = new Date(toDate);
        limitDate.setHours(23, 59, 59);
        return new Date(dateStr) <= limitDate;
      });
    }

    // Sorting
    if (sortConfig.key) {
      rows.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [rawRowsForActiveReport, searchTerm, selectedDept, selectedShift, selectedCity, selectedState, selectedAgeGroup, fromDate, toDate, sortConfig, employees, shifts]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedDept('All');
    setSelectedShift('All');
    setSelectedAgeGroup('All');
    setSelectedCity('All');
    setSelectedState('All');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Export handlers
  const handleExportExcel = (customRows = null, title = null) => {
    const targetRows = customRows || filteredRows;
    const targetTitle = title || reportObj.title;

    const dataToExport = targetRows.map(row => {
      const formatted = {};
      reportObj.columns.forEach(col => {
        formatted[col.label] = row[col.key];
      });
      return formatted;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HR Report');
    XLSX.writeFile(workbook, `${targetTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = (customRows = null, title = null) => {
    const targetRows = customRows || filteredRows;
    const targetTitle = title || reportObj.title;

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('HANDLOOM ERP - HR INTELLIGENCE SYSTEM', 14, 22);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Name: ${targetTitle}`, 14, 28);
    doc.text(`Exported On: ${new Date().toLocaleString()}`, 14, 34);

    const headers = reportObj.columns.map(c => c.label);
    const body = targetRows.map(row => reportObj.columns.map(col => {
      const val = row[col.key];
      if (typeof val === 'number' && (col.key.toLowerCase().includes('salary') || col.key.toLowerCase().includes('pay') || col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('deductions') || col.key.toLowerCase().includes('allowances'))) {
        return `INR ${val.toLocaleString()}`;
      }
      return String(val === null || val === undefined ? '-' : val);
    }));

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 }
    });

    doc.save(`${targetTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handlePrint = (customRows = null, title = null) => {
    const targetRows = customRows || filteredRows;
    const targetTitle = title || reportObj.title;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${targetTitle}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { font-size: 20px; margin-bottom: 5px; color: #4f46e5; }
            p { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 12px; text-align: left; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>HANDLOOM ERP — ${targetTitle.toUpperCase()}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${reportObj.columns.map(c => `<th>${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${targetRows.map(row => `
                <tr>
                  ${reportObj.columns.map(col => {
                    const val = row[col.key];
                    return `<td>${typeof val === 'number' ? val.toLocaleString() : val}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Recharts Chart Real Data computations
  const workforceGrowthData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const countsByMonth = Array(12).fill(0);
    
    employees.forEach(emp => {
      const dateStr = emp.joining_date || emp.date_of_joining;
      if (dateStr) {
        const d = new Date(dateStr);
        if (d.getFullYear() === currentYear) {
          countsByMonth[d.getMonth()] += 1;
        }
      }
    });

    let cumulative = 0;
    return months.map((m, idx) => {
      cumulative += countsByMonth[idx];
      return { month: m, Count: cumulative };
    });
  }, [employees]);

  const deptDistributionData = useMemo(() => {
    const counts = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Other';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([dept, count]) => ({
      dept,
      Headcount: count
    }));
  }, [employees]);

  const leaveBreakdownData = useMemo(() => {
    const counts = {};
    leaves.forEach(l => {
      const type = l.leave_type || 'Other';
      counts[type] = (counts[type] || 0) + (parseFloat(l.total_days) || 1);
    });
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [leaves]);

  const performanceRatingData = useMemo(() => {
    return performance.map(p => {
      const emp = employees.find(e => String(e.id) === String(p.employee_id));
      return {
        name: emp?.name || p.employee_name || 'Employee',
        Rating: parseFloat(p.overall_rating || p.manager_rating) || 0
      };
    }).slice(0, 5);
  }, [performance, employees]);

  // Calculated Stats for stat cards (REAL DATA)
  const stats = useMemo(() => {
    const totalEmpCount = employees.length;
    
    // Count attendance records with valid check-in / positive/negative working hours or present status
    const presentToday = attendance.filter(a => {
      const statusLower = String(a.status || '').toLowerCase();
      const hoursVal = parseFloat(a.hours || a.working_hours) || 0;
      return !a.status || ['present', 'p', 'active'].includes(statusLower) || hoursVal !== 0;
    }).length;

    const leavesCount = leaves.length;
    
    const totalPayrollAmt = payroll.reduce((sum, p) => {
      const basic = parseFloat(p.basic || p.basic_salary) || 0;
      const allowances = parseFloat(p.allowances) || 0;
      const deductions = parseFloat(p.deductions) || 0;
      const loanDeduct = parseFloat(p.loan_amount || p.loan_deduct) || 0;
      const advanceDeduct = parseFloat(p.advance) || 0;
      return sum + (basic + allowances - deductions - loanDeduct - advanceDeduct);
    }, 0);

    const claimsCount = expenseClaims.length;

    return {
      totalEmpCount,
      presentToday,
      leavesCount,
      totalPayrollAmt,
      claimsCount
    };
  }, [employees, attendance, leaves, payroll, expenseClaims]);

  return (
    <div className="animate-fade page-wrapper" style={{ paddingBottom: '60px', padding: '24px' }}>
      
      {/* 1. HEADER SECTION */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '850', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <Activity size={28} style={{ color: '#4f46e5' }} /> HR Reports & Analytics
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500' }}>
            Centralized real-time workforce intelligence and exports
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleRefreshData} 
            style={{ minWidth: '42px', padding: '10px', justifyContent: 'center' }}
            title="Refresh Report Data"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowExportModal(true)} 
            style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <Download size={18} style={{ color: '#4f46e5' }} /> Export Center
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
        
        {/* Card 1: Total Employees */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Employees</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{stats.totalEmpCount}</h3>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Present Today</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{stats.presentToday}</h3>
          </div>
        </div>

        {/* Card 3: Leaves */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Leaves</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{stats.leavesCount}</h3>
          </div>
        </div>

        {/* Card 4: Monthly Payroll */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Payroll</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>₹{(stats.totalPayrollAmt / 1000).toFixed(0)}K</h3>
          </div>
        </div>

        {/* Card 5: Claims */}
        <div className="card stat-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Claims</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={16} />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{stats.claimsCount}</h3>
          </div>
        </div>

      </div>

      {/* 3. GLOBAL FILTER SECTION */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '28px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={18} style={{ color: '#4f46e5' }} />
          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Global HR Filters
          </h4>
          <span style={{ fontSize: '11px', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', padding: '3px 8px', borderRadius: '100px', fontWeight: 600, marginLeft: '4px' }}>
            Controls All Dynamic Tables & Analytics
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.6fr', gap: '16px', alignItems: 'flex-end' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>From Date</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>To Date</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Department</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedDept} 
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id || dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Shift</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedShift} 
              onChange={e => setSelectedShift(e.target.value)}
            >
              <option value="All">All Shifts</option>
              <option value="General">General Shift</option>
              <option value="Day">Day Shift</option>
              <option value="Night">Night Shift</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Age Group</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedAgeGroup} 
              onChange={e => setSelectedAgeGroup(e.target.value)}
            >
              <option value="All">All Ages</option>
              <option value="Under 25">Under 25</option>
              <option value="25-35">25-35</option>
              <option value="36-45">36-45</option>
              <option value="Over 45">Over 45</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>City</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedCity} 
              onChange={e => setSelectedCity(e.target.value)}
            >
              {citiesList.map(city => (
                <option key={city} value={city}>{city === 'All' ? 'All Cities' : city}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>State</label>
            <select 
              className="form-control" 
              style={{ margin: 0, padding: '8px 12px', fontSize: '13px' }} 
              value={selectedState} 
              onChange={e => setSelectedState(e.target.value)}
            >
              {statesList.map(state => (
                <option key={state} value={state}>{state === 'All' ? 'All States' : state}</option>
              ))}
            </select>
          </div>

          <div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '9px', fontSize: '13px', justifyContent: 'center', width: '100%' }} 
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </div>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '28px', alignItems: 'start', marginBottom: '28px' }}>
        
        {/* SUB-MENU TABS - GROUPED REPORTS LIST */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
            <FileText size={18} style={{ color: '#4f46e5' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reports List
            </h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {REPORT_CATEGORIES.map(category => (
              <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: category.color, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.8px',
                  paddingLeft: '6px',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {category.name}
                </span>
                {category.reports.map(report => {
                  const isSelected = activeReportId === report.id;
                  return (
                    <button
                      key={report.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setActiveReportId(report.id);
                        setSearchTerm('');
                        setCurrentPage(1);
                        setSortConfig({ key: '', direction: '' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                        color: isSelected ? '#4f46e5' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '13px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: isSelected ? '#4f46e5' : 'var(--text-muted)' 
                        }} />
                        {report.name}
                      </span>
                      {isSelected && <ChevronRight size={14} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 5. DYNAMIC REPORT TABLE */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {/* Table Header Filter Action Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px 24px', 
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                {reportObj.title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '2px 0 0 0' }}>
                Showing dynamic query results with active global parameters
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search records..." 
                  style={{ paddingLeft: '32px', width: '220px', margin: 0, paddingY: '6px', fontSize: '13px' }}
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', paddingY: '6px' }}
                onClick={() => handleExportExcel()}
              >
                <Download size={14} style={{ color: '#15803d' }} /> Excel
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', paddingY: '6px' }}
                onClick={() => handleExportPDF()}
              >
                <FileText size={14} style={{ color: '#dc2626' }} /> PDF
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', paddingY: '6px' }}
                onClick={() => handlePrint()}
              >
                <Printer size={14} style={{ color: '#4f46e5' }} /> Print
              </button>
            </div>
          </div>

          {/* Table Element */}
          <div className="card overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 rounded-2xl" style={{ overflowX: 'auto', padding: 0 }}>
            <table className="data-table" style={{ width: '100%', margin: 0, minWidth: '800px', borderCollapse: 'collapse' }}>
              <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 backdrop-blur-sm">
                <tr>
                  {reportObj.columns.map(col => (
                    <th 
                      key={col.key} 
                      onClick={() => requestSort(col.key)}
                      className="text-left px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500 hover:bg-slate-100/50 transition-colors"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {col.label}
                        {sortConfig.key === col.key && (
                          <span style={{ fontSize: '10px' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-5 text-xs uppercase font-extrabold tracking-wider text-slate-500">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={reportObj.columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No report records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, index) => (
                    <tr key={index}>
                      {reportObj.columns.map(col => {
                        const val = row[col.key];
                        // Special cell renderer for numbers/currency
                        if (typeof val === 'number') {
                          if (col.key.toLowerCase().includes('salary') || col.key.toLowerCase().includes('pay') || col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('deductions') || col.key.toLowerCase().includes('allowances')) {
                            return (
                              <td key={col.key} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                ₹{val.toLocaleString('en-IN')}
                              </td>
                            );
                          }
                          return <td key={col.key} style={{ fontWeight: 600 }}>{val}</td>;
                        }
                        // Render badge for status/employment status
                        if (col.key === 'status' || col.key === 'employment_status') {
                          const lower = String(val).toLowerCase();
                          let badgeClass = 'badge-pending';
                          if (lower === 'completed' || lower === 'active' || lower === 'approved' || lower === 'paid') badgeClass = 'badge-active';
                          if (lower === 'inactive' || lower === 'rejected') badgeClass = 'badge-draft';
                          return (
                            <td key={col.key}>
                              <span className={`badge ${badgeClass}`}>{val}</span>
                            </td>
                          );
                        }
                        return <td key={col.key}>{String(val === null || val === undefined ? '-' : val)}</td>;
                      })}
                      
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => setShowRowViewModal(row)}
                            title="View Record Details"
                          >
                            <Eye size={12} /> View
                          </button>
                          
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => {
                              setShowEmailModal({ row, title: reportObj.title });
                            }}
                            title="Send via Email"
                          >
                            <Mail size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 24px', 
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Show:</span>
              <select 
                className="form-control" 
                style={{ width: '70px', padding: '4px 8px', margin: 0, fontSize: '13px' }}
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                Records of <strong>{filteredRows.length}</strong> total
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
              >
                Previous
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontWeight: 600 }}>
                Page {currentPage} of {totalPages || 1}
              </div>

              <button 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '13px' }}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 6. CHARTS & ANALYTICS SECTION */}
      <div className="card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: '#4f46e5' }} /> HR Trends & Visual Analytics
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '2px 0 0 0' }}>
              Visual analytics generated from real-time employee databases and shift aggregates
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
              Live Sync Active
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          
          {/* Chart 1: Workforce Growth */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>📈 Workforce Headcount growth</span>
              <span style={{ color: '#4f46e5', fontSize: '12px' }}>Current Year</span>
            </h5>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workforceGrowthData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip formatter={(value) => [value, 'Employees']} />
                  <Legend />
                  <Area type="monotone" dataKey="Count" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Department Headcount */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>⚙️ Department Distribution</span>
              <span style={{ color: '#10b981', fontSize: '12px' }}>Total: {stats.totalEmpCount} Active</span>
            </h5>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptDistributionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" />
                  <XAxis dataKey="dept" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip formatter={(v) => `${v} Employees`} />
                  <Legend />
                  <Bar dataKey="Headcount" fill="#10b981" barSize={25} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Leave Types Breakdown */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              🍂 Leave Breakdown by Category
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', height: '240px' }}>
              <div style={{ height: '220px' }}>
                {leaveBreakdownData.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '12px', color: 'var(--text-muted)' }}>
                    No Leave Records
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leaveBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {leaveBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} Days`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaveBreakdownData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}:</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.value} Days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 4: Employee Rating Performance */}
          <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', background: 'white' }}>
            <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>🏆 Top Performers Rating Scale</span>
              <span style={{ color: '#ec4899', fontSize: '12px' }}>Manager Rating Overview</span>
            </h5>
            <div style={{ width: '100%', height: '240px' }}>
              {performanceRatingData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '12px', color: 'var(--text-muted)' }}>
                  No Performance Records
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={performanceRatingData} 
                    layout="vertical" 
                    margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 5]} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" style={{ fontSize: '11px' }} width={90} />
                    <Tooltip formatter={(v) => `${v} Star`} />
                    <Legend />
                    <Bar dataKey="Rating" fill="#ec4899" barSize={12} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ==============================================================
          MODALS & OVERLAYS INTERACTION
          ============================================================== */}

      {/* MODAL 1: EXPORT CENTER */}
      {showExportModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="card animate-fade" style={{ width: '500px', padding: '24px', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={20} style={{ color: '#4f46e5' }} /> Bulk Export Center
              </h3>
              <button 
                onClick={() => setShowExportModal(false)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  CHOOSE EXPORT FORMAT
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['Excel', 'PDF', 'CSV'].map(fmt => (
                    <button
                      key={fmt}
                      className="btn"
                      onClick={() => setExportFormat(fmt)}
                      style={{
                        padding: '10px',
                        justifyContent: 'center',
                        background: exportFormat === fmt ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                        border: exportFormat === fmt ? '2px solid #4f46e5' : '1px solid var(--border)',
                        color: exportFormat === fmt ? '#4f46e5' : 'var(--text-secondary)',
                        fontWeight: 700
                      }}
                    >
                      {fmt} Format
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  SELECT REPORT DOMAINS FOR COMPILATION
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {REPORT_CATEGORIES.map(cat => {
                    const isChecked = exportSelectedModules.includes(cat.id);
                    return (
                      <div 
                        key={cat.id} 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => {
                          if (isChecked) {
                            setExportSelectedModules(exportSelectedModules.filter(m => m !== cat.id));
                          } else {
                            setExportSelectedModules([...exportSelectedModules, cat.id]);
                          }
                        }}
                      >
                        <input type="checkbox" checked={isChecked} readOnly style={{ width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                💡 <strong>Multi-Module Export:</strong> Compiling selected reports will compile a unified package file. Perfect for Board meetings and Monthly audit reviews.
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowExportModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 2, justifyContent: 'center', background: '#4f46e5', color: 'white' }}
                  onClick={() => {
                    alert(`Compiling and Downloading ${exportSelectedModules.length} domains in ${exportFormat} format!`);
                    setShowExportModal(false);
                  }}
                >
                  Generate Bulk Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ROW VOUCHER DETAIL VIEW */}
      {showRowViewModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="card animate-fade" style={{ width: '550px', padding: '28px', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                📑 Transaction Details / Voucher
              </h3>
              <button 
                onClick={() => setShowRowViewModal(null)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#4f46e5', margin: 0 }}>HANDLOOM ERP</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}> — HR Master</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', background: '#e2e8f0', color: 'var(--text-primary)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    HR VOUCHER
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                {Object.keys(showRowViewModal).filter(k => k !== 'raw_emp').map(key => {
                  const val = showRowViewModal[key];
                  const colObj = reportObj.columns.find(c => c.key === key);
                  const labelName = colObj ? colObj.label : key.replace(/([A-Z])/g, ' $1');
                  
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {labelName}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {typeof val === 'number' && (key.toLowerCase().includes('salary') || key.toLowerCase().includes('pay') || key.toLowerCase().includes('amount')) ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }} 
                  onClick={() => handlePrint([showRowViewModal], `Voucher_${showRowViewModal.employee_id || showRowViewModal.claim_id || 'Detail'}`)}
                >
                  <Printer size={16} /> Print Voucher
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', background: '#4f46e5', color: 'white' }}
                  onClick={() => handleExportPDF([showRowViewModal], `Voucher_${showRowViewModal.employee_id || showRowViewModal.claim_id || 'Detail'}`)}
                >
                  <Download size={16} /> PDF Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EMAIL DISPATCH COMPOSER */}
      {showEmailModal && (
        <div className="modal-backdrop" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <div className="card animate-fade" style={{ width: '500px', padding: '24px', background: 'white', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={20} style={{ color: '#4f46e5' }} /> Email Dispatcher
              </h3>
              <button 
                onClick={() => setShowEmailModal(null)} 
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recipient Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  defaultValue="hr.partner@handloomerp.com" 
                  placeholder="recipient@example.com" 
                  style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }} 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subject</label>
                <input 
                  type="text" 
                  className="form-control" 
                  defaultValue={`Handloom ERP HR MIS - ${showEmailModal.title}`} 
                  style={{ padding: '8px 12px', fontSize: '13px', margin: 0 }} 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Message Body</label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  defaultValue={`Dear Partner,\n\nPlease find attached the requested "${showEmailModal.title}" log voucher for your reference.\n\nBest Regards,\nHR MIS Team — Handloom ERP`} 
                  style={{ padding: '10px 12px', fontSize: '13px', margin: 0, resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <FileText size={18} style={{ color: '#dc2626' }} />
                <div style={{ fontSize: '12px' }}>
                  <span style={{ fontWeight: 700, display: 'block' }}>{showEmailModal.title.replace(/\s+/g, '_')}.pdf</span>
                  <span style={{ color: 'var(--text-muted)' }}>Automatic System Generated Attachment (42 KB)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifycontent: 'center' }} onClick={() => setShowEmailModal(null)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 2, justifycontent: 'center', background: '#4f46e5', color: 'white' }}
                  onClick={() => {
                    alert('Email sent successfully!');
                    setShowEmailModal(null);
                  }}
                >
                  Dispatch Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
