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
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">

      {/* HEADER */}
      <div className="btn btn-secondary">
        {/* LEFT: Title + record count */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">BENEFITS</h1>
          <span className="btn btn-primary">
            {filteredBenefits.length} Records
          </span>
        </div>

        {/* RIGHT: Filter dropdown + view toggle + Add button */}
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
              {(filterType || filterStatus) && <span className="btn btn-primary" />}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button onClick={() => { setFilterType(''); setFilterStatus(''); }} className="text-xs text-indigo-600 hover:underline">Reset</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Benefit Type</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                      className="form-control">
                      <option value="">All Types</option>
                      {benefitTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control">
                      <option value="">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Expired">Expired</option>
                      <option value="Cancelled">Cancelled</option>
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

          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Benefit
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
              <Heart className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.totalBenefits}</p>
              <p className="text-xs text-slate-500">Total Benefits</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-success">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.activeBenefits}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">₹{(stats.totalCoverage / 100000).toFixed(1)}L</p>
              <p className="text-xs text-slate-500">Total Coverage</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">₹{(stats.employerCost / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-500">Employer Cost/Mo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefit Types Summary */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Benefit Programs</h3>
        <div className="form-row">
          {benefitSummary.slice(0, 5).map(type => {
            const IconComponent = type.icon;
            return (
              <div 
                key={type.name} 
                className={`p-3 rounded-lg border cursor-pointer transition-all ${filterType === type.name ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                onClick={() => setFilterType(filterType === type.name ? '' : type.name)}
              >
                <div className={`w-8 h-8 rounded-lg bg-${type.color}-100 flex items-center justify-center mb-2`}>
                  <IconComponent className={`w-4 h-4 text-${type.color}-600`} />
                </div>
                <p className="text-sm font-medium text-slate-700 truncate">{type.name}</p>
                <p className="text-lg font-bold text-slate-800">{type.count}</p>
                <p className="text-xs text-slate-500">enrollments</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Grid View */}
      {viewMode === 'grid' && (
        <div className="form-row">
          {filteredBenefits.map(benefit => (
          <div key={benefit.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[benefit.status]}`}>
                  {benefit.status}
                </span>
                <h3 className="font-semibold text-slate-800 mt-2">{benefit.benefit_type}</h3>
                <p className="text-sm text-slate-500">{benefit.employee_name}</p>
              </div>
              <div className="btn btn-primary">
                <Heart className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            
            <div className="btn btn-secondary">
              <div>
                <p className="text-xs text-slate-500">Coverage</p>
                <p className="text-sm font-semibold text-slate-800">₹{benefit.coverage_amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Your Share</p>
                <p className="text-sm font-semibold text-slate-800">₹{benefit.employee_contribution?.toLocaleString()}/mo</p>
              </div>
            </div>
            
            {benefit.provider_name && (
              <div className="btn btn-secondary">
                <p className="text-xs text-slate-500">Provider: {benefit.provider_name}</p>
                {benefit.policy_number && <p className="text-xs text-slate-400">Policy: {benefit.policy_number}</p>}
              </div>
            )}
            
            <div className="btn btn-secondary">
              <span className="text-xs text-slate-500">
                Valid: {formatDate(benefit.start_date)} - {formatDate(benefit.end_date)}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(benefit)} className="btn btn-secondary">
                  <Edit2 className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => handleDelete(benefit.id)} className="btn btn-danger">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
          {filteredBenefits.length === 0 && (
            <div className="btn btn-secondary">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No benefits found</p>
            </div>
          )}
        </div>
      )}

      {/* Benefits List View */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Benefit Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Coverage</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Employer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Provider</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Valid Period</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBenefits.map(benefit => (
                  <tr key={benefit.id} className="btn btn-secondary">
                    <td className="px-6 py-4 text-sm text-slate-800">{benefit.employee_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">{benefit.benefit_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[benefit.status]}`}>
                        {benefit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">₹{benefit.coverage_amount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">₹{benefit.employer_contribution?.toLocaleString()}/mo</td>
                    <td className="px-6 py-4 text-sm text-slate-600">₹{benefit.employee_contribution?.toLocaleString()}/mo</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {benefit.provider_name || '—'}
                      {benefit.policy_number && <div className="text-xs text-slate-400">{benefit.policy_number}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(benefit.start_date)} - {formatDate(benefit.end_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(benefit)} className="btn btn-secondary">
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                        <button onClick={() => handleDelete(benefit.id)} className="btn btn-danger">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBenefits.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No benefits found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Benefit</h2>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Benefit Type *</label>
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
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Benefit details..."
                />
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Coverage (₹)</label>
                  <input
                    type="number"
                    value={form.coverage_amount}
                    onChange={(e) => setForm({ ...form, coverage_amount: e.target.value })}
                    className="form-control"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employer (₹/mo)</label>
                  <input
                    type="number"
                    value={form.employer_contribution}
                    onChange={(e) => setForm({ ...form, employer_contribution: e.target.value })}
                    className="form-control"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee (₹/mo)</label>
                  <input
                    type="number"
                    value={form.employee_contribution}
                    onChange={(e) => setForm({ ...form, employee_contribution: e.target.value })}
                    className="form-control"
                    placeholder="500"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provider Name</label>
                  <input
                    type="text"
                    value={form.provider_name}
                    onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                    className="form-control"
                    placeholder="Insurance company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number</label>
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
            <div className="btn btn-secondary">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
