import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEmployees, addEmployee, updateEmployee, deleteEmployee, searchEmployeesByPrefix, fetchDepartments, fetchDesignations, fetchShifts, getEmployeeById } from '../../../services/hrService';
import { Users, Plus, Search, Edit2, Trash2, X, Save, Mail, Phone, Building, User, MapPin, Briefcase, CreditCard, FileText, ChevronRight, Eye, ExternalLink, LayoutList, LayoutGrid, Filter, IndianRupee } from 'lucide-react';

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
  name: '', email: '', phone: '', employee_id: '',
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

const defaultDesignations = [
  "Managing Director", "CEO", "General Manager", "AGM", "Manager", 
  "Assistant Manager", "Team Leader", "Senior Executive", "Executive", 
  "Coordinator", "Supervisor", "Incharge", "Officer", "Senior Officer", 
  "Assistant", "Operator", "Technician", "Worker", "Trainee"
];

const defaultDepartments = [
  "Management", "Merchandising", "Design", "Purchase", "Stores", 
  "Inventory", "Production", "Weaving", "Dyeing", "Quality", 
  "Dispatch", "Export Documentation", "Logistics", "Accounts", 
  "HR", "Payroll", "Maintenance", "IT", "Admin"
];

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

  const uniqueDepartments = Array.from(new Set([
    ...departments.map(d => d.name),
    ...defaultDepartments
  ])).filter(Boolean);

  const uniqueDesignations = Array.from(new Set([
    ...designations.map(d => d.title || d.name),
    ...defaultDesignations
  ])).filter(Boolean);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All');

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
      const [depts, desigs, shiftList] = await Promise.all([
        fetchDepartments().catch(() => []),
        fetchDesignations().catch(() => []),
        fetchShifts().catch(() => [])
      ]);
      setDepartments(depts);
      setDesignations(desigs);
      setShifts(shiftList);
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
    const integerFields = ['shift_id', 'reporting_manager_id', 'department_id', 'designation_id', 'basic_salary', 'allowances', 'deductions', 'net_salary'];
    // Fields that should be dates or null
    const dateFields = ['date_of_birth', 'date_of_joining', 'confirmation_date', 'probation_end_date', 'passport_expiry'];

    Object.keys(cleaned).forEach(key => {
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
    ];
    const missingFields = requiredFields.filter(f => !form[f.field] || form[f.field].toString().trim() === '');
    if (missingFields.length > 0) {
      setMessage({ type: 'error', text: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` });
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

  const renderBasicSection = () => (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Basic Information
        </h4>
      </div>
      <div className="form-row">
        <div className="sm:col-span-2 relative">
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => {
              const value = e.target.value;
              setForm({ ...form, name: value });
              handleSearchPrefix(value);
            }}
            onFocus={() => {
              if (form.name.length > 0) {
                handleSearchPrefix(form.name);
              }
            }}
            onBlur={() => setTimeout(() => setShowNameDropdown(false), 150)}
            className="form-control" placeholder="John Doe" />
          {showNameDropdown && (
            <ul className="btn btn-secondary">
              {nameSuggestions.map(emp => (
                <li
                  key={emp.id}
                  className="btn btn-primary"
                  onMouseDown={() => {
                    setForm({ ...form, name: emp.name });
                    setShowNameDropdown(false);
                  }}
                >
                  {emp.name}
                  {emp.employee_id ? <span className="ml-2 text-xs text-slate-400">({emp.employee_id})</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Work Email *</label>
          <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="form-control" placeholder="john@company.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="form-control" placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
          <input type="text" value={form.employee_id || ''} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            className="form-control" placeholder="Auto-generated if empty" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Personal Email</label>
          <input type="email" value={form.personal_email || ''} onChange={(e) => setForm({ ...form, personal_email: e.target.value })}
            className="form-control" placeholder="john.personal@gmail.com" />
        </div>
      </div>
    </div>
  );

  const renderPersonalSection = () => (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Personal Details
        </h4>
      </div>
      <div className="form-row">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
          <input type="date" value={form.date_of_birth || ''} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            className="form-control" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
          <select value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="form-control">
            <option value="">Select</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
          <select value={form.blood_group || ''} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
            className="form-control">
            <option value="">Select</option>
            <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
            <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Marital Status</label>
          <select value={form.marital_status || ''} onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
            className="form-control">
            <option value="">Select</option>
            <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
          <input type="text" value={form.nationality || ''} onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="form-control" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Emergency Contact Details
        </h4>
      </div>
      <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200/50 mt-4">
        <div className="form-row">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Contact Name</label>
            <input type="text" value={form.emergency_contact_name || ''} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
              className="form-control" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Relationship</label>
            <select value={form.emergency_contact_relation || ''} onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })}
              className="form-control">
              <option value="">Select</option>
              <option>Spouse</option><option>Parent</option><option>Sibling</option><option>Friend</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Phone Number</label>
            <input type="tel" value={form.emergency_contact_phone || ''} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
              className="form-control" placeholder="+91 98765 43210" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAddressSection = () => (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Address Details
        </h4>
      </div>
      
      <div style={{ margin: '16px 0 8px 0', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
        <h5 style={{ color: 'var(--primary)', margin: 0, fontSize: 14, fontWeight: 600 }}>
          Current Address
        </h5>
      </div>
      <div>
        <textarea value={form.current_address || ''} onChange={(e) => setForm({ ...form, current_address: e.target.value })}
          className="form-control" rows="3" placeholder="Full current address" />
      </div>

      <div style={{ margin: '24px 0 8px 0', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
        <h5 style={{ color: 'var(--primary)', margin: 0, fontSize: 14, fontWeight: 600 }}>
          Permanent Address
        </h5>
      </div>
      <div>
        <textarea value={form.permanent_address || ''} onChange={(e) => setForm({ ...form, permanent_address: e.target.value })}
          className="form-control" rows="3" placeholder="Full permanent address" />
      </div>
    </div>
  );

  const renderProfessionalSection = () => (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Work / Professional Info
        </h4>
      </div>
      <div className="form-row">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
          <select value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="form-control">
            <option value="">Select</option>
            {uniqueDepartments.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
          <select value={form.designation || ''} onChange={(e) => setForm({ ...form, designation: e.target.value })}
            className="form-control">
            <option value="">Select</option>
            {uniqueDesignations.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
          <select value={form.employment_type || 'Full-time'} onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            className="form-control">
            <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Intern</option><option>Consultant</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select value={form.employment_status || 'Active'} onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
            className="form-control">
            <option>Active</option><option>Probation</option><option>On Leave</option><option>Notice Period</option><option>Terminated</option><option>Resigned</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of Joining</label>
          <input type="date" value={form.date_of_joining || ''} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
            className="form-control" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reporting Manager</label>
          <select value={form.reporting_manager_id || ''} onChange={(e) => setForm({ ...form, reporting_manager_id: e.target.value })}
            className="form-control">
            <option value="">Select</option>
            {employees.filter(e => e.id !== editingId).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} - {emp.designation || emp.department}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Work Location</label>
          <input type="text" value={form.work_location || ''} onChange={(e) => setForm({ ...form, work_location: e.target.value })}
            className="form-control" placeholder="Head Office / Remote" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
          <select value={form.shift_id || ''} onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
            className="form-control">
            <option value="">Select</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirmation Date</label>
          <input type="date" value={form.confirmation_date || ''} onChange={(e) => setForm({ ...form, confirmation_date: e.target.value })}
            className="form-control" />
        </div>
      </div>
    </div>
  );

  const renderBankSection = () => (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Bank Details
        </h4>
      </div>
      <div className="form-row">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
          <input type="text" value={form.bank_name || ''} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            className="form-control" placeholder="HDFC Bank" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
          <input type="text" value={form.account_number || ''} onChange={(e) => setForm({ ...form, account_number: e.target.value })}
            className="form-control" placeholder="XXXXXXXXXX" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
          <input type="text" value={form.ifsc_code || ''} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })}
            className="form-control" placeholder="HDFC0001234" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Statutory Details
        </h4>
      </div>
      <div className="p-5 bg-slate-50/50 rounded-xl border border-slate-200/50 mt-4">
        <div className="form-row">
          <div>
            <label className="block text-xs text-slate-500 mb-1">PAN Number</label>
            <input type="text" value={form.pan_number || ''} onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
              className="form-control" placeholder="ABCDE1234F" maxLength={10} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">UAN Number</label>
            <input type="text" value={form.uan_number || ''} onChange={(e) => setForm({ ...form, uan_number: e.target.value })}
              className="form-control" placeholder="123456789012" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsSection = () => (
    <div className="space-y-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
          Document Details
        </h4>
      </div>
      <div className="form-row">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Aadhaar Number</label>
          <input type="text" value={form.aadhar_number || ''} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })}
            className="form-control" placeholder="XXXX XXXX XXXX" maxLength={14} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
          <input type="text" value={form.passport_number || ''} onChange={(e) => setForm({ ...form, passport_number: e.target.value })}
            className="form-control" placeholder="A1234567" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Passport Expiry</label>
          <input type="date" value={form.passport_expiry || ''} onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })}
            className="form-control" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Driving License</label>
          <input type="text" value={form.driving_license || ''} onChange={(e) => setForm({ ...form, driving_license: e.target.value })}
            className="form-control" placeholder="DL1234567890" />
        </div>
      </div>
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
      <div className="space-y-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: 16, fontWeight: 700 }}>
            Salary Details
          </h4>
        </div>
        <div className="form-row">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Basic Salary</label>
            <input type="number" value={form.basic_salary || ''} onChange={(e) => {
              const val = e.target.value;
              setForm(prev => ({ ...prev, basic_salary: val, net_salary: (Number(val) || 0) + (Number(prev.allowances) || 0) - (Number(prev.deductions) || 0) }));
            }} className="form-control" placeholder="e.g. 50000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Allowances</label>
            <input type="number" value={form.allowances || ''} onChange={(e) => {
              const val = e.target.value;
              setForm(prev => ({ ...prev, allowances: val, net_salary: (Number(prev.basic_salary) || 0) + (Number(val) || 0) - (Number(prev.deductions) || 0) }));
            }} className="form-control" placeholder="e.g. 10000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deductions</label>
            <input type="number" value={form.deductions || ''} onChange={(e) => {
              const val = e.target.value;
              setForm(prev => ({ ...prev, deductions: val, net_salary: (Number(prev.basic_salary) || 0) + (Number(prev.allowances) || 0) - (Number(val) || 0) }));
            }} className="form-control" placeholder="e.g. 2000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Net Salary</label>
            <input type="number" value={form.net_salary || calcNet() || ''} readOnly className="form-control" placeholder="0" />
          </div>
        </div>
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
      <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
        {/* Form Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
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

        <div className="card" style={{ padding: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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

      {/* Search Bar */}
      <div className="card" style={{ padding: '12px 24px', display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by ID, Name or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40, width: '100%' }}
          />
        </div>
      </div>

      {/* DATA AREA */}
      <div>
        {message.text && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 6, fontSize: 14, background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: message.type === 'success' ? '#10b981' : '#ef4444', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
            {message.text}
          </div>
        )}

        {/* LIST VIEW (Table format matching Party Master) */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Employee</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Department</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Designation</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Status</th>
                <th style={{ padding: '12px 24px', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No employees found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div 
                            style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                            onClick={() => navigate(`/hr/employees/${emp.id}`)}
                          >
                            {emp.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{emp.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{emp.department || '—'}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{emp.designation || '—'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: emp.employment_status === 'Active' || !emp.employment_status ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: emp.employment_status === 'Active' || !emp.employment_status ? '#10b981' : '#f59e0b',
                        border: `1px solid ${emp.employment_status === 'Active' || !emp.employment_status ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                      }}>
                        {emp.employment_status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => navigate(`/hr/employees/${emp.id}`)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="View Profile">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleEdit(emp)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMaster;