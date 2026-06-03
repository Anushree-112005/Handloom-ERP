import { useState, useEffect } from 'react';
import { Users, Plus, Save, Edit2, Search, Filter, Eye, Trash2, X, Download, Copy, Briefcase, FileText, CheckCircle, Smartphone, MapPin, Hash, User, Map, AlertCircle, Building, Calendar, Shield, ShieldAlert, IndianRupee, GraduationCap, CreditCard, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { employeeAPI, subMasterAPI } from '../../services/api';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function EmployeeMaster() {
  const [view, setView] = useState('list');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedViewEmp, setSelectedViewEmp] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [formTab, setFormTab] = useState('personal'); 
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

  const initialForm = {
    employee_code: '', name: '', dob: '', gender: '', blood_group: '', mobile: '', address: '', family_details: '',
    department: '', designation: '', category: '', unit: '', production_line: '', shift: '', skill_level: '',
    aadhaar_no: '', pan_no: '', pf_account: '', esi_no: '', uan: '', biometric_id: '', medical_fitness: '',
    wage_type: '', basic_salary: 0, hra: 0, da: 0, allowances: 0, pf_esi_percent: 0,
    qualification: '', iti_trade: '', machine_knowledge: '', training_records: '',
    bank_name: '', ifsc_code: '', account_number: '', payment_mode: '',
    emergency_contact: '', pf_nominee: '', gratuity_nominee: '',
    status: '', password: '', biometric_link: false, canteen: false, transport: false, accommodation: false
  };

  const [formData, setFormData] = useState(initialForm);

  const [bloodGroups, setBloodGroups] = useState(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);
  const [isCustomBloodGroup, setIsCustomBloodGroup] = useState(false);
  const [customBloodGroupVal, setCustomBloodGroupVal] = useState('');

  const [departments, setDepartments] = useState([]);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);
  const [customDepartmentVal, setCustomDepartmentVal] = useState('');

  const [categories, setCategories] = useState([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryVal, setCustomCategoryVal] = useState('');

  const [shifts, setShifts] = useState([]);
  const [isCustomShift, setIsCustomShift] = useState(false);
  const [customShiftVal, setCustomShiftVal] = useState('');

  const [skillLevels, setSkillLevels] = useState([]);
  const [isCustomSkillLevel, setIsCustomSkillLevel] = useState(false);
  const [customSkillLevelVal, setCustomSkillLevelVal] = useState('');

  const [wageTypes, setWageTypes] = useState([]);
  const [isCustomWageType, setIsCustomWageType] = useState(false);
  const [customWageTypeVal, setCustomWageTypeVal] = useState('');

  const [statuses, setStatuses] = useState([]);
  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [customStatusVal, setCustomStatusVal] = useState('');

  const [paymentModes, setPaymentModes] = useState([]);
  const [isCustomPaymentMode, setIsCustomPaymentMode] = useState(false);
  const [customPaymentModeVal, setCustomPaymentModeVal] = useState('');

  useEffect(() => { 
    fetchEmployees();
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const [bgRes, depRes, catRes, shiftRes, skillRes, wageRes, statRes, payRes] = await Promise.all([
        subMasterAPI.list('blood_group_master').catch(() => ({ data: [] })),
        subMasterAPI.list('department_master').catch(() => ({ data: [] })),
        subMasterAPI.list('employee_category_master').catch(() => ({ data: [] })),
        subMasterAPI.list('shift_master').catch(() => ({ data: [] })),
        subMasterAPI.list('skill_level_master').catch(() => ({ data: [] })),
        subMasterAPI.list('wage_type_master').catch(() => ({ data: [] })),
        subMasterAPI.list('employee_status_master').catch(() => ({ data: [] })),
        subMasterAPI.list('payment_mode_master').catch(() => ({ data: [] }))
      ]);

      if (bgRes.data && bgRes.data.length > 0) {
        setBloodGroups(prev => [...new Set([...prev, ...bgRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
      if (depRes.data && depRes.data.length > 0) {
        setDepartments(prev => [...new Set([...prev, ...depRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
      if (catRes.data && catRes.data.length > 0) {
        setCategories(prev => [...new Set([...prev, ...catRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
      if (shiftRes.data && shiftRes.data.length > 0) {
        setShifts(prev => [...new Set([...prev, ...shiftRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
      if (skillRes.data && skillRes.data.length > 0) {
        setSkillLevels(prev => [...new Set([...prev, ...skillRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
      if (wageRes.data && wageRes.data.length > 0) {
        setWageTypes(prev => [...new Set([...prev, ...wageRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
      if (statRes.data && statRes.data.length > 0) {
        setStatuses(prev => [...new Set([...prev, ...statRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
      if (payRes.data && payRes.data.length > 0) {
        setPaymentModes(prev => [...new Set([...prev, ...payRes.data.filter(d => d.is_active).map(d => d.name)])]);
      }
    } catch (err) { console.error("Error fetching masters", err); }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await employeeAPI.list();
      setEmployees(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleOpenForm = (emp = null, readOnly = false) => {
    if (emp) {
      setFormData({ ...emp, password: '' });
      setEditingId(emp.id);
    } else {
      setFormData(initialForm);
      setEditingId(null);
    }
    setIsReadOnly(readOnly);
    setFormTab('personal');
    setView('form');
  };

  const handleDelete = (id, name, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({ show: true, id, name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (editingId) {
        await employeeAPI.update(editingId, formData);
      } else {
        await employeeAPI.create(formData);
      }
      setView('list');
      fetchEmployees();
    } catch (err) {
      alert("Error saving employee");
    }
  };

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    
    if (name === 'blood_group' && value === 'custom_add_new') {
      setIsCustomBloodGroup(true);
      setCustomBloodGroupVal('');
      return;
    }

    if (name === 'department' && value === 'custom_add_new') {
      setIsCustomDepartment(true);
      setCustomDepartmentVal('');
      return;
    }

    if (name === 'category' && value === 'custom_add_new') {
      setIsCustomCategory(true);
      setCustomCategoryVal('');
      return;
    }

    if (name === 'shift' && value === 'custom_add_new') {
      setIsCustomShift(true);
      setCustomShiftVal('');
      return;
    }

    if (name === 'skill_level' && value === 'custom_add_new') {
      setIsCustomSkillLevel(true);
      setCustomSkillLevelVal('');
      return;
    }

    if (name === 'wage_type' && value === 'custom_add_new') {
      setIsCustomWageType(true);
      setCustomWageTypeVal('');
      return;
    }

    if (name === 'status' && value === 'custom_add_new') {
      setIsCustomStatus(true);
      setCustomStatusVal('');
      return;
    }

    if (name === 'payment_mode' && value === 'custom_add_new') {
      setIsCustomPaymentMode(true);
      setCustomPaymentModeVal('');
      return;
    }

    if (['basic_salary', 'hra', 'da', 'allowances', 'pf_esi_percent'].includes(name)) {
      value = value === '' ? 0 : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveCustomBloodGroup = async () => {
    if (!customBloodGroupVal.trim()) return;
    try {
      await subMasterAPI.create('blood_group_master', { 
        entity: 'blood_group_master', 
        name: customBloodGroupVal.trim(), 
        is_active: true 
      });
      setBloodGroups(prev => [...new Set([...prev, customBloodGroupVal.trim()])]);
      setFormData(prev => ({ ...prev, blood_group: customBloodGroupVal.trim() }));
      setIsCustomBloodGroup(false);
      setCustomBloodGroupVal('');
    } catch (err) {
      console.error("Failed to add custom blood group", err);
    }
  };

  const handleSaveCustomDepartment = async () => {
    if (!customDepartmentVal.trim()) return;
    try {
      await subMasterAPI.create('department_master', { 
        entity: 'department_master', 
        name: customDepartmentVal.trim(), 
        is_active: true 
      });
      setDepartments(prev => [...new Set([...prev, customDepartmentVal.trim()])]);
      setFormData(prev => ({ ...prev, department: customDepartmentVal.trim() }));
      setIsCustomDepartment(false);
      setCustomDepartmentVal('');
    } catch (err) { console.error("Failed to add custom department", err); }
  };

  const handleSaveCustomCategory = async () => {
    if (!customCategoryVal.trim()) return;
    try {
      await subMasterAPI.create('employee_category_master', { 
        entity: 'employee_category_master', 
        name: customCategoryVal.trim(), 
        is_active: true 
      });
      setCategories(prev => [...new Set([...prev, customCategoryVal.trim()])]);
      setFormData(prev => ({ ...prev, category: customCategoryVal.trim() }));
      setIsCustomCategory(false);
      setCustomCategoryVal('');
    } catch (err) { console.error("Failed to add custom category", err); }
  };

  const handleSaveCustomShift = async () => {
    if (!customShiftVal.trim()) return;
    try {
      await subMasterAPI.create('shift_master', { 
        entity: 'shift_master', 
        name: customShiftVal.trim(), 
        is_active: true 
      });
      setShifts(prev => [...new Set([...prev, customShiftVal.trim()])]);
      setFormData(prev => ({ ...prev, shift: customShiftVal.trim() }));
      setIsCustomShift(false);
      setCustomShiftVal('');
    } catch (err) { console.error("Failed to add custom shift", err); }
  };

  const handleSaveCustomSkillLevel = async () => {
    if (!customSkillLevelVal.trim()) return;
    try {
      await subMasterAPI.create('skill_level_master', { 
        entity: 'skill_level_master', 
        name: customSkillLevelVal.trim(), 
        is_active: true 
      });
      setSkillLevels(prev => [...new Set([...prev, customSkillLevelVal.trim()])]);
      setFormData(prev => ({ ...prev, skill_level: customSkillLevelVal.trim() }));
      setIsCustomSkillLevel(false);
      setCustomSkillLevelVal('');
    } catch (err) { console.error("Failed to add custom skill level", err); }
  };

  const handleSaveCustomWageType = async () => {
    if (!customWageTypeVal.trim()) return;
    try {
      await subMasterAPI.create('wage_type_master', { 
        entity: 'wage_type_master', 
        name: customWageTypeVal.trim(), 
        is_active: true 
      });
      setWageTypes(prev => [...new Set([...prev, customWageTypeVal.trim()])]);
      setFormData(prev => ({ ...prev, wage_type: customWageTypeVal.trim() }));
      setIsCustomWageType(false);
      setCustomWageTypeVal('');
    } catch (err) { console.error("Failed to add custom wage type", err); }
  };

  const handleSaveCustomStatus = async () => {
    if (!customStatusVal.trim()) return;
    try {
      await subMasterAPI.create('employee_status_master', { 
        entity: 'employee_status_master', 
        name: customStatusVal.trim(), 
        is_active: true 
      });
      setStatuses(prev => [...new Set([...prev, customStatusVal.trim()])]);
      setFormData(prev => ({ ...prev, status: customStatusVal.trim() }));
      setIsCustomStatus(false);
      setCustomStatusVal('');
    } catch (err) { console.error("Failed to add custom status", err); }
  };

  const handleSaveCustomPaymentMode = async () => {
    if (!customPaymentModeVal.trim()) return;
    try {
      await subMasterAPI.create('payment_mode_master', { 
        entity: 'payment_mode_master', 
        name: customPaymentModeVal.trim(), 
        is_active: true 
      });
      setPaymentModes(prev => [...new Set([...prev, customPaymentModeVal.trim()])]);
      setFormData(prev => ({ ...prev, payment_mode: customPaymentModeVal.trim() }));
      setIsCustomPaymentMode(false);
      setCustomPaymentModeVal('');
    } catch (err) { console.error("Failed to add custom payment mode", err); }
  };

  const handleKeyDownTabTransition = (e, nextTab, nextFieldName) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      setFormTab(nextTab);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[name="${nextFieldName}"], select[name="${nextFieldName}"]`);
        if (nextInput) {
          nextInput.focus();
        }
      }, 100);
    }
  };

  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchSearch = e.name?.toLowerCase().includes(term) || 
           e.employee_code?.toLowerCase().includes(term) ||
           e.department?.toLowerCase().includes(term);
           
    const matchCategory = categoryFilter === 'All Categories' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'All Status' || e.status === statusFilter;

    const empDate = e.created_at ? new Date(e.created_at) : null;
    let matchFrom = true;
    let matchTo = true;
    
    if (empDate) {
      if (fromDate) {
        const fDate = new Date(fromDate);
        fDate.setHours(0,0,0,0);
        matchFrom = empDate >= fDate;
      }
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23,59,59,999);
        matchTo = empDate <= tDate;
      }
    }
    
    return matchSearch && matchCategory && matchStatus && matchFrom && matchTo;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Employee Master Report', 14, 15);
    
    const tableData = filteredEmployees.map(emp => [
      emp.employee_code,
      emp.name,
      emp.department || '-',
      emp.designation || '-',
      emp.mobile || '-',
      emp.status
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Emp Code', 'Name', 'Department', 'Designation', 'Mobile', 'Status']],
      body: tableData,
    });
    
    doc.save('Employee_Master_Report.pdf');
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEmployees.map(emp => ({
      'Emp Code': emp.employee_code,
      'Name': emp.name,
      'Department': emp.department,
      'Designation': emp.designation,
      'Category': emp.category,
      'Mobile': emp.mobile,
      'Wage Type': emp.wage_type,
      'Status': emp.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employee_Master_Report.xlsx");
    setShowExportMenu(false);
  };

  const totalEmployees = employees.length;
  const permanentStaff = employees.filter(e => e.category === 'Permanent').length;
  const contractWorkers = employees.filter(e => e.category === 'Contract').length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;

  const handleCardClick = (type) => {
    if (type === 'Total') {
      setCategoryFilter('All Categories');
      setStatusFilter('All Status');
    } else if (type === 'Permanent') {
      setCategoryFilter('Permanent');
      setStatusFilter('All Status');
    } else if (type === 'Contract') {
      setCategoryFilter('Contract');
      setStatusFilter('All Status');
    } else if (type === 'Active') {
      setCategoryFilter('All Categories');
      setStatusFilter('Active');
    }
  };

  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isReadOnly ? 'View HR Profile' : editingId ? 'Update HR Profile' : 'New Employee Onboarding'}
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setView('list')}>
              <X size={16} /> Close
            </button>
            {!isReadOnly && (
              <button type="submit" form="empForm" className="btn btn-primary">
                <Save size={16} /> {editingId ? 'Update' : 'Save'} Employee
              </button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Form Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <button onClick={() => setFormTab('personal')} style={{ padding: '16px 20px', background: formTab === 'personal' ? '#fff' : 'transparent', border: 'none', borderBottom: formTab === 'personal' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, color: formTab === 'personal' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><User size={16}/> Personal Info</button>
            <button onClick={() => setFormTab('employment')} style={{ padding: '16px 20px', background: formTab === 'employment' ? '#fff' : 'transparent', border: 'none', borderBottom: formTab === 'employment' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, color: formTab === 'employment' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase size={16}/> Employment</button>
            <button onClick={() => setFormTab('identity')} style={{ padding: '16px 20px', background: formTab === 'identity' ? '#fff' : 'transparent', border: 'none', borderBottom: formTab === 'identity' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, color: formTab === 'identity' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16}/> Statutory & ID</button>
            <button onClick={() => setFormTab('salary')} style={{ padding: '16px 20px', background: formTab === 'salary' ? '#fff' : 'transparent', border: 'none', borderBottom: formTab === 'salary' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, color: formTab === 'salary' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><IndianRupee size={16}/> Salary</button>
            <button onClick={() => setFormTab('education')} style={{ padding: '16px 20px', background: formTab === 'education' ? '#fff' : 'transparent', border: 'none', borderBottom: formTab === 'education' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, color: formTab === 'education' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><GraduationCap size={16}/> Education & Exp.</button>
            <button onClick={() => setFormTab('bank')} style={{ padding: '16px 20px', background: formTab === 'bank' ? '#fff' : 'transparent', border: 'none', borderBottom: formTab === 'bank' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, color: formTab === 'bank' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><Building size={16}/> Bank Details</button>
            <button onClick={() => setFormTab('flags')} style={{ padding: '16px 20px', background: formTab === 'flags' ? '#fff' : 'transparent', border: 'none', borderBottom: formTab === 'flags' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: 600, color: formTab === 'flags' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldAlert size={16}/> Status & Flags</button>
          </div>

          <form id="empForm" onSubmit={handleSubmit} style={{ padding: 32 }}>
            <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              
              {/* PERSONAL INFO */}
              {formTab === 'personal' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Employee Code *</label>
                      <input className="form-control" name="employee_code" value={formData.employee_code} onChange={handleChange} required disabled={!!editingId} />
                    </div>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" className="form-control" name="dob" value={formData.dob} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select className="form-control" name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Blood Group</label>
                      {isCustomBloodGroup ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Blood Group..."
                            value={customBloodGroupVal}
                            onChange={(e) => setCustomBloodGroupVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomBloodGroup();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomBloodGroup} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomBloodGroup(false); setFormData(prev => ({ ...prev, blood_group: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="blood_group" value={formData.blood_group} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input className="form-control" name="mobile" value={formData.mobile} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Residential Address</label>
                      <input className="form-control" name="address" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Family Details</label>
                      <input className="form-control" name="family_details" value={formData.family_details} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'employment', 'department')} />
                    </div>
                  </div>

                  {/* Section 2: Employment */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                    Employment
                  </h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Department</label>
                        {isCustomDepartment ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              autoFocus
                              className="form-control" 
                              placeholder="Type Department..."
                              value={customDepartmentVal}
                              onChange={(e) => setCustomDepartmentVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveCustomDepartment();
                                }
                              }}
                            />
                            <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomDepartment} title="Save">
                              <CheckCircle size={16} />
                            </button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomDepartment(false); setFormData(prev => ({ ...prev, department: '' })); }} title="Cancel">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <select className="form-control" name="department" value={formData.department} onChange={handleChange}>
                            <option value="">-- Select --</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                          </select>
                        )}
                      </div>
                    <div className="form-group">
                      <label>Designation</label>
                      <input className="form-control" name="designation" value={formData.designation} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      {isCustomCategory ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Category..."
                            value={customCategoryVal}
                            onChange={(e) => setCustomCategoryVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomCategory();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomCategory} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomCategory(false); setFormData(prev => ({ ...prev, category: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="category" value={formData.category} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Unit</label>
                      <input className="form-control" name="unit" value={formData.unit} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Production Line</label>
                      <input className="form-control" name="production_line" value={formData.production_line} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Shift</label>
                      {isCustomShift ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Shift..."
                            value={customShiftVal}
                            onChange={(e) => setCustomShiftVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomShift();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomShift} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomShift(false); setFormData(prev => ({ ...prev, shift: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="shift" value={formData.shift} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Skill Level</label>
                      {isCustomSkillLevel ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Skill Level..."
                            value={customSkillLevelVal}
                            onChange={(e) => setCustomSkillLevelVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomSkillLevel();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomSkillLevel} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomSkillLevel(false); setFormData(prev => ({ ...prev, skill_level: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="skill_level" value={formData.skill_level} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'identity', 'aadhaar_no')}>
                          <option value="">-- Select --</option>
                          {skillLevels.map(sl => <option key={sl} value={sl}>{sl}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Statutory & ID */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                    Statutory & ID
                  </h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Aadhaar No</label>
                      <input className="form-control" name="aadhaar_no" value={formData.aadhaar_no} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PAN No</label>
                      <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Biometric ID</label>
                      <input className="form-control" name="biometric_id" value={formData.biometric_id} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PF Account No</label>
                      <input className="form-control" name="pf_account" value={formData.pf_account} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>UAN</label>
                      <input className="form-control" name="uan" value={formData.uan} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>ESI No</label>
                      <input className="form-control" name="esi_no" value={formData.esi_no} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Medical Fitness</label>
                      <input className="form-control" name="medical_fitness" value={formData.medical_fitness} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'salary', 'wage_type')} />
                    </div>
                  </div>

                  {/* Section 4: Salary */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                    Salary
                  </h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Wage Type</label>
                      {isCustomWageType ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Wage Type..."
                            value={customWageTypeVal}
                            onChange={(e) => setCustomWageTypeVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomWageType();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomWageType} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomWageType(false); setFormData(prev => ({ ...prev, wage_type: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="wage_type" value={formData.wage_type} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {wageTypes.map(wt => <option key={wt} value={wt}>{wt}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Basic Salary</label>
                      <input type="number" className="form-control" name="basic_salary" value={formData.basic_salary} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>HRA</label>
                      <input type="number" className="form-control" name="hra" value={formData.hra} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>DA (Dearness Allowance)</label>
                      <input type="number" className="form-control" name="da" value={formData.da} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Other Allowances</label>
                      <input type="number" className="form-control" name="allowances" value={formData.allowances} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PF/ESI % (Deduction)</label>
                      <input type="number" step="0.1" className="form-control" name="pf_esi_percent" value={formData.pf_esi_percent} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'education', 'qualification')} />
                    </div>
                  </div>

                  {/* Section 5: Education & Exp. */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                    Education & Exp.
                  </h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group">
                      <label>Highest Qualification</label>
                      <input className="form-control" name="qualification" value={formData.qualification} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>ITI / Trade Specialization</label>
                      <input className="form-control" name="iti_trade" value={formData.iti_trade} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Machine Knowledge</label>
                      <input className="form-control" name="machine_knowledge" value={formData.machine_knowledge} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Training Records</label>
                      <input className="form-control" name="training_records" value={formData.training_records} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'bank', 'bank_name')} />
                    </div>
                  </div>

                  {/* Section 6: Bank Details */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                    Bank Details
                  </h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input className="form-control" name="bank_name" value={formData.bank_name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <input className="form-control" name="account_number" value={formData.account_number} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <input className="form-control" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Payment Mode</label>
                      {isCustomPaymentMode ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Payment Mode..."
                            value={customPaymentModeVal}
                            onChange={(e) => setCustomPaymentModeVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomPaymentMode();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPaymentMode} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPaymentMode(false); setFormData(prev => ({ ...prev, payment_mode: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="payment_mode" value={formData.payment_mode} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {paymentModes.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <h5 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px dashed var(--border)', paddingBottom: 8, fontSize: 14, fontWeight: 600 }}>Emergency & Nominee Info</h5>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Emergency Contact</label>
                      <input className="form-control" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PF Nominee</label>
                      <input className="form-control" name="pf_nominee" value={formData.pf_nominee} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Gratuity Nominee</label>
                      <input className="form-control" name="gratuity_nominee" value={formData.gratuity_nominee} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'flags', 'status')} />
                    </div>
                  </div>

                  {/* Section 7: Status & Flags */}
                  <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                    Status & Flags
                  </h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
                    <div className="form-group">
                      <label>Employment Status</label>
                      {isCustomStatus ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Status..."
                            value={customStatusVal}
                            onChange={(e) => setCustomStatusVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomStatus();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomStatus} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomStatus(false); setFormData(prev => ({ ...prev, status: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>ERP Login Password {editingId && '(Optional: Leave blank to keep current)'}</label>
                      <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="biometric_link" checked={formData.biometric_link} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Biometric Linked</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="canteen" checked={formData.canteen} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Canteen Facility</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="transport" checked={formData.transport} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Transport Facility</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="accommodation" checked={formData.accommodation} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Accommodation</span>
                    </label>
                  </div>
                </div>
              )}

              {/* EMPLOYMENT */}
              {formTab === 'employment' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Department</label>
                      {isCustomDepartment ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Department..."
                            value={customDepartmentVal}
                            onChange={(e) => setCustomDepartmentVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomDepartment();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomDepartment} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomDepartment(false); setFormData(prev => ({ ...prev, department: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="department" value={formData.department} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {departments.map(d => <option key={d} value={d}>{d}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Designation</label>
                      <input className="form-control" name="designation" value={formData.designation} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      {isCustomCategory ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Category..."
                            value={customCategoryVal}
                            onChange={(e) => setCustomCategoryVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomCategory();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomCategory} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomCategory(false); setFormData(prev => ({ ...prev, category: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="category" value={formData.category} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Unit</label>
                      <input className="form-control" name="unit" value={formData.unit} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Production Line</label>
                      <input className="form-control" name="production_line" value={formData.production_line} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Shift</label>
                      {isCustomShift ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Shift..."
                            value={customShiftVal}
                            onChange={(e) => setCustomShiftVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomShift();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomShift} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomShift(false); setFormData(prev => ({ ...prev, shift: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="shift" value={formData.shift} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Skill Level</label>
                      {isCustomSkillLevel ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Skill Level..."
                            value={customSkillLevelVal}
                            onChange={(e) => setCustomSkillLevelVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomSkillLevel();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomSkillLevel} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomSkillLevel(false); setFormData(prev => ({ ...prev, skill_level: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="skill_level" value={formData.skill_level} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'identity', 'aadhaar_no')}>
                          <option value="">-- Select --</option>
                          {skillLevels.map(sl => <option key={sl} value={sl}>{sl}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* IDENTITY & STATUTORY */}
              {formTab === 'identity' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Aadhaar No</label>
                      <input className="form-control" name="aadhaar_no" value={formData.aadhaar_no} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PAN No</label>
                      <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Biometric ID</label>
                      <input className="form-control" name="biometric_id" value={formData.biometric_id} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PF Account No</label>
                      <input className="form-control" name="pf_account" value={formData.pf_account} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>UAN</label>
                      <input className="form-control" name="uan" value={formData.uan} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>ESI No</label>
                      <input className="form-control" name="esi_no" value={formData.esi_no} onChange={handleChange} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Medical Fitness</label>
                      <input className="form-control" name="medical_fitness" value={formData.medical_fitness} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'salary', 'wage_type')} />
                    </div>
                  </div>
                </div>
              )}

              {/* SALARY & WAGES */}
              {formTab === 'salary' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Wage Type</label>
                      {isCustomWageType ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Wage Type..."
                            value={customWageTypeVal}
                            onChange={(e) => setCustomWageTypeVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomWageType();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomWageType} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomWageType(false); setFormData(prev => ({ ...prev, wage_type: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="wage_type" value={formData.wage_type} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {wageTypes.map(wt => <option key={wt} value={wt}>{wt}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Basic Salary</label>
                      <input type="number" className="form-control" name="basic_salary" value={formData.basic_salary} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>HRA</label>
                      <input type="number" className="form-control" name="hra" value={formData.hra} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>DA (Dearness Allowance)</label>
                      <input type="number" className="form-control" name="da" value={formData.da} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Other Allowances</label>
                      <input type="number" className="form-control" name="allowances" value={formData.allowances} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PF/ESI % (Deduction)</label>
                      <input type="number" step="0.1" className="form-control" name="pf_esi_percent" value={formData.pf_esi_percent} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'education', 'qualification')} />
                    </div>
                  </div>
                </div>
              )}

              {/* EDUCATION & EXPERIENCE */}
              {formTab === 'education' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group">
                      <label>Highest Qualification</label>
                      <input className="form-control" name="qualification" value={formData.qualification} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>ITI / Trade Specialization</label>
                      <input className="form-control" name="iti_trade" value={formData.iti_trade} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Machine Knowledge</label>
                      <input className="form-control" name="machine_knowledge" value={formData.machine_knowledge} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Training Records</label>
                      <input className="form-control" name="training_records" value={formData.training_records} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'bank', 'bank_name')} />
                    </div>
                  </div>
                </div>
              )}

              {/* BANK DETAILS */}
              {formTab === 'bank' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input className="form-control" name="bank_name" value={formData.bank_name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <input className="form-control" name="account_number" value={formData.account_number} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <input className="form-control" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Payment Mode</label>
                      {isCustomPaymentMode ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Payment Mode..."
                            value={customPaymentModeVal}
                            onChange={(e) => setCustomPaymentModeVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomPaymentMode();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomPaymentMode} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomPaymentMode(false); setFormData(prev => ({ ...prev, payment_mode: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="payment_mode" value={formData.payment_mode} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {paymentModes.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Emergency & Nominee Info</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Emergency Contact</label>
                      <input className="form-control" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>PF Nominee</label>
                      <input className="form-control" name="pf_nominee" value={formData.pf_nominee} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Gratuity Nominee</label>
                      <input className="form-control" name="gratuity_nominee" value={formData.gratuity_nominee} onChange={handleChange} onKeyDown={(e) => handleKeyDownTabTransition(e, 'flags', 'status')} />
                    </div>
                  </div>
                </div>
              )}

              {/* STATUS & FLAGS */}
              {formTab === 'flags' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
                    <div className="form-group">
                      <label>Employment Status</label>
                      {isCustomStatus ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input 
                            autoFocus
                            className="form-control" 
                            placeholder="Type Status..."
                            value={customStatusVal}
                            onChange={(e) => setCustomStatusVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveCustomStatus();
                              }
                            }}
                          />
                          <button type="button" className="btn btn-primary" style={{ padding: '0 8px' }} onClick={handleSaveCustomStatus} title="Save">
                            <CheckCircle size={16} />
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0 8px' }} onClick={() => { setIsCustomStatus(false); setFormData(prev => ({ ...prev, status: '' })); }} title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                          <option value="">-- Select --</option>
                          {statuses.map(st => <option key={st} value={st}>{st}</option>)}
                          <option value="custom_add_new" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+ Add Custom...</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>ERP Login Password {editingId && '(Optional: Leave blank to keep current)'}</label>
                      <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="biometric_link" checked={formData.biometric_link} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Biometric Linked</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="canteen" checked={formData.canteen} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Canteen Facility</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="transport" checked={formData.transport} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Transport Facility</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <input type="checkbox" name="accommodation" checked={formData.accommodation} onChange={handleChange} style={{ width: 18, height: 18 }} />
                      <span style={{ fontWeight: 500 }}>Accommodation</span>
                    </label>
                  </div>
                </div>
              )}

            </fieldset>
          </form>
        </div>
      </div>
    );
  }

  // --- LIST / SPLIT VIEW ---
  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="var(--primary)" /> Employee & HR Master
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage employee profiles, statutory details, and payroll data.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} /> Export
            </button>
            {showExportMenu && (
              <>
                <div onClick={() => setShowExportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 100, minWidth: 160, overflow: 'hidden' }}>
                  <button onClick={exportToPDF} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <FileText size={16} color="#ef4444" /> PDF Report
                  </button>
                  <button onClick={exportToExcel} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Download size={16} color="#10b981" /> Excel Sheet
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Onboard Employee
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div 
          className="card stat-card" 
          onClick={() => handleCardClick('Total')}
          style={{ cursor: 'pointer', border: categoryFilter === 'All Categories' && statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Employees</h3>
            <div className="value">{totalEmployees}</div>
          </div>
        </div>
        
        <div 
          className="card stat-card"
          onClick={() => handleCardClick('Permanent')}
          style={{ cursor: 'pointer', border: categoryFilter === 'Permanent' ? '2px solid #10b981' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-details">
            <h3>Permanent Staff</h3>
            <div className="value">{permanentStaff}</div>
          </div>
        </div>

        <div 
          className="card stat-card"
          onClick={() => handleCardClick('Contract')}
          style={{ cursor: 'pointer', border: categoryFilter === 'Contract' ? '2px solid #f59e0b' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <User size={24} />
          </div>
          <div className="stat-details">
            <h3>Contract Workers</h3>
            <div className="value">{contractWorkers}</div>
          </div>
        </div>

        <div 
          className="card stat-card"
          onClick={() => handleCardClick('Active')}
          style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #8b5cf6' : '1px solid transparent', transition: 'all 0.2s' }}
        >
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <ShieldAlert size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Employees</h3>
            <div className="value">{activeEmployees}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by ID, Name, or Department..." 
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option>All Categories</option>
            <option>Permanent</option>
            <option>Contract</option>
            <option>Casual</option>
            <option>Trainee</option>
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input 
              type="date" 
              className="form-control" 
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ width: 140, margin: 0 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input 
              type="date" 
              className="form-control" 
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ width: 140, margin: 0 }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        
        {/* LEFT SIDE: TABLE */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Emp Code</th><th>Employee Name</th><th>Dept & Role</th>
                  <th>Category</th><th>Shift</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No employees found.</td></tr>
                ) : (
                  filteredEmployees.map(e => (
                    <tr 
                      key={e.id} 
                      onClick={() => setSelectedViewEmp(e)}
                      style={{ 
                        cursor: 'pointer', 
                        background: selectedViewEmp?.id === e.id ? 'var(--bg-secondary)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ fontWeight: 600 }}>{e.employee_code}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{e.name}</td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{e.department || '-'}</span><br/>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.designation || '-'}</span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{e.category}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{e.shift || '-'}</span>
                      </td>
                      <td>
                        <span className={`badge ${e.status === 'Active' ? 'badge-active' : e.status === 'Resigned' ? 'badge-warning' : 'badge-inactive'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td onClick={evt => evt.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            onClick={() => handleOpenForm(e, true)}
                            title="View Profile"
                          >
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            onClick={() => handleOpenForm(e, false)}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            onClick={(evt) => handleDelete(e.id, e.name, evt)}
                            title="Delete"
                          >
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
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

        {/* RIGHT SIDE: DETAILS PANE */}
        {selectedViewEmp && (
          <div style={{ flex: '0 0 350px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                  <User size={18} /> {selectedViewEmp.name}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewEmp, false)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => setSelectedViewEmp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                <DetailRow label="Emp Code" value={selectedViewEmp.employee_code} />
                <DetailRow label="Status" value={<span className={`badge ${selectedViewEmp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{selectedViewEmp.status}</span>} />
                <DetailRow label="Department" value={selectedViewEmp.department} />
                <DetailRow label="Designation" value={selectedViewEmp.designation} />
                <DetailRow label="Category" value={selectedViewEmp.category} />
                <DetailRow label="Shift" value={selectedViewEmp.shift} />
                <DetailRow label="Mobile" value={selectedViewEmp.mobile} />
                
                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Statutory & ID</h4>
                <DetailRow label="Aadhaar" value={selectedViewEmp.aadhaar_no} />
                <DetailRow label="PAN" value={selectedViewEmp.pan_no} />
                <DetailRow label="UAN" value={selectedViewEmp.uan} />
                <DetailRow label="ESI No" value={selectedViewEmp.esi_no} />
                
                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wage Details</h4>
                <DetailRow label="Wage Type" value={selectedViewEmp.wage_type} />
                <DetailRow label="Basic Salary" value={`₹${selectedViewEmp.basic_salary}`} />
                <DetailRow label="PF/ESI Deduct" value={`${selectedViewEmp.pf_esi_percent}%`} />
                
                <h4 style={{ margin: '16px 0 4px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Facilities</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedViewEmp.canteen && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Canteen</span>}
                  {selectedViewEmp.transport && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Transport</span>}
                  {selectedViewEmp.accommodation && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Accommodation</span>}
                  {!selectedViewEmp.canteen && !selectedViewEmp.transport && !selectedViewEmp.accommodation && <span style={{ color: 'var(--text-muted)' }}>None assigned</span>}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Premium React Delete Confirmation Modal Popup */}
      {deleteConfirm.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="card animate-scale" style={{
            width: 420,
            padding: 24,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            textAlign: 'center'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fee2e2'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
              Confirm Deletion
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete employee <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13 }}
                onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: 1, padding: '10px 16px', fontWeight: 600, fontSize: 13, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
                onClick={async () => {
                  const { id } = deleteConfirm;
                  setDeleteConfirm({ show: false, id: null, name: '' });
                  try {
                    await employeeAPI.delete(id);
                    if (selectedViewEmp?.id === id) setSelectedViewEmp(null);
                    fetchEmployees();
                  } catch (err) {
                    alert("Error deleting employee.");
                  }
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
