import React, { useState, useEffect } from 'react';
import { Plus, User, FileText, Truck, AlertTriangle, ArrowLeft, Save, X, Edit2, Trash2, Eye, Phone, Mail, Send, Navigation, Clock, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { fetchEmployees } from '../../services/hrService';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

const DriverList = () => {
  const [drivers, setDrivers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [mode, setMode] = useState('list'); // 'list', 'form'
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewingDriver, setViewingDriver] = useState(null); // For view modal
  const [sendPortalDriver, setSendPortalDriver] = useState(null); // For send portal modal
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    mobile: '',
    licenseNumber: '',
    licenseExpiry: '',
    experience: '',
    vehicleId: '',
    assignmentDate: '',
    status: 'ACTIVE',
    email: ''
  });

  // Fetch drivers, employees, and vehicles on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees and main fleet data
      const [employeesData, driversRes, vehiclesRes] = await Promise.all([
        fetchEmployees(),
        api.get('/fleet/drivers'),
        api.get('/fleet/vehicles')
      ]);

      setEmployees(employeesData || []);
      setDrivers(driversRes.data || []);
      setVehicles(vehiclesRes.data || []);

      // Fetch dispatches separately as it might be decommissioned in some versions
      try {
        const dispatchesRes = await api.get('/inventory/dispatches');
        setDispatches(dispatchesRes.data || []);
      } catch (dispError) {
        console.warn('⚠️ Dispatches endpoint not available, skipping:', dispError.message);
        setDispatches([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch core fleet data:', error);
      // Don't clear everything if just one fails, but log it
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      mobile: '',
      licenseNumber: '',
      licenseExpiry: '',
      experience: '',
      vehicleId: '',
      assignmentDate: '',
      status: 'ACTIVE',
      email: ''
    });
  };

  const openAddForm = () => {
    setEditingDriver(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (driver) => {
    setEditingDriver(driver);
    // Find matching employee by name for dropdown
    const matchingEmp = employees.find(e => e.name === driver.name);
    setFormData({
      employeeId: matchingEmp?.id?.toString() || '',
      mobile: driver.mobile || '',
      licenseNumber: driver.license_number || '',
      licenseExpiry: driver.license_expiry || '',
      experience: driver.salary?.toString() || '', // salary stored as experience proxy
      vehicleId: driver.assigned_vehicle_id?.toString() || '',
      assignmentDate: driver.date_of_joining || '',
      status: driver.status || 'Active',
      email: driver.email || ''
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.employeeId && !formData.licenseNumber && !formData.mobile;
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
    setEditingDriver(null);
    resetForm();
  };

  // Auto-fill mobile when employee is selected
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setFormData(prev => ({ ...prev, employeeId: empId }));

    if (empId) {
      const selectedEmp = employees.find(emp => emp.id === parseInt(empId));
      if (selectedEmp) {
        setFormData(prev => ({
          ...prev,
          employeeId: empId,
          mobile: selectedEmp.mobile || selectedEmp.phone || '',
          email: selectedEmp.email || selectedEmp.personal_email || '',
          licenseNumber: selectedEmp.driving_license || '',
          licenseExpiry: selectedEmp.passport_expiry ? selectedEmp.passport_expiry.split('T')[0] : ''
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, mobile: '', email: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.licenseNumber || !formData.licenseExpiry || !formData.experience) {
      showError('Please fill in all required fields');
      return;
    }

    // Look up the selected employee to get name
    const selectedEmployee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    if (!selectedEmployee) {
      showError('Selected employee not found. Please select a valid employee.');
      return;
    }

    setIsSaving(true);
    try {
      // Build payload matching backend DriverCreate schema
      const payload = {
        name: selectedEmployee.name,
        mobile: formData.mobile || selectedEmployee.mobile || selectedEmployee.phone || '0000000000',
        license_number: formData.licenseNumber,
        license_expiry: formData.licenseExpiry || null,
        salary: formData.experience ? parseFloat(formData.experience) : 0, // store experience in salary field
        date_of_joining: formData.assignmentDate || null,
        status: formData.status,
        assigned_vehicle_id: formData.vehicleId ? parseInt(formData.vehicleId) : null,
        email: formData.email,
        employee_id: formData.employeeId ? parseInt(formData.employeeId) : null
      };

      if (editingDriver) {
        await api.put(`/fleet/drivers/${editingDriver.id}`, payload);
      } else {
        await api.post('/fleet/drivers', payload);
      }

      await fetchData();
      backToList();
      showSuccess(editingDriver ? 'Driver updated successfully' : 'Driver created successfully');
    } catch (error) {
      console.error('Failed to save driver:', error);
      const detail = error.response?.data?.detail;
      let errorMsg = 'Failed to save driver. Please try again.';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
      }
      showError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    let confirmed = false;
    try {
      confirmed = await showConfirm({
        title: 'Delete Driver',
        description: 'Are you sure you want to delete this driver? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive'
      });
    } catch {
      confirmed = window.confirm('Are you sure you want to delete this driver?');
    }

    if (confirmed) {
      try {
        await api.delete(`/fleet/drivers/${id}`);
        await fetchData();
        showSuccess('Driver deleted successfully');
      } catch (error) {
        console.error('Failed to delete driver:', error);
        showError('Failed to delete driver.');
      }
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm({
      title: 'Bulk Delete Drivers',
      message: `Are you sure you want to delete ${selectedIds.length} selected drivers? This action cannot be undone.`,
      confirmText: 'Delete All',
      variant: 'destructive'
    });
    
    if (confirmed) {
      setLoading(true);
      try {
        await Promise.all(selectedIds.map(id => api.delete(`/fleet/drivers/${id}`)));
        await fetchData();
        setSelectedIds([]);
        showConfirm({
          title: 'Success',
          message: 'Selected drivers have been deleted.',
          confirmText: 'OK',
          hideCancel: true
        });
      } catch (error) {
        console.error('Bulk delete failed:', error);
        showConfirm({
          title: 'Error',
          message: "Error during bulk delete. Please try again.",
          confirmText: 'OK',
          hideCancel: true,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === drivers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(drivers.map(d => d.id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isLicenseExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0;
  };

  // ──────────────────────────────────────────────
  //                VIEW MODAL
  // ──────────────────────────────────────────────
  if (viewingDriver) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="form-control">
          {/* Modal Header */}
          <div className="btn btn-secondary">
            <h2 className="text-xl font-bold text-slate-900">Driver Details</h2>
            <button
              onClick={() => setViewingDriver(null)}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Driver Info */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Driver Information</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Name</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Mobile</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.mobile || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(viewingDriver.status)}`}>
                    {viewingDriver.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Experience (Years)</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.salary || 0} Years</p>
                </div>
              </div>
            </div>

            {/* License Details */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">License Details</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Driving License</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.license_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">License Expiry</p>
                  <p className="text-sm font-medium text-slate-900">
                    {viewingDriver.license_expiry ? new Date(viewingDriver.license_expiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">License Type</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.license_type || 'HMV'}</p>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Additional Details</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Assigned Vehicle</p>
                  <p className="text-sm font-medium text-slate-900">
                    {vehicles.find(v => v.id === viewingDriver.assigned_vehicle_id)?.vehicle_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Date of Birth</p>
                  <p className="text-sm font-medium text-slate-900">
                    {viewingDriver.date_of_birth ? new Date(viewingDriver.date_of_birth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Aadhar Number</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.aadhar_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Emergency Contact</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.emergency_contact || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Blood Group</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.blood_group || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Address</p>
                  <p className="text-sm font-medium text-slate-900">{viewingDriver.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="btn btn-secondary">
              <p>Created: {viewingDriver.created_at ? new Date(viewingDriver.created_at).toLocaleString() : 'N/A'}</p>
              <p>Last Updated: {viewingDriver.updated_at ? new Date(viewingDriver.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="btn btn-secondary">
            <button
              onClick={() => setViewingDriver(null)}
              className="btn btn-secondary"
            >
              Close
            </button>
            <button
              onClick={() => {
                openEditForm(viewingDriver);
                setViewingDriver(null);
              }}
              className="btn btn-primary"
            >
              Edit Driver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  //                FORM VIEW
  // ──────────────────────────────────────────────
  if (mode === 'form') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header */}
        <div className="btn btn-secondary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={backToList}
                  className="btn btn-secondary"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {editingDriver ? 'Edit Driver' : 'Vehicle Assign  '}
                  </h1>
                  <span className="btn btn-danger">
                    Not Saved
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="submit"
                  form="driver-form"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <div className="btn btn-secondary">
              <form id="driver-form" onSubmit={handleSubmit} className="form-row">
                {/* Driver (Employee Dropdown) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Driver (Employee) *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={handleEmployeeChange}
                    className="form-control"
                  >
                    <option value="">{employees.length > 0 ? 'Select Employee' : 'No Employees Found'}</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} {emp.designation ? `(${emp.designation})` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Mobile Number - Auto-fetched */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number *</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Auto-fetched from employee"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      className="form-control"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="driver@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="form-control"
                    />
                  </div>
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Driving License *</label>
                  <input
                    type="text"
                    required
                    placeholder="TN1234567890"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    className="form-control"
                  />
                </div>

                {/* License Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">License Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                    className="form-control"
                  />
                </div>

                {/* Experience (Years) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Experience (Years) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="5"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="form-control"
                  />
                </div>

                {/* Assigned Vehicle */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Vehicle</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                    className="form-control"
                  >
                    <option value="">Select a Vehicle</option>
                    {vehicles.map(v => (
                       <option key={v.id} value={v.id}>{v.vehicle_number}</option>
                    ))}
                  </select>
                </div>



                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="form-control"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  //                LIST VIEW
  // ──────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <User className="h-7 w-7 text-blue-600" />
              Vehicle Assignment
            </h1>
            <p className="text-gray-600 mt-1">Manage driver information and vehicle assignments</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} disabled={loading}
                className="btn btn-danger">
                <Trash2 size={16} /> Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              onClick={openAddForm}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4" />
             vehicle Assign
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? '-' : dispatches.filter(d => d.status === 'In Transit').length}
              </p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? '-' : drivers.filter(d => {
                  if (d.status !== 'ACTIVE' && d.status !== 'Active') return false;
                  if (!d.assigned_vehicle_id) return true;
                  const v = vehicles.find(vh => vh.id === d.assigned_vehicle_id);
                  if (v?.status === 'UNDER_MAINTENANCE' || v?.status === 'Under Maintenance') return false;
                  const busy = dispatches.some(disp => disp.vehicleNumber === v?.vehicle_number && disp.status === 'In Transit');
                  return !busy;
                }).length}
              </p>
            </div>
            <User className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Drivers List</h2>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left w-10">
                    <input type="checkbox" 
                      checked={drivers.length > 0 && selectedIds.length === drivers.length}
                      onChange={toggleSelectAll}
                      className="btn btn-secondary" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Portal</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.length === 0 ? (
                   <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No drivers found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                     <tr key={driver.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(driver.id) ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <input type="checkbox" 
                          checked={selectedIds.includes(driver.id)}
                          onChange={() => toggleSelect(driver.id)}
                          className="btn btn-secondary" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{driver.name || 'N/A'}</span>
                          </div>

                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-900">{driver.mobile || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{driver.license_number || 'N/A'}</div>
                          <div className={`text-sm ${isLicenseExpiring(driver.license_expiry) ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                            Expires: {driver.license_expiry ? new Date(driver.license_expiry).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.salary ? `${driver.salary} Years` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicles.find(v => v.id === driver.assigned_vehicle_id)?.vehicle_number || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          let effectiveStatus = driver.status;
                          if ((driver.status === 'ACTIVE' || driver.status === 'Active') && driver.assigned_vehicle_id) {
                            const v = vehicles.find(vh => vh.id === driver.assigned_vehicle_id);
                            if (v?.status === 'UNDER_MAINTENANCE' || v?.status === 'Under Maintenance') {
                              effectiveStatus = 'Maintenance';
                            } else {
                              const isInTransit = dispatches.some(d => d.vehicleNumber === v?.vehicle_number && d.status === 'In Transit');
                              if (isInTransit) effectiveStatus = 'In Transit';
                            }
                          }
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(effectiveStatus)}`}>
                              {effectiveStatus}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSendPortalDriver(driver)}
                          className="btn btn-success"
                        >
                          <Send size={12} />
                          SEND
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setViewingDriver(driver)}
                            title="View Details"
                            className="btn btn-primary"
                          >
                            <Eye size={16} className="text-blue-600 hover:text-blue-800" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditForm(driver)}
                            title="Edit"
                            className="btn btn-primary"
                          >
                            <Edit2 size={16} className="text-indigo-600 hover:text-indigo-800" />
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

      {/* Send Portal Modal */}
      {sendPortalDriver && (
        <SendDriverPortalModal 
          driver={sendPortalDriver} 
          employees={employees}
          onClose={() => setSendPortalDriver(null)} 
        />
      )}
    </div>
  );
};

// --- Send Driver Portal Modal ---
function SendDriverPortalModal({ driver, employees, onClose }) {
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Dynamically resolve email from linked employee as fallback/override
  const linkedEmployee = employees?.find(emp => emp.id === driver.employee_id);
  const resolvedEmail = linkedEmployee?.personal_email || linkedEmployee?.email || driver.email;

  const [username, setUsername] = useState(resolvedEmail || driver.email || '');
  const [password, setPassword] = useState("pass@driver123"); 
  const [mobile, setMobile] = useState(driver.mobile || '');
  const portalLink = `${window.location.origin}/driver-portal/login`;

  const firstLetter = driver.name?.charAt(0).toUpperCase() || 'D';

  const handleSend = async () => {
    if (!resolvedEmail) {
      setErrorMsg('Driver email is required to send portal access. Please update the profile.');
      return;
    }

    setSending(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/driver-portal/set-portal-credentials', {
        driver_id: String(driver.id),
        driver_name: driver.name,
        driver_mobile: mobile,
        driver_email: resolvedEmail,
        portal_link: portalLink,
        username: username,
        password: password
      }, { timeout: 60000 });

      if (response.data.success) {
        setShowSuccess(true);
      } else {
        setErrorMsg(response.data.message || "Failed to send portal access.");
      }
    } catch (error) {
      console.error("Error sending portal access:", error);
      setErrorMsg("An error occurred while sending portal access.");
    } finally {
      setSending(false);
    }
  };

  if (showSuccess) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, width: 400, padding: "30px", boxShadow: "0 32px 80px rgba(0,0,0,.28)", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#F0FDF4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#15803D" }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Access Granted!</h3>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5, marginBottom: 24 }}>Portal login credentials have been sent successfully to <b>{driver.name}</b> via Email & WhatsApp.</p>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "#111827", color: "#fff", border: "none", padding: "12px 0", borderRadius: 10, fontWeight: 700, cursor: "pointer", transition: "transform .2s" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 16, width: 400, padding: "30px", boxShadow: "0 32px 80px rgba(0,0,0,.28)", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#DC2626" }}>
            <X size={32} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Send Failed</h3>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5, marginBottom: 24 }}>{errorMsg}</p>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ width: "100%", background: "#DC2626", color: "#fff", border: "none", padding: "12px 0", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 480, boxShadow: "0 32px 80px rgba(0,0,0,.28)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, background: "#EEF2FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={20} className="text-indigo-600" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Send Driver Portal Access</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Send login link & credentials to driver's email</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 22 }}>×</button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Driver Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F9FAFB", borderRadius: 10, padding: "12px 14px", border: "1px solid #E5E7EB", marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, background: "#4338ca", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{firstLetter}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{driver.name}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{resolvedEmail || 'No Email'} · {mobile || 'No Mobile'}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#15803D" }}>
                📧 {resolvedEmail ? "Email Ready" : "No Email"}
              </div>
              <div style={{ background: mobile ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${mobile ? "#BBF7D0" : "#FECACA"}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: mobile ? "#15803D" : "#DC2626" }}>
                📱 {mobile ? "WhatsApp Ready" : "No Mobile"}
              </div>
            </div>
          </div>

          {/* Preview Box */}
          <div style={{ background: "#F8FAFF", border: "1.5px solid #C7D2FE", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: .5, marginBottom: 12 }}>📨 Notification will be sent via Email & WhatsApp</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>EMAIL (TO)</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{resolvedEmail || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>MOBILE (WHATSAPP)</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    style={{ 
                      width: '100%', 
                      fontSize: 13, 
                      fontWeight: 600, 
                      color: "#111827", 
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid transparent',
                      padding: 0,
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = '#C7D2FE'}
                    onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>PORTAL LINK</div>
              <div style={{ fontSize: 12, color: "#4338ca", fontWeight: 600, background: "#EEF2FF", padding: "6px 10px", borderRadius: 6, wordBreak: "break-all" }}>
                {portalLink}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>USERNAME</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", fontFamily: "monospace", background: "#F3F4F6", padding: "6px 10px", borderRadius: 6 }}>
                  {username}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>PASSWORD</div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: "#111827", 
                    fontFamily: "monospace", 
                    background: "#fff", 
                    padding: "6px 10px", 
                    borderRadius: 6,
                    border: '1px solid #E5E7EB',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", color: "#374111", padding: "11px 0", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{ 
                flex: 2, 
                background: "#4338ca", 
                border: "none", 
                color: "#fff", 
                padding: "11px 0", 
                borderRadius: 8, 
                cursor: sending ? "default" : "pointer", 
                fontSize: 13, 
                fontWeight: 700, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: 8, 
                transition: "background .3s" 
              }}>
              {sending ? "Sending..." : "Send Portal Access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverList;
