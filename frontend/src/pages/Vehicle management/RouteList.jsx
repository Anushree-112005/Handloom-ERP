import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, MapPin, Compass, Clock, DollarSign, Save, X, Edit2, Trash2, Eye, Search, Filter, Download, ArrowLeft, User, FileText, Globe, Mail, Phone, IndianRupee } from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';
import { getDispatches } from '../../services/dispatchService';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import jsPDF from 'jspdf';
import logoImg from '../../assets/logo.png';
import ExportButton from '../../components/ExportButton';
const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value || '-'}</div>
  </div>
);

const RouteList = () => {
  const [routes, setRoutes] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingRoute, setEditingRoute] = useState(null);
  const [viewingRoute, setViewingRoute] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const profilePreviewRef = React.useRef(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const fileInputRef = useRef(null);

  const initialForm = {
    routeName: '',
    fromLocation: '',
    toLocation: '',
    distance: '',
    estimatedTime: '',
    fuelCostEstimate: '',
    tollCharges: '',
    roadCondition: '',
    routeType: '',
    avgSpeed: '',
    difficulty: '',
    // Fuel Entry Integration
    fuelDate: new Date().toISOString().split('T')[0],
    fuelStationId: '',
    fuelType: 'DIESEL',
    fuelQuantity: '',
    fuelRate: '',
    fuelOdometer: '',
    fuelPaymentMode: '',
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
        setDispatches([]);
      }
    } catch (error) {
      console.error('Failed to fetch dispatches', error);
      setDispatches([]);
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
    // Replaced by ExportButton component
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

  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.route_name || 'Route').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Route_Profile_${safeName}.pdf`);
    }
  };

  // ── FORM VIEW ──
  if (view === 'form') {

  return (
    <div className="animate-fade">

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            type="button"
            onClick={() => setView('list')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {editingRoute ? 'Edit Route' : 'Add New Route'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
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
                  <MasterDropdown
                    entity="road_condition"
                    value={formData.roadCondition}
                    onChange={(val) => setFormData({ ...formData, roadCondition: val })}
                    options={roadConditions.map(c => ({ value: c, label: c }))}
                    placeholder="--- Select Road Condition ---"
                  />
                </div>

                <div className="form-group">
                  <label>Route Type *</label>
                  <MasterDropdown
                    entity="route_type"
                    value={formData.routeType}
                    onChange={(val) => setFormData({ ...formData, routeType: val })}
                    options={routeTypes.map(c => ({ value: c, label: c }))}
                    placeholder="--- Select Route Type ---"
                  />
                </div>
                <div className="form-group">
                  <label>Difficulty *</label>
                  <MasterDropdown
                    entity="route_difficulty"
                    value={formData.difficulty}
                    onChange={(val) => setFormData({ ...formData, difficulty: val })}
                    options={difficulties.map(c => ({ value: c, label: c }))}
                    placeholder="--- Select Difficulty ---"
                  />
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
                  <MasterDropdown
                    value={formData.fuelStationId}
                    onChange={(val) => {
                      const st = stations.find(s => String(s.id) === String(val));
                      setFormData({ ...formData, fuelStationId: val, fuelStationName: st ? st.name : formData.fuelStationName });
                    }}
                    options={stations.map(s => ({ value: s.id, label: `${s.name} - ${s.location || ''}`.trim() }))}
                    placeholder="--- Select a Station ---"
                  />
                </div>

                <div className="form-group">
                  <label>Vehicle Number</label>
                  <MasterDropdown
                    value={formData.fuelVehicleNumber}
                    onChange={(val) => setFormData({ ...formData, fuelVehicleNumber: val })}
                    options={vehicles.map(v => ({ value: v.vehicle_number, label: v.vehicle_number }))}
                    placeholder="--- Select Vehicle ---"
                  />
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
                  <MasterDropdown
                    entity="payment_mode"
                    value={formData.fuelPaymentMode}
                    onChange={(val) => setFormData({ ...formData, fuelPaymentMode: val })}
                    options={paymentMethods.map(m => ({ value: m, label: m }))}
                    placeholder="--- Select Payment Mode ---"
                  />
                </div>
                <div className="form-group">
                  <label>Odometer Reading</label>
                  <input type="number" step="0.1" className="form-control" name="fuelOdometer" value={formData.fuelOdometer} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                  <X size={16} /> Close
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  <Save size={16} /> {isSaving ? 'Saving...' : (editingRoute ? 'Update Route' : 'Save Route')}
                </button>
              </div>
            </form>
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
            <Compass size={24} color="var(--primary)" /> Route Management
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage routes, cost estimates and route conditions</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton 
            data={filteredRoutes}
            filename="Route_List_Report"
            pdfTitle="Route List Report"
            columns={[
              { header: 'Route Name', key: 'route_name' },
              { header: 'From', key: 'origin' },
              { header: 'To', key: 'destination' },
              { header: 'Distance (KM)', key: 'distance_km' },
              { header: 'Est. Time (Hours)', key: 'estimated_duration_hours', render: (row) => (row.estimated_duration_hours || 0).toFixed(2) },
              { header: 'Avg Speed (KM/H)', key: 'avg_speed' },
              { header: 'Fuel Cost (₹)', key: 'fuel_cost_estimate' },
              { header: 'Toll (₹)', key: 'toll_charges' },
              { header: 'Condition', key: 'road_condition' },
              { header: 'Type', key: 'route_type' },
              { header: 'Difficulty', key: 'difficulty' },
              { header: 'Status', key: 'status' }
            ]}
          />
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add New Route
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Compass size={24} />
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
            <Compass size={24} />
          </div>
          <div className="stat-details">
            <h3>Avg Distance</h3>
            <div className="value">{avgDistance} KM</div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        
        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Route Name, Source, Destination..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Routes</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Split Layout: Table */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route Code</th>
                  <th>Route Name</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Distance (KM)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading routes...</td></tr>
                ) : filteredRoutes.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No routes found</td></tr>
                ) : (
                  filteredRoutes.map(route => {
                    const isActive = route.status !== 'Inactive';
                    return (
                      <tr key={route.id} onClick={() => setViewingRoute(route)} style={{ cursor: 'pointer', background: viewingRoute?.id === route.id ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ fontWeight: 600 }}>{route.route_code || route.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{route.route_name}</td>
                        <td>{route.origin}</td>
                        <td>{route.destination}</td>
                        <td>{route.distance_km || 0}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isActive ? '#d1fae5' : '#f3f4f6', color: isActive ? '#065f46' : '#374151', display: 'inline-block' }}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingRoute(route)} title="Preview Profile">
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleOpenForm(route)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleDelete(route.id, e)} title="Delete">
                              <Trash2 size={16} color="var(--danger, #ef4444)" />
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
      
        {/* Profile View Modal */}
        {viewingRoute && (
          <div className="fixed inset-0" style={{ zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}>
            <div className="animate-scale-up" style={{ background: '#f8fafc', width: '95%', maxWidth: 900, height: '90vh', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} /> 
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Route Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(viewingRoute)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setViewingRoute(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div ref={profilePreviewRef} style={{ width: '100%', maxWidth: 794, background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden', flexShrink: 0 }}>
                  
                  <div style={{ padding: '32px 40px 20px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div><img src={logoImg} alt="Dinesh Exports" style={{ width: 56, height: 56, objectFit: 'contain' }} /></div>
                        <div>
                           <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                           <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', width: 300 }}>
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>ROUTE PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(viewingRoute.status || 'ACTIVE').toUpperCase()}</span></div>
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
                        <User size={14} /> 1. PATH DETAILS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Origin" value={viewingRoute.origin} />
                        </div>
                        <div>
                          <InfoRow2 label="Destination" value={viewingRoute.destination} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <User size={14} /> 2. DISTANCE & TIME
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Distance" value={`${viewingRoute.distance_km || 0} KM`} />
                          <InfoRow2 label="Average Speed" value={`${viewingRoute.avg_speed || 0} KM/H`} />
                        </div>
                        <div>
                          <InfoRow2 label="Estimated Time" value={`${Math.round((viewingRoute.estimated_duration_hours || 0) * 60)} min`} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <IndianRupee size={14} /> 3. COST & CONDITIONS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Fuel Cost Est." value={`₹${viewingRoute.fuel_cost_estimate || 0}`} />
                          <InfoRow2 label="Toll Charges" value={`₹${viewingRoute.toll_charges || 0}`} />
                        </div>
                        <div>
                          <InfoRow2 label="Road Condition" value={viewingRoute.road_condition || 'Good'} />
                          <InfoRow2 label="Route Type" value={viewingRoute.route_type || 'State Highway'} />
                          <InfoRow2 label="Difficulty" value={viewingRoute.difficulty || 'Medium'} />
                        </div>
                      </div>
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

export default RouteList;
