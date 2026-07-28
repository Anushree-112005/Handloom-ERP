import React, { useState, useEffect } from 'react';
import { Heart, Plus, Filter, LayoutList, LayoutGrid, CheckCircle, X, Save, Eye, Edit2, Trash2, Users, DollarSign, Shield, Baby, Search, RefreshCw, User } from 'lucide-react';
import { fetchBenefits, createBenefit, updateBenefit, deleteBenefit, fetchEmployees } from '../../../services/hrService';

const benefitTypes = [
  { name: 'Health Insurance', icon: Shield, color: 'indigo' },
  { name: 'Life Insurance', icon: Heart, color: 'red' },
  { name: 'Provident Fund', icon: DollarSign, color: 'green' },
  { name: 'Gratuity', icon: DollarSign, color: 'purple' },
  { name: 'Maternity Leave', icon: Baby, color: 'pink' },
  { name: 'Paternity Leave', icon: Users, color: 'blue' },
  { name: 'Medical Allowance', icon: Heart, color: 'red' },
  { name: 'Food Allowance', icon: Heart, color: 'orange' },
  { name: 'Transport Allowance', icon: Heart, color: 'teal' },
  { name: 'Education Allowance', icon: Heart, color: 'yellow' }
];

const statusColors = {
  'Active': 'bg-green-100 text-green-700',
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Expired': 'bg-red-100 text-red-700',
  'Cancelled': 'bg-slate-100 text-slate-600'
};

