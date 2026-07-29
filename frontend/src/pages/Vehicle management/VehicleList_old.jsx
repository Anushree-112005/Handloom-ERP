import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Truck, AlertTriangle, ArrowLeft, Save, X, Eye, FileUp, Search, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'form'
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedViewVehicle, setSelectedViewVehicle] = useState(null); // For details panel
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const fileInputRef = useRef(null);

  console.log('🔄 VehicleList rendering - mode:', mode, 'loading:', loading, 'vehicles:', vehicles.length);

  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'TIPPER',
    make: '',
    model: '',
    year_of_manufacture: '',
    chassis_number: '',
    engine_number: '',
    capacity_tons: '',
    rc_number: '',
    insurance_number: '',
    insurance_expiry: '',
    fitness_expiry: '',
    permit_expiry: '',
    pollution_expiry: '',
    current_mileage: '',
    status: 'ACTIVE'
  });

  const vehicleTypes = [
    { value: 'TIPPER', label: 'Tipper' }
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' }
  ];

  // ✅ Fetch vehicles from backend
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching vehicles from API...');
      const response = await api.get('/fleet/vehicles');
      console.log('✅ API Response received:', response.data);
      const vehicleList = response.data || [];
      console.log('📊 Vehicle count:', vehicleList.length);
      setVehicles(vehicleList);
      console.log('✅ Vehicles state updated successfully');
    } catch (error) {
      console.error('❌ Failed to fetch vehicles - Full error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        fullError: error
      });
      showError('Failed to load vehicles');
      setVehicles([]);
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      vehicle_type: 'TIPPER',
      make: '',
      model: '',
      year_of_manufacture: '',
      chassis_number: '',
      engine_number: '',
      capacity_tons: '',
      rc_number: '',
      insurance_number: '',
      insurance_expiry: '',
      fitness_expiry: '',
      permit_expiry: '',
      pollution_expiry: '',
      current_mileage: '',
      status: 'ACTIVE'
    });
  };

  const openAddForm = () => {
    setEditingVehicle(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number || '',
      vehicle_type: vehicle.vehicle_type || 'TIPPER',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year_of_manufacture: vehicle.year_of_manufacture || '',
      chassis_number: vehicle.chassis_number || '',
      engine_number: vehicle.engine_number || '',
      capacity_tons: vehicle.capacity_tons || '',
      rc_number: vehicle.rc_number || '',
      insurance_number: vehicle.insurance_number || '',
      insurance_expiry: vehicle.insurance_expiry || '',
      fitness_expiry: vehicle.fitness_expiry || '',
      permit_expiry: vehicle.permit_expiry || '',
      pollution_expiry: vehicle.pollution_expiry || '',
      current_mileage: vehicle.current_mileage || '',
      status: vehicle.status || 'Active'
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.vehicle_number && !formData.make && !formData.model;
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
    setEditingVehicle(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vehicle_number.trim() || !formData.make.trim() || !formData.model.trim()) {
      showError('Please fill in required fields (Vehicle Number, Make & Model)');
      return;
    }

    setIsSaving(true);

    const payload = { ...formData };
    // Convert empty strings to null for better API compatibility
    const numericFields = ['year_of_manufacture', 'capacity_tons', 'current_mileage'];
    numericFields.forEach(field => {
      payload[field] = payload[field] === '' ? null : Number(payload[field]);
    });
    
    const dateFields = ['insurance_expiry', 'fitness_expiry', 'permit_expiry', 'pollution_expiry'];
    dateFields.forEach(field => {
      payload[field] = payload[field] === '' ? null : payload[field];
    });

    try {
      if (editingVehicle) {
        // Update existing vehicle
        console.log('📝 Updating vehicle:', editingVehicle.id);
        await api.put(`/fleet/vehicles/${editingVehicle.id}`, payload);
        showSuccess('Vehicle updated successfully');
      } else {
        // Create new vehicle
        console.log('✅ Creating new vehicle:', payload.vehicle_number);
        await api.post('/fleet/vehicles', payload);
        showSuccess('Vehicle created successfully');
      }

      // Step 1: Refresh vehicle list
      console.log('🔄 Refreshing vehicle list...');
      await fetchVehicles();
      console.log('✅ Vehicle list refreshed');

      // Step 2: Reset form data separately
      console.log('🔄 Resetting form data...');
      setFormData({
        vehicle_number: '',
        vehicle_type: 'TIPPER',
        make: '',
        model: '',
        year_of_manufacture: '',
        chassis_number: '',
        engine_number: '',
        capacity_tons: '',
        rc_number: '',
        insurance_number: '',
        insurance_expiry: '',
        fitness_expiry: '',
        permit_expiry: '',
        pollution_expiry: '',
        current_mileage: '',
        status: 'ACTIVE'
      });
      console.log('✅ Form data reset');

      // Step 3: Clear editing state
      console.log('🔄 Clearing editing state...');
      setEditingVehicle(null);
      console.log('✅ Editing state cleared');

      // Step 4: Return to list view (LAST)
      console.log('📋 Changing mode to list');
      setMode('list');
      console.log('✅ Mode changed, should now display list view');
    } catch (error) {
      console.error('❌ Failed to save vehicle:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to save vehicle';
      showError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // --- SMART HEADER DETECTION ---
        let headerIndex = -1;
        for (let i = 0; i < Math.min(json.length, 20); i++) {
          const row = json[i];
          if (row && row.some(cell => cell && typeof cell === 'string' && 
            ['vehicle', 'registration', 'number', 'make', 'model'].some(k => cell.toLowerCase().includes(k))
          )) {
            headerIndex = i;
            break;
          }
        }

        let finalData = [];
        if (headerIndex !== -1) {
          const rawData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });
          finalData = rawData.map(row => {
            const mapped = { ...row };
            // Map common column names
            const numKey = Object.keys(row).find(k => ['vehicle number', 'registration number', 'vehicle no', 'reg no', 'vehicle', 'number'].some(s => k.toLowerCase().trim().includes(s)));
            if (numKey && !row.vehicle_number) mapped.vehicle_number = row[numKey];
            
            const makeKey = Object.keys(row).find(k => ['make', 'brand', 'company'].some(s => k.toLowerCase().trim().includes(s)));
            if (makeKey && !row.make) mapped.make = row[makeKey];

            const modelKey = Object.keys(row).find(k => ['model', 'variant'].some(s => k.toLowerCase().trim().includes(s)));
            if (modelKey && !row.model) mapped.model = row[modelKey];
            
            // Clean up
            if (!mapped.vehicle_number) return null;
            return mapped;
          }).filter(Boolean);
        } else {
          finalData = XLSX.utils.sheet_to_json(worksheet);
        }

        if (finalData.length === 0) {
          showError("No valid vehicle data found. Please ensure there is a 'Vehicle Number' column.");
          setImporting(false);
          return;
        }

        const response = await api.post('/fleet/vehicles/bulk-import', { vehicles: finalData });
        showSuccess(response.data.message || `Successfully imported ${finalData.length} vehicles!`);
        fetchVehicles();
      } catch (err) {
        console.error("Import failed:", err);
        showError("Import failed: " + (err.response?.data?.detail || err.message));
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDelete = async (id) => {
    console.log('🗑️ DELETE BUTTON CLICKED - Vehicle ID:', id);

    // Show confirmation with fallback
    let confirmed = false;
    try {
      console.log('📋 Showing confirmation dialog...');
      confirmed = await showConfirm({
        title: 'Delete Vehicle',
        description: 'Are you sure you want to delete this vehicle? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive'
      });
    } catch (dialogError) {
      console.warn('⚠️ ConfirmDialog failed, falling back to window.confirm:', dialogError);
      confirmed = window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.');
    }

    console.log('✅ Confirmation result:', confirmed);
    if (!confirmed) {
      console.log('❌ Delete cancelled by user');
      return;
    }

    try {
      console.log('🚀 Sending DELETE request to /fleet/vehicles/' + id);
      const response = await api.delete(`/fleet/vehicles/${id}`);
      console.log('✅ DELETE request successful:', response.data);

      showSuccess('Vehicle deleted successfully');
      console.log('🔄 Refreshing vehicle list...');

      await fetchVehicles();
      console.log('✅ Vehicle list refreshed after deletion');
    } catch (error) {
      console.error('❌ ERROR IN DELETE:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        fullError: error
      });
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to delete vehicle';
      showError(errorMsg);
    }
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVehicles(vehicles.map(v => v.id));
    } else {
      setSelectedVehicles([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedVehicles(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm({
      title: 'Bulk Delete Vehicles',
      description: `Are you sure you want to delete ${selectedVehicles.length} vehicles? This action cannot be undone.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await api.post('/fleet/vehicles/bulk-delete', { ids: selectedVehicles });
      showSuccess(`Successfully deleted ${selectedVehicles.length} vehicles`);
      setSelectedVehicles([]);
      fetchVehicles();
    } catch (err) {
      showError('Bulk delete failed');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (vehicle) => {
    console.log('👁️ Opening view modal for vehicle:', vehicle.id);
    setViewingVehicle(vehicle);
  };

  const closeViewModal = () => {
    console.log('👁️ Closing view modal');
    setViewingVehicle(null);
  };

  const getStatusColor = (status) => {
    switch (String(status).toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'UNDER_MAINTENANCE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExpiryWarning = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 0) return 'text-red-600 font-medium';
    if (daysUntilExpiry <= 30) return 'text-orange-600 font-medium';
    return 'text-gray-600';
  };

  // ────────────────────────────────────────────────
  //                  VIEW MODAL (CHECK FIRST!)
  // ────────────────────────────────────────────────
  if (viewingVehicle) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="form-control">
          {/* Modal Header */}
          <div className="btn btn-secondary">
            <h2 className="text-xl font-bold text-slate-900">Vehicle Details</h2>
            <button
              onClick={closeViewModal}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Vehicle Identification */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Vehicle Identification</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Vehicle Number</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Vehicle Type</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.vehicle_type}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Specifications</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Make</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.make}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Model</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.model}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Year of Manufacture</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.year_of_manufacture}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Capacity (Units)</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.capacity_tons}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                    (viewingVehicle.status === 'ACTIVE' || viewingVehicle.status === 'Active') ? 'bg-green-100 text-green-800 border-green-200' :
                    (viewingVehicle.status === 'INACTIVE' || viewingVehicle.status === 'Inactive') ? 'bg-gray-100 text-gray-800 border-gray-200' :
                    'bg-yellow-100 text-yellow-800 border-yellow-200'
                  }`}>
                    {viewingVehicle.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Engine & Chassis Details */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Engine & Chassis</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Chassis Number</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.chassis_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Engine Number</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.engine_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">RC Number</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.rc_number || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Insurance & Registration */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Insurance & Compliance</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Insurance Number</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.insurance_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Insurance Expiry</p>
                  <p className="text-sm font-medium text-slate-900">
                    {viewingVehicle.insurance_expiry ? new Date(viewingVehicle.insurance_expiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Fitness Expiry</p>
                  <p className="text-sm font-medium text-slate-900">
                    {viewingVehicle.fitness_expiry ? new Date(viewingVehicle.fitness_expiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Permit Expiry</p>
                  <p className="text-sm font-medium text-slate-900">
                    {viewingVehicle.permit_expiry ? new Date(viewingVehicle.permit_expiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Pollution Expiry</p>
                  <p className="text-sm font-medium text-slate-900">
                    {viewingVehicle.pollution_expiry ? new Date(viewingVehicle.pollution_expiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mileage Information */}
            <div className="btn btn-secondary">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Mileage</h3>
              <div className="form-row">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Current Mileage (km)</p>
                  <p className="text-sm font-medium text-slate-900">{viewingVehicle.current_mileage || 0} km</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="btn btn-secondary">
              <p>Created: {viewingVehicle.created_at ? new Date(viewingVehicle.created_at).toLocaleString() : 'N/A'}</p>
              <p>Last Updated: {viewingVehicle.updated_at ? new Date(viewingVehicle.updated_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="btn btn-secondary">
            <button
              onClick={closeViewModal}
              className="btn btn-secondary"
            >
              Close
            </button>
            <button
              onClick={() => {
                openEditForm(viewingVehicle);
                closeViewModal();
              }}
              className="btn btn-primary"
            >
              Edit Vehicle
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  //                  LIST VIEW
  // ────────────────────────────────────────────────
  if (mode === 'list') {
    // Show loading spinner
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full min-h-screen bg-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-600">Loading vehicles...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full min-h-screen bg-white">
        {/* Header */}
        <div className="btn btn-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">VEHICLE MANAGEMENT</h1>
              <div className="flex items-center gap-2">
                <span className="btn btn-primary">
                  {vehicles.length} Records
                </span>
                {selectedVehicles.length > 0 && (
                  <span className="btn btn-danger">
                    {selectedVehicles.length} Selected
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {selectedVehicles.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-danger"
                >
                  <Trash2 size={18} />
                  Delete Selected ({selectedVehicles.length})
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={importing}
                className={`inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm ${importing ? 'opacity-50 cursor-wait' : ''}`}
              >
                <FileUp size={18} />
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={openAddForm}
                className="btn btn-primary"
              >
                <Plus size={18} />
                New Vehicle
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="form-row">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {vehicles.filter(v => v.status === 'ACTIVE' || v.status === 'Active').length}
                </p>
              </div>
              <div className="btn btn-success">
                <div className="btn btn-success"></div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {vehicles.filter(v => v.status === 'UNDER_MAINTENANCE' || v.status === 'Under Maintenance').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {vehicles.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-12">
              <div className="mb-6 rounded-full bg-gray-100 p-8">
                <Truck className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No vehicles found</h3>
              <p className="mt-2 text-gray-600">Get started by adding your first vehicle to the fleet.</p>
              <button
                onClick={openAddForm}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Add Your First Vehicle
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left w-10">
                    <input 
                      type="checkbox" 
                      className="btn btn-secondary"
                      onChange={handleSelectAll}
                      checked={selectedVehicles.length > 0 && selectedVehicles.length === vehicles.length}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specifications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className={`hover:bg-gray-50 ${selectedVehicles.includes(vehicle.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="btn btn-secondary"
                        checked={selectedVehicles.includes(vehicle.id)}
                        onChange={() => handleSelectOne(vehicle.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{vehicle.vehicle_number}</div>
                        <div className="text-sm text-gray-500">{vehicle.vehicle_type} • {vehicle.make}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vehicle.model} ({vehicle.year_of_manufacture})</div>
                      <div className="text-sm text-gray-500">Capacity: {vehicle.capacity_tons || 'N/A'} Units</div>
                      <div className="text-xs text-gray-400">Engine: {vehicle.engine_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">Mileage: {vehicle.current_mileage || 'N/A'} km</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${getExpiryWarning(vehicle.insurance_expiry)}`}>
                        {vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Fitness: {vehicle.fitness_expiry ? new Date(vehicle.fitness_expiry).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button type="button" onClick={() => openViewModal(vehicle)} title="View Details" className="btn btn-primary">
                          <Eye size={18} className="text-blue-600 hover:text-blue-800" />
                        </button>
                        <button type="button" onClick={() => openEditForm(vehicle)} title="Edit" className="btn btn-primary">
                          <Edit2 size={18} className="text-indigo-600 hover:text-indigo-800" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  //                  FORM VIEW
  // ────────────────────────────────────────────────
  if (mode === 'form') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="btn btn-secondary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={backToList} className="text-slate-600 hover:text-slate-900">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">
                    {editingVehicle ? 'Edit Vehicle' : 'New Vehicle'}
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
                >
                  <div className="flex items-center gap-2">
                    <X size={16} />
                    Cancel
                  </div>
                </button>
                <button
                  type="submit"
                  form="vehicle-form"
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  <div className="flex items-center gap-2">
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 w-full">
          <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="btn btn-secondary">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Vehicle Details</h2>

              <div className="form-row">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Vehicle Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={formData.vehicle_number}
                    onChange={handleChange}
                    placeholder="TN-33-AB-1234"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    {vehicleTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    RC Number
                  </label>
                  <input
                    type="text"
                    name="rc_number"
                    value={formData.rc_number}
                    onChange={handleChange}
                    placeholder="RC-12345678"
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="Hyundai"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Shehzore"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Year of Manufacture <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="year_of_manufacture"
                    value={formData.year_of_manufacture}
                    onChange={handleChange}
                    placeholder="2022"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Capacity (Units) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="capacity_tons"
                    value={formData.capacity_tons}
                    onChange={handleChange}
                    placeholder="16"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Chassis Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="chassis_number"
                    value={formData.chassis_number}
                    onChange={handleChange}
                    placeholder="CHASIS123"
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Engine Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="engine_number"
                    value={formData.engine_number}
                    onChange={handleChange}
                    placeholder="ENGINE123"
                    className="form-control"
                    required
                  />
                </div>



                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Insurance Expiry <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="insurance_expiry"
                    value={formData.insurance_expiry}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Insurance Number
                  </label>
                  <input
                    type="text"
                    name="insurance_number"
                    value={formData.insurance_number}
                    onChange={handleChange}
                    placeholder="INS-12345678"
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Fitness Expiry <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fitness_expiry"
                    value={formData.fitness_expiry}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Permit Expiry <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="permit_expiry"
                    value={formData.permit_expiry}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Pollution Expiry <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="pollution_expiry"
                    value={formData.pollution_expiry}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Current Mileage (km)
                  </label>
                  <input
                    type="number"
                    name="current_mileage"
                    value={formData.current_mileage}
                    onChange={handleChange}
                    placeholder="0"
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Fallback if mode is something unexpected
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <p className="text-red-600 text-lg font-semibold">⚠️ Error: Unknown view mode</p>
        <p className="text-gray-600 mt-2">Mode: "{mode}"</p>
        <button
          onClick={() => {
            console.log('🔴 Emergency reset - changing mode to list');
            setMode('list');
          }}
          className="btn btn-primary"
        >
          Reset to List View
        </button>
      </div>
    </div>
  );
};

export default VehicleList;
