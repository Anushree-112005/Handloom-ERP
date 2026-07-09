import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { 
  Plus, MapPin, Truck, User, Package, DollarSign, Clock, 
  ArrowLeft, Save, X, Edit2, Trash2, Eye, Volume2, Search,
  Filter, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

const TripPlanning = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    driver_id: '',
    from_location: '',
    to_location: '',
    material: '',
    quantity_tons: '',
    customer_name: '',
    customer_phone: '',
    rate_per_ton: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/fleet/trips'),
        api.get('/fleet/vehicles'),
        api.get('/fleet/drivers')
      ]);
      setTrips(tripsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load trip planning data');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.vehicle_number || '';
  const getDriverName = (id) => drivers.find(d => d.id === id)?.driver_name || '';

  const handleOpenForm = (trip = null) => {
    if (trip) {
      setEditingTrip(trip);
      setFormData({
        date: trip.trip_date || trip.date,
        vehicle_id: trip.vehicle_id || '',
        driver_id: trip.driver_id || '',
        from_location: trip.start_location || trip.from_location || '',
        to_location: trip.end_location || trip.to_location || '',
        material: trip.material || parseTripNotes(trip).material,
        quantity_tons: (trip.quantity_tons || parseTripNotes(trip).quantity.replace(' Tons', '') || 0).toString(),
        customer_name: trip.customer_name || parseTripNotes(trip).customer,
        customer_phone: trip.customer_phone || '',
        rate_per_ton: (trip.rate_per_ton || parseTripNotes(trip).rate.replace('₹', '') || 0).toString()
      });
    } else {
      setEditingTrip(null);
      setFormData(initialForm);
    }
    setView('form');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.driver_id || !formData.customer_name) {
      showError('Please fill required fields: Vehicle, Driver, Customer');
      return;
    }

    const payload = {
      trip_date: formData.date,
      vehicle_id: parseInt(formData.vehicle_id),
      driver_id: parseInt(formData.driver_id),
      start_location: formData.from_location,
      end_location: formData.to_location,
      notes: `${formData.material} | ${formData.customer_name} | Qty: ${formData.quantity_tons} Tons | Rate: ${formData.rate_per_ton}`,
      status: editingTrip ? editingTrip.status : 'Planned',
      revenue: (parseFloat(formData.quantity_tons) || 0) * (parseFloat(formData.rate_per_ton) || 0)
    };

    try {
      if (editingTrip) {
        await api.put(`/fleet/trips/${editingTrip.id}`, payload);
        showSuccess('Trip updated successfully');
      } else {
        await api.post('/fleet/trips', payload);
        showSuccess('Trip created successfully');
      }
      setView('list');
      setViewingTrip(null);
      fetchInitialData();
    } catch (error) {
      console.error('Failed to save trip:', error);
      showError(error.response?.data?.detail || 'Failed to save trip');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Trip',
      description: 'Are you sure you want to delete this trip?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });
    
    if (!confirmed) return;

    try {
      await api.delete(`/fleet/trips/${id}`);
      showSuccess('Trip deleted successfully');
      fetchInitialData();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      showError(error.response?.data?.detail || 'Failed to delete trip');
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    let bg = '#f3f4f6', color = '#374151';
    if (s === 'PLANNED') { bg = '#dbeafe'; color = '#1e40af'; }
    if (s === 'IN PROGRESS' || s === 'IN_PROGRESS') { bg = '#fef3c7'; color = '#92400e'; }
    if (s === 'COMPLETED') { bg = '#d1fae5'; color = '#065f46'; }
    if (s === 'CANCELLED') { bg = '#fee2e2'; color = '#b91c1c'; }
    return (
      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: color }}>
        {status}
      </span>
    );
  };

  const parseTripNotes = (trip) => {
    const notes = trip.notes || '';
    const parts = notes.split(' | ');
    return {
      material: parts[0] || 'General Cargo',
      customer: parts[1] || 'Internal Transfer',
      quantity: parts[2]?.replace('Qty: ', '') || '0 Tons',
      rate: parts[3]?.replace('Rate: ', '') || '₹0'
    };
  };

  const handleExportExcel = () => {
    const data = filteredTrips.map(trip => {
      const info = parseTripNotes(trip);
      return {
        'Trip ID': trip.id,
        'Date': trip.trip_date ? trip.trip_date.split('T')[0] : '',
        'Vehicle': getVehicleName(trip.vehicle_id),
        'Driver': getDriverName(trip.driver_id),
        'Start Location': trip.start_location,
        'End Location': trip.end_location,
        'Material': info.material,
        'Quantity': info.quantity,
        'Customer': info.customer,
        'Rate': info.rate,
        'Status': trip.status,
        'Revenue': trip.revenue
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trips");
    XLSX.writeFile(wb, "Trip_Planning.xlsx");
  };

  const filteredTrips = trips.filter(trip => {
    const info = parseTripNotes(trip);
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      (trip.id || '').toString().includes(searchLower) ||
      (trip.start_location || '').toLowerCase().includes(searchLower) ||
      (trip.end_location || '').toLowerCase().includes(searchLower) ||
      (getVehicleName(trip.vehicle_id) || '').toLowerCase().includes(searchLower) ||
      (getDriverName(trip.driver_id) || '').toLowerCase().includes(searchLower) ||
      info.material.toLowerCase().includes(searchLower) ||
      info.customer.toLowerCase().includes(searchLower)
    );
    const matchesStatus = statusFilter === 'All Status' || trip.status?.toUpperCase().replace('_', ' ') === statusFilter.toUpperCase().replace('_', ' ');
    return matchesSearch && matchesStatus;
  });

  const totalTrips = trips.length;
  const plannedTrips = trips.filter(t => t.status?.toUpperCase() === 'PLANNED').length;
  const inProgressTrips = trips.filter(t => t.status?.toUpperCase().includes('PROGRESS')).length;
  const completedTrips = trips.filter(t => t.status?.toUpperCase() === 'COMPLETED').length;

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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingTrip ? 'Edit Trip' : 'Plan New Trip'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              <button type="submit" form="tripForm" className="btn btn-primary"><Save size={16} /> {editingTrip ? 'Update Trip' : 'Save Trip'}</button>
            </div>
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="tripForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Trip Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" className="form-control" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Vehicle *</label>
                  <select className="form-control" name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} required>
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Driver *</label>
                  <select className="form-control" name="driver_id" value={formData.driver_id} onChange={handleInputChange} required>
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Customer *</label>
                  <input className="form-control" name="customer_name" value={formData.customer_name} onChange={handleInputChange} placeholder="Enter customer name" required />
                </div>
                <div className="form-group">
                  <label>Customer Phone</label>
                  <input className="form-control" name="customer_phone" value={formData.customer_phone} onChange={handleInputChange} placeholder="Optional phone number" />
                </div>
                <div className="form-group">
                  <label>Material *</label>
                  <input className="form-control" name="material" value={formData.material} onChange={handleInputChange} placeholder="e.g. M-Sand, Blue Metal" required />
                </div>

                <div className="form-group">
                  <label>Crusher / Start Location *</label>
                  <input className="form-control" name="from_location" value={formData.from_location} onChange={handleInputChange} placeholder="Start location" required />
                </div>
                <div className="form-group">
                  <label>Delivery / End Location *</label>
                  <input className="form-control" name="to_location" value={formData.to_location} onChange={handleInputChange} placeholder="End location" required />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label>Qty (Tons) *</label>
                    <input type="number" step="0.1" className="form-control" name="quantity_tons" value={formData.quantity_tons} onChange={handleInputChange} placeholder="0" required />
                  </div>
                  <div>
                    <label>Rate / Ton *</label>
                    <input type="number" step="0.01" className="form-control" name="rate_per_ton" value={formData.rate_per_ton} onChange={handleInputChange} placeholder="₹" required />
                  </div>
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
            <MapPin size={24} color="var(--primary)" /> Trip Planning
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Plan and schedule vehicle transport trips</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Plan New Trip
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Trips</h3>
            <div className="value">{totalTrips}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('Planned')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#1e40af' }}>
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h3>Planned</h3>
            <div className="value">{plannedTrips}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('In Progress')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>In Progress</h3>
            <div className="value">{inProgressTrips}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('Completed')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Package size={24} />
          </div>
          <div className="stat-details">
            <h3>Completed</h3>
            <div className="value">{completedTrips}</div>
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
            placeholder="Search trips, vehicles, locations..."
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
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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
                  <th>Trip Details</th>
                  <th>Vehicle & Driver</th>
                  <th>Route</th>
                  <th>Material & Customer</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading trips...</td></tr>
                ) : filteredTrips.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No trips found</td></tr>
                ) : (
                  filteredTrips.map(trip => {
                    const info = parseTripNotes(trip);
                    return (
                      <tr key={trip.id} onClick={() => setViewingTrip(trip)} style={{ cursor: 'pointer', background: viewingTrip?.id === trip.id ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.2s' }}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Trip #{trip.id}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{trip.trip_date ? trip.trip_date.split('T')[0] : ''}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Truck size={14} style={{ color: 'var(--text-muted)' }} /> {getVehicleName(trip.vehicle_id)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <User size={14} style={{ color: 'var(--text-muted)' }} /> {getDriverName(trip.driver_id)}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            {trip.start_location} &rarr; {trip.end_location}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                              {info.material} ({info.quantity})
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {info.customer}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {getStatusBadge(trip.status)}
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(trip)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(e) => handleDelete(trip.id, e)} title="Delete">
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
      {viewingTrip && (() => {
        const info = parseTripNotes(viewingTrip);
        return (
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
            <div className="card" style={{ maxWidth: 600, width: '100%', padding: 0, overflow: 'hidden', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Trip Details — #{viewingTrip.id}
                </h3>
                <button onClick={() => setViewingTrip(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>VEHICLE & DRIVER</span>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      <Truck size={16} color="var(--primary)" /> {getVehicleName(viewingTrip.vehicle_id)}
                    </div>
                    <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                      <User size={14} /> {getDriverName(viewingTrip.driver_id)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>STATUS</span>
                    <div style={{ marginTop: 4 }}>
                      {getStatusBadge(viewingTrip.status)}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>ROUTE DETAILS</span>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>START LOCATION</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{viewingTrip.start_location}</div>
                    </div>
                    <ArrowLeft size={16} color="var(--text-muted)" style={{ transform: 'rotate(180deg)' }} />
                    <div style={{ flex: 1, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>END LOCATION</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{viewingTrip.end_location}</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MATERIAL & CUSTOMER</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Material</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{info.material}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Quantity</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{info.quantity}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Customer</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{info.customer}</div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>RATE PER TON</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={16} color="var(--text-muted)" /> {info.rate}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>ESTIMATED REVENUE</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                      ₹{viewingTrip.revenue ? viewingTrip.revenue.toLocaleString() : '0'}
                    </div>
                  </div>
                </div>

                {viewingTrip.voice_note_path && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Volume2 size={14} /> DRIVER VOICE NOTE
                    </span>
                    <audio 
                      src={viewingTrip.voice_note_path.startsWith('http') ? viewingTrip.voice_note_path : `/${viewingTrip.voice_note_path}`} 
                      controls 
                      style={{ width: '100%', height: 32 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TripPlanning;
