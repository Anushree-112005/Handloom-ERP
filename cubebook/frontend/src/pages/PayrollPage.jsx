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
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Briefcase size={32} className="animate-pulse text-purple-600" />
          <p className="text-sm font-medium">Please select a company first.</p>
        </div>
      </div>
    );
  }

  // ── Summaries ─────────────────────────────────────────────────────────────
  const activeEmps = employees.filter(e => e.status === 'Active').length;
  const monthlyWageBill = employees.filter(e => e.status === 'Active').reduce((s,e) => s + (e.net_pay || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/25">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="cb-page-title">Payroll Management</h1>
            <p className="cb-page-subtitle">Employee master, salary processing, and disbursement register</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="font-semibold text-purple-700">{activeEmps}</span> Active Employees
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="cb-stat-card border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <p className="cb-stat-label">Total Employees</p>
            <p className="cb-stat-value text-purple-700">{employees.length}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users size={20} /></div>
        </div>
        <div className="cb-stat-card border-l-4 border-l-teal-500 flex items-center justify-between">
          <div>
            <p className="cb-stat-label">Monthly Wage Bill</p>
            <p className="cb-stat-value text-teal-700">₹{fmt(monthlyWageBill)}</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl"><DollarSign size={20} /></div>
        </div>
        <div className="cb-stat-card border-l-4 border-l-pink-500 flex items-center justify-between">
          <div>
            <p className="cb-stat-label">Salary Runs This Year</p>
            <p className="cb-stat-value text-pink-700">{new Set(allRecords.map(r => `${r.month}-${r.year}`)).size}</p>
          </div>
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl"><FileText size={20} /></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'employees', label: 'Employee Master', icon: Users, path: '/payroll/employees' },
          { key: 'processing', label: 'Salary Processing', icon: DollarSign, path: '/payroll/processing' },
          { key: 'reports', label: 'Disbursement Register', icon: FileText, path: '/payroll/reports' },
        ].map(({ key, label, icon: Icon, path: p }) => (
          <button key={key} onClick={() => navigate(p)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all ${
              activeTab === key
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
            }`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {/* ─── EMPLOYEE MASTER TAB ─── */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 cb-card">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{employees.length} employees registered</span>
            <button onClick={openAddModal} className="cb-btn-primary text-xs py-1.5 px-3">
              <Plus size={14} /> Add Employee
            </button>
          </div>

          <div className="cb-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 cb-th">Code</th>
                    <th className="px-4 py-3 cb-th">Name & Designation</th>
                    <th className="px-4 py-3 cb-th">Department</th>
                    <th className="px-4 py-3 cb-th text-right">Gross Salary</th>
                    <th className="px-4 py-3 cb-th text-right">Net Pay</th>
                    <th className="px-4 py-3 cb-th text-center">Status</th>
                    <th className="px-4 py-3 cb-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingEmps ? (
                    <tr><td colSpan="7" className="py-12 text-center text-slate-400 animate-pulse">Loading employees…</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan="7" className="py-12 text-center text-slate-400">
                      No employees found. Click "Add Employee" to get started.
                    </td></tr>
                  ) : employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 cb-td font-mono text-xs font-bold text-purple-700">{emp.emp_code}</td>
                      <td className="px-4 py-3 cb-td">
                        <div className="font-semibold text-slate-800">{emp.full_name}</div>
                        <div className="text-xs text-slate-400">{emp.designation || '—'}</div>
                      </td>
                      <td className="px-4 py-3 cb-td text-slate-500">{emp.department || '—'}</td>
                      <td className="px-4 py-3 cb-td text-right font-mono">₹{fmt(emp.gross_salary)}</td>
                      <td className="px-4 py-3 cb-td text-right font-mono font-bold text-slate-800">₹{fmt(emp.net_pay)}</td>
                      <td className="px-4 py-3 cb-td text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          emp.status === 'Active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>{emp.status}</span>
                      </td>
                      <td className="px-4 py-3 cb-td text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEditModal(emp)} className="p-1.5 rounded hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors"><Edit2 size={13}/></button>
                          <button onClick={() => { if(confirm('Delete employee?')) deleteEmp.mutate(emp.id); }} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
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
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-4 cb-card">
            <div className="flex items-center gap-2">
              <label className="cb-label">Month:</label>
              <select value={selMonth} onChange={e => setSelMonth(+e.target.value)} className="cb-input py-1.5 px-2 text-xs max-w-[140px]">
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="cb-label">Year:</label>
              <input type="number" value={selYear} onChange={e => setSelYear(+e.target.value)}
                className="cb-input py-1.5 px-2 text-xs w-24 font-mono" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              {salaryRecords.length > 0 && salaryRecords.every(r => r.status !== 'Disbursed') && (
                <button onClick={() => { if(confirm('Delete this salary run?')) deleteRunMut.mutate(); }}
                  className="cb-btn-secondary text-xs py-1.5 px-3">
                  <Trash2 size={13}/> Reset Run
                </button>
              )}
              {salaryRecords.length === 0 && (
                <button onClick={() => processMut.mutate()} disabled={processMut.isPending}
                  className="cb-btn-primary text-xs py-1.5 px-3">
                  <RefreshCw size={13} className={processMut.isPending ? 'animate-spin' : ''} />
                  {processMut.isPending ? 'Processing…' : 'Generate Payroll'}
                </button>
              )}
            </div>
          </div>

          {processMut.isError && (
            <div className="flex gap-2 items-center px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16}/> {processMut.error?.response?.data?.detail || 'Error processing salary'}
            </div>
          )}
          {disbAlert && (
            <div className="flex gap-2 items-center px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <Check size={16}/> {disbAlert}
            </div>
          )}

          {/* Payment ledger picker for disburse */}
          {salaryRecords.length > 0 && salaryRecords.some(r => r.status !== 'Disbursed') && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">Select payment account to disburse salary:</span>
              <select value={payLedgerId} onChange={e => setPayLedgerId(e.target.value)}
                className="cb-input py-1 px-2 text-xs ml-auto max-w-[220px]">
                <option value="">-- Select Bank/Cash --</option>
                {bankLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}

          {/* Salary Sheet */}
          {salaryRecords.length > 0 && (
            <div className="cb-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 cb-th">Code</th>
                      <th className="px-4 py-3 cb-th">Employee Name</th>
                      <th className="px-4 py-3 cb-th text-right">Basic</th>
                      <th className="px-4 py-3 cb-th text-right">HRA</th>
                      <th className="px-4 py-3 cb-th text-right">Other Allow.</th>
                      <th className="px-4 py-3 cb-th text-right">Gross</th>
                      <th className="px-4 py-3 cb-th text-right">Deductions</th>
                      <th className="px-4 py-3 cb-th text-right font-bold">Net Pay</th>
                      <th className="px-4 py-3 cb-th text-center">Status</th>
                      <th className="px-4 py-3 cb-th text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 cb-td font-mono text-xs text-purple-700 font-bold">{r.emp_code}</td>
                        <td className="px-4 py-3 cb-td font-semibold text-slate-800">{r.employee_name}</td>
                        <td className="px-4 py-3 cb-td text-right font-mono text-xs">₹{fmt(r.basic)}</td>
                        <td className="px-4 py-3 cb-td text-right font-mono text-xs">₹{fmt(r.hra)}</td>
                        <td className="px-4 py-3 cb-td text-right font-mono text-xs">₹{fmt(r.other_allowances)}</td>
                        <td className="px-4 py-3 cb-td text-right font-mono text-xs">₹{fmt(r.gross_salary)}</td>
                        <td className="px-4 py-3 cb-td text-right font-mono text-xs text-red-600">
                          -₹{fmt((r.pf_deduction||0)+(r.professional_tax||0)+(r.other_deductions||0))}
                        </td>
                        <td className="px-4 py-3 cb-td text-right font-mono font-bold text-slate-900">₹{fmt(r.net_pay)}</td>
                        <td className="px-4 py-3 cb-td text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            r.status === 'Disbursed' ? 'bg-green-50 text-green-700 border-green-200' :
                            r.status === 'Processed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 cb-td text-right">
                          {r.status !== 'Disbursed' && (
                            <button
                              onClick={() => { if(!payLedgerId) { alert('Select a payment account above first'); return; } disburseMut.mutate({ id: r.id }); }}
                              disabled={disburseMut.isPending}
                              className="cb-btn-primary text-xs py-1 px-2.5 rounded"
                            >Disburse</button>
                          )}
                          {r.status === 'Disbursed' && r.voucher_id && (
                            <span className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-end">
                              <Check size={12}/> Voucher #{r.voucher_id}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={7} className="px-4 py-3 cb-td text-right text-slate-700">Grand Total Net Pay:</td>
                      <td className="px-4 py-3 cb-td text-right font-black text-purple-700 font-mono">
                        ₹{fmt(salaryRecords.reduce((s,r) => s + (r.net_pay || 0), 0))}
                      </td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {salaryRecords.length === 0 && !loadingRecords && (
            <div className="cb-card py-16 text-center text-slate-400">
              <DollarSign size={32} className="mx-auto mb-3 text-slate-300"/>
              <p className="font-semibold">No salary records for {MONTHS[selMonth-1]} {selYear}</p>
              <p className="text-xs mt-1">Click "Generate Payroll" to create salary entries for all active employees.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── DISBURSEMENT REGISTER TAB ─── */}
      {activeTab === 'reports' && (
        <div className="cb-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 cb-th">Month</th>
                  <th className="px-4 py-3 cb-th">Code</th>
                  <th className="px-4 py-3 cb-th">Employee Name</th>
                  <th className="px-4 py-3 cb-th text-right">Gross</th>
                  <th className="px-4 py-3 cb-th text-right">Net Pay</th>
                  <th className="px-4 py-3 cb-th text-center">Status</th>
                  <th className="px-4 py-3 cb-th text-center">Voucher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRecords.length === 0 ? (
                  <tr><td colSpan="7" className="py-12 text-center text-slate-400">No salary records found.</td></tr>
                ) : allRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 cb-td font-semibold text-purple-700">{r.month_label}</td>
                    <td className="px-4 py-3 cb-td font-mono text-xs text-slate-500">{r.emp_code}</td>
                    <td className="px-4 py-3 cb-td font-semibold text-slate-800">{r.employee_name}</td>
                    <td className="px-4 py-3 cb-td text-right font-mono text-xs">₹{fmt(r.gross_salary)}</td>
                    <td className="px-4 py-3 cb-td text-right font-mono font-bold">₹{fmt(r.net_pay)}</td>
                    <td className="px-4 py-3 cb-td text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.status === 'Disbursed' ? 'bg-green-50 text-green-700 border-green-200' :
                        r.status === 'Processed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 cb-td text-center font-mono text-xs text-slate-400">
                      {r.voucher_id ? `#${r.voucher_id}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── EMPLOYEE MODAL ─── */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeEmpModal}>
          <form onSubmit={handleEmpSubmit}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <span className="text-sm font-bold text-slate-800">{editEmp ? 'Edit Employee' : 'Add New Employee'}</span>
              <button type="button" onClick={closeEmpModal} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ['emp_code',    'Employee Code *', 'text', true],
                ['full_name',   'Full Name *',     'text', true],
                ['designation', 'Designation',     'text', false],
              ].map(([key, label, type, required]) => (
                <label key={key} className={`flex flex-col gap-1 ${key === 'full_name' ? 'col-span-2' : ''}`}>
                  <span className="cb-label text-xs">{label}</span>
                  <input required={required} type={type} value={empForm[key] || ''}
                    onChange={e => setEmpForm({ ...empForm, [key]: e.target.value })}
                    className="cb-input text-xs py-1.5 px-2.5" disabled={editEmp && key === 'emp_code'} />
                </label>
              ))}
              <label className="flex flex-col gap-1">
                <span className="cb-label text-xs">Department</span>
                <select value={empForm.department || ''} onChange={e => setEmpForm({ ...empForm, department: e.target.value })}
                  className="cb-input text-xs py-1.5 px-2.5">
                  <option value="">— Select —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>

              <label className="flex flex-col gap-1"><span className="cb-label text-xs">Joining Date</span>
                <input type="date" value={empForm.joining_date || ''} onChange={e => setEmpForm({ ...empForm, joining_date: e.target.value })}
                  className="cb-input text-xs py-1.5 px-2.5" /></label>
              <label className="flex flex-col gap-1"><span className="cb-label text-xs">Status</span>
                <select value={empForm.status} onChange={e => setEmpForm({ ...empForm, status: e.target.value })}
                  className="cb-input text-xs py-1.5 px-2.5">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select></label>
            </div>

            {/* Salary */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Salary Components (Monthly ₹)</p>
              <div className="grid grid-cols-2 gap-3">
                {[['basic_salary','Basic Salary'],['hra','HRA'],['other_allowances','Other Allowances'],
                  ['pf_deduction','PF Deduction'],['professional_tax','Professional Tax']].map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1">
                    <span className="cb-label text-xs">{label}</span>
                    <input type="number" min="0" step="0.01" value={empForm[key] || 0}
                      onChange={e => setEmpForm({ ...empForm, [key]: e.target.value })}
                      className="cb-input text-xs py-1.5 px-2.5 font-mono" />
                  </label>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bank Details (for disbursement)</p>
              <div className="grid grid-cols-2 gap-3">
                {[['bank_account','Account Number'],['ifsc_code','IFSC Code'],['bank_name','Bank Name']].map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1">
                    <span className="cb-label text-xs">{label}</span>
                    <input type="text" value={empForm[key] || ''} onChange={e => setEmpForm({ ...empForm, [key]: e.target.value })}
                      className="cb-input text-xs py-1.5 px-2.5 font-mono" />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-slate-100">
              <button type="button" onClick={closeEmpModal} className="cb-btn-secondary text-xs py-1.5 px-3">Cancel</button>
              <button type="submit" disabled={createEmp.isPending || updateEmp.isPending}
                className="cb-btn-primary text-xs py-1.5 px-3">
                <Check size={13}/>{editEmp ? 'Save Changes' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
