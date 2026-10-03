import React, { useState, useEffect } from 'react';
import { Plus, Users, Phone, User, MapPin, ArrowLeft, Save, X, Edit2, Trash2, Eye, Download, FileText, Globe, Mail, IndianRupee, Clock } from 'lucide-react';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import jsPDF from 'jspdf';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value || '-'}</div>
  </div>
);

const HelperList = () => {
  const [helpers, setHelpers] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'form'
  const [editingHelper, setEditingHelper] = useState(null);
  const [viewingHelper, setViewingHelper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const profilePreviewRef = React.useRef(null);

  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.name || 'Helper').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `${safeName}_Profile.pdf`);
    }
  };

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
                  placeholder="--- Select Status ---"
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
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingHelper(helper)} title="Preview Profile">
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openEditForm(helper)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDelete(helper.id)} title="Delete">
                              <Trash2 size={16} color="var(--danger, #ef4444)" />
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

        {/* Profile View Modal */}
        {viewingHelper && (() => {
          return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Helper Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(viewingHelper)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setViewingHelper(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
                <div ref={profilePreviewRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden', flexShrink: 0 }}>

                  <div style={{ padding: '32px 40px 20px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div><img src={logoImg} alt="Handloom ERP" style={{ width: 56, height: 56, objectFit: 'contain' }} /></div>
                        <div>
                          <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', width: 300 }}>
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>HELPER DETAILS</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(viewingHelper.status || 'ACTIVE').toUpperCase()}</span></div>
                        </div>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Helper ID</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div style={{ fontWeight: 500, color: '#0f172a' }}>H{String(viewingHelper.id).padStart(3, '0')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                  <div style={{ padding: '10px 40px 40px 40px' }}>
                    
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <User size={14} /> 1. PERSONAL INFORMATION
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Name" value={viewingHelper.name} />
                          <InfoRow2 label="Aadhar Number" value={viewingHelper.aadhar_number} />
                        </div>
                        <div>
                          <InfoRow2 label="Mobile" value={viewingHelper.mobile} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <MapPin size={14} /> 2. ADDRESS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Address" value={viewingHelper.address} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <FileText size={14} /> 3. EMPLOYMENT DETAILS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Date of Joining" value={new Date(viewingHelper.date_of_joining).toLocaleDateString()} />
                        </div>
                        <div>
                          <InfoRow2 label="Daily Wage" value={`₹${viewingHelper.daily_wage || '0'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                      <div>
                        <div style={{ fontWeight: 800, marginBottom: 2 }}>Handloom ERP</div>
                        <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@handloomerp.com</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.handloomerp.com</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                        <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          );
        })()}
    </div>
  );
};

export default HelperList;
