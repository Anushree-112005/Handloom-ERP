import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Filter, LayoutList, LayoutGrid, CheckCircle, XCircle, Clock, DollarSign, Calendar, FileText, Upload, X, Save, Eye, Trash2, Edit2 } from 'lucide-react';
import { fetchExpenseClaims, createExpenseClaim, updateExpenseClaim, deleteExpenseClaim, fetchEmployees } from '../../../services/hrService';

const expenseCategories = ['Travel', 'Food & Meals', 'Accommodation', 'Office Supplies', 'Communication', 'Transportation', 'Training', 'Client Entertainment', 'Medical', 'Other'];

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Manager Approved': 'bg-blue-100 text-blue-700',
  'Finance Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Paid': 'bg-emerald-100 text-emerald-700'
};

export default function ExpenseClaims() {
  const [claims, setClaims] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewingClaim, setViewingClaim] = useState(null);

  const initialForm = {
    employee_id: '',
    employee_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    currency: 'INR',
    receipt_number: '',
    project: '',
    cost_center: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsData, empData] = await Promise.all([
        fetchExpenseClaims(),
        fetchEmployees()
      ]);
      setClaims(claimsData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.category || !form.amount) {
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
        await updateExpenseClaim(editingId, payload);
      } else {
        await createExpenseClaim(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving claim:', error);
    }
  };

  const handleEdit = (claim) => {
    setForm({
      employee_id: claim.employee_id,
      employee_name: claim.employee_name,
      expense_date: claim.expense_date,
      category: claim.category,
      description: claim.description || '',
      amount: claim.amount,
      currency: claim.currency,
      receipt_number: claim.receipt_number || '',
      project: claim.project || '',
      cost_center: claim.cost_center || ''
    });
    setEditingId(claim.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense claim?')) return;
    try {
      await deleteExpenseClaim(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStatusChange = async (id, newStatus, approvedBy = null) => {
    try {
      await updateExpenseClaim(id, { status: newStatus, approved_by: approvedBy });
      loadData();
      setViewingClaim(null);
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

  const filteredClaims = claims.filter(claim => {
    const matchesStatus = !filterStatus || claim.status === filterStatus;
    const matchesCategory = !filterCategory || claim.category === filterCategory;
    return matchesStatus && matchesCategory;
  });

  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'Pending').length,
    approved: claims.filter(c => ['Manager Approved', 'Finance Approved'].includes(c.status)).length,
    totalAmount: claims.reduce((sum, c) => sum + (c.amount || 0), 0),
    paidAmount: claims.filter(c => c.status === 'Paid').reduce((sum, c) => sum + (c.amount || 0), 0)
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div className="btn btn-secondary">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Expense Claims</h1>
          <span className="btn btn-primary">
            {filteredClaims.length} Records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                showFilters || filterStatus || filterCategory
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              Filter
              {(filterStatus || filterCategory) && (
                <span className="btn btn-primary" />
              )}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button
                    onClick={() => { setFilterStatus(''); setFilterCategory(''); setShowFilters(false); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Manager Approved">Manager Approved</option>
                      <option value="Finance Approved">Finance Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Categories</option>
                      {expenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="btn btn-secondary">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary"
          >
            <Plus size={14} /> New Claim
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

      {/* Stats Cards */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Receipt className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Claims</p>
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
              <p className="text-2xl font-bold text-slate-800">{stats.approved}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">₹{stats.totalAmount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total Amount</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">₹{stats.paidAmount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Paid Amount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Claims List View - Table */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Claim ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map(claim => (
                <tr key={claim.id} className="btn btn-secondary">
                  <td className="px-4 py-3 text-sm font-medium text-indigo-600">{claim.claim_id}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{claim.employee_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{claim.expense_date}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{claim.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 text-right font-medium">₹{claim.amount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[claim.status] || 'bg-slate-100 text-slate-600'}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewingClaim(claim)} className="btn btn-secondary">
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                      {claim.status === 'Pending' && (
                        <>
                          <button onClick={() => handleEdit(claim)} className="btn btn-secondary">
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </button>
                          <button onClick={() => handleDelete(claim.id)} className="btn btn-danger">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClaims.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No expense claims found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Claims Grid View */}
      {viewMode === 'grid' && (
        <div className="form-row">
          {filteredClaims.length === 0 ? (
            <div className="btn btn-secondary">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No expense claims found</p>
            </div>
          ) : filteredClaims.map(claim => (
            <div key={claim.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-600 truncate">{claim.claim_id}</p>
                  <p className="text-xs text-slate-700 truncate mt-0.5">{claim.employee_name}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[claim.status] || 'bg-slate-100 text-slate-600'}`}>
                  {claim.status}
                </span>
              </div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-700">{claim.category}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-600">{claim.expense_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Amount</span>
                  <span className="text-lg font-bold text-slate-800">₹{claim.amount?.toLocaleString()}</span>
                </div>
              </div>
              <div className="btn btn-secondary">
                <button onClick={() => setViewingClaim(claim)} className="btn btn-secondary">
                  <Eye className="w-3 h-3" /> View
                </button>
                {claim.status === 'Pending' && (
                  <>
                    <button onClick={() => handleEdit(claim)} className="btn btn-secondary">
                      <Edit2 className="w-3 h-3 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(claim.id)} className="btn btn-danger">
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
      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Expense Claim</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                <select
                  value={form.employee_id}
                  onChange={handleEmployeeChange}
                  className="form-control"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Category</option>
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Brief description of expense..."
                />
              </div>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="form-control"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Receipt #</label>
                  <input
                    type="text"
                    value={form.receipt_number}
                    onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
                    className="form-control"
                    placeholder="Receipt number"
                  />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                  <input
                    type="text"
                    value={form.project}
                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="form-control"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost Center</label>
                  <input
                    type="text"
                    value={form.cost_center}
                    onChange={(e) => setForm({ ...form, cost_center: e.target.value })}
                    className="form-control"
                    placeholder="Cost center code"
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

      {/* View/Approve Modal */}
      {viewingClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">Expense Claim Details</h2>
              <button onClick={() => setViewingClaim(null)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-indigo-600">{viewingClaim.claim_id}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[viewingClaim.status]}`}>
                  {viewingClaim.status}
                </span>
              </div>
              
              <div className="form-row">
                <div>
                  <span className="text-xs text-slate-500">Employee</span>
                  <p className="font-medium">{viewingClaim.employee_name}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Expense Date</span>
                  <p className="font-medium">{viewingClaim.expense_date}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Category</span>
                  <p className="font-medium">{viewingClaim.category}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Amount</span>
                  <p className="font-bold text-lg text-slate-800">₹{viewingClaim.amount?.toLocaleString()}</p>
                </div>
              </div>
              
              {viewingClaim.description && (
                <div className="pt-4 border-t">
                  <span className="text-xs text-slate-500">Description</span>
                  <p className="text-sm text-slate-600 mt-1">{viewingClaim.description}</p>
                </div>
              )}
              
              {viewingClaim.project && (
                <div className="form-row">
                  <div>
                    <span className="text-xs text-slate-500">Project</span>
                    <p className="font-medium">{viewingClaim.project}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Cost Center</span>
                    <p className="font-medium">{viewingClaim.cost_center || '—'}</p>
                  </div>
                </div>
              )}
              
              {viewingClaim.approved_by && (
                <div className="pt-4 border-t">
                  <span className="text-xs text-slate-500">Approved By</span>
                  <p className="font-medium">{viewingClaim.approved_by}</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons based on status */}
            {viewingClaim.status === 'Pending' && (
              <div className="btn btn-secondary">
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Rejected')}
                  className="btn btn-danger"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Manager Approved', 'HR Admin')}
                  className="btn btn-success"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
            {viewingClaim.status === 'Manager Approved' && (
              <div className="btn btn-secondary">
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Finance Approved', 'Finance Admin')}
                  className="btn btn-primary"
                >
                  <CheckCircle className="w-4 h-4" /> Finance Approve
                </button>
              </div>
            )}
            {viewingClaim.status === 'Finance Approved' && (
              <div className="btn btn-secondary">
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Paid')}
                  className="btn btn-success"
                >
                  <DollarSign className="w-4 h-4" /> Mark as Paid
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
