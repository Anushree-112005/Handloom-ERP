import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, addEmployee, updateEmployee, deleteEmployee, searchEmployeesByPrefix, fetchDepartments, fetchDesignations, fetchShifts, getEmployeeById, fetchRawBiometricLogs } from '../../../services/hrService';
import { Users, Plus, Search, Edit2, Trash2, X, Save, Mail, Phone, Building, User, MapPin, Briefcase, CreditCard, FileText, ChevronRight, Eye, ExternalLink, LayoutList, LayoutGrid, Filter, IndianRupee, Download, FileSpreadsheet, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper to extract error message from API response
const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return defaultMsg;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
  if (typeof detail === 'object') return detail.msg || detail.message || JSON.stringify(detail);
  return defaultMsg;
};

const initialFormState = {
  // Basic Info
  name: '', email: '', phone: '', employee_id: '', biometric_id: '',
  // Personal Details
  date_of_birth: '', gender: '', blood_group: '', marital_status: '', nationality: 'Indian',
  personal_email: '', emergency_contact_phone: '', emergency_contact_name: '', emergency_contact_relation: '',
  // Address
  current_address: '', permanent_address: '', current_city: '', current_state: '', current_pincode: '',
  permanent_city: '', permanent_state: '', permanent_pincode: '',
  // Professional
  department: '', department_id: '', designation: '', designation_id: '', date_of_joining: '',
  employment_type: 'Full-time', employment_status: 'Active',
  reporting_manager_id: '', reporting_manager: '', work_location: '', shift_id: '',
  confirmation_date: '', probation_end_date: '', grade: '',
  // Bank Details (match backend: account_number, ifsc_code)
  bank_name: '', account_number: '', ifsc_code: '', pan_number: '', uan_number: '',
  // Documents/IDs (match backend: aadhar_number)
  aadhar_number: '', passport_number: '', passport_expiry: '', driving_license: '',
  // Salary
  basic_salary: '', allowances: '', deductions: '', net_salary: ''
};

