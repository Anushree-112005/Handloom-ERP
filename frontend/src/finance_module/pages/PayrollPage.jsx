import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payroll as payrollApi, ledgers as ledgersApi } from '../api';
import useCompanyStore from '../store/companyStore';
import {
  Users, DollarSign, FileText, Plus, Trash2, Edit2, Check, X,
  ChevronDown, AlertCircle, Briefcase, Download, RefreshCw
} from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const DEPARTMENTS = ['Accounts', 'Sales', 'Operations', 'HR', 'Management', 'IT', 'Production'];
const ROLES       = ['Administrator', 'Accountant', 'Sales Manager', 'Auditor', 'Staff'];

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n || 0);

export default function PayrollPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { activeCompany } = useCompanyStore();

  const path = location.pathname;
  const activeTab = path.includes('processing') ? 'processing'
    : path.includes('reports') ? 'reports'
    : 'employees';

  const now = new Date();
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [empForm, setEmpForm] = useState({
    emp_code:'', full_name:'', designation:'', department:'',
    bank_account:'', ifsc_code:'', bank_name:'',
    basic_salary:0, hra:0, other_allowances:0,
    pf_deduction:0, professional_tax:0,
    joining_date:'', status:'Active',
  });
  const [payLedgerId, setPayLedgerId] = useState('');
  const [disbAlert, setDisbAlert] = useState('');

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: employees = [], isLoading: loadingEmps } = useQuery({
    queryKey: ['employees', activeCompany?.id],
    queryFn:  () => payrollApi.listEmployees(activeCompany.id),
    enabled:  !!activeCompany,
  });

  const { data: salaryRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['salary-records', activeCompany?.id, selMonth, selYear],
    queryFn:  () => payrollApi.listSalaryRecords({ company_id: activeCompany.id, month: selMonth, year: selYear }),
    enabled:  !!activeCompany && activeTab !== 'employees',
  });

  const { data: allRecords = [] } = useQuery({
    queryKey: ['all-salary-records', activeCompany?.id],
    queryFn:  () => payrollApi.listSalaryRecords({ company_id: activeCompany.id }),
    enabled:  !!activeCompany && activeTab === 'reports',
  });

  const { data: bankLedgers = [] } = useQuery({
    queryKey: ['ledgers-bank', activeCompany?.id],
    queryFn:  () => ledgersApi.list({ company_id: activeCompany.id, group: 'Bank Accounts' }),
    enabled:  !!activeCompany,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const createEmp = useMutation({
    mutationFn: (data) => payrollApi.createEmployee({ ...data, company_id: activeCompany.id }),
    onSuccess: () => { qc.invalidateQueries(['employees', activeCompany.id]); closeEmpModal(); },
  });
  const updateEmp = useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateEmployee(id, data),
    onSuccess: () => { qc.invalidateQueries(['employees', activeCompany.id]); closeEmpModal(); },
  });
  const deleteEmp = useMutation({
    mutationFn: (id) => payrollApi.deleteEmployee(id),
    onSuccess: () => qc.invalidateQueries(['employees', activeCompany.id]),
  });
  const processMut = useMutation({
    mutationFn: () => payrollApi.processSalary({ company_id: activeCompany.id, month: selMonth, year: selYear }),
    onSuccess: () => qc.invalidateQueries(['salary-records', activeCompany.id]),
  });
  const disburseMut = useMutation({
    mutationFn: ({ id }) => payrollApi.disburseSalary(id, {
      payment_ledger_id: payLedgerId,
      company_id: activeCompany.id,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries(['salary-records', activeCompany.id]);
      qc.invalidateQueries(['all-salary-records', activeCompany.id]);
      setDisbAlert(`✓ ${data.message}`);
      setTimeout(() => setDisbAlert(''), 4000);
    },
  });
  const deleteRunMut = useMutation({
    mutationFn: () => payrollApi.deleteSalaryRun({ company_id: activeCompany.id, month: selMonth, year: selYear }),
    onSuccess: () => qc.invalidateQueries(['salary-records', activeCompany.id]),
  });

  // ── Employee modal helpers ────────────────────────────────────────────────
  const openAddModal = () => {
    setEditEmp(null);
    setEmpForm({ emp_code:'', full_name:'', designation:'', department:'',
      bank_account:'', ifsc_code:'', bank_name:'',
      basic_salary:0, hra:0, other_allowances:0,
      pf_deduction:0, professional_tax:0, joining_date:'', status:'Active' });
    setShowEmpModal(true);
  };
  const openEditModal = (emp) => {
    setEditEmp(emp);
    setEmpForm({ ...emp, joining_date: emp.joining_date || '' });
    setShowEmpModal(true);
  };
  const closeEmpModal = () => { setShowEmpModal(false); setEditEmp(null); };

  const handleEmpSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...empForm,
      basic_salary:     parseFloat(empForm.basic_salary)     || 0,
      hra:              parseFloat(empForm.hra)              || 0,
      other_allowances: parseFloat(empForm.other_allowances) || 0,
      pf_deduction:     parseFloat(empForm.pf_deduction)     || 0,
      professional_tax: parseFloat(empForm.professional_tax) || 0,
    };
    if (editEmp) updateEmp.mutate({ id: editEmp.id, data: payload });
    else         createEmp.mutate(payload);
  };

  if (!activeCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Briefcase size={32} style={{ color: 'var(--primary)', opacity: 0.6 }} />
          <p style={{ fontSize: 14, fontWeight: 500 }}>Please select a company first.</p>
        </div>
      </div>
    );
  }

  // ── Summaries ─────────────────────────────────────────────────────────────
  const activeEmps = employees.filter(e => e.status === 'Active').length;
  const monthlyWageBill = employees.filter(e => e.status === 'Active').reduce((s,e) => s + (e.net_pay || 0), 0);

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: '#7c3aed', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px #7c3aed33' }}>
            <Users size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Payroll Management</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Employee master, salary processing, and disbursement register</p>
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: '#7c3aed' }}>{activeEmps}</span> Active Employees
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {[
          { label: 'Total Employees', value: employees.length, icon: Users, color: '#7c3aed', border: '#7c3aed' },
          { label: 'Monthly Wage Bill', value: `₹${fmt(monthlyWageBill)}`, icon: DollarSign, color: '#0d9488', border: '#0d9488' },
          { label: 'Salary Runs This Year', value: new Set(allRecords.map(r => `${r.month}-${r.year}`)).size, icon: FileText, color: '#db2777', border: '#db2777' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderLeft: `4px solid ${border}`, borderRadius: '12px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color }}>{value}</p>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: color + '15', color }}>
              <Icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'employees', label: 'Employee Master', icon: Users, path: '/payroll/employees' },
          { key: 'processing', label: 'Salary Processing', icon: DollarSign, path: '/payroll/processing' },
          { key: 'reports', label: 'Disbursement Register', icon: FileText, path: '/payroll/reports' },
        ].map(({ key, label, icon: Icon, path: p }) => (
          <button key={key} onClick={() => navigate(p)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 13, fontWeight: 700, transition: 'all 0.2s', borderBottom: `2px solid ${activeTab === key ? '#7c3aed' : 'transparent'}`, marginBottom: -2, color: activeTab === key ? '#7c3aed' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 0 }}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ─── EMPLOYEE MASTER TAB ─── */}
      {activeTab === 'employees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{employees.length} employees registered</span>
            <button onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              <Plus size={14} /> Add Employee
            </button>
          </div>

          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    {['Code','Name & Designation','Department','Gross Salary','Net Pay','Status','Actions'].map((h, i) => (
                      <th key={h} style={{ padding: `12px ${i===0?'20px':i===6?'20px':'16px'}`, fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: ['Gross Salary','Net Pay'].includes(h) ? 'right' : h === 'Status' || h === 'Actions' ? 'center' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingEmps ? (
                    <tr><td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading employees…</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>
                      No employees found. Click "Add Employee" to get started.
                    </td></tr>
                  ) : employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>{emp.emp_code}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{emp.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{emp.designation || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{emp.department || '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>₹{fmt(emp.gross_salary)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>₹{fmt(emp.net_pay)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: emp.status === 'Active' ? '#d1fae5' : '#f1f5f9', color: emp.status === 'Active' ? '#047857' : '#64748b', border: `1px solid ${emp.status === 'Active' ? '#a7f3d0' : '#e2e8f0'}` }}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <button onClick={() => openEditModal(emp)} style={{ padding: 6, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background='#ede9fe'; e.currentTarget.style.color='#7c3aed'; }} onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}><Edit2 size={13}/></button>
                          <button onClick={() => { if(confirm('Delete employee?')) deleteEmp.mutate(emp.id); }} style={{ padding: 6, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.color='#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SALARY PROCESSING TAB ─── */}
      {activeTab === 'processing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Month:</label>
              <select value={selMonth} onChange={e => setSelMonth(+e.target.value)} className="cb-input" style={{ maxWidth: 160, cursor: 'pointer' }}>
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Year:</label>
              <input type="number" value={selYear} onChange={e => setSelYear(+e.target.value)} className="cb-input" style={{ width: 90, fontFamily: 'monospace' }} />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {salaryRecords.length > 0 && salaryRecords.every(r => r.status !== 'Disbursed') && (
                <button onClick={() => { if(confirm('Delete this salary run?')) deleteRunMut.mutate(); }}
                  className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}>
                  <Trash2 size={13}/> Reset Run
                </button>
              )}
              {salaryRecords.length === 0 && (
                <button onClick={() => processMut.mutate()} disabled={processMut.isPending}
                  className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}>
                  <RefreshCw size={13} style={{ animation: processMut.isPending ? 'spin 1s linear infinite' : 'none' }} />
                  {processMut.isPending ? 'Processing…' : 'Generate Payroll'}
                </button>
              )}
            </div>
          </div>

          {processMut.isError && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, color: '#b91c1c', fontSize: 13 }}>
              <AlertCircle size={16}/> {processMut.error?.response?.data?.detail || 'Error processing salary'}
            </div>
          )}
          {disbAlert && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 10, color: '#047857', fontSize: 13 }}>
              <Check size={16}/> {disbAlert}
            </div>
          )}

          {/* Payment ledger picker for disburse */}
          {salaryRecords.length > 0 && salaryRecords.some(r => r.status !== 'Disbursed') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px' }}>
              <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#92400e', fontWeight: 500 }}>Select payment account to disburse salary:</span>
              <select value={payLedgerId} onChange={e => setPayLedgerId(e.target.value)} className="cb-input" style={{ marginLeft: 'auto', maxWidth: 240, cursor: 'pointer' }}>
                <option value="">-- Select Bank/Cash --</option>
                {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}

          {/* Salary Sheet */}
          {salaryRecords.length > 0 && (
            <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 900 }}>
                  <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      {['Code','Employee Name','Basic','HRA','Other Allow.','Gross','Deductions','Net Pay','Status','Action'].map((h, i) => (
                        <th key={h} style={{ padding: `12px ${i===0?'20px':i===9?'20px':'16px'}`, fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: ['Basic','HRA','Other Allow.','Gross','Deductions','Net Pay'].includes(h) ? 'right' : ['Status','Action'].includes(h) ? 'center' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salaryRecords.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>{r.emp_code}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{r.employee_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>₹{fmt(r.basic)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>₹{fmt(r.hra)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>₹{fmt(r.other_allowances)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>₹{fmt(r.gross_salary)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: '#ef4444' }}>-₹{fmt((r.pf_deduction||0)+(r.professional_tax||0)+(r.other_deductions||0))}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>₹{fmt(r.net_pay)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.status==='Disbursed'?'#d1fae5':r.status==='Processed'?'#dbeafe':'#fef3c7', color: r.status==='Disbursed'?'#047857':r.status==='Processed'?'#1d4ed8':'#b45309', border: `1px solid ${r.status==='Disbursed'?'#a7f3d0':r.status==='Processed'?'#bfdbfe':'#fde68a'}` }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                          {r.status !== 'Disbursed' && (
                            <button onClick={() => { if(!payLedgerId) { alert('Select a payment account above first'); return; } disburseMut.mutate({ id: r.id }); }}
                              disabled={disburseMut.isPending}
                              className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}>Disburse</button>
                          )}
                          {r.status === 'Disbursed' && r.voucher_id && (
                            <span style={{ fontSize: 12, color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                              <Check size={12}/> #{r.voucher_id}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)' }}>
                    <tr>
                      <td colSpan={7} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 12 }}>Grand Total Net Pay:</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color: '#7c3aed' }}>₹{fmt(salaryRecords.reduce((s,r) => s + (r.net_pay || 0), 0))}</td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {salaryRecords.length === 0 && !loadingRecords && (
            <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <DollarSign size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }}/>
              <p style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No salary records for {MONTHS[selMonth-1]} {selYear}</p>
              <p style={{ margin: 0, fontSize: 13 }}>Click "Generate Payroll" to create salary entries for all active employees.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── DISBURSEMENT REGISTER TAB ─── */}
      {activeTab === 'reports' && (
        <div className="card" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 750 }}>
              <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  {['Month','Code','Employee Name','Gross','Net Pay','Status','Voucher'].map((h, i) => (
                    <th key={h} style={{ padding: `12px ${i===0?'20px':i===6?'20px':'16px'}`, fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', textAlign: ['Gross','Net Pay'].includes(h)?'right':['Status','Voucher'].includes(h)?'center':'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRecords.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 500 }}>No salary records found.</td></tr>
                ) : allRecords.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding: '12px 20px', fontWeight: 700, color: '#7c3aed', fontSize: 13 }}>{r.month_label}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.emp_code}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{r.employee_name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>₹{fmt(r.gross_salary)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>₹{fmt(r.net_pay)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.status==='Disbursed'?'#d1fae5':r.status==='Processed'?'#dbeafe':'#fef3c7', color: r.status==='Disbursed'?'#047857':r.status==='Processed'?'#1d4ed8':'#b45309', border: `1px solid ${r.status==='Disbursed'?'#a7f3d0':r.status==='Processed'?'#bfdbfe':'#fde68a'}` }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.voucher_id ? `#${r.voucher_id}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── EMPLOYEE MODAL ─── */}
      {showEmpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeEmpModal}>
          <form onSubmit={handleEmpSubmit}
            style={{ background: 'var(--bg-primary)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', width: '100%', maxWidth: 520, padding: 28, border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{editEmp ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button type="button" onClick={closeEmpModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18}/></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['emp_code', 'Employee Code *', 'text', true],
                ['full_name', 'Full Name *', 'text', true],
                ['designation', 'Designation', 'text', false],
              ].map(([key, label, type, required]) => (
                <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: key==='full_name'?'span 2':undefined }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
                  <input required={required} type={type} value={empForm[key] || ''}
                    onChange={e => setEmpForm({ ...empForm, [key]: e.target.value })}
                    className="cb-input" disabled={editEmp && key === 'emp_code'} />
                </label>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Department</span>
                <select value={empForm.department || ''} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} className="cb-input">
                  <option value="">— Select —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Joining Date</span>
                <input type="date" value={empForm.joining_date || ''} onChange={e => setEmpForm({ ...empForm, joining_date: e.target.value })} className="cb-input" />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</span>
                <select value={empForm.status} onChange={e => setEmpForm({ ...empForm, status: e.target.value })} className="cb-input">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            {/* Salary Components */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Salary Components (Monthly ₹)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['basic_salary','Basic Salary'],['hra','HRA'],['other_allowances','Other Allowances'],['pf_deduction','PF Deduction'],['professional_tax','Professional Tax']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
                    <input type="number" min="0" step="0.01" value={empForm[key] || 0}
                      onChange={e => setEmpForm({ ...empForm, [key]: e.target.value })}
                      className="cb-input" style={{ fontFamily: 'monospace' }} />
                  </label>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 14px 0', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bank Details (for disbursement)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['bank_account','Account Number'],['ifsc_code','IFSC Code'],['bank_name','Bank Name']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
                    <input type="text" value={empForm[key] || ''} onChange={e => setEmpForm({ ...empForm, [key]: e.target.value })} className="cb-input" style={{ fontFamily: 'monospace' }} />
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 20, marginTop: 20, borderTop: '1px solid var(--border)' }}>
              <button type="button" onClick={closeEmpModal} className="btn btn-secondary" style={{ padding: '9px 18px', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={createEmp.isPending || updateEmp.isPending}
                className="btn btn-primary" style={{ padding: '9px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14}/>{editEmp ? 'Save Changes' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
