import React, { useState } from 'react';
import { Plus, Truck, Phone, MapPin, DollarSign, Star, Calendar, ArrowLeft, Save, X, Edit2, Trash2, Eye, Download, User, Globe, Mail, FileText } from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';
import { confirmDialog } from '../../utils/dialogs';
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

const TransportVendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [mode, setMode] = useState('list');
  const [viewingVendor, setViewingVendor] = React.useState(null);
  const profilePreviewRef = React.useRef(null);
  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.vendorName || 'Vendor').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Vendor_Profile_${safeName}.pdf`);
    }
  };
 // 'list' or 'form'
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    vendorName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    panNumber: '',
    gstNumber: '',
    ratePerKM: '',
    ratePerTrip: '',
    contractExpiry: '',
    paymentTerms: '30 Days',
    specializations: ''
  });

  const paymentTermsOptions = [
    { value: '15 Days', label: '15 Days' },
    { value: '30 Days', label: '30 Days' },
    { value: '45 Days', label: '45 Days' },
    { value: '60 Days', label: '60 Days' }
  ];

  const resetForm = () => {
    setFormData({
      vendorName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      panNumber: '',
      gstNumber: '',
      ratePerKM: '',
      ratePerTrip: '',
      contractExpiry: '',
      paymentTerms: '30 Days',
      specializations: ''
    });
  };

  const openAddForm = () => {
    setEditingVendor(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendorName: vendor.vendorName,
      contactPerson: vendor.contactPerson,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      panNumber: vendor.panNumber,
      gstNumber: vendor.gstNumber,
      ratePerKM: vendor.ratePerKM.toString(),
      ratePerTrip: vendor.ratePerTrip.toString(),
      contractExpiry: vendor.contractExpiry,
      paymentTerms: vendor.paymentTerms,
      specializations: vendor.specializations.join(', ')
    });
    setMode('form');
  };

  const backToList = () => {
    setMode('list');
    setEditingVendor(null);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingVendor) {
      setVendors(vendors.map(v =>
        v.id === editingVendor.id
          ? {
              ...v,
              ...formData,
              ratePerKM: parseFloat(formData.ratePerKM),
              ratePerTrip: parseFloat(formData.ratePerTrip),
              specializations: formData.specializations.split(',').map(s => s.trim())
            }
          : v
      ));
    } else {
      const vendorId = 'TV' + String(vendors.length + 1).padStart(3, '0');
      const vendor = {
        id: vendorId,
        ...formData,
        ratePerKM: parseFloat(formData.ratePerKM),
        ratePerTrip: parseFloat(formData.ratePerTrip),
        vehicleTypes: ['Truck', 'Lorry'],
        rating: 0,
        totalTrips: 0,
        onTimeDelivery: 0,
        isActive: true,
        joinDate: new Date().toISOString().split('T')[0],
        specializations: formData.specializations.split(',').map(s => s.trim())
      };
      setVendors([...vendors, vendor]);
    }

    backToList();
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this transport vendor? This action cannot be undone.',
      type: 'delete',
      confirmText: 'Delete'
    });
    if (confirmed) {
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-3 w-3 ${index < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const isContractExpiring = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays > 0;
  };

  // Form View
  if (mode === 'form') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            type="button"
            onClick={backToList} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {editingVendor ? 'Edit Vendor' : 'New Vendor'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sri Krishna Transport"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mr. Krishnan"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 55555"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="krishnan@sktransport.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Salem, Tamil Nadu"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PAN Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="ABCDE1234F"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GST Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="33ABCDE1234F1Z5"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rate per KM (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="25.00"
                    value={formData.ratePerKM}
                    onChange={(e) => setFormData({...formData, ratePerKM: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rate per Trip (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="1500.00"
                    value={formData.ratePerTrip}
                    onChange={(e) => setFormData({...formData, ratePerTrip: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contract Expiry *</label>
                  <input
                    type="date"
                    required
                    value={formData.contractExpiry}
                    onChange={(e) => setFormData({...formData, contractExpiry: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms *</label>
                  <MasterDropdown
                    entity="payment_terms"
                    value={formData.paymentTerms}
                    onChange={(val) => setFormData({...formData, paymentTerms: val})}
                    options={paymentTermsOptions.map(term => ({ value: term.value, label: term.label }))}
                    placeholder="--- Select Payment Terms ---"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Specializations (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Construction Material, Heavy Load"
                    value={formData.specializations}
                    onChange={(e) => setFormData({...formData, specializations: e.target.value})}
                    className="form-control"
                  />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={backToList}>
                <X size={16} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> {editingVendor ? 'Update Vendor' : 'Save Vendor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="h-7 w-7 text-orange-600" />
              Transport Vendor Management
            </h1>
            <p className="text-gray-600 mt-1">Manage external transport vendors and contracts</p>
          </div>
          <button
            onClick={openAddForm}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Vendor
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
            </div>
            <Truck className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vendors</p>
              <p className="text-2xl font-bold text-green-600">
                {vendors.filter(v => v.isActive).length}
              </p>
            </div>
            <Truck className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-blue-600">
                {vendors.length > 0 ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1) : '0.0'}
              </p>
            </div>
            <Star className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contracts Expiring</p>
              <p className="text-2xl font-bold text-red-600">
                {vendors.filter(v => isContractExpiring(v.contractExpiry)).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Transport Vendors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rates & Terms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract & Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="btn btn-secondary">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                      <div className="text-sm text-gray-500">ID: {vendor.id}</div>
                      <div className="text-sm text-blue-600">{vendor.contactPerson}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendor.specializations.map((spec, index) => (
                          <span key={index} className="btn btn-primary">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{vendor.phone}</span>
                      </div>
                      <div className="text-sm text-gray-500">{vendor.email}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{vendor.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">₹{vendor.ratePerKM}/km</span>
                      </div>
                      <div className="text-sm text-gray-500">₹{vendor.ratePerTrip}/trip</div>
                      <div className="text-xs text-blue-600">{vendor.paymentTerms}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-1">
                        {getRatingStars(vendor.rating)}
                        <span className="text-sm text-gray-600 ml-1">{vendor.rating}</span>
                      </div>
                      <div className="text-sm text-gray-500">{vendor.totalTrips} trips</div>
                      <div className="text-xs text-green-600">{vendor.onTimeDelivery}% on-time</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(vendor.isActive)}`}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className={`text-xs mt-1 ${isContractExpiring(vendor.contractExpiry) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        Expires: {new Date(vendor.contractExpiry).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setViewingVendor(vendor)}
                        title="Preview Profile"
                      >
                        <Eye className="h-4 w-4" color="var(--primary)" />
                      </button>
                      <button
                        onClick={() => openEditForm(vendor)}
                        className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" color="var(--danger, #ef4444)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile View Modal */}
      {viewingVendor && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Vendor Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(viewingVendor)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setViewingVendor(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
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
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>TRANSPORT VENDOR PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: viewingVendor.isActive ? '#22c55e' : '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{viewingVendor.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
                        </div>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Generated On</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                  <div style={{ padding: '10px 40px 40px 40px' }}>
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <User size={14} /> 1. DETAILS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                        <div>
                          <InfoRow2 label="Vendor ID" value={viewingVendor.id} />
                          <InfoRow2 label="Vendor Name" value={viewingVendor.vendorName} />
                          <InfoRow2 label="Contact Person" value={viewingVendor.contactPerson} />
                          <InfoRow2 label="Phone" value={viewingVendor.phone} />
                          <InfoRow2 label="Email" value={viewingVendor.email} />
                          <InfoRow2 label="Address" value={viewingVendor.address} />
                          <InfoRow2 label="Specializations" value={viewingVendor.specializations.join(', ')} />
                          <InfoRow2 label="Rate per KM" value={`₹${viewingVendor.ratePerKM}`} />
                          <InfoRow2 label="Rate per Trip" value={`₹${viewingVendor.ratePerTrip}`} />
                          <InfoRow2 label="Payment Terms" value={viewingVendor.paymentTerms} />
                          <InfoRow2 label="Contract Expiry" value={viewingVendor.contractExpiry} />
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
        )}
    </div>
  );
};

export default TransportVendorList;
