import React, { useState, useEffect } from 'react';
import { Heart, Plus, Filter, LayoutList, LayoutGrid, CheckCircle, X, Save, Eye, Edit2, Trash2, Users, DollarSign, Shield, Baby } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('grid'); // grid, list

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
    const matchesType = !filterType || b.benefit_type === filterType;
    const matchesStatus = !filterStatus || b.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Group benefits by type for summary
  const benefitSummary = benefitTypes.map(type => ({
    ...type,
    count: benefits.filter(b => b.benefit_type === type.name && b.status === 'Active').length,
    total: benefits.filter(b => b.benefit_type === type.name && b.status === 'Active')
      .reduce((sum, b) => sum + (b.coverage_amount || 0), 0)
  }));

  const stats = {
    totalBenefits: benefits.length,
    activeBenefits: benefits.filter(b => b.status === 'Active').length,
    totalCoverage: benefits.filter(b => b.status === 'Active').reduce((sum, b) => sum + (b.coverage_amount || 0), 0),
    employerCost: benefits.filter(b => b.status === 'Active').reduce((sum, b) => sum + (b.employer_contribution || 0), 0)
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalBenefits}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Total Benefits</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#10b98118', color: '#047857', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.activeBenefits}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Active</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>₹{(stats.totalCoverage / 100000).toFixed(1)}L</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Total Coverage</p>
          </div>
        </div>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#f59e0b18', color: '#b45309', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>₹{(stats.employerCost / 1000).toFixed(0)}K</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Employer Cost/Mo</p>
          </div>
        </div>
      </div>
      {/* Benefit Programs Summary */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Benefit Programs</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {benefitSummary.slice(0, 5).map(type => {
            const IconComponent = type.icon;
            return (
              <div 
                key={type.name} 
                className={`p-4 rounded-lg border cursor-pointer transition-all ${filterType === type.name ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'}`}
                style={{ background: filterType === type.name ? 'rgba(79, 70, 229, 0.04)' : '#fff' }}
                onClick={() => setFilterType(filterType === type.name ? '' : type.name)}
              >
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#4f46e510', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{type.name}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{type.count}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>enrollments</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Grid View */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filteredBenefits.map(benefit => (
            <div key={benefit.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', itemsStart: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <span style={{ 
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: benefit.status === 'Active' ? '#10b98118' : benefit.status === 'Pending' ? '#f59e0b18' : benefit.status === 'Expired' ? '#ef444418' : '#64748b18',
                      color: benefit.status === 'Active' ? '#047857' : benefit.status === 'Pending' ? '#b45309' : benefit.status === 'Expired' ? '#b91c1c' : '#475569'
                    }}>{benefit.status}</span>
                    <h3 style={{ margin: '8px 0 2px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{benefit.benefit_type}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{benefit.employee_name}</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4f46e510', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Coverage</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>₹{benefit.coverage_amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Your Share</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>₹{benefit.employee_contribution?.toLocaleString()}/mo</p>
                  </div>
                </div>
                
                {benefit.provider_name && (
                  <div style={{ marginBottom: 12, fontSize: 12 }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Provider: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{benefit.provider_name}</span></p>
                    {benefit.policy_number && <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)' }}>Policy: <span style={{ fontFamily: 'monospace' }}>{benefit.policy_number}</span></p>}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Valid: {formatDate(benefit.start_date)} - {formatDate(benefit.end_date)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => handleEdit(benefit)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(benefit.id)} className="btn btn-danger" style={{ padding: 6, borderRadius: '50%', background: '#fef2f2', border: '1px solid #ef444430' }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredBenefits.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500" style={{ margin: 0 }}>No benefits found</p>
            </div>
          )}
        </div>
      )}

      {/* Benefits List View */}
      {viewMode === 'list' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Benefit Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Coverage</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Employer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Valid Period</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBenefits.map(benefit => (
                  <tr key={benefit.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{benefit.employee_name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{benefit.benefit_type}</td>
                    <td className="px-6 py-4">
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: benefit.status === 'Active' ? '#10b98118' : benefit.status === 'Pending' ? '#f59e0b18' : benefit.status === 'Expired' ? '#ef444418' : '#64748b18',
                        color: benefit.status === 'Active' ? '#047857' : benefit.status === 'Pending' ? '#b45309' : benefit.status === 'Expired' ? '#b91c1c' : '#475569'
                      }}>{benefit.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{benefit.coverage_amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">₹{benefit.employer_contribution?.toLocaleString()}/mo</td>
                    <td className="px-6 py-4 text-sm text-slate-600">₹{benefit.employee_contribution?.toLocaleString()}/mo</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">{benefit.provider_name || '—'}</span>
                      {benefit.policy_number && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{benefit.policy_number}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(benefit.start_date)} - {formatDate(benefit.end_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => handleEdit(benefit)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(benefit.id)} className="btn btn-danger" style={{ padding: 6, borderRadius: '50%', background: '#fef2f2', border: '1px solid #ef444430' }}>
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBenefits.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      No benefits found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>{/* END DATA AREA */}
        </>
      )}

      {/* Form Inline */}
      {showForm && (
        <form className="card" style={{ padding: 0 }} onSubmit={(e) => e.preventDefault()}>
          {/* Form Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
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
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="form-control"
                placeholder="Benefit details..."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
          </div>
        </form>
      )}
    </div>
  );
}
