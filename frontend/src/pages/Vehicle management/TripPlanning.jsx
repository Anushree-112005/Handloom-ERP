import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { 
  Plus, MapPin, Truck, User, Package, DollarSign, Clock, 
  ArrowLeft, Save, X, Edit2, Trash2, Eye, Volume2, Search,
  Phone, Briefcase
} from 'lucide-react';

const TripPlanning = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [mode, setMode] = useState('list');
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
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
  });

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

  const resetForm = () => {
    setFormData({
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
    });
  };

  const openAddForm = () => {
    setEditingTrip(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (trip) => {
    setEditingTrip(trip);
    setFormData({
      date: trip.date,
      vehicle_id: trip.vehicle_id || '',
      driver_id: trip.driver_id || '',
      from_location: trip.from_location || '',
      to_location: trip.to_location || '',
      material: trip.material || '',
      quantity_tons: (trip.quantity_tons || 0).toString(),
      customer_name: trip.customer_name || '',
      customer_phone: trip.customer_phone || '',
      rate_per_ton: (trip.rate_per_ton || 0).toString()
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.vehicle_id && !formData.driver_id && !formData.customer_name;
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
    setEditingTrip(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      await fetchInitialData();
      backToList();
    } catch (error) {
      console.error('Failed to save trip:', error);
      showError(error.response?.data?.detail || 'Failed to save trip');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Trip',
      description: 'Are you sure you want to delete this trip?',
      confirmText: 'Delete',
      variant: 'destructive'
    }).catch(() => false);
    
    if (!confirmed) return;

    try {
      await api.delete(`/fleet/trips/${id}`);
      showSuccess('Trip deleted successfully');
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      showError(error.response?.data?.detail || 'Failed to delete trip');
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PLANNED': 
        return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>Planned</span>;
      case 'IN PROGRESS':
      case 'IN_PROGRESS': 
        return <span className="badge" style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>In Progress</span>;
      case 'COMPLETED': 
        return <span className="badge badge-active">Completed</span>;
      case 'CANCELLED': 
        return <span className="badge" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>Cancelled</span>;
      default: 
        return <span className="badge" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>{status}</span>;
    }
  };

  // Helper to parse materials and financials from trip notes
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

  const filteredTrips = trips.filter(trip => {
    const info = parseTripNotes(trip);
    const searchLower = searchTerm.toLowerCase();
    return (
      (trip.id || '').toString().includes(searchLower) ||
      (trip.start_location || '').toLowerCase().includes(searchLower) ||
      (trip.end_location || '').toLowerCase().includes(searchLower) ||
      (getVehicleName(trip.vehicle_id) || '').toLowerCase().includes(searchLower) ||
      (getDriverName(trip.driver_id) || '').toLowerCase().includes(searchLower) ||
      info.material.toLowerCase().includes(searchLower) ||
      info.customer.toLowerCase().includes(searchLower)
    );
  });

  if (mode === 'form') {
    return (
      <div className="animate-fade" style={{ padding: 2 }}>
        {/* Form header row matching Sales Invoice style */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handleCancel} className="btn btn-secondary" style={{ padding: 8, display: 'inline-flex', alignItems: 'center' }}>
              <ArrowLeft size={20} />
            </button>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingTrip ? 'Edit Trip Details' : 'Plan New Trip'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleCancel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={16} /> Save Plan
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Date *</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-control" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Vehicle *</label>
              <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} className="form-control">
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Driver *</label>
              <select required value={formData.driver_id} onChange={(e) => setFormData({...formData, driver_id: e.target.value})} className="form-control">
                <option value="">Select Driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Customer *</label>
              <input type="text" required value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="form-control" placeholder="Enter customer name" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Customer Phone</label>
              <input type="text" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} className="form-control" placeholder="Optional phone number" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Crusher / Start Location *</label>
              <input type="text" required value={formData.from_location} onChange={(e) => setFormData({...formData, from_location: e.target.value})} className="form-control" placeholder="Start location" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Delivery / End Location *</label>
              <input type="text" required value={formData.to_location} onChange={(e) => setFormData({...formData, to_location: e.target.value})} className="form-control" placeholder="End location" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Material *</label>
              <input type="text" required value={formData.material} onChange={(e) => setFormData({...formData, material: e.target.value})} className="form-control" placeholder="e.g. M-Sand, Blue Metal" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Qty (Tons) *</label>
                <input type="number" step="0.1" required value={formData.quantity_tons} onChange={(e) => setFormData({...formData, quantity_tons: e.target.value})} className="form-control" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Rate / Ton *</label>
                <input type="number" step="0.01" required value={formData.rate_per_ton} onChange={(e) => setFormData({...formData, rate_per_ton: e.target.value})} className="form-control" placeholder="₹" />
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ padding: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Upper header action row matching Sales Invoice */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={28} color="var(--primary)" /> Trip Planning
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Plan and schedule vehicle transport trips</p>
        </div>
        <div>
          <button onClick={openAddForm} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> New Trip
          </button>
        </div>
      </div>

      {/* Main Table list Card */}
      <div className="card" style={{ padding: 20 }}>
        {/* Table Top Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, pb: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search trips, vehicles, locations..." 
              className="form-control"
              style={{ paddingLeft: 38, width: '100%', margin: 0, height: 38 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '12px 16px' }}>Trip Details</th>
                <th style={{ padding: '12px 16px' }}>Vehicle & Driver</th>
                <th style={{ padding: '12px 16px' }}>Route</th>
                <th style={{ padding: '12px 16px' }}>Material & Customer</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Voice Note</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    No planned trips found
                  </td>
                </tr>
              ) : (
                filteredTrips.map(trip => {
                  const info = parseTripNotes(trip);
                  return (
                    <tr key={trip.id}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Trip #{trip.id}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(trip.trip_date).toLocaleDateString()}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Truck size={14} style={{ color: 'var(--text-muted)' }} /> {getVehicleName(trip.vehicle_id)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} style={{ color: 'var(--text-muted)' }} /> {getDriverName(trip.driver_id)}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                          {trip.start_location} &rarr; {trip.end_location}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            {info.material} ({info.quantity})
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {info.customer}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getStatusBadge(trip.status)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {trip.voice_note_path ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <audio src={trip.voice_note_path.startsWith('http') ? trip.voice_note_path : `/${trip.voice_note_path}`} style={{ height: 26, width: 120 }} controls />
                            <Volume2 size={14} style={{ color: 'var(--primary)' }} />
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No voice note</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setViewingTrip(trip)} className="btn btn-secondary" style={{ padding: 6, borderRadius: 6 }} title="View">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => openEditForm(trip)} className="btn btn-secondary" style={{ padding: 6, borderRadius: 6 }} title="Edit">
                            <Edit2 size={15} color="var(--primary)" />
                          </button>
                          <button onClick={() => handleDelete(trip.id)} className="btn btn-secondary" style={{ padding: 6, borderRadius: 6 }} title="Delete">
                            <Trash2 size={15} color="#ef4444" />
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

      {/* View Modal with Premium Backdrop Blur */}
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
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Trip Details — #{viewingTrip.id}
                </h3>
                <button onClick={() => setViewingTrip(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Trip Date</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={16} color="var(--text-muted)" /> {new Date(viewingTrip.trip_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Current Status</span>
                    <div style={{ marginTop: 4 }}>
                      {getStatusBadge(viewingTrip.status)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Vehicle Number</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={16} color="var(--text-muted)" /> {getVehicleName(viewingTrip.vehicle_id)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Assigned Driver</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={16} color="var(--text-muted)" /> {getDriverName(viewingTrip.driver_id)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Crusher / Start Location</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={16} color="var(--text-muted)" /> {viewingTrip.start_location}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Delivery Location</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={16} color="var(--text-muted)" /> {viewingTrip.end_location}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Material Details</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={16} color="var(--text-muted)" /> {info.material} ({info.quantity})
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', uppercase: true }}>Customer / Consignee</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Briefcase size={16} color="var(--text-muted)" /> {info.customer}
                    </div>
                  </div>
                </div>

                {/* Financial Details Section */}
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

                {/* Voice Note Section */}
                {viewingTrip.voice_note_path && (
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', uppercase: true, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
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

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <button onClick={() => setViewingTrip(null)} className="btn btn-secondary">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TripPlanning;
