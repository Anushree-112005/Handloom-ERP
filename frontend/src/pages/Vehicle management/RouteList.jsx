import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, MapPin, Navigation, Clock, DollarSign, ArrowLeft, Save, X, Edit2, Trash2, Eye } from 'lucide-react';
import { getDispatches } from '../../services/dispatchService';

const RouteList = () => {
  const [routes, setRoutes] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'form'
  const [editingRoute, setEditingRoute] = useState(null);
  const [viewingRoute, setViewingRoute] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [formData, setFormData] = useState({
    routeName: '',
    fromLocation: '',
    toLocation: '',
    distance: '',
    estimatedTime: '',
    fuelCostEstimate: '',
    tollCharges: '',
    roadCondition: 'Good',
    routeType: 'State Highway',
    avgSpeed: '',
    difficulty: 'Medium',
    // Fuel Entry Integration
    fuelDate: new Date().toISOString().split('T')[0],
    fuelStationId: '',
    fuelType: 'DIESEL',
    fuelQuantity: '',
    fuelRate: '',
    fuelOdometer: '',
    fuelPaymentMode: 'Cash',
    fuelVehicleNumber: '',
    fuelStationName: '',
    isActive: true
  });

  const roadConditions = [
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Poor', label: 'Poor' }
  ];

  const routeTypes = [
    { value: 'National Highway', label: 'National Highway' },
    { value: 'State Highway', label: 'State Highway' },
    { value: 'District Road', label: 'District Road' },
    { value: 'Village Road', label: 'Village Road' }
  ];

  const difficulties = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' }
  ];

  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Fuel Card', label: 'Fuel Card' },
    { value: 'UPI', label: 'UPI' }
  ];

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchDispatchesData();
    fetchStations();
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/fleet/vehicles');
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vehicles', error);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await api.get('/fleet/fuel-stations');
      setStations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch fuel stations', error);
    }
  };

  const fetchDispatchesData = async () => {
    try {
      const data = await getDispatches();
      setDispatches(data || []);
    } catch (error) {
      console.error('Failed to fetch dispatches', error);
    }
  };

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/fleet/routes');
      setRoutes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch routes', error);
      showError('Failed to load routes');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      routeName: '',
      fromLocation: '',
      toLocation: '',
      distance: '',
      estimatedTime: '',
      fuelCostEstimate: '',
      tollCharges: '',
      roadCondition: 'Good',
      routeType: 'State Highway',
      avgSpeed: '',
      difficulty: 'Medium',
      fuelDate: new Date().toISOString().split('T')[0],
      fuelStationId: '',
      fuelType: 'DIESEL',
      fuelQuantity: '',
      fuelRate: '',
      fuelOdometer: '',
      fuelPaymentMode: 'Cash',
      fuelVehicleNumber: '',
      fuelStationName: '',
      isActive: true
    });
  };

  const openAddForm = () => {
    setEditingRoute(null);
    resetForm();
    setMode('form');
  };

  const populateForm = (route) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.route_name || '',
      fromLocation: route.from_location || '',
      toLocation: route.to_location || '',
      distance: (route.distance_km || 0).toString(),
      estimatedTime: (Math.round((route.estimated_time_hours || 0) * 60)).toString(),
      fuelCostEstimate: (route.fuel_cost_estimate || 0).toString(),
      tollCharges: (route.toll_charges || 0).toString(),
      roadCondition: route.road_condition || 'Good',
      routeType: route.route_type || 'State Highway',
      avgSpeed: (route.avg_speed || 0).toString(),
      difficulty: (route.difficulty || 'Medium') || 'Medium',
      isActive: route.is_active !== undefined ? route.is_active : true,
      fuelDate: route.fuel_date || new Date().toISOString().split('T')[0],
      fuelStationId: route.fuel_station_id || '',
      fuelType: route.fuel_type || 'DIESEL',
      fuelQuantity: (route.fuel_quantity_liters || '').toString(),
      fuelRate: (route.fuel_rate_per_liter || '').toString(),
      fuelOdometer: (route.fuel_odometer_reading || '').toString(),
      fuelPaymentMode: route.fuel_payment_mode || 'Cash',
      fuelVehicleNumber: route.fuel_vehicle_number || '',
      fuelStationName: route.fuel_station_name || ''
    });
  };

  const openEditForm = (route) => {
    populateForm(route);
    setMode('form');
  };

  const openViewForm = (route) => {
    setViewingRoute(route);
  };

  const handleCancel = async () => {
    // Check if form has any data (simplified check)
    const isFormEmpty = !formData.routeName && !formData.fromLocation && !formData.toLocation && !formData.distance;
    
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
    setEditingRoute(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      route_name: formData.routeName,
      from_location: formData.fromLocation,
      to_location: formData.toLocation,
      distance_km: parseFloat(formData.distance) || 0,
      estimated_time_hours: parseFloat(formData.estimatedTime) / 60 || 0,
      fuel_cost_estimate: parseFloat(formData.fuelCostEstimate) || 0,
      toll_charges: parseFloat(formData.tollCharges) || 0,
      road_condition: formData.roadCondition,
      route_type: formData.routeType,
      avg_speed: parseFloat(formData.avgSpeed) || 0,
      difficulty: formData.difficulty,
      is_active: formData.isActive !== undefined ? formData.isActive : true,
      // Fuel Entry Integration
      fuel_date: formData.fuelDate,
      fuel_station_id: formData.fuelStationId ? parseInt(formData.fuelStationId) : null,
      fuel_type: formData.fuelType,
      fuel_quantity_liters: parseFloat(formData.fuelQuantity) || 0,
      fuel_rate_per_liter: parseFloat(formData.fuelRate) || 0,
      fuel_odometer_reading: formData.fuelOdometer ? parseFloat(formData.fuelOdometer) : null,
      fuel_payment_mode: formData.fuelPaymentMode,
      fuel_vehicle_number: formData.fuelVehicleNumber,
      fuel_station_name: formData.fuelStationName
    };

    try {
      if (editingRoute) {
        await api.put(`/fleet/routes/${editingRoute.id}`, payload);
        showSuccess('Route updated successfully');
      } else {
        await api.post('/fleet/routes', payload);
        showSuccess('Route created successfully');
      }
      await fetchRoutes();
      backToList();
    } catch (error) {
      console.error('Failed to save route:', error);
      showError(error.response?.data?.detail || 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Route',
      description: 'Are you sure you want to delete this route?',
      confirmText: 'Delete',
      variant: 'destructive'
    }).catch(() => false);

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/routes/${id}`);
      showSuccess('Route deleted successfully');
      await fetchRoutes();
    } catch (error) {
      console.error('Failed to delete route:', error);
      showError(error.response?.data?.detail || 'Failed to delete route');
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDispatchChange = (e) => {
    const dispatchId = e.target.value;
    const selectedDispatch = dispatches.find(d => (d.dispatchId || d.issueDocumentNumber) === dispatchId);

    if (selectedDispatch) {
      setFormData({
        ...formData,
        routeName: dispatchId,
        fromLocation: selectedDispatch.sourceWarehouse || '',
        toLocation: selectedDispatch.destinationWarehouse || '',
        fuelVehicleNumber: selectedDispatch.vehicleNumber || '',
        fuelDate: selectedDispatch.date ? selectedDispatch.date.split('T')[0] : formData.fuelDate
      });
    } else {
      setFormData({
        ...formData,
        routeName: dispatchId
      });
    }
  };

  if (mode === 'form') {
    return (
      <div className="min-h-screen bg-slate-50">
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
                    {editingRoute ? 'Edit Route' : 'New Route'}
                  </h1>
                  <span className="btn btn-danger">
                    Not Saved
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
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

        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <div className="btn btn-secondary">
              <form onSubmit={handleSubmit} className="form-row">

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dispatch ID *</label>
                  <select
                    required
                    value={formData.routeName}
                    onChange={handleDispatchChange}
                    className="form-control"
                  >
                    <option value="">Select Dispatch ID</option>
                    {dispatches.map(d => (
                      <option key={d.id} value={d.dispatchId || d.issueDocumentNumber}>
                        {d.dispatchId || d.issueDocumentNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">From Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Crusher A"
                    value={formData.fromLocation}
                    onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">To Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Site B"
                    value={formData.toLocation}
                    onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Distance (KM) *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    placeholder="15"
                    value={formData.distance}
                    onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Time (Minutes) *</label>
                  <input
                    type="number"
                    required
                    placeholder="45"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Average Speed (KM/H) *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    placeholder="45"
                    value={formData.avgSpeed}
                    onChange={(e) => setFormData({ ...formData, avgSpeed: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fuel Cost Estimate (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="350.00"
                    value={formData.fuelCostEstimate}
                    onChange={(e) => setFormData({ ...formData, fuelCostEstimate: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Toll Charges (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="50.00"
                    value={formData.tollCharges}
                    onChange={(e) => setFormData({ ...formData, tollCharges: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Road Condition *</label>
                  <select
                    required
                    value={formData.roadCondition}
                    onChange={(e) => setFormData({ ...formData, roadCondition: e.target.value })}
                    className="form-control"
                  >
                    {roadConditions.map(condition => (
                      <option key={condition.value} value={condition.value}>{condition.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Route Type *</label>
                  <select
                    required
                    value={formData.routeType}
                    onChange={(e) => setFormData({ ...formData, routeType: e.target.value })}
                    className="form-control"
                  >
                    {routeTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty Level *</label>
                  <select
                    required
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="form-control"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Route Status</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">
                        {formData.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Fuel Entry Section */}
                <div className="col-span-1 md:col-span-2 pt-4 border-t mt-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-purple-600" /> Fuel Entry Details
                  </h3>
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number</label>
                      <input
                        type="text"
                        readOnly
                        value={formData.fuelVehicleNumber}
                        placeholder="Auto-filled from Dispatch"
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Fuel Station (Manual Entry)</label>
                      <input
                        type="text"
                        placeholder="Enter Station Name"
                        value={formData.fuelStationName}
                        onChange={(e) => setFormData({ ...formData, fuelStationName: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Fuel Type</label>
                      <input
                        type="text"
                        readOnly
                        value="Diesel"
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Quantity (Liters)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.fuelQuantity}
                        onChange={(e) => setFormData({ ...formData, fuelQuantity: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Price per Liter (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.fuelRate}
                        onChange={(e) => setFormData({ ...formData, fuelRate: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Odometer Reading</label>
                      <input
                        type="number"
                        value={formData.fuelOdometer}
                        onChange={(e) => setFormData({ ...formData, fuelOdometer: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                      <select
                        value={formData.fuelPaymentMode}
                        onChange={(e) => setFormData({ ...formData, fuelPaymentMode: e.target.value })}
                        className="form-control"
                      >
                        {paymentMethods.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}
                      </select>
                    </div>
                  </div>
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
              <Navigation className="h-7 w-7 text-purple-600" />
              Route Management
            </h1>
            <p className="text-gray-600 mt-1">Manage transportation routes and logistics</p>
          </div>
          <button
            onClick={openAddForm}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            New Route
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <Navigation className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-green-600">
                {routes.filter(r => r.is_active !== false).length}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Distance</p>
              <p className="text-2xl font-bold text-blue-600">
                {routes.length > 0 ? (routes.reduce((sum, r) => sum + (r.distance_km || 0), 0) / routes.length).toFixed(1) : '0'} KM
              </p>
            </div>
            <Navigation className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Route List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Estimates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Road Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id} className="btn btn-secondary">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{route.route_name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-blue-600">{route.from_location} → {route.to_location}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${route.is_active !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {route.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{(route.distance_km || 0)} KM</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{Math.round((route.estimated_time_hours || 0) * 60)} min</span>
                      </div>
                      <div className="text-xs text-green-600">{(route.avg_speed || 0)} KM/H avg</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">₹{(route.fuel_cost_estimate || 0)} fuel</span>
                      </div>
                      <div className="text-sm text-gray-500">₹{(route.toll_charges || 0)} toll</div>
                      <div className="text-xs text-blue-600">₹{((route.fuel_cost_estimate || 0) + (route.toll_charges || 0)).toFixed(2)} total</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getConditionColor((route.road_condition || 'Good'))}`}>
                        {(route.road_condition || 'Good')}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{(route.route_type || 'State Highway')}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border mt-1 ${getDifficultyColor((route.difficulty || 'Medium'))}`}>
                        {(route.difficulty || 'Medium')}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openViewForm(route)}
                        className="btn btn-success"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditForm(route)}
                        className="btn btn-primary"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(route.id)}
                        className="btn btn-danger"
                        title="Delete"
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

      {/* View Modal */}
      {viewingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Route Details</h2>
              <button
                onClick={() => setViewingRoute(null)}
                className="btn btn-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="form-row">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Route Name</p>
                  <p className="font-medium text-gray-900">{viewingRoute.route_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${viewingRoute.is_active !== false ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                    {viewingRoute.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">From Location</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {viewingRoute.from_location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">To Location</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {viewingRoute.to_location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Distance</p>
                  <p className="font-medium text-gray-900">{viewingRoute.distance_km || 0} KM</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estimated Time</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1"><Clock className="h-4 w-4 text-gray-400" /> {Math.round((viewingRoute.estimated_time_hours || 0) * 60)} Minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average Speed</p>
                  <p className="font-medium text-gray-900">{viewingRoute.avg_speed || 0} KM/H</p>
                </div>

                <div className="col-span-2 pt-4 border-t mt-2">
                  <h3 className="font-semibold text-gray-900 mb-4">Cost Estimates & Conditions</h3>
                  <div className="form-row">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fuel Cost Estimate</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">₹{viewingRoute.fuel_cost_estimate || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Toll Charges</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">₹{viewingRoute.toll_charges || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Road Condition</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getConditionColor(viewingRoute.road_condition || 'Good')}`}>
                        {viewingRoute.road_condition || 'Good'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Route Type</p>
                      <p className="font-medium text-gray-900">{viewingRoute.route_type || 'State Highway'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Difficulty Level</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(viewingRoute.difficulty || 'Medium')}`}>
                        {viewingRoute.difficulty || 'Medium'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 pt-4 border-t mt-2">
                  <h3 className="font-semibold text-gray-900 mb-4">Fuel Entry Details</h3>
                  <div className="btn btn-primary">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fuel Date</p>
                      <p className="font-medium text-gray-900">{viewingRoute.fuel_date || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                      <p className="font-medium text-gray-900">{viewingRoute.fuel_vehicle_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fuel Station</p>
                      <p className="font-medium text-gray-900">{viewingRoute.fuel_station_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Fuel Details</p>
                      <p className="font-medium text-gray-900">
                        {viewingRoute.fuel_quantity_liters}L {viewingRoute.fuel_type} @ ₹{viewingRoute.fuel_rate_per_liter}/L
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Odometer</p>
                      <p className="font-medium text-gray-900">{viewingRoute.fuel_odometer_reading || 'N/A'} KM</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Payment & Total</p>
                      <p className="font-bold text-purple-700">
                        ₹{((viewingRoute.fuel_quantity_liters || 0) * (viewingRoute.fuel_rate_per_liter || 0)).toFixed(2)} ({viewingRoute.fuel_payment_mode})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingRoute(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RouteList;
