import { useState, useEffect } from 'react';
import { Users, Plus, Save, ArrowLeft, Edit2, Search, Eye, Trash2, X, User, Briefcase, FileText, IndianRupee, GraduationCap, Building, ShieldAlert, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { employeeAPI } from '../../services/api';

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

  const initialForm = {
    employee_code: '', name: '', dob: '', gender: '', blood_group: '', mobile: '', address: '', family_details: '',
    department: '', designation: '', category: 'Permanent', unit: '', production_line: '', shift: '', skill_level: '',
    aadhaar_no: '', pan_no: '', pf_account: '', esi_no: '', uan: '', biometric_id: '', medical_fitness: '',
    wage_type: 'Monthly', basic_salary: 0, hra: 0, da: 0, allowances: 0, pf_esi_percent: 0,
    qualification: '', iti_trade: '', machine_knowledge: '', training_records: '',
    bank_name: '', ifsc_code: '', account_number: '', payment_mode: 'NEFT',
    emergency_contact: '', pf_nominee: '', gratuity_nominee: '',
    status: 'Active', password: '', biometric_link: false, canteen: false, transport: false, accommodation: false
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { 
    fetchEmployees();
  }, []);

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

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete employee ${name}?`)) {
      try {
        await employeeAPI.delete(id);
        if (selectedViewEmp?.id === id) setSelectedViewEmp(null);
        fetchEmployees();
      } catch (err) {
        alert("Error deleting employee.");
      }
    }
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
    if (['basic_salary', 'hra', 'da', 'allowances', 'pf_esi_percent'].includes(name)) {
      value = value === '' ? 0 : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button 
                onClick={() => setView('list')}
                className="btn btn-secondary"
                style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={20} />
              </button>
              {isReadOnly ? 'View HR Profile' : editingId ? 'Update HR Profile' : 'New Employee Onboarding'}
            </h2>
          </div>
          {!isReadOnly && (
            <button type="submit" form="empForm" className="btn btn-primary">
              <Save size={18} /> {editingId ? 'Update' : 'Save'} Employee
            </button>
          )}
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
                      <input className="form-control" name="employee_code" value={formData.employee_code} onChange={handleChange} required placeholder="Unique ID (e.g. EMP100)" disabled={!!editingId} />
                    </div>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input className="form-control" name="name" value={formData.name} onChange={handleChange} required placeholder="As per Aadhaar" />
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
                      <select className="form-control" name="blood_group" value={formData.blood_group} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input className="form-control" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit number" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Residential Address</label>
                      <input className="form-control" name="address" value={formData.address} onChange={handleChange} placeholder="Full address" />
                    </div>
                    <div className="form-group">
                      <label>Family Details</label>
                      <input className="form-control" name="family_details" value={formData.family_details} onChange={handleChange} placeholder="Father/Spouse name" />
                    </div>
                  </div>
                </div>
              )}

              {/* EMPLOYMENT */}
              {formTab === 'employment' && (
                <div className="animate-fade">
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Department</label>
                      <select className="form-control" name="department" value={formData.department} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        <option>Production</option><option>Quality</option><option>Maintenance</option><option>HR</option><option>Accounts</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Designation</label>
                      <input className="form-control" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Supervisor, Weaver" />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select className="form-control" name="category" value={formData.category} onChange={handleChange}>
                        <option>Permanent</option><option>Contract</option><option>Casual</option><option>Trainee</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Unit</label>
                      <input className="form-control" name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g. Unit-1, Erode Unit" />
                    </div>
                    <div className="form-group">
                      <label>Production Line</label>
                      <input className="form-control" name="production_line" value={formData.production_line} onChange={handleChange} placeholder="e.g. Line A, Sizing" />
                    </div>
                    <div className="form-group">
                      <label>Shift</label>
                      <select className="form-control" name="shift" value={formData.shift} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        <option>General Shift</option><option>Shift 1 (Morning)</option><option>Shift 2 (Evening)</option><option>Shift 3 (Night)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Skill Level</label>
                      <select className="form-control" name="skill_level" value={formData.skill_level} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        <option>Skilled</option><option>Semi-Skilled</option><option>Unskilled</option>
                      </select>
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
                      <input className="form-control" name="aadhaar_no" value={formData.aadhaar_no} onChange={handleChange} placeholder="12-digit number" />
                    </div>
                    <div className="form-group">
                      <label>PAN No</label>
                      <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} placeholder="10-digit alphanumeric" />
                    </div>
                    <div className="form-group">
                      <label>Biometric ID</label>
                      <input className="form-control" name="biometric_id" value={formData.biometric_id} onChange={handleChange} placeholder="Device ID mapping" />
                    </div>
                    <div className="form-group">
                      <label>PF Account No</label>
                      <input className="form-control" name="pf_account" value={formData.pf_account} onChange={handleChange} placeholder="PF Number" />
                    </div>
                    <div className="form-group">
                      <label>UAN</label>
                      <input className="form-control" name="uan" value={formData.uan} onChange={handleChange} placeholder="Universal Account Number" />
                    </div>
                    <div className="form-group">
                      <label>ESI No</label>
                      <input className="form-control" name="esi_no" value={formData.esi_no} onChange={handleChange} placeholder="ESI registration" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Medical Fitness</label>
                      <input className="form-control" name="medical_fitness" value={formData.medical_fitness} onChange={handleChange} placeholder="Fitness status or last checkup date" />
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
                      <select className="form-control" name="wage_type" value={formData.wage_type} onChange={handleChange}>
                        <option>Monthly</option><option>Daily</option><option>Piece Rate</option>
                      </select>
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
                      <input type="number" step="0.1" className="form-control" name="pf_esi_percent" value={formData.pf_esi_percent} onChange={handleChange} />
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
                      <input className="form-control" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. 10th, 12th, B.Sc" />
                    </div>
                    <div className="form-group">
                      <label>ITI / Trade Specialization</label>
                      <input className="form-control" name="iti_trade" value={formData.iti_trade} onChange={handleChange} placeholder="e.g. Fitter, Electrician" />
                    </div>
                    <div className="form-group">
                      <label>Machine Knowledge</label>
                      <input className="form-control" name="machine_knowledge" value={formData.machine_knowledge} onChange={handleChange} placeholder="e.g. Toyota JAT 810, Somet" />
                    </div>
                    <div className="form-group">
                      <label>Training Records</label>
                      <input className="form-control" name="training_records" value={formData.training_records} onChange={handleChange} placeholder="Recent certifications or safety training" />
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
                      <input className="form-control" name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="e.g. State Bank of India" />
                    </div>
                    <div className="form-group">
                      <label>Account Number</label>
                      <input className="form-control" name="account_number" value={formData.account_number} onChange={handleChange} placeholder="Full account number" />
                    </div>
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <input className="form-control" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} placeholder="11-character IFSC" />
                    </div>
                    <div className="form-group">
                      <label>Payment Mode</label>
                      <select className="form-control" name="payment_mode" value={formData.payment_mode} onChange={handleChange}>
                        <option>NEFT</option><option>Cash</option><option>Cheque</option>
                      </select>
                    </div>
                  </div>

                  <h4 style={{ color: 'var(--primary)', marginTop: 24, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Emergency & Nominee Info</h4>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="form-group">
                      <label>Emergency Contact</label>
                      <input className="form-control" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Name & Phone" />
                    </div>
                    <div className="form-group">
                      <label>PF Nominee</label>
                      <input className="form-control" name="pf_nominee" value={formData.pf_nominee} onChange={handleChange} placeholder="Nominee name" />
                    </div>
                    <div className="form-group">
                      <label>Gratuity Nominee</label>
                      <input className="form-control" name="gratuity_nominee" value={formData.gratuity_nominee} onChange={handleChange} placeholder="Nominee name" />
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
                      <select className="form-control" name="status" value={formData.status} onChange={handleChange}>
                        <option>Active</option><option>Resigned</option><option>Terminated</option><option>Suspended</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>ERP Login Password {editingId && '(Optional: Leave blank to keep current)'}</label>
                      <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} placeholder="Set password for ERP access" />
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
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Download size={18} /> Export <span style={{ fontSize: 10 }}>▼</span>
            </button>
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#fff', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 140, overflow: 'hidden' }}>
                <button onClick={exportToPDF} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📄 Export PDF
                </button>
                <button onClick={exportToExcel} style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📊 Export Excel
                </button>
              </div>
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
                  <th>Category</th><th>Status</th><th>Actions</th>
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
    </div>
  );
}
