import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, MapPin, Truck, User, Package, DollarSign, Clock, ArrowLeft, Save, X, Edit2, Trash2, Eye, Volume2 } from 'lucide-react';

const TripPlanning = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [mode, setMode] = useState('list');
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
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
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || '';

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
      date: formData.date,
      vehicle_id: parseInt(formData.vehicle_id),
      driver_id: parseInt(formData.driver_id),
      from_location: formData.from_location,
      to_location: formData.to_location,
      material: formData.material,
      quantity_tons: parseFloat(formData.quantity_tons) || 0,
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      rate_per_ton: parseFloat(formData.rate_per_ton) || 0
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

  const getStatusColor = (status) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (mode === 'form') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="btn btn-secondary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleCancel} className="btn btn-secondary">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {editingTrip ? 'Edit Trip' : 'New Trip'}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleCancel} className="flex items-center gap-2 border px-4 py-2 rounded-lg">
                  <X size={16} /> Cancel
                </button>
                <button onClick={handleSubmit} className="btn btn-primary">
                  <Save size={16} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto">
          <div className="card">
            <form onSubmit={handleSubmit} className="form-row">
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vehicle *</label>
                <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} className="form-control">
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Driver *</label>
                <select required value={formData.driver_id} onChange={(e) => setFormData({...formData, driver_id: e.target.value})} className="form-control">
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Customer *</label>
                <input type="text" required value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Customer Phone</label>
                <input type="text" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Crusher Name *</label>
                <input type="text" required value={formData.from_location} onChange={(e) => setFormData({...formData, from_location: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Location *</label>
                <input type="text" required value={formData.to_location} onChange={(e) => setFormData({...formData, to_location: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Material *</label>
                <input type="text" required value={formData.material} onChange={(e) => setFormData({...formData, material: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity (Tons) *</label>
                <input type="number" step="0.1" required value={formData.quantity_tons} onChange={(e) => setFormData({...formData, quantity_tons: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rate per Ton (₹) *</label>
                <input type="number" step="0.01" required value={formData.rate_per_ton} onChange={(e) => setFormData({...formData, rate_per_ton: e.target.value})} className="form-control" />
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MapPin className="h-7 w-7 text-blue-600" /> Trip Planning
          </h1>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus className="h-4 w-4" /> New Trip
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle & Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voice Note</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trips.map(trip => (
                <tr key={trip.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{trip.trip_number}</div>
                    <div className="text-sm text-gray-500">{new Date(trip.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div><Truck className="inline h-4 w-4 mr-1 text-gray-400" />{getVehicleName(trip.vehicle_id)}</div>
                    <div><User className="inline h-4 w-4 mr-1 text-gray-400" />{getDriverName(trip.driver_id)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {trip.from_location} &rarr; {trip.to_location}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {trip.material} ({trip.quantity_tons} Tons)
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(trip.status)}`}>{trip.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {trip.voice_note_path ? (
                      <div className="flex items-center gap-2">
                        <audio src={trip.voice_note_path.startsWith('http') ? trip.voice_note_path : `/${trip.voice_note_path}`} className="h-6 w-24" controls />
                        <Volume2 size={12} className="text-blue-500" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No note</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setViewingTrip(trip)} className="btn btn-success" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEditForm(trip)} className="btn btn-primary" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(trip.id)} className="btn btn-danger" title="Delete">
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
      {viewingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Trip Details ({viewingTrip.trip_number})</h2>
              <button 
                onClick={() => setViewingTrip(null)}
                className="btn btn-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="form-row">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-400" /> 
                    {new Date(viewingTrip.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(viewingTrip.status)}`}>
                    {viewingTrip.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Truck className="h-4 w-4 text-gray-400" /> 
                    {getVehicleName(viewingTrip.vehicle_id)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Driver</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-400" /> 
                    {getDriverName(viewingTrip.driver_id)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Crusher Name</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" /> 
                    {viewingTrip.from_location}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Delivery Location</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" /> 
                    {viewingTrip.to_location}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Material</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Package className="h-4 w-4 text-gray-400" /> 
                    {viewingTrip.material}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Quantity</p>
                  <p className="font-medium text-gray-900">
                    {viewingTrip.quantity_tons} Tons
                  </p>
                </div>
                <div className="col-span-2 pt-4 border-t mt-2">
                  <h3 className="font-semibold text-gray-900 mb-4">Financials & Additional Details</h3>
                  <div className="form-row">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Customer</p>
                      <p className="font-medium text-gray-900">{viewingTrip.customer_name} ({viewingTrip.customer_phone || 'No Phone'})</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rate per Ton</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" /> 
                        ₹{viewingTrip.rate_per_ton || 0}
                      </p>
                    </div>
                    {viewingTrip.remarks && (
                      <div className="col-span-2 mt-2">
                        <p className="text-sm text-gray-500 mb-1">Remarks</p>
                        <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border">
                          {viewingTrip.remarks}
                        </p>
                      </div>
                    )}
                    {viewingTrip.voice_note_path && (
                      <div className="btn btn-primary">
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Volume2 size={16} /> Driver Voice Note
                        </p>
                        <audio 
                          src={viewingTrip.voice_note_path.startsWith('http') ? viewingTrip.voice_note_path : `/${viewingTrip.voice_note_path}`} 
                          controls 
                          className="w-full h-10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingTrip(null)}
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

export default TripPlanning;
