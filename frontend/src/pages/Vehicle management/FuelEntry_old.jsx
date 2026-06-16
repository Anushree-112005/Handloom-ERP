import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, Fuel, Calendar, DollarSign, Truck, User, ArrowLeft, Save, X, Edit2, Trash2, Eye } from 'lucide-react';

const FuelEntry = () => {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [mode, setMode] = useState('list');
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null); // Added for view popup
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicle_id: '',
    station_id: '',
    fuel_type: 'DIESEL',
    quantity_liters: '',
    rate_per_liter: '',
    odometer_reading: '',
    payment_mode: 'Cash',
    remarks: ''
  });

  const [loading, setLoading] = useState(true);

  const fuelTypes = [
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'PETROL', label: 'Petrol' },
    { value: 'CNG', label: 'CNG' }
  ];

  const paymentMethods = [
    { value: 'Cash', label: 'Cash' },
    { value: 'Credit Card', label: 'Credit Card' },
    { value: 'Fuel Card', label: 'Fuel Card' },
    { value: 'UPI', label: 'UPI' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [entriesRes, vehiclesRes, stationsRes] = await Promise.all([
        api.get('/fleet/fuel-entries'),
        api.get('/fleet/vehicles'),
        api.get('/fleet/fuel-stations')
      ]);
      setFuelEntries(entriesRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setStations(stationsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load fuel entries data');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.vehicle_number || '';
  const getStationName = (id) => stations.find(s => s.id === id)?.station_name || 'N/A';

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      vehicle_id: '',
      station_id: '',
      fuel_type: 'DIESEL',
      quantity_liters: '',
      rate_per_liter: '',
      odometer_reading: '',
      payment_mode: 'Cash',
      remarks: ''
    });
  };

  const openAddForm = () => {
    setEditingEntry(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      vehicle_id: entry.vehicle_id || '',
      station_id: entry.station_id || '',
      fuel_type: entry.fuel_type || 'DIESEL',
      quantity_liters: (entry.quantity_liters || 0).toString(),
      rate_per_liter: (entry.rate_per_liter || 0).toString(),
      odometer_reading: (entry.odometer_reading || '').toString(),
      payment_mode: entry.payment_mode || 'Cash',
      remarks: entry.remarks || ''
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.vehicle_id && !formData.quantity_liters;
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
    setEditingEntry(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalAmount = parseFloat(formData.quantity_liters) * parseFloat(formData.rate_per_liter);

    const payload = {
      date: formData.date,
      vehicle_id: parseInt(formData.vehicle_id),
      station_id: formData.station_id ? parseInt(formData.station_id) : null,
      fuel_type: formData.fuel_type,
      quantity_liters: parseFloat(formData.quantity_liters) || 0,
      rate_per_liter: parseFloat(formData.rate_per_liter) || 0,
      total_amount: totalAmount,
      odometer_reading: formData.odometer_reading ? parseFloat(formData.odometer_reading) : null,
      payment_mode: formData.payment_mode,
      remarks: formData.remarks
    };

    try {
      if (editingEntry) {
        await api.put(`/fleet/fuel-entries/${editingEntry.id}`, payload);
        showSuccess('Fuel entry updated successfully');
      } else {
        await api.post('/fleet/fuel-entries', payload);
        showSuccess('Fuel entry created successfully');
      }
      await fetchInitialData();
      backToList();
    } catch (error) {
      console.error('Failed to save fuel entry:', error);
      showError(error.response?.data?.detail || 'Failed to save fuel entry');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Fuel Entry',
      description: 'Are you sure you want to delete this fuel entry?',
      confirmText: 'Delete',
      variant: 'destructive'
    }).catch(() => false);
    
    if (!confirmed) return;

    try {
      await api.delete(`/fleet/fuel-entries/${id}`);
      showSuccess('Fuel entry deleted successfully');
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to delete fuel entry:', error);
      showError(error.response?.data?.detail || 'Failed to delete fuel entry');
    }
  };

  if (mode === 'form') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="btn btn-secondary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={backToList} className="btn btn-secondary">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {editingEntry ? 'Edit Fuel Entry' : 'New Fuel Entry'}
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
                <label className="block text-sm font-medium mb-2">Fuel Station</label>
                <select value={formData.station_id} onChange={(e) => setFormData({...formData, station_id: e.target.value})} className="form-control">
                  <option value="">Select Fuel Station</option>
                  {stations.map(s => <option key={s.id} value={s.id}>{s.station_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fuel Type *</label>
                <select required value={formData.fuel_type} onChange={(e) => setFormData({...formData, fuel_type: e.target.value})} className="form-control">
                  {fuelTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity (Liters) *</label>
                <input type="number" step="0.1" required value={formData.quantity_liters} onChange={(e) => setFormData({...formData, quantity_liters: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price per Liter (₹) *</label>
                <input type="number" step="0.01" required value={formData.rate_per_liter} onChange={(e) => setFormData({...formData, rate_per_liter: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Odometer Reading</label>
                <input type="number" value={formData.odometer_reading} onChange={(e) => setFormData({...formData, odometer_reading: e.target.value})} className="form-control" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method *</label>
                <select required value={formData.payment_mode} onChange={(e) => setFormData({...formData, payment_mode: e.target.value})} className="form-control">
                  {paymentMethods.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}
                </select>
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
            <Fuel className="h-7 w-7 text-blue-600" /> Fuel Entry
          </h1>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus className="h-4 w-4" /> New Fuel Entry
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry ID & Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle & Station</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuel Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fuelEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{entry.entry_number}</div>
                    <div className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div><Truck className="inline h-4 w-4 mr-1 text-gray-400" /> {getVehicleName(entry.vehicle_id)}</div>
                    {entry.station_id && <div className="text-sm text-blue-600 mt-1">{getStationName(entry.station_id)}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{entry.fuel_type}</div>
                    <div className="text-sm text-gray-500">{entry.quantity_liters}L @ ₹{entry.rate_per_liter}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">₹{(entry.total_amount || 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{entry.payment_mode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setViewingEntry(entry)} className="btn btn-success" title="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEditForm(entry)} className="btn btn-primary" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="btn btn-danger" title="Delete">
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

      {/* View Modal Popup */}
      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Fuel className="h-5 w-5 text-blue-600" /> Fuel Entry Details ({viewingEntry.entry_number})
              </h2>
              <button 
                onClick={() => setViewingEntry(null)}
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
                    <Calendar className="h-4 w-4 text-gray-400" /> 
                    {new Date(viewingEntry.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="font-bold text-lg text-blue-700">₹{(viewingEntry.total_amount || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Truck className="h-4 w-4 text-gray-400" /> 
                    {getVehicleName(viewingEntry.vehicle_id)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Odometer Reading</p>
                  <p className="font-medium text-gray-900">{viewingEntry.odometer_reading ? `${viewingEntry.odometer_reading} KM` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Fuel Station</p>
                  <p className="font-medium text-gray-900">{viewingEntry.station_id ? getStationName(viewingEntry.station_id) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="font-medium text-gray-900">{viewingEntry.payment_mode || 'Cash'}</p>
                </div>
                
                <div className="col-span-2 pt-4 border-t mt-2">
                  <h3 className="font-semibold text-gray-900 mb-4">Fuel Particulars</h3>
                  <div className="form-row">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Type</p>
                      <p className="font-medium text-gray-900">{viewingEntry.fuel_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <p className="font-medium text-gray-900">{viewingEntry.quantity_liters} L</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Rate</p>
                      <p className="font-medium text-gray-900">₹{viewingEntry.rate_per_liter} / L</p>
                    </div>
                  </div>
                </div>

                {viewingEntry.remarks && (
                  <div className="col-span-2 mt-2">
                    <p className="text-sm text-gray-500 mb-1">Remarks</p>
                    <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border">
                      {viewingEntry.remarks}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingEntry(null)}
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

export default FuelEntry;