const EmployeeMaster = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formTab, setFormTab] = useState('all');
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const uniqueDepartments = Array.from(new Set(
    departments.map(d => d.name)
  )).filter(Boolean);

  const uniqueDesignations = Array.from(new Set(
    designations.map(d => d.title || d.name)
  )).filter(Boolean);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [biometricIds, setBiometricIds] = useState([]);
  const [showBiometricDropdown, setShowBiometricDropdown] = useState(false);

  // Load employees from backend

  useEffect(() => {
    loadEmployees();
    loadMasterData();
    const interval = setInterval(() => {
      loadEmployees();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMasterData = async () => {
    try {
      const [depts, desigs, shiftList, logs] = await Promise.all([
        fetchDepartments().catch(() => []),
        fetchDesignations().catch(() => []),
        fetchShifts().catch(() => []),
        fetchRawBiometricLogs().catch(() => [])
      ]);
      setDepartments(depts);
      setDesignations(desigs);
      setShifts(shiftList);
      
      const uniqueIds = Array.from(new Set(logs.map(log => log.biometric_id || log.data?.biometric_id))).filter(Boolean);
      uniqueIds.sort((a, b) => parseInt(a) - parseInt(b));
      setBiometricIds(uniqueIds);
    } catch (e) {
      console.log('Master data load error:', e);
    }
  };



  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to load employees' });
    }
  };

  const handleSearchPrefix = async (prefix) => {
    if (prefix.length > 0) {
      try {
        const suggestions = await searchEmployeesByPrefix(prefix);
        setNameSuggestions(suggestions);
        setShowNameDropdown(suggestions.length > 0);
      } catch {
        setShowNameDropdown(false);
      }
    } else {
      setShowNameDropdown(false);
    }
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
    setShowForm(false);
    setFormTab('all');
  };

  // Clean form data before sending - convert empty strings to null for optional fields
  const cleanFormData = (data) => {
    const cleaned = { ...data };
    // Fields that should be integers or null
    const integerFields = ['shift_id', 'reporting_manager_id', 'department_id', 'designation_id'];
    const floatZeroFields = ['basic_salary', 'allowances', 'deductions', 'net_salary'];
    // Fields that should be dates or null
    const dateFields = ['date_of_birth', 'date_of_joining', 'confirmation_date', 'probation_end_date', 'passport_expiry'];

    Object.keys(cleaned).forEach(key => {
      // Convert float zero fields
      if (floatZeroFields.includes(key)) {
        if (cleaned[key] === '' || cleaned[key] === null || cleaned[key] === undefined) {
          cleaned[key] = 0;
        } else {
          cleaned[key] = parseFloat(cleaned[key]);
          if (isNaN(cleaned[key])) cleaned[key] = 0;
        }
        return; // skip further processing for this key
      }

      // Convert empty strings to null
      if (cleaned[key] === '' || cleaned[key] === undefined) {
        cleaned[key] = null;
      }
      // Convert integer fields
      if (integerFields.includes(key) && cleaned[key]) {
        cleaned[key] = parseInt(cleaned[key], 10);
        if (isNaN(cleaned[key])) cleaned[key] = null;
      }
      // Keep date fields as strings or null (backend expects ISO date string)
      if (dateFields.includes(key) && cleaned[key] === '') {
        cleaned[key] = null;
      }
    });
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields and show specific missing fields
    const requiredFields = [
      { field: 'name', label: 'Full Name' },
      { field: 'email', label: 'Work Email' },
      { field: 'phone', label: 'Phone' },
    ];
    const missingFields = requiredFields.filter(f => !form[f.field] || form[f.field].toString().trim() === '');
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` });
      return;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(form.phone.toString().trim())) {
      setMessage({ type: 'error', text: 'Phone number must be a 10-digit number' });
      return;
    }
    setLoading(true);
    try {
      const cleanedData = cleanFormData(form);
      if (editingId) {
        await updateEmployee(editingId, cleanedData);
        setMessage({ type: 'success', text: 'Employee updated!' });
      } else {
        await addEmployee(cleanedData);
        setMessage({ type: 'success', text: 'Employee added!' });
      }
      // Reload employees immediately to get fresh data from backend
      await loadEmployees();
      // Add delay to ensure UI renders the updated data before closing modal
      setTimeout(() => {
        resetForm();
      }, 500);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Failed to save employee') });
      setLoading(false);
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleEdit = async (emp) => {
    try {
      setLoading(true);
      const fullEmpData = await getEmployeeById(emp.id);

      // Properly format dates for HTML date inputs (YYYY-MM-DD)
      const formattedData = { ...initialFormState, ...fullEmpData };

      // Format date fields to YYYY-MM-DD format for date inputs
      const dateFields = ['date_of_birth', 'date_of_joining', 'confirmation_date', 'probation_end_date', 'passport_expiry'];
      dateFields.forEach(field => {
        if (formattedData[field]) {
          // Ensure date is in YYYY-MM-DD format
          const dateValue = formattedData[field];
          if (dateValue) {
            formattedData[field] = dateValue.split('T')[0]; // Remove time part if exists
          }
        }
      });

      // Ensure numeric fields are properly set
      if (formattedData.reporting_manager_id) {
        formattedData.reporting_manager_id = String(formattedData.reporting_manager_id);
      }
      if (formattedData.shift_id) {
        formattedData.shift_id = String(formattedData.shift_id);
      }
      if (formattedData.department_id) {
        formattedData.department_id = String(formattedData.department_id);
      }
      if (formattedData.designation_id) {
        formattedData.designation_id = String(formattedData.designation_id);
      }


      setForm(formattedData);
      setEditingId(emp.id);
      setFormTab('all');
      setShowForm(true);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch full employee details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this employee?')) {
      try {
        await deleteEmployee(id);
        setMessage({ type: 'success', text: 'Employee deleted.' });
        await loadEmployees();
      } catch {
        setMessage({ type: 'error', text: 'Failed to delete employee.' });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    // Status filter
    if (statusFilter !== 'All' && emp.employment_status !== statusFilter) {
      return false;
    }
    // Department filter
    if (departmentFilter !== 'All' && emp.department !== departmentFilter) {
      return false;
    }
    // Employment Type filter
    if (employmentTypeFilter !== 'All' && emp.employment_type !== employmentTypeFilter) {
      return false;
    }
    // Search term filter (if needed)
    if (searchTerm && !(
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )) {
      return false;
    }
    return true;
  });

  const formTabs = [
    { id: 'all', label: 'All Details', icon: Eye },
    { id: 'basic', label: 'Basic', icon: User },
    { id: 'personal', label: 'Personal', icon: Users },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'professional', label: 'Work', icon: Briefcase },
    { id: 'bank', label: 'Bank', icon: CreditCard },
    { id: 'documents', label: 'Docs', icon: FileText },
    { id: 'salary', label: 'Salary', icon: IndianRupee },
  ];

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Employees Report", 14, 15);
    const tableColumn = ["#", "Emp ID", "Name", "Department", "Designation", "Status"];
    const tableRows = [];

    filteredEmployees.forEach((emp, index) => {
      tableRows.push([
        index + 1,
        emp.employee_id || '-',
        emp.name,
        emp.department || '-',
        emp.designation || '-',
        emp.employment_status || 'Active'
      ]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Employees_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = filteredEmployees.map((emp, index) => ({
      "#": index + 1,
      "Emp ID": emp.employee_id || '-',
      "Name": emp.name,
      "Department": emp.department || '-',
      "Designation": emp.designation || '-',
      "Status": emp.employment_status || 'Active'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
    XLSX.writeFile(workbook, `Employees_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const SectionHeader = ({ icon: Icon, title, subtitle, colorClass }) => (
    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-200/60">
      <div className={`p-3 rounded-xl shadow-sm border ${colorClass}`}>
        <Icon size={22} className="stroke-[2.5]" />
      </div>
      <div>
        <h4 className="text-lg font-bold text-slate-800 tracking-tight m-0">{title}</h4>
        {subtitle && <p className="text-xs font-medium text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const renderBasicSection = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Basic Information
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="sm:col-span-2 relative group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-indigo-600 transition-colors">Full Name *</label>
            <input type="text" value={form.name} onChange={e => { const value = e.target.value; setForm({ ...form, name: value }); handleSearchPrefix(value); }} onFocus={() => { if (form.name.length > 0) handleSearchPrefix(form.name); }} onBlur={() => setTimeout(() => setShowNameDropdown(false), 150)} className="form-control hover:border-indigo-300 focus:border-indigo-500 transition-colors" placeholder="John Doe" />
            {showNameDropdown && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 shadow-xl rounded-xl mt-1 max-h-60 overflow-auto">
                {nameSuggestions.map(emp => (
                  <li key={emp.id} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0 border-slate-100 transition-colors" onMouseDown={() => { setForm({ ...form, name: emp.name }); setShowNameDropdown(false); }}>
                    <div className="font-semibold text-slate-800">{emp.name}</div>
                    {emp.employee_id && <div className="text-xs text-slate-500">{emp.employee_id}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-indigo-600 transition-colors">Work Email *</label>
            <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-control hover:border-indigo-300 focus:border-indigo-500 transition-colors" placeholder="john@company.com" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-indigo-600 transition-colors">Phone *</label>
            <input type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-control hover:border-indigo-300 focus:border-indigo-500 transition-colors" placeholder="10-digit number" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-indigo-600 transition-colors">Employee ID</label>
            <input type="text" value={form.employee_id || ''} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className="form-control hover:border-indigo-300 focus:border-indigo-500 transition-colors" placeholder="Auto-generated if empty" />
          </div>
          <div className="group relative">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-indigo-600 transition-colors">Biometric Machine ID</label>
            <input 
              type="text" 
              value={form.biometric_id || ''} 
              onChange={(e) => setForm({ ...form, biometric_id: e.target.value })} 
              onFocus={() => setShowBiometricDropdown(true)}
              onBlur={() => setTimeout(() => setShowBiometricDropdown(false), 200)}
              className="form-control hover:border-indigo-300 focus:border-indigo-500 transition-colors" 
              placeholder="Select or type ID..." 
            />
            {showBiometricDropdown && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 shadow-xl rounded-xl mt-1 max-h-60 overflow-auto">
                {biometricIds
                  .filter(id => !form.biometric_id || String(id).toLowerCase().includes(String(form.biometric_id).toLowerCase()))
                  .map(id => {
                    const assignedEmp = employees.find(e => String(e.biometric_id) === String(id) && e.id !== editingId);
                    return (
                      <li 
                        key={id} 
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b last:border-0 border-slate-100 transition-colors flex justify-between items-center" 
                        onMouseDown={() => { 
                          setForm({ ...form, biometric_id: String(id) }); 
                          setShowBiometricDropdown(false); 
                        }}
                      >
                        <span className="font-semibold text-slate-800">ID: {id}</span>
                        {assignedEmp ? (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            Assigned to {assignedEmp.name}
                          </span>
                        ) : (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                            Available
                          </span>
                        )}
                      </li>
                    );
                  })}
                {biometricIds.filter(id => !form.biometric_id || String(id).toLowerCase().includes(String(form.biometric_id).toLowerCase())).length === 0 && (
                  <li className="px-4 py-3 text-sm text-slate-400 text-center">
                    No matching biometric IDs found. Type to use custom.
                  </li>
                )}
              </ul>
            )}
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-indigo-600 transition-colors">Personal Email</label>
            <input type="email" value={form.personal_email || ''} onChange={(e) => setForm({ ...form, personal_email: e.target.value })} className="form-control hover:border-indigo-300 focus:border-indigo-500 transition-colors" placeholder="john.personal@gmail.com" />
          </div>
        </div>
      </fieldset>
    </div>
  );

  const renderPersonalSection = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Personal Details
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-emerald-600 transition-colors">Date of Birth</label>
            <input type="date" value={form.date_of_birth || ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="form-control hover:border-emerald-300 focus:border-emerald-500 transition-colors" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-emerald-600 transition-colors">Gender</label>
            <select value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="form-control hover:border-emerald-300 focus:border-emerald-500 transition-colors">
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-emerald-600 transition-colors">Blood Group</label>
            <select value={form.blood_group || ''} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="form-control hover:border-emerald-300 focus:border-emerald-500 transition-colors">
              <option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-emerald-600 transition-colors">Marital Status</label>
            <select value={form.marital_status || ''} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className="form-control hover:border-emerald-300 focus:border-emerald-500 transition-colors">
              <option value="">Select</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-emerald-600 transition-colors">Nationality</label>
            <input type="text" value={form.nationality || ''} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="form-control hover:border-emerald-300 focus:border-emerald-500 transition-colors" />
          </div>
        </div>
      </fieldset>

      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Emergency Contact
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-rose-600 transition-colors">Contact Name</label>
            <input type="text" value={form.emergency_contact_name || ''} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} className="form-control hover:border-rose-300 focus:border-rose-500 transition-colors" placeholder="Jane Doe" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-rose-600 transition-colors">Relationship</label>
            <select value={form.emergency_contact_relation || ''} onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })} className="form-control hover:border-rose-300 focus:border-rose-500 transition-colors">
              <option value="">Select</option><option>Spouse</option><option>Parent</option><option>Sibling</option><option>Friend</option><option>Other</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-rose-600 transition-colors">Phone Number</label>
            <input type="tel" value={form.emergency_contact_phone || ''} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} className="form-control hover:border-rose-300 focus:border-rose-500 transition-colors" placeholder="+91 98765 43210" />
          </div>
        </div>
      </fieldset>
    </div>
  );

  const renderAddressSection = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Address Details
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h5 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin size={16}/> Current Address</h5>
            <textarea value={form.current_address || ''} onChange={(e) => setForm({ ...form, current_address: e.target.value })} className="form-control hover:border-amber-300 focus:border-amber-500 transition-colors resize-none" rows="4" placeholder="Full current address..." />
          </div>
          <div className="space-y-4">
            <h5 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2"><Building size={16}/> Permanent Address</h5>
            <textarea value={form.permanent_address || ''} onChange={(e) => setForm({ ...form, permanent_address: e.target.value })} className="form-control hover:border-amber-300 focus:border-amber-500 transition-colors resize-none" rows="4" placeholder="Full permanent address..." />
          </div>
        </div>
      </fieldset>
    </div>
  );

  const renderProfessionalSection = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Work / Professional Info
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Department</label>
            <select value={form.department || ''} onChange={(e) => { if (e.target.value === 'add_custom') navigate('/hr/departments?add=true'); else setForm({ ...form, department: e.target.value }); }} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors">
              <option value="">Select</option>
              {uniqueDepartments.map(name => <option key={name} value={name}>{name}</option>)}
              <option value="add_custom" className="text-purple-600 font-bold bg-purple-50">+ Add Custom</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Designation</label>
            <select value={form.designation || ''} onChange={(e) => { if (e.target.value === 'add_custom') navigate('/hr/designations?add=true'); else setForm({ ...form, designation: e.target.value }); }} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors">
              <option value="">Select</option>
              {uniqueDesignations.map(name => <option key={name} value={name}>{name}</option>)}
              <option value="add_custom" className="text-purple-600 font-bold bg-purple-50">+ Add Custom</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Employment Type</label>
            <select value={form.employment_type || 'Full-time'} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors">
              <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Intern</option><option>Consultant</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Status</label>
            <select value={form.employment_status || 'Active'} onChange={(e) => setForm({ ...form, employment_status: e.target.value })} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors">
              <option>Active</option><option>Probation</option><option>On Leave</option><option>Notice Period</option><option>Terminated</option><option>Resigned</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Date of Joining</label>
            <input type="date" value={form.date_of_joining || ''} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Reporting Manager</label>
            <select value={form.reporting_manager_id || ''} onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors">
              <option value="">Select</option>
              {employees.filter(e => e.id !== editingId).map(emp => <option key={emp.id} value={emp.id}>{emp.name} - {emp.designation || emp.department}</option>)}
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Work Location</label>
            <input type="text" value={form.work_location || ''} onChange={(e) => setForm({ ...form, work_location: e.target.value })} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors" placeholder="Head Office / Remote" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Shift</label>
            <select value={form.shift_id || ''} onChange={(e) => setForm({ ...form, shift_id: e.target.value })} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors">
              <option value="">Select</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-purple-600 transition-colors">Confirmation Date</label>
            <input type="date" value={form.confirmation_date || ''} onChange={(e) => setForm({ ...form, confirmation_date: e.target.value })} className="form-control hover:border-purple-300 focus:border-purple-500 transition-colors" />
          </div>
        </div>
      </fieldset>
    </div>
  );

  const renderBankSection = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Bank Details
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="sm:col-span-2 group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-cyan-600 transition-colors">Bank Name</label>
            <input type="text" value={form.bank_name || ''} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className="form-control hover:border-cyan-300 focus:border-cyan-500 transition-colors" placeholder="e.g., HDFC Bank" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-cyan-600 transition-colors">Account Number</label>
            <input type="text" value={form.account_number || ''} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className="form-control hover:border-cyan-300 focus:border-cyan-500 transition-colors" placeholder="XXXXXXXXXX" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-cyan-600 transition-colors">IFSC Code</label>
            <input type="text" value={form.ifsc_code || ''} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} className="form-control hover:border-cyan-300 focus:border-cyan-500 transition-colors" placeholder="HDFC0001234" />
          </div>
        </div>
      </fieldset>

      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Statutory Details
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-slate-900 transition-colors">PAN Number</label>
            <input type="text" value={form.pan_number || ''} onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })} className="form-control hover:border-slate-400 focus:border-slate-500 transition-colors uppercase" placeholder="ABCDE1234F" maxLength={10} />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-slate-900 transition-colors">UAN Number</label>
            <input type="text" value={form.uan_number || ''} onChange={(e) => setForm({ ...form, uan_number: e.target.value })} className="form-control hover:border-slate-400 focus:border-slate-500 transition-colors" placeholder="123456789012" />
          </div>
        </div>
      </fieldset>
    </div>
  );

  const renderDocumentsSection = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
        <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Document Details
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-sky-600 transition-colors">Aadhaar Number</label>
            <input type="text" value={form.aadhar_number || ''} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} className="form-control hover:border-sky-300 focus:border-sky-500 transition-colors" placeholder="XXXX XXXX XXXX" maxLength={14} />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-sky-600 transition-colors">Passport Number</label>
            <input type="text" value={form.passport_number || ''} onChange={(e) => setForm({ ...form, passport_number: e.target.value })} className="form-control hover:border-sky-300 focus:border-sky-500 transition-colors" placeholder="A1234567" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-sky-600 transition-colors">Passport Expiry</label>
            <input type="date" value={form.passport_expiry || ''} onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })} className="form-control hover:border-sky-300 focus:border-sky-500 transition-colors" />
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-sky-600 transition-colors">Driving License</label>
            <input type="text" value={form.driving_license || ''} onChange={(e) => setForm({ ...form, driving_license: e.target.value })} className="form-control hover:border-sky-300 focus:border-sky-500 transition-colors" placeholder="DL1234567890" />
          </div>
        </div>
      </fieldset>
    </div>
  );

  const renderSalarySection = () => {
    const calcNet = () => {
      const b = Number(form.basic_salary) || 0;
      const a = Number(form.allowances) || 0;
      const d = Number(form.deductions) || 0;
      return b + a - d;
    };
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
          <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Salary Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-green-600 transition-colors">Basic Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input type="number" value={form.basic_salary || ''} onChange={(e) => { const val = e.target.value; setForm(prev => ({ ...prev, basic_salary: val, net_salary: (Number(val) || 0) + (Number(prev.allowances) || 0) - (Number(prev.deductions) || 0) })); }} className="form-control pl-8 hover:border-green-300 focus:border-green-500 transition-colors" placeholder="50000" />
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-green-600 transition-colors">Allowances</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input type="number" value={form.allowances || ''} onChange={(e) => { const val = e.target.value; setForm(prev => ({ ...prev, allowances: val, net_salary: (Number(prev.basic_salary) || 0) + (Number(val) || 0) - (Number(prev.deductions) || 0) })); }} className="form-control pl-8 hover:border-green-300 focus:border-green-500 transition-colors" placeholder="10000" />
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-hover:text-green-600 transition-colors">Deductions</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input type="number" value={form.deductions || ''} onChange={(e) => { const val = e.target.value; setForm(prev => ({ ...prev, deductions: val, net_salary: (Number(prev.basic_salary) || 0) + (Number(prev.allowances) || 0) - (Number(val) || 0) })); }} className="form-control pl-8 hover:border-green-300 focus:border-green-500 transition-colors" placeholder="2000" />
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Net Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">₹</span>
                <input type="number" value={form.net_salary || calcNet() || ''} readOnly className="form-control pl-8 bg-green-50/50 border-green-200 text-green-800 font-bold shadow-inner" placeholder="0" />
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    );
  };

  const renderFormSection = () => {
    switch (formTab) {
      case 'all':
        return (
          <div className="space-y-8 divide-y divide-slate-100">
            <div>{renderBasicSection()}</div>
            <div className="pt-6">{renderPersonalSection()}</div>
            <div className="pt-6">{renderAddressSection()}</div>
            <div className="pt-6">{renderProfessionalSection()}</div>
            <div className="pt-6">{renderBankSection()}</div>
            <div className="pt-6">{renderDocumentsSection()}</div>
            <div className="pt-6">{renderSalarySection()}</div>
          </div>
        );
      case 'basic':
        return renderBasicSection();
      case 'personal':
        return renderPersonalSection();
      case 'address':
        return renderAddressSection();
      case 'professional':
        return renderProfessionalSection();
      case 'bank':
        return renderBankSection();
      case 'documents':
        return renderDocumentsSection();
      case 'salary':
        return renderSalarySection();
      default:
        return null;
    }
  };

  if (showForm) {
    return (
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
        <div className="card animate-fade" style={{ padding: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Form Header inside card */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {editingId ? 'Edit Employee Details' : 'Add New Employee'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X size={16} /> Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={16} /> Save Employee
              </button>
            </div>
          </div>
          {/* Form Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            {formTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = formTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormTab(tab.id)}
                  style={{
                    padding: '16px 24px',
                    background: isActive ? '#fff' : 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    fontWeight: 600,
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Form Section */}
          <div style={{ padding: 24, background: '#fff' }}>
            <form onSubmit={handleSubmit}>
              {renderFormSection()}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="var(--primary)" /> Employee Master
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage employee profiles, professional details, and salary sheets.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Employees</h3>
            <div className="value">{employees.length}</div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Employees</h3>
            <div className="value">{employees.filter(e => e.employment_status === 'Active' || !e.employment_status).length}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>On Probation</h3>
            <div className="value">{employees.filter(e => e.employment_status === 'Probation').length}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>On Leave</h3>
            <div className="value">{employees.filter(e => e.employment_status === 'On Leave').length}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {!showForm && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search by ID, Name or Email..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', padding: '10px 16px 10px 44px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', height: 44 }} 
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <select 
              value={departmentFilter} 
              onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 160 }}
            >
              <option value="All">All Departments</option>
              {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, height: 44, outline: 'none', background: '#fff', minWidth: 160 }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="On Leave">On Leave</option>
              <option value="Notice Period">Notice Period</option>
              <option value="Terminated">Terminated</option>
              <option value="Resigned">Resigned</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('All');
                setStatusFilter('All');
                setEmploymentTypeFilter('All');
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
      )}

      {/* DATA AREA */}
      <div>
        {message.text && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 6, fontSize: 14, background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: message.type === 'success' ? '#10b981' : '#ef4444', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            {message.text}
          </div>
        )}

        {/* LIST VIEW (Table format matching Party Master) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>ACTIONS</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No employees found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 600, fontSize: 14, border: '1px solid #e2e8f0' }}>
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div 
                            style={{ fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                            onClick={() => navigate(`/hr/employees/${emp.id}`)}
                          >
                            {emp.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{emp.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department || '—'}</td>
                    <td>{emp.designation || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: emp.employment_status === 'Active' || !emp.employment_status ? '#10b981' : '#f59e0b' }}></span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: emp.employment_status === 'Active' || !emp.employment_status ? '#10b981' : '#f59e0b' }}>{emp.employment_status || 'Active'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/hr/employees/${emp.id}`)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer' }} title="View Profile">
                          <Eye size={14} color="#6366f1" />
                        </button>
                        <button onClick={() => handleEdit(emp)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                          <Edit2 size={14} color="#3b82f6" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {!showForm && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Showing <span style={{ fontWeight: 600, color: '#1e293b' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span style={{ fontWeight: 600, color: '#1e293b' }}>{filteredEmployees.length}</span> results
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
      </div>
    </div>
  );
};

export default EmployeeMaster;