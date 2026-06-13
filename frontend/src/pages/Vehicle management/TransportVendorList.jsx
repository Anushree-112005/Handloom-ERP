import React, { useState } from 'react';
import { Plus, Truck, Phone, MapPin, DollarSign, Star, Calendar, ArrowLeft, Save, X, Edit2, Trash2 } from 'lucide-react';

const TransportVendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'form'
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
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
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header */}
        <div className="btn btn-secondary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={backToList}
                  className="btn btn-secondary"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {editingVendor ? 'Edit Vendor' : 'New Vendor'}
                  </h1>
                  <span className="btn btn-danger">
                    Not Saved
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={backToList}
                  className="btn btn-secondary"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <div className="btn btn-secondary">
              <form onSubmit={handleSubmit} className="form-row">
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
                  <select
                    required
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                    className="form-control"
                  >
                    {paymentTermsOptions.map(term => (
                      <option key={term.value} value={term.value}>{term.label}</option>
                    ))}
                  </select>
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
              </form>
            </div>
          </div>
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
                        onClick={() => openEditForm(vendor)}
                        className="btn btn-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="btn btn-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransportVendorList;
