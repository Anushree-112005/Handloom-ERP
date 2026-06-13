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
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + record count */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">LOANS & ADVANCES</h1>
          <span className="btn btn-primary">
            {filteredLoans.length} Records
          </span>
        </div>

        {/* RIGHT: Filter dropdown + view toggle + EMI Calculator + New Loan */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {(filterStatus || filterType) && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => { setFilterStatus(''); setFilterType(''); }} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control">
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Disbursed">Disbursed</option>
                      <option value="Repaying">Repaying</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Loan Type</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                      className="form-control">
                      <option value="">All Types</option>
                      {loanTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="btn btn-secondary">
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutList size={16} />
            </button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <LayoutGrid size={16} />
            </button>
          </div>

          <button onClick={() => setShowCalculator(true)}
            className="btn btn-secondary">
            <Calculator className="w-4 h-4" /> EMI Calculator
          </button>

          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Loan
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

      {/* Stats */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Loans</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
              <p className="text-xs text-slate-500">Active Loans</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">₹{(stats.totalAmount / 100000).toFixed(1)}L</p>
              <p className="text-xs text-slate-500">Outstanding</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table - List View */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
            <thead className="btn btn-secondary">
              <tr>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Loan ID</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Employee</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Type</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Amount</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">EMI</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Tenure</th>
                <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500">Status</th>
                <th className="text-right px-6 py-4 text-xs uppercase font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map(loan => (
                <tr key={loan.id} className="btn btn-secondary">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-indigo-600">{loan.loan_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{loan.employee_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{loan.loan_type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">₹{loan.amount?.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">₹{loan.emi_amount?.toLocaleString()}/mo</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{loan.tenure_months} months</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[loan.status]}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewingLoan(loan)} className="btn btn-secondary">
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                      {loan.status === 'Pending' && (
                        <>
                          <button onClick={() => handleEdit(loan)} className="btn btn-secondary">
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </button>
                          <button onClick={() => handleDelete(loan.id)} className="btn btn-danger">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No loans found</p>
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
        <div className="form-row">
          {filteredLoans.length === 0 ? (
            <div className="btn btn-secondary">
              <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No loans found</p>
            </div>
          ) : filteredLoans.map(loan => (
            <div key={loan.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-600 truncate">{loan.loan_id}</p>
                  <p className="text-sm text-slate-700 truncate mt-1">{loan.employee_name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[loan.status]}`}>
                  {loan.status}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-700">{loan.loan_type}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-semibold text-slate-800">₹{loan.amount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">EMI</span>
                  <span className="font-medium text-green-600">₹{loan.emi_amount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Tenure</span>
                  <span className="font-medium">{loan.tenure_months} months</span>
                </div>
              </div>
              <div className="btn btn-secondary">
                <button onClick={() => setViewingLoan(loan)} className="btn btn-secondary">
                  <Eye className="w-3 h-3" /> View
                </button>
                {loan.status === 'Pending' && (
                  <>
                    <button onClick={() => handleEdit(loan)} className="btn btn-secondary">
                      <Edit2 className="w-3 h-3 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(loan.id)} className="btn btn-danger">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Loan Request</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loan Type *</label>
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
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="form-control"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.interest_rate}
                    onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                    className="form-control"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (months) *</label>
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
                <div className="btn btn-primary">
                  <p className="text-sm text-indigo-600">Calculated EMI</p>
                  <p className="text-2xl font-bold text-indigo-700">₹{calculatedEMI.toLocaleString()}/month</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Reason for loan..."
                />
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Guarantor Name</label>
                  <input
                    type="text"
                    value={form.guarantor_name}
                    onChange={(e) => setForm({ ...form, guarantor_name: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Guarantor Contact</label>
                  <input
                    type="text"
                    value={form.guarantor_contact}
                    onChange={(e) => setForm({ ...form, guarantor_contact: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
            <div className="btn btn-secondary">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">Loan Details</h2>
              <button onClick={() => setViewingLoan(null)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-indigo-600">{viewingLoan.loan_id}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[viewingLoan.status]}`}>
                  {viewingLoan.status}
                </span>
              </div>
              
              <div className="form-row">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Employee</p>
                  <p className="font-semibold">{viewingLoan.employee_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Loan Type</p>
                  <p className="font-semibold">{viewingLoan.loan_type}</p>
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Amount</p>
                  <p className="text-xl font-bold text-slate-800">₹{viewingLoan.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Interest</p>
                  <p className="text-xl font-bold text-slate-800">{viewingLoan.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">EMI</p>
                  <p className="text-xl font-bold text-green-600">₹{viewingLoan.emi_amount?.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tenure</p>
                  <p className="font-medium">{viewingLoan.tenure_months} months</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Applied On</p>
                  <p className="font-medium">{formatDate(viewingLoan.applied_date)}</p>
                </div>
              </div>
              
              {viewingLoan.purpose && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-500 mb-1">Purpose</p>
                  <p className="text-slate-700">{viewingLoan.purpose}</p>
                </div>
              )}
            </div>
            
            {viewingLoan.status === 'Pending' && (
              <div className="btn btn-secondary">
                <button 
                  onClick={() => handleStatusChange(viewingLoan.id, 'Rejected')}
                  className="btn btn-danger"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleStatusChange(viewingLoan.id, 'Approved')}
                  className="btn btn-success"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
            {viewingLoan.status === 'Approved' && (
              <div className="btn btn-secondary">
                <button 
                  onClick={() => handleStatusChange(viewingLoan.id, 'Disbursed')}
                  className="btn btn-primary"
                >
                  <DollarSign className="w-4 h-4" /> Mark Disbursed
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMI Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">EMI Calculator</h2>
              <button onClick={() => setShowCalculator(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Principal Amount (₹)</label>
                <input
                  type="number"
                  id="calcAmount"
                  className="form-control"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (% per annum)</label>
                <input
                  type="number"
                  id="calcRate"
                  step="0.5"
                  className="form-control"
                  placeholder="12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (months)</label>
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
                className="form-control"
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
