import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { 
  Plus, MapPin, Truck, User, Package, DollarSign, Clock, 
  ArrowLeft, Save, X, Edit2, Trash2, Eye, Volume2, Search,
  Filter, Download, IndianRupee, Phone, Globe, Mail, FileText, Compass
} from 'lucide-react';
import * as XLSX from 'xlsx';
import MasterDropdown from '../../components/MasterDropdown';
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

const TripPlanning = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const profilePreviewRef = React.useRef(null);
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
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
    // Replaced by ExportButton component
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

  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.id || 'Trip').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Trip_Profile_${safeName}.pdf`);
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
            {editingTrip ? 'Edit Trip' : 'Plan New Trip'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form id="tripForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Trip Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" className="form-control" name="date" value={formData.date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Vehicle *</label>
                  <MasterDropdown
                    value={formData.vehicle_id}
                    onChange={(val) => setFormData({ ...formData, vehicle_id: val })}
                    options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                    placeholder="--- Select Vehicle ---"
                  />
                </div>
                <div className="form-group">
                  <label>Driver *</label>
                  <MasterDropdown
                    value={formData.driver_id}
                    onChange={(val) => setFormData({ ...formData, driver_id: val })}
                    options={drivers.map(d => ({ value: d.id, label: d.driver_name }))}
                    placeholder="--- Select Driver ---"
                  />
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
                  <div className="form-group">
                    <label>Rate Per Ton (₹) *</label>
                    <input type="number" step="0.01" className="form-control" name="rate_per_ton" value={formData.rate_per_ton} onChange={handleInputChange} placeholder="₹" required />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                  <X size={16} /> Close
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingTrip ? 'Update Trip' : 'Save Trip'}
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
            <Compass size={24} color="var(--primary)" /> Trip Planning
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Plan and schedule vehicle trips</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton 
            data={filteredTrips}
            filename="Trip_Planning_Report"
            pdfTitle="Trip Planning Report"
            columns={[
              { header: 'Trip ID', key: 'id' },
              { header: 'Date', key: 'trip_date', render: (row) => row.trip_date ? row.trip_date.split('T')[0] : '' },
              { header: 'Vehicle', key: 'vehicle_id', render: (row) => getVehicleName(row.vehicle_id) },
              { header: 'Driver', key: 'driver_id', render: (row) => getDriverName(row.driver_id) },
              { header: 'Start Location', key: 'start_location' },
              { header: 'End Location', key: 'end_location' },
              { header: 'Material', key: 'material', render: (row) => parseTripNotes(row).material },
              { header: 'Quantity', key: 'quantity', render: (row) => parseTripNotes(row).quantity },
              { header: 'Customer', key: 'customer', render: (row) => parseTripNotes(row).customer },
              { header: 'Rate', key: 'rate', render: (row) => parseTripNotes(row).rate },
              { header: 'Status', key: 'status' },
              { header: 'Revenue', key: 'revenue' }
            ]}
          />
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Plan New Trip
          </button>
        </div>
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
        
        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Trip No, Vehicle, Driver..."
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
            <option value="All Status">All Trips</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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
                  <th>Trip No</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>Loading trips...</td></tr>
                ) : filteredTrips.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No trips found</td></tr>
                ) : (
                  filteredTrips.map(trip => {
                    const info = parseTripNotes(trip);
                    return (
                      <tr key={trip.id} onClick={() => setViewingTrip(trip)} style={{ cursor: 'pointer', background: viewingTrip?.id === trip.id ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.2s' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trip.id}</td>
                        <td>{getVehicleName(trip.vehicle_id)}</td>
                        <td>{getDriverName(trip.driver_id)}</td>
                        <td>{trip.start_location} &rarr; {trip.end_location}</td>
                        <td>{trip.trip_date ? trip.trip_date.split('T')[0] : '-'}</td>
                        <td>-</td>
                        <td style={{ textAlign: 'center' }}>
                          {getStatusBadge(trip.status)}
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingTrip(trip)} title="Preview Profile">
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleOpenForm(trip)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleDelete(trip.id, e)} title="Delete">
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
      
      
        {/* Profile View Modal */}
        {viewingTrip && (() => {
          const info = parseTripNotes(viewingTrip);
          return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Trip Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(viewingTrip)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setViewingTrip(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
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
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>TRIP DETAILS</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(viewingTrip.status || 'SCHEDULED').toUpperCase()}</span></div>
                        </div>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Trip Date</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div style={{ fontWeight: 500, color: '#0f172a' }}>{viewingTrip.trip_date ? viewingTrip.trip_date.split('T')[0] : '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                  <div style={{ padding: '10px 40px 40px 40px' }}>
                    
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <User size={14} /> 1. VEHICLE & DRIVER
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Vehicle" value={getVehicleName(viewingTrip.vehicle_id)} />
                        </div>
                        <div>
                          <InfoRow2 label="Driver" value={getDriverName(viewingTrip.driver_id)} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <MapPin size={14} /> 2. ROUTE DETAILS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Start Location" value={viewingTrip.start_location} />
                        </div>
                        <div>
                          <InfoRow2 label="End Location" value={viewingTrip.end_location} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <IndianRupee size={14} /> 3. MATERIAL & CUSTOMER
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Material" value={info.material} />
                          <InfoRow2 label="Quantity" value={info.quantity} />
                        </div>
                        <div>
                          <InfoRow2 label="Customer" value={info.customer} />
                          <InfoRow2 label="Estimated Revenue" value={`₹${viewingTrip.revenue ? viewingTrip.revenue.toLocaleString() : '0'}`} />
                        </div>
                      </div>
                    </div>

                    {viewingTrip.voice_note_path && (
                      <div style={{ marginTop: 24, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
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

export default TripPlanning;