export default function Benefits() {
  const [benefits, setBenefits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const initialForm = {
    employee_id: '',
    employee_name: '',
    benefit_type: '',
    description: '',
    coverage_amount: '',
    employer_contribution: '',
    employee_contribution: '',
    start_date: '',
    end_date: '',
    provider_name: '',
    policy_number: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [benefitData, empData] = await Promise.all([
        fetchBenefits(),
        fetchEmployees()
      ]);
      setBenefits(benefitData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.benefit_type) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        ...form,
        employee_id: parseInt(form.employee_id),
        coverage_amount: parseFloat(form.coverage_amount) || 0,
        employer_contribution: parseFloat(form.employer_contribution) || 0,
        employee_contribution: parseFloat(form.employee_contribution) || 0
      };

      if (editingId) {
        await updateBenefit(editingId, payload);
      } else {
        await createBenefit(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving benefit:', error);
    }
  };

  const handleEdit = (benefit) => {
    setForm({
      employee_id: benefit.employee_id,
      employee_name: benefit.employee_name,
      benefit_type: benefit.benefit_type,
      description: benefit.description || '',
      coverage_amount: benefit.coverage_amount || '',
      employer_contribution: benefit.employer_contribution || '',
      employee_contribution: benefit.employee_contribution || '',
      start_date: benefit.start_date?.split('T')[0] || '',
      end_date: benefit.end_date?.split('T')[0] || '',
      provider_name: benefit.provider_name || '',
      policy_number: benefit.policy_number || ''
    });
    setEditingId(benefit.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this benefit record?')) return;
    try {
      await deleteBenefit(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
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

  const filteredBenefits = benefits.filter(b => {
    const matchesSearch = (b.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.benefit_type || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || b.benefit_type === filterType;
    const matchesStatus = !filterStatus || b.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBenefits.length / itemsPerPage);
  
  const stats = {
    total: benefits.length,
    active: benefits.filter(b => b.status === 'Active').length,
    pending: benefits.filter(b => b.status === 'Pending').length,
    totalCoverage: benefits.filter(b => b.status === 'Active').reduce((sum, b) => sum + (parseFloat(b.coverage_amount) || 0), 0)
  };
  const paginatedBenefits = filteredBenefits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                <Heart size={24} color="var(--primary)" /> Benefits Management
              </h2>
              <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
                {filteredBenefits.length} Records
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
                <Plus className="w-4 h-4" /> Add Benefit
              </button>
            </div>
          </div>

      {/* DATA AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Heart size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Benefits</h3>
              <div className="value">{stats.total}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-details">
              <h3>Active Benefits</h3>
              <div className="value">{stats.active}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Shield size={24} />
            </div>
            <div className="stat-details">
              <h3>Pending</h3>
              <div className="value">{stats.pending}</div>
            </div>
          </div>
          <div className="card stat-card" style={{ border: 'none', transition: 'all 0.2s' }}>
            <div className="stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-details">
              <h3>Total Coverage</h3>
              <div className="value">₹{(stats.totalCoverage / 100000).toFixed(1)}L</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card" style={{ padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', border: 'none' }}>
          <div className="flex-1" style={{ minWidth: 300, position: 'relative' }}>
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Employee or Benefit Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 44, width: '100%', height: 42, background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 200, height: 42, background: '#f8fafc', border: '1px solid #e2e8f0' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Benefit Types</option>
            {benefitTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <select
            className="form-control"
            style={{ width: 160, height: 42, background: '#f8fafc', border: '1px solid #e2e8f0' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button onClick={() => { setSearchTerm(''); setFilterType(''); setFilterStatus(''); }} className="btn btn-secondary" style={{ height: 42, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* Benefits List View */}
        <div className="card" style={{ padding: 0, border: 'none' }}>
          <div className="overflow-x-auto">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">Employee</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">Benefit Type</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">Coverage</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">Employer / Employee</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">Provider</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">Valid Period</th>
                  <th className="text-left px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">Status</th>
                  <th className="px-6 py-4 text-xs uppercase font-bold text-slate-500 tracking-wide">
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBenefits.map(benefit => (
                  <tr key={benefit.id} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">{benefit.employee_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{benefit.benefit_type}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600">₹{benefit.coverage_amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-slate-600">Employer: <span className="font-semibold">₹{benefit.employer_contribution?.toLocaleString()}/mo</span></span>
                        <span className="text-slate-600">Employee: <span className="font-semibold">₹{benefit.employee_contribution?.toLocaleString()}/mo</span></span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">{benefit.provider_name || '—'}</span>
                      {benefit.policy_number && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{benefit.policy_number}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(benefit.start_date)} -<br/>{formatDate(benefit.end_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ 
                        backgroundColor: benefit.status === 'Active' ? '#10b98118' : benefit.status === 'Pending' ? '#f59e0b18' : benefit.status === 'Expired' ? '#ef444418' : '#64748b18',
                        color: benefit.status === 'Active' ? '#047857' : benefit.status === 'Pending' ? '#b45309' : benefit.status === 'Expired' ? '#b91c1c' : '#475569'
                      }}>{benefit.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(benefit)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer' }} title="Edit">
                          <Edit2 size={14} color="#3b82f6" />
                        </button>
                        <button onClick={() => handleDelete(benefit.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedBenefits.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p style={{ margin: 0 }}>No benefits found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Showing <span style={{ fontWeight: 600, color: '#1e293b' }}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span style={{ fontWeight: 600, color: '#1e293b' }}>{Math.min(currentPage * itemsPerPage, filteredBenefits.length)}</span> of <span style={{ fontWeight: 600, color: '#1e293b' }}>{filteredBenefits.length}</span> results
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 6, background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#475569', fontSize: 13, fontWeight: 500, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>{/* END DATA AREA */}
        </>
      )}

      {/* Form Inline */}
      {showForm && (
        <form className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, border: 'none' }} onSubmit={(e) => e.preventDefault()}>
          {/* Form Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit Benefit' : 'Add Benefit'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X className="w-5 h-5" /> Close
              </button>
            </div>
          </div>
          
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 24, margin: 0 }}>
            <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Benefit Details
            </legend>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                <label>Benefit Type *</label>
                <select
                  value={form.benefit_type}
                  onChange={(e) => setForm({ ...form, benefit_type: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select Type</option>
                  {benefitTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{ gridColumn: 'span 4' }}>
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Benefit details..."
                />
              </div>
            </div>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label>Coverage (₹)</label>
                <input
                  type="number"
                  value={form.coverage_amount}
                  onChange={(e) => setForm({ ...form, coverage_amount: e.target.value })}
                  className="form-control"
                  placeholder="500000"
                />
              </div>
              <div className="form-group">
                <label>Employer (₹/mo)</label>
                <input
                  type="number"
                  value={form.employer_contribution}
                  onChange={(e) => setForm({ ...form, employer_contribution: e.target.value })}
                  className="form-control"
                  placeholder="1000"
                />
              </div>
              <div className="form-group">
                <label>Employee (₹/mo)</label>
                <input
                  type="number"
                  value={form.employee_contribution}
                  onChange={(e) => setForm({ ...form, employee_contribution: e.target.value })}
                  className="form-control"
                  placeholder="500"
                />
              </div>
            </div>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Provider Name</label>
                <input
                  type="text"
                  value={form.provider_name}
                  onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                  className="form-control"
                  placeholder="Insurance company"
                />
              </div>
              <div className="form-group">
                <label>Policy Number</label>
                <input
                  type="text"
                  value={form.policy_number}
                  onChange={(e) => setForm({ ...form, policy_number: e.target.value })}
                  className="form-control"
                  placeholder="POL123456"
                />
              </div>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  );
}
