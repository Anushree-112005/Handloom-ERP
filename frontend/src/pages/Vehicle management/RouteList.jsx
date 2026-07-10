import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, MapPin, Navigation, Clock, DollarSign, Save, X, Edit2, Trash2, Eye, Search, Filter, Download } from 'lucide-react';
import { getDispatches } from '../../services/dispatchService';
import * as XLSX from 'xlsx';

const RouteList = () => {
  const [routes, setRoutes] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingRoute, setEditingRoute] = useState(null);
  const [viewingRoute, setViewingRoute] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const initialForm = {
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
  };
  const [formData, setFormData] = useState(initialForm);

  const roadConditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const routeTypes = ['National Highway', 'State Highway', 'District Road', 'Village Road'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const paymentMethods = ['Cash', 'Credit Card', 'Fuel Card', 'UPI'];

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
      console.log('Fetched dispatches:', data);
      if (data && data.length > 0) {
        setDispatches(data);
      } else {
        // Ultimate fallback if backend returns truly empty and mock fails
        setDispatches([
          { id: 'mock1', indent_id: 'DSP-001', delivery_place: 'Fallback Chennai' },
          { id: 'mock2', indent_id: 'DSP-002', delivery_place: 'Fallback Coimbatore' }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch dispatches', error);
      setDispatches([
        { id: 'mock1', indent_id: 'DSP-001', delivery_place: 'Error Fallback' }
      ]);
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

  const handleOpenForm = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        routeName: route.route_name || '',
        fromLocation: route.origin || '',
        toLocation: route.destination || '',
        distance: (route.distance_km || 0).toString(),
        estimatedTime: (Math.round((route.estimated_duration_hours || 0) * 60)).toString(),
        fuelCostEstimate: (route.fuel_cost_estimate || 0).toString(),
        tollCharges: (route.toll_charges || 0).toString(),
        roadCondition: route.road_condition || 'Good',
        routeType: route.route_type || 'Regular',
        avgSpeed: (route.avg_speed || 0).toString(),
        difficulty: (route.difficulty || 'Medium') || 'Medium',
        isActive: route.status !== 'Inactive',
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
    } else {
      setEditingRoute(null);
      setFormData(initialForm);
    }
    setView('form');
  };

  const handleDispatchChange = (e) => {
    const dispatchId = e.target.value;
    const selectedDispatch = dispatches.find(d => 
      (d.dispatchId === dispatchId) || 
      (d.issueDocumentNumber === dispatchId) ||
      (d.indent_id === dispatchId) ||
      (d.id && d.id.toString() === dispatchId)
    );

    if (selectedDispatch) {
      setFormData({
        ...formData,
        routeName: dispatchId,
        fromLocation: selectedDispatch.sourceWarehouse || selectedDispatch.delivery_place || '',
        toLocation: selectedDispatch.destinationWarehouse || '',
        fuelVehicleNumber: selectedDispatch.vehicleNumber || selectedDispatch.vehicle_no || '',
        fuelDate: selectedDispatch.date || selectedDispatch.dispatch_date ? (selectedDispatch.date || selectedDispatch.dispatch_date).split('T')[0] : formData.fuelDate
      });
    } else {
      setFormData({
        ...formData,
        routeName: dispatchId
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      route_name: formData.routeName,
      origin: formData.fromLocation,
      destination: formData.toLocation,
      distance_km: parseFloat(formData.distance) || 0,
      estimated_duration_hours: parseFloat(formData.estimatedTime) / 60 || 0,
      route_type: formData.routeType,
      status: formData.isActive ? "Active" : "Inactive",
      toll_charges: parseFloat(formData.tollCharges) || 0,
      road_condition: formData.roadCondition,
      avg_speed: parseFloat(formData.avgSpeed) || 0,
      difficulty: formData.difficulty,
      // Fuel Entry Integration
      fuel_cost_estimate: parseFloat(formData.fuelCostEstimate) || 0,
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
      setView('list');
      setViewingRoute(null);
    } catch (error) {
      console.error('Failed to save route:', error);
      showError(error.response?.data?.detail || 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Route',
      description: 'Are you sure you want to delete this route?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });
    
    if (!confirmed) return;

    try {
      await api.delete(`/fleet/routes/${id}`);
      showSuccess('Route deleted successfully');
      fetchRoutes();
    } catch (error) {
      console.error('Failed to delete route:', error);
      showError(error.response?.data?.detail || 'Failed to delete route');
    }
  };

  const handleExportExcel = () => {
    const data = filteredRoutes.map(route => ({
      'Route Name': route.route_name,
      'From': route.origin,
      'To': route.destination,
      'Distance (KM)': route.distance_km,
      'Est. Time (Hours)': (route.estimated_duration_hours || 0).toFixed(2),
      'Avg Speed (KM/H)': route.avg_speed || 0,
      'Fuel Cost (₹)': route.fuel_cost_estimate || 0,
      'Toll (₹)': route.toll_charges || 0,
      'Condition': route.road_condition || 'Good',
      'Type': route.route_type,
      'Difficulty': route.difficulty || 'Medium',
      'Status': route.status || 'Active'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Routes");
    XLSX.writeFile(wb, "Routes_List.xlsx");
  };

  const filteredRoutes = routes.filter(route => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (route.route_name || '').toLowerCase().includes(searchLower) ||
      (route.origin || '').toLowerCase().includes(searchLower) ||
      (route.destination || '').toLowerCase().includes(searchLower)
    );
    const routeStatus = route.status || 'Active';
    const matchesStatus = statusFilter === 'All Status' || routeStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRoutes = routes.length;
  const activeRoutes = routes.filter(r => r.status !== 'Inactive').length;
  const inactiveRoutes = routes.filter(r => r.status === 'Inactive').length;
  const avgDistance = routes.length ? Math.round(routes.reduce((acc, curr) => acc + (curr.distance_km || 0), 0) / routes.length) : 0;

  const handleCardClick = (status) => {
    if (status === 'Total') setStatusFilter('All Status');
    else setStatusFilter(status);
  };

  // ── FORM VIEW ──
  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingRoute ? 'Edit Route' : 'Add New Route'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              <button type="submit" form="routeForm" className="btn btn-primary" disabled={isSaving}><Save size={16} /> {isSaving ? 'Saving...' : (editingRoute ? 'Update Route' : 'Save Route')}</button>
            </div>
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="routeForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Route Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Dispatch ID *</label>
                  <input type="text" className="form-control" name="routeName" value={formData.routeName} onChange={handleInputChange} placeholder="Enter Dispatch ID" required />
                </div>
                <div className="form-group">
                  <label>From Location *</label>
                  <input className="form-control" name="fromLocation" value={formData.fromLocation} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>To Location *</label>
                  <input className="form-control" name="toLocation" value={formData.toLocation} onChange={handleInputChange} required />
                </div>

                <div className="form-group">
                  <label>Distance (KM) *</label>
                  <input type="number" step="0.1" className="form-control" name="distance" value={formData.distance} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Estimated Time (Minutes) *</label>
                  <input type="number" className="form-control" name="estimatedTime" value={formData.estimatedTime} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Average Speed (KM/H) *</label>
                  <input type="number" step="0.1" className="form-control" name="avgSpeed" value={formData.avgSpeed} onChange={handleInputChange} required />
                </div>

                <div className="form-group">
                  <label>Fuel Cost Estimate (₹) *</label>
                  <input type="number" step="0.01" className="form-control" name="fuelCostEstimate" value={formData.fuelCostEstimate} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Toll Charges (₹) *</label>
                  <input type="number" step="0.01" className="form-control" name="tollCharges" value={formData.tollCharges} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Road Condition *</label>
                  <select className="form-control" name="roadCondition" value={formData.roadCondition} onChange={handleInputChange} required>
                    {roadConditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Route Type *</label>
                  <select className="form-control" name="routeType" value={formData.routeType} onChange={handleInputChange} required>
                    {routeTypes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty *</label>
                  <select className="form-control" name="difficulty" value={formData.difficulty} onChange={handleInputChange} required>
                    {difficulties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} style={{ width: 18, height: 18 }} />
                    <span style={{ fontWeight: 600 }}>Route is Active</span>
                  </label>
                </div>
              </div>

              <h4 style={{ color: 'var(--primary)', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fuel Entry Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Fuel Date</label>
                  <input type="date" className="form-control" name="fuelDate" value={formData.fuelDate} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Fuel Station Name</label>
                  <input className="form-control" name="fuelStationName" value={formData.fuelStationName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Fuel Station (Linked)</label>
                  <select className="form-control" name="fuelStationId" value={formData.fuelStationId} onChange={handleInputChange}>
                    <option value="">Select a Station</option>
                    {stations.map(s => <option key={s.id} value={s.id}>{s.name} - {s.location}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Vehicle Number</label>
                  <select className="form-control" name="fuelVehicleNumber" value={formData.fuelVehicleNumber} onChange={handleInputChange}>
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.vehicle_number}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Fuel Quantity (Liters)</label>
                  <input type="number" step="0.1" className="form-control" name="fuelQuantity" value={formData.fuelQuantity} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Fuel Rate (Per Liter)</label>
                  <input type="number" step="0.01" className="form-control" name="fuelRate" value={formData.fuelRate} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Payment Mode</label>
                  <select className="form-control" name="fuelPaymentMode" value={formData.fuelPaymentMode} onChange={handleInputChange}>
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Odometer Reading</label>
                  <input type="number" step="0.1" className="form-control" name="fuelOdometer" value={formData.fuelOdometer} onChange={handleInputChange} />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={24} color="var(--primary)" /> Route Management
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage routes, cost estimates and route conditions</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add New Route
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Navigation size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Routes</h3>
            <div className="value">{totalRoutes}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('Active')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Routes</h3>
            <div className="value">{activeRoutes}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('Inactive')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <h3>Inactive Routes</h3>
            <div className="value">{inactiveRoutes}</div>
          </div>
        </div>

        <div className="card stat-card" style={{ transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Navigation size={24} />
          </div>
          <div className="stat-details">
            <h3>Avg Distance</h3>
            <div className="value">{avgDistance} KM</div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by route name or location..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 180, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Split Layout: Table */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route Name & Status</th>
                  <th>Path Details</th>
                  <th>Distance & Time</th>
                  <th>Costs Estimate</th>
                  <th>Conditions</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading routes...</td></tr>
                ) : filteredRoutes.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No routes found</td></tr>
                ) : (
                  filteredRoutes.map(route => {
                    const isActive = route.status !== 'Inactive';
                    return (
                      <tr key={route.id} onClick={() => setViewingRoute(route)} style={{ cursor: 'pointer', background: viewingRoute?.id === route.id ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.2s' }}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{route.route_name}</div>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isActive ? '#d1fae5' : '#f3f4f6', color: isActive ? '#065f46' : '#374151', display: 'inline-block', marginTop: 4 }}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
                            <MapPin size={14} color="var(--text-muted)" /> {route.origin}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>
                            <MapPin size={14} color="var(--text-muted)" /> {route.destination}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{route.distance_km || 0} KM</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Clock size={12} /> {Math.round((route.estimated_duration_hours || 0) * 60)} min
                          </div>
                          <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>{route.avg_speed || 0} KM/H avg</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--text-primary)' }}>
                            <DollarSign size={14} color="var(--text-muted)" /> ₹{route.fuel_cost_estimate || 0} fuel
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>₹{route.toll_charges || 0} toll</div>
                          <div style={{ fontSize: 11, color: '#2563eb', marginTop: 2 }}>₹{((route.fuel_cost_estimate || 0) + (route.toll_charges || 0)).toFixed(2)} total</div>
                        </td>
                        <td>
                          <div>
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                              {route.road_condition || 'Good'}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{route.route_type || 'State Highway'}</div>
                          <div style={{ marginTop: 4 }}>
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                              {route.difficulty || 'Medium'}
                            </span>
                          </div>
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(route)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(e) => handleDelete(route.id, e)} title="Delete">
                              <Trash2 size={16} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* View Modal */}
      {viewingRoute && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 600, width: '100%', padding: 0, overflow: 'hidden', borderRadius: 12, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Route Details — {viewingRoute.route_name}
              </h3>
              <button onClick={() => setViewingRoute(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</span>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: viewingRoute.status !== 'Inactive' ? '#d1fae5' : '#f3f4f6', color: viewingRoute.status !== 'Inactive' ? '#065f46' : '#374151' }}>
                      {viewingRoute.status !== 'Inactive' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>PATH DETAILS</span>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>FROM LOCATION</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} color="var(--primary)" /> {viewingRoute.origin}</div>
                  </div>
                  <Navigation size={16} color="var(--text-muted)" style={{ transform: 'rotate(90deg)' }} />
                  <div style={{ flex: 1, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>TO LOCATION</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} color="var(--primary)" /> {viewingRoute.destination}</div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>DISTANCE & TIME</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Distance</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.distance_km || 0} KM</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Estimated Time</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{Math.round((viewingRoute.estimated_duration_hours || 0) * 60)} min</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Average Speed</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.avg_speed || 0} KM/H</div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>COST ESTIMATES & CONDITIONS</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Fuel Cost</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>₹{viewingRoute.fuel_cost_estimate || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Toll Charges</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>₹{viewingRoute.toll_charges || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Road Condition</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.road_condition || 'Good'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Route Type</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.route_type || 'State Highway'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Difficulty</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.difficulty || 'Medium'}</div>
                  </div>
                </div>
              </div>

              {(viewingRoute.fuel_date || viewingRoute.fuel_station_name || viewingRoute.fuel_quantity_liters) && (
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>FUEL ENTRY DETAILS</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 8, background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fuel Date</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.fuel_date || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Station Name</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.fuel_station_name || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fuel Type</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.fuel_type || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quantity (Liters)</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.fuel_quantity_liters || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rate (Per Liter)</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>₹{viewingRoute.fuel_rate_per_liter || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Payment Mode</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{viewingRoute.fuel_payment_mode || '-'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteList;
