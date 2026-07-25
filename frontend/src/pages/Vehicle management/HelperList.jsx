import React, { useState, useEffect } from 'react';
import { Plus, Users, Phone, User, MapPin, ArrowLeft, Save, X, Edit2, Trash2, Eye } from 'lucide-react';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

const HelperList = () => {
  const [helpers, setHelpers] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'form'
  const [editingHelper, setEditingHelper] = useState(null);
  const [viewingHelper, setViewingHelper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    aadhar_number: '',
    address: '',
    daily_wage: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      aadhar_number: '',
      address: '',
      daily_wage: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    });
  };

  useEffect(() => {
    fetchHelpers();
  }, []);

  const fetchHelpers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/fleet/helpers');
      setHelpers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch helpers:', error);
      showError('Failed to load helpers');
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingHelper(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (helper) => {
    setEditingHelper(helper);
    setFormData({
      name: helper.name || '',
      mobile: helper.mobile || '',
      aadhar_number: helper.aadhar_number || '',
      address: helper.address || '',
      daily_wage: helper.daily_wage?.toString() || '',
      date_of_joining: helper.date_of_joining || '',
      status: helper.status || 'ACTIVE'
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.name && !formData.mobile;
    if (!isFormEmpty) {
      const confirmed = await showConfirm({
        title: 'Cancel Changes',
        description: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
        confirmText: 'Yes, Cancel',
        cancelText: 'No, Stay',
        variant: 'destructive'
      });
      if (!confirmed) return;
    }
    backToList();
  };

  const backToList = () => {
    setMode('list');
    setEditingHelper(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.mobile.trim()) {
      showError('Name and Mobile Number are required');
      return;
    }

    setIsSaving(true);
    const payload = {
      ...formData,
      daily_wage: formData.daily_wage ? parseFloat(formData.daily_wage) : 0
    };

    try {
      if (editingHelper) {
        await api.put(`/fleet/helpers/${editingHelper.id}`, payload);
        showSuccess('Helper updated successfully');
      } else {
        await api.post('/fleet/helpers', payload);
        showSuccess('Helper created successfully');
      }
      await fetchHelpers();
      backToList();
    } catch (error) {
      console.error('Failed to save helper:', error);
      showError(error.response?.data?.detail || 'Failed to save helper');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Helper',
      description: 'Are you sure you want to delete this helper?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (confirmed) {
      try {
        await api.delete(`/fleet/helpers/${id}`);
        await fetchHelpers();
        showSuccess('Helper deleted successfully');
      } catch (error) {
        console.error('Failed to delete helper:', error);
        showError('Failed to delete helper');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'ON_LEAVE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (viewingHelper) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="form-control">
          <div className="btn btn-secondary">
            <h2 className="text-xl font-bold text-slate-900">Helper Details</h2>
            <button onClick={() => setViewingHelper(null)} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="form-row">
              <div>
                <p className="text-xs text-slate-500 uppercase">Name</p>
                <p className="font-semibold">{viewingHelper.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Mobile</p>
                <p className="font-semibold">{viewingHelper.mobile}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(viewingHelper.status)}`}>
                  {viewingHelper.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Daily Wage</p>
                <p className="font-semibold">₹{viewingHelper.daily_wage}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Joining Date</p>
                <p className="font-semibold">{new Date(viewingHelper.date_of_joining).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Aadhar Number</p>
                <p className="font-semibold">{viewingHelper.aadhar_number || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase">Address</p>
                <p className="font-semibold">{viewingHelper.address || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button onClick={() => setViewingHelper(null)} className="px-4 py-2 border rounded-lg hover:bg-white transition-colors">Close</button>
            <button 
              onClick={() => { openEditForm(viewingHelper); setViewingHelper(null); }}
              className="btn btn-primary"
            >
              Edit Helper
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'form') {
    return (
      <div className="animate-fade" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            type="button"
            onClick={handleCancel} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {editingHelper ? 'Edit Helper' : 'New Helper'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form onSubmit={handleSubmit} className="form-row">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Helper Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    placeholder="Enter helper full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile number"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Aadhar Number</label>
                <input
                  type="text"
                  placeholder="12-digit Aadhar number"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({...formData, aadhar_number: e.target.value})}
                  className="form-control"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Status *</label>
                <MasterDropdown
                  entity="helper_status"
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'ON_LEAVE', label: 'On Leave' }
                  ]}
                  placeholder="Select Status"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Daily Wage (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={formData.daily_wage}
                  onChange={(e) => setFormData({...formData, daily_wage: e.target.value})}
                  className="form-control"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Joining Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date_of_joining}
                  onChange={(e) => setFormData({...formData, date_of_joining: e.target.value})}
                  className="form-control"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                  <textarea
                    rows="3"
                    placeholder="Residential address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  <X size={16} /> Close
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  <Save size={16} /> {isSaving ? 'Saving...' : (editingHelper ? 'Update Helper' : 'Save Helper')}
                </button>
              </div>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              Helper Management
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Manage workforce and helper assignments</p>
          </div>
          <button
            onClick={openAddForm}
            className="btn btn-primary"
          >
            <Plus size={20} />
            New Helper
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="card">
          <div className="btn btn-primary">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-tight">Total Helpers</p>
            <p className="text-2xl font-bold text-slate-900">{helpers.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="btn btn-success">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-tight">Active</p>
            <p className="text-2xl font-bold text-green-600">{helpers.filter(h => h.status === 'ACTIVE').length}</p>
          </div>
        </div>
        <div className="card">
          <div className="h-12 w-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-tight">On Leave</p>
            <p className="text-2xl font-bold text-yellow-600">{helpers.filter(h => h.status === 'ON_LEAVE').length}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="btn btn-secondary">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Helper Workforce</h2>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Helper Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aadhar</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employment</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {helpers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                      No helpers found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  helpers.map((helper) => (
                    <tr key={helper.id} className="btn btn-secondary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="btn btn-primary">
                            {helper.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{helper.name}</p>
                            <p className="text-xs text-slate-500 font-semibold">ID: H{String(helper.id).padStart(3, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                          <Phone size={14} />
                          {helper.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {helper.aadhar_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">₹{helper.daily_wage}/day</div>
                        <div className="text-xs text-slate-500 font-medium">Joined: {new Date(helper.date_of_joining).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm ${getStatusColor(helper.status)}`}>
                          {helper.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setViewingHelper(helper)} className="btn btn-secondary" title="View details">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => openEditForm(helper)} className="btn btn-secondary" title="Edit helper">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(helper.id)} className="btn btn-secondary" title="Delete helper">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelperList;
