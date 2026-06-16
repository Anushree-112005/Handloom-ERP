import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Search, Calendar, CheckCircle, XCircle, Clock, X, Save, Eye, Edit2, Trash2, DollarSign, Calculator, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchLoans, createLoan, updateLoan, deleteLoan, fetchEmployees } from '../../../services/hrService';

const loanTypes = ['Personal Loan', 'Salary Advance', 'Emergency Loan', 'Education Loan', 'Housing Loan', 'Vehicle Loan'];

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Disbursed': 'bg-blue-100 text-blue-700',
  'Repaying': 'bg-purple-100 text-purple-700',
  'Closed': 'bg-slate-100 text-slate-600'
};

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingLoan, setViewingLoan] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('');

  const initialForm = {
    employee_id: '',
    employee_name: '',
    loan_type: '',
    amount: '',
    interest_rate: '0',
    tenure_months: '12',
    purpose: '',
    guarantor_name: '',
    guarantor_contact: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loanData, empData] = await Promise.all([
        fetchLoans(),
        fetchEmployees()
      ]);
      setLoans(loanData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.loan_type || !form.amount || !form.tenure_months) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        ...form,
        employee_id: parseInt(form.employee_id),
        amount: parseFloat(form.amount),
        interest_rate: parseFloat(form.interest_rate) || 0,
        tenure_months: parseInt(form.tenure_months),
        emi_amount: calculateEMI(parseFloat(form.amount), parseFloat(form.interest_rate), parseInt(form.tenure_months))
      };

      if (editingId) {
        await updateLoan(editingId, payload);
      } else {
        await createLoan(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  const handleEdit = (loan) => {
    setForm({
      employee_id: loan.employee_id,
      employee_name: loan.employee_name,
      loan_type: loan.loan_type,
      amount: loan.amount,
      interest_rate: loan.interest_rate || 0,
      tenure_months: loan.tenure_months,
      purpose: loan.purpose || '',
      guarantor_name: loan.guarantor_name || '',
      guarantor_contact: loan.guarantor_contact || ''
    });
    setEditingId(loan.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this loan record?')) return;
    try {
      await deleteLoan(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateLoan(id, { status: newStatus });
      loadData();
      setViewingLoan(null);
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
      employee_name: emp?.name || ''
    });
  };

  const calculateEMI = (principal, rate, months) => {
    if (rate === 0) return principal / months;
    const r = rate / 12 / 100;
    const emi = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
    return Math.round(emi);
  };

  const filteredLoans = loans.filter(loan => {
    const matchesStatus = !filterStatus || loan.status === filterStatus;
    const matchesType = !filterType || loan.loan_type === filterType;
    return matchesStatus && matchesType;
  });

  const stats = {
    total: loans.length,
    pending: loans.filter(l => l.status === 'Pending').length,
    active: loans.filter(l => ['Disbursed', 'Repaying'].includes(l.status)).length,
    totalAmount: loans.filter(l => ['Disbursed', 'Repaying'].includes(l.status)).reduce((sum, l) => sum + (l.amount || 0), 0)
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const calculatedEMI = form.amount && form.tenure_months 
    ? calculateEMI(parseFloat(form.amount), parseFloat(form.interest_rate) || 0, parseInt(form.tenure_months))
    : 0;

  return (
    <div className="animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 'calc(100vh - 80px)' }}>
      {!showForm && (
        <>
          {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Wallet size={24} color="var(--primary)" /> Loans & Advances
          </h2>
          <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
            {filteredLoans.length} Records
          </span>
        </div>

        {/* RIGHT: EMI Calculator + New Loan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setShowCalculator(true)}
            className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
            <Calculator className="w-4 h-4" /> EMI Calculator
          </button>

          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
            <Plus className="w-4 h-4" /> New Loan
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Total Loans</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#f59e0b18', color: '#b45309', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.pending}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Pending</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#10b98118', color: '#047857', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.active}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Active Loans</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>₹{(stats.totalAmount / 100000).toFixed(1)}L</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Outstanding</p>
          </div>
        </div>
      </div>

      {/* Loans Table - List View */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Loan ID</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Employee</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Type</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Amount</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">EMI</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Tenure</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Status</th>
                  <th className="text-right px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-indigo-600">{loan.loan_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-800">{loan.employee_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{loan.loan_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-800">₹{loan.amount?.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">₹{loan.emi_amount?.toLocaleString()}/mo</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{loan.tenure_months} months</span>
                    </td>
                    <td className="px-6 py-4">
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: loan.status === 'Approved' || loan.status === 'Disbursed' || loan.status === 'Repaying' ? '#10b98118' : loan.status === 'Pending' ? '#f59e0b18' : loan.status === 'Rejected' ? '#ef444418' : '#64748b18',
                        color: loan.status === 'Approved' || loan.status === 'Disbursed' || loan.status === 'Repaying' ? '#047857' : loan.status === 'Pending' ? '#b45309' : loan.status === 'Rejected' ? '#b91c1c' : '#475569'
                      }}>{loan.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => setViewingLoan(loan)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        {loan.status === 'Pending' && (
                          <>
                            <button onClick={() => handleEdit(loan)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button onClick={() => handleDelete(loan.id)} className="btn btn-danger" style={{ padding: 6, borderRadius: '50%', background: '#fef2f2', border: '1px solid #ef444430' }}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      No loans found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loans Grid - Grid View */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredLoans.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
              <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500" style={{ margin: 0 }}>No loans found</p>
            </div>
          ) : filteredLoans.map(loan => (
            <div key={loan.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', itemsStart: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{loan.loan_id}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loan.employee_name}</p>
                  </div>
                  <span style={{ 
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: loan.status === 'Approved' || loan.status === 'Disbursed' || loan.status === 'Repaying' ? '#10b98118' : loan.status === 'Pending' ? '#f59e0b18' : loan.status === 'Rejected' ? '#ef444418' : '#64748b18',
                    color: loan.status === 'Approved' || loan.status === 'Disbursed' || loan.status === 'Repaying' ? '#047857' : loan.status === 'Pending' ? '#b45309' : loan.status === 'Rejected' ? '#b91c1c' : '#475569'
                  }}>{loan.status}</span>
                </div>
                <div className="space-y-2" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Type</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loan.loan_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{loan.amount?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>EMI</span>
                    <span style={{ fontWeight: 600, color: 'var(--emerald)' }}>₹{loan.emi_amount?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tenure</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{loan.tenure_months} months</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <button onClick={() => setViewingLoan(loan)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', fontSize: 12, flex: 1 }}>
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                {loan.status === 'Pending' && (
                  <>
                    <button onClick={() => handleEdit(loan)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(loan.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      </div>{/* END DATA AREA */}
        </>
      )}

      {/* Form Inline */}
      {showForm && (
        <form className="card" style={{ padding: 0 }} onSubmit={(e) => e.preventDefault()}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit Loan Request' : 'New Loan Request'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Submit'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X className="w-5 h-5" /> Close
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Employee *</label>
                <select
                  value={form.employee_id}
                  onChange={handleEmployeeChange}
                  className="form-control"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Loan Type *</label>
                <select
                  value={form.loan_type}
                  onChange={(e) => setForm({ ...form, loan_type: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select Type</option>
                  {loanTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="form-control"
                  placeholder="50000"
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.interest_rate}
                  onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                  className="form-control"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Tenure (months) *</label>
                <input
                  type="number"
                  value={form.tenure_months}
                  onChange={(e) => setForm({ ...form, tenure_months: e.target.value })}
                  className="form-control"
                  placeholder="12"
                />
              </div>
            </div>
            
            {calculatedEMI > 0 && (
              <div style={{ background: '#4f46e510', border: '1px solid #4f46e520', padding: 12, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Calculated EMI</p>
                <p style={{ margin: 0, fontSize: 18, fontStyle: 'normal', fontWeight: 800, color: 'var(--primary)' }}>₹{calculatedEMI.toLocaleString()}/month</p>
              </div>
            )}
            
            <div className="form-group">
              <label>Purpose</label>
              <textarea
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                rows={2}
                className="form-control"
                placeholder="Reason for loan..."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Guarantor Name</label>
                <input
                  type="text"
                  value={form.guarantor_name}
                  onChange={(e) => setForm({ ...form, guarantor_name: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Guarantor Contact</label>
                <input
                  type="text"
                  value={form.guarantor_contact}
                  onChange={(e) => setForm({ ...form, guarantor_contact: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* View Modal */}
      {viewingLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 animate-fade">
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Loan Details</h2>
              <button onClick={() => setViewingLoan(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{viewingLoan.loan_id}</span>
                <span style={{ 
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: viewingLoan.status === 'Approved' || viewingLoan.status === 'Disbursed' || viewingLoan.status === 'Repaying' ? '#10b98118' : viewingLoan.status === 'Pending' ? '#f59e0b18' : viewingLoan.status === 'Rejected' ? '#ef444418' : '#64748b18',
                  color: viewingLoan.status === 'Approved' || viewingLoan.status === 'Disbursed' || viewingLoan.status === 'Repaying' ? '#047857' : viewingLoan.status === 'Pending' ? '#b45309' : viewingLoan.status === 'Rejected' ? '#b91c1c' : '#475569'
                }}>{viewingLoan.status}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Employee</p>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: 'var(--text-primary)' }}>{viewingLoan.employee_name}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Loan Type</p>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: 'var(--text-primary)' }}>{viewingLoan.loan_type}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Amount</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>₹{viewingLoan.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Interest</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{viewingLoan.interest_rate}%</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>EMI</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 700, color: 'var(--emerald)' }}>₹{viewingLoan.emi_amount?.toLocaleString()}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Tenure</p>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 500, color: 'var(--text-primary)' }}>{viewingLoan.tenure_months} months</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Applied On</p>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 500, color: 'var(--text-primary)' }}>{formatDate(viewingLoan.applied_date)}</p>
                </div>
              </div>
              
              {viewingLoan.purpose && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Purpose</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-primary)' }}>{viewingLoan.purpose}</p>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
              {viewingLoan.status === 'Pending' && (
                <>
                  <button 
                    onClick={() => handleStatusChange(viewingLoan.id, 'Rejected')}
                    className="btn btn-danger"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button 
                    onClick={() => handleStatusChange(viewingLoan.id, 'Approved')}
                    className="btn btn-success"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                </>
              )}
              {viewingLoan.status === 'Approved' && (
                <button 
                  onClick={() => handleStatusChange(viewingLoan.id, 'Disbursed')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <DollarSign className="w-4 h-4" /> Mark Disbursed
                </button>
              )}
              <button onClick={() => setViewingLoan(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMI Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 animate-fade">
          <div className="card" style={{ width: '100%', maxWidth: 450, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>EMI Calculator</h2>
              <button onClick={() => setShowCalculator(false)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="form-group">
                <label>Principal Amount (₹)</label>
                <input
                  type="number"
                  id="calcAmount"
                  className="form-control"
                  placeholder="100000"
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (% per annum)</label>
                <input
                  type="number"
                  id="calcRate"
                  step="0.5"
                  className="form-control"
                  placeholder="12"
                />
              </div>
              <div className="form-group">
                <label>Tenure (months)</label>
                <input
                  type="number"
                  id="calcTenure"
                  className="form-control"
                  placeholder="12"
                />
              </div>
              
              <button
                onClick={() => {
                  const amt = parseFloat(document.getElementById('calcAmount').value);
                  const rate = parseFloat(document.getElementById('calcRate').value);
                  const months = parseInt(document.getElementById('calcTenure').value);
                  if (amt && months) {
                    const emi = calculateEMI(amt, rate || 0, months);
                    const totalPayment = emi * months;
                    const totalInterest = totalPayment - amt;
                    alert(`EMI: ₹${emi.toLocaleString()}\nTotal Payment: ₹${totalPayment.toLocaleString()}\nTotal Interest: ₹${totalInterest.toLocaleString()}`);
                  }
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: 12 }}
              >
                Calculate EMI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
