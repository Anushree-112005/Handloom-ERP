import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Search, Calendar, CheckCircle, XCircle, Clock, X, Save, Eye, Edit2, Trash2, DollarSign, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { fetchLoans, createLoan, updateLoan, deleteLoan, fetchEmployees, fetchPayroll } from '../../../services/hrService';

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
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewingLoan, setViewingLoan] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('');

  const initialForm = {
    employee_id: '',
    employee_name: '',
    loan_type: '',
    amount: '',
    purpose: '',
    guarantor_name: '',
    guarantor_contact: '',
    applied_date: new Date().toISOString().split('T')[0]
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loanData, empData, payrollData] = await Promise.all([
        fetchLoans(),
        fetchEmployees(),
        fetchPayroll().catch(() => [])
      ]);
      setLoans(loanData);
      setEmployees(empData);
      setPayrolls(payrollData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLoanPaidAmount = (loan) => {
    if (!loan) return 0;
    const selectedEmp = employees.find(
      emp => String(emp.id) === String(loan.employee_id) || String(emp.employee_id) === String(loan.employee_id) || (emp.name && loan.employee_name && emp.name.toLowerCase() === loan.employee_name.toLowerCase())
    );
    if (!selectedEmp) return 0;
    return payrolls
      .filter(p => 
        String(p.employee) === String(selectedEmp.id) || 
        String(p.employee) === String(selectedEmp.employee_id)
      )
      .reduce((sum, p) => sum + (Number(p.loan_amount) || 0), 0);
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.loan_type || !form.amount) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        ...form,
        employee_id: parseInt(form.employee_id),
        amount: parseFloat(form.amount)
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
      purpose: loan.purpose || '',
      guarantor_name: loan.guarantor_name || '',
      guarantor_contact: loan.guarantor_contact || '',
      applied_date: loan.applied_date || new Date().toISOString().split('T')[0]
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

        {/* RIGHT: New Loan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Employee</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Type</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Full Amount</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Paid Amount</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Balance Amount</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Status</th>
                  <th className="px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
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
                      <span className="text-sm font-medium text-emerald-600">₹{getLoanPaidAmount(loan).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-amber-600">₹{Math.max(0, loan.amount - getLoanPaidAmount(loan)).toLocaleString()}</span>
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
                    <td className="px-6 py-4 text-right" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => setViewingLoan(loan)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button onClick={() => handleEdit(loan)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }} title="Edit">
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(loan.id)} className="btn btn-danger" style={{ padding: 6, borderRadius: '50%', background: '#fef2f2', border: '1px solid #ef444430' }} title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
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
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loan.employee_name}</p>
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
                    <span style={{ color: 'var(--text-muted)' }}>Full Amount</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{loan.amount?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Paid Amount</span>
                    <span style={{ fontWeight: 600, color: '#10b981' }}>₹{getLoanPaidAmount(loan).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Balance Amount</span>
                    <span style={{ fontWeight: 700, color: '#b45309' }}>₹{Math.max(0, loan.amount - getLoanPaidAmount(loan)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <button onClick={() => setViewingLoan(loan)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', fontSize: 12, flex: 1 }}>
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => handleEdit(loan)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(loan.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
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
        <form className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }} onSubmit={(e) => e.preventDefault()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
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
          
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
            <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Loan Details
            </legend>

            <div className="form-row">
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
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
            </div>

            <div className="form-row">
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
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={form.applied_date}
                  onChange={(e) => setForm({ ...form, applied_date: e.target.value })}
                  className="form-control"
                  required
                />
              </div>
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
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label>Purpose</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Reason for loan..."
                />
              </div>
            </div>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
          </fieldset>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Full Amount</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>₹{viewingLoan.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Applied On</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(viewingLoan.applied_date)}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Paid Amount</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 700, color: '#10b981' }}>₹{getLoanPaidAmount(viewingLoan).toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Balance Amount</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 700, color: '#b45309' }}>₹{Math.max(0, viewingLoan.amount - getLoanPaidAmount(viewingLoan)).toLocaleString()}</p>
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

    </div>
  );
}
