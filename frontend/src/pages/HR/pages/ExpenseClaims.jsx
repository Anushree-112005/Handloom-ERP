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
    <div className="animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, height: '100%', minHeight: 'calc(100vh - 80px)' }}>
      {!showForm && (
        <>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Receipt size={24} color="var(--primary)" /> Expense Claims
              </h2>
              <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
                {filteredClaims.length} Records
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
              >
                <Plus size={14} /> New Claim
              </button>
            </div>
          </div>

      {/* DATA AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Total Claims</p>
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
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.approved}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Approved</p>
            </div>
          </div>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>₹{stats.totalAmount.toLocaleString()}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Total Amount</p>
            </div>
          </div>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: '#10b98118', color: '#047857', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>₹{stats.paidAmount.toLocaleString()}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Paid Amount</p>
            </div>
          </div>
        </div>

      {/* Claims List View - Table */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Claim ID</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Employee</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Category</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Amount</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map(claim => (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{claim.claim_id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{claim.employee_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{claim.expense_date}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{claim.category}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{claim.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: claim.status === 'Paid' || claim.status === 'Finance Approved' ? '#10b98118' : claim.status === 'Manager Approved' ? '#3b82f618' : claim.status === 'Rejected' ? '#ef444418' : '#f59e0b18',
                        color: claim.status === 'Paid' || claim.status === 'Finance Approved' ? '#047857' : claim.status === 'Manager Approved' ? '#1d4ed8' : claim.status === 'Rejected' ? '#b91c1c' : '#b45309'
                      }}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button onClick={() => setViewingClaim(claim)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }} title="View">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        {claim.status === 'Pending' && (
                          <>
                            <button onClick={() => handleEdit(claim)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }} title="Edit">
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </button>
                            <button onClick={() => handleDelete(claim.id)} className="btn btn-danger" style={{ padding: 6, borderRadius: '50%', background: '#fef2f2', border: '1px solid #ef444430' }} title="Delete">
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
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredClaims.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500" style={{ margin: 0 }}>No expense claims found</p>
            </div>
          ) : filteredClaims.map(claim => (
            <div key={claim.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{claim.claim_id}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{claim.employee_name}</p>
                  </div>
                  <span style={{ 
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: claim.status === 'Paid' || claim.status === 'Finance Approved' ? '#10b98118' : claim.status === 'Manager Approved' ? '#3b82f618' : claim.status === 'Rejected' ? '#ef444418' : '#f59e0b18',
                    color: claim.status === 'Paid' || claim.status === 'Finance Approved' ? '#047857' : claim.status === 'Manager Approved' ? '#1d4ed8' : claim.status === 'Rejected' ? '#b91c1c' : '#b45309'
                  }}>{claim.status}</span>
                </div>
                <div className="space-y-1.5" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Category</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{claim.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{claim.expense_date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>₹{claim.amount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <button onClick={() => setViewingClaim(claim)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 12px', fontSize: 12, flex: 1 }}>
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                {claim.status === 'Pending' && (
                  <>
                    <button onClick={() => handleEdit(claim)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(claim.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
      {/* Create/Edit Form Inline */}
      {showForm && (
        <form className="card" style={{ padding: 0 }} onSubmit={(e) => e.preventDefault()}>
          {/* Form Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit Expense Claim' : 'New Expense Claim'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X className="w-4 h-4" /> Close
              </button>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="form-group">
              <label>Employee *</label>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Expense Date *</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
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
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="form-control"
                placeholder="Brief description of expense..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="form-control"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Receipt #</label>
                <input
                  type="text"
                  value={form.receipt_number}
                  onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
                  className="form-control"
                  placeholder="Receipt number"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Project</label>
                <input
                  type="text"
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  className="form-control"
                  placeholder="Project name"
                />
              </div>
              <div className="form-group">
                <label>Cost Center</label>
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
        </form>
      )}

      {/* View/Approve Modal */}
      {viewingClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Expense Claim Details</h2>
              <button onClick={() => setViewingClaim(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>{viewingClaim.claim_id}</span>
                <span style={{ 
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: viewingClaim.status === 'Paid' || viewingClaim.status === 'Finance Approved' ? '#10b98118' : viewingClaim.status === 'Manager Approved' ? '#3b82f618' : viewingClaim.status === 'Rejected' ? '#ef444418' : '#f59e0b18',
                  color: viewingClaim.status === 'Paid' || viewingClaim.status === 'Finance Approved' ? '#047857' : viewingClaim.status === 'Manager Approved' ? '#1d4ed8' : viewingClaim.status === 'Rejected' ? '#b91c1c' : '#b45309'
                }}>{viewingClaim.status}</span>
              </div>
              
              <div className="space-y-3 text-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-slate-500">Employee</span><span className="font-semibold text-slate-800">{viewingClaim.employee_name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-slate-500">Expense Date</span><span className="font-semibold text-slate-800">{viewingClaim.expense_date}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-slate-500">Category</span><span className="font-semibold text-slate-800">{viewingClaim.category}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-slate-500">Amount</span><span className="font-bold text-emerald-600 text-lg">₹{viewingClaim.amount?.toLocaleString()}</span></div>
              </div>
              
              {viewingClaim.description && (
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs text-slate-500">Description</span>
                  <p className="text-sm text-slate-600 mt-1" style={{ margin: 0 }}>{viewingClaim.description}</p>
                </div>
              )}
              
              {viewingClaim.project && (
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span className="text-xs text-slate-500">Project</span>
                    <p className="font-semibold text-slate-800" style={{ margin: 0 }}>{viewingClaim.project}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Cost Center</span>
                    <p className="font-semibold text-slate-800" style={{ margin: 0 }}>{viewingClaim.cost_center || '—'}</p>
                  </div>
                </div>
              )}
              
              {viewingClaim.approved_by && (
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs text-slate-500">Approved By</span>
                  <p className="font-semibold text-slate-800" style={{ margin: 0 }}>{viewingClaim.approved_by}</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons based on status */}
            {viewingClaim.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Rejected')}
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Manager Approved', 'HR Admin')}
                  className="btn btn-success"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', borderColor: '#10b981' }}
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
            {viewingClaim.status === 'Manager Approved' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Finance Approved', 'Finance Admin')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle className="w-4 h-4" /> Finance Approve
                </button>
              </div>
            )}
            {viewingClaim.status === 'Finance Approved' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
                <button 
                  onClick={() => handleStatusChange(viewingClaim.id, 'Paid')}
                  className="btn btn-success"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', borderColor: '#10b981' }}
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
