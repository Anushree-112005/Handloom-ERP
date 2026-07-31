import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, AlertTriangle, Truck, User, MapPin, Wrench, DollarSign, ArrowLeft, Save, X, Edit2, Trash2, Eye } from 'lucide-react';

const BreakdownEntry = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  
  const [mode, setMode] = useState('list');
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    breakdown_date: new Date().toISOString().split('T')[0],
    breakdown_time: '',
    breakdown_location: '',
    route_id: '',
    current_odometer: '',
    breakdown_type: '',
    issue_description: '',
    severity: 'Medium',
    action_taken: '',
    repair_type: 'Temporary',
    sent_to_service: 'No',
    service_center_name: '',
    mechanic_name: '',
    contact_number: '',
    estimated_cost: '',
    actual_cost: '',
    status: 'Reported',
    remarks: '',
    attachment: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const breakdownTypes = [
    { value: 'Engine Failure', label: 'Engine Failure' },
    { value: 'Tyre Puncture', label: 'Tyre Puncture' },
    { value: 'Brake Issue', label: 'Brake Issue' },
    { value: 'Electrical Issue', label: 'Electrical Issue' },
    { value: 'Others', label: 'Others' }
  ];

  const severities = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ];

  const repairTypes = [
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Permanent', label: 'Permanent' }
  ];

  const statuses = [
    { value: 'Reported', label: 'Reported' },
    { value: 'In Repair', label: 'In Repair' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [breakdownsRes, vehiclesRes, driversRes, routesRes] = await Promise.all([
        api.get('/fleet/breakdowns'),
        api.get('/fleet/vehicles'),
        api.get('/fleet/drivers'),
        api.get('/fleet/routes')
      ]);
      setBreakdowns(breakdownsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
      setRoutes(routesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load breakdown data');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.vehicle_number || '';
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || '';
  const getRouteName = (id) => routes.find(r => r.id === id)?.route_name || '';

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      driver_id: '',
      breakdown_date: new Date().toISOString().split('T')[0],
      breakdown_time: '',
      breakdown_location: '',
      route_id: '',
      current_odometer: '',
      breakdown_type: '',
      issue_description: '',
      severity: 'Medium',
      action_taken: '',
      repair_type: 'Temporary',
      sent_to_service: 'No',
      service_center_name: '',
      mechanic_name: '',
      contact_number: '',
      estimated_cost: '',
      actual_cost: '',
      status: 'Reported',
      remarks: '',
      attachment: ''
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
      vehicle_id: entry.vehicle_id || '',
      driver_id: entry.driver_id || '',
      breakdown_date: entry.breakdown_date || '',
      breakdown_time: entry.breakdown_time || '',
      breakdown_location: entry.breakdown_location || '',
      route_id: entry.route_id || '',
      current_odometer: (entry.current_odometer || '').toString(),
      breakdown_type: entry.breakdown_type || '',
      issue_description: entry.issue_description || '',
      severity: entry.severity || 'Medium',
      action_taken: entry.action_taken || '',
      repair_type: entry.repair_type || 'Temporary',
      sent_to_service: entry.sent_to_service ? 'Yes' : 'No',
      service_center_name: entry.service_center_name || '',
      mechanic_name: entry.mechanic_name || '',
      contact_number: entry.contact_number || '',
      estimated_cost: (entry.estimated_cost || 0).toString(),
      actual_cost: (entry.actual_cost || 0).toString(),
      status: entry.status || 'Reported',
      remarks: entry.remarks || '',
      attachment: entry.attachment || ''
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.vehicle_id && !formData.breakdown_type;
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
    setIsSaving(true);

    const payload = {
      vehicle_id: parseInt(formData.vehicle_id),
      driver_id: parseInt(formData.driver_id),
      breakdown_date: formData.breakdown_date,
      breakdown_time: formData.breakdown_time,
      breakdown_location: formData.breakdown_location,
      route_id: formData.route_id ? parseInt(formData.route_id) : null,
      current_odometer: formData.current_odometer ? parseFloat(formData.current_odometer) : null,
      breakdown_type: formData.breakdown_type,
      issue_description: formData.issue_description,
      severity: formData.severity,
      action_taken: formData.action_taken,
      repair_type: formData.repair_type,
      sent_to_service: formData.sent_to_service === 'Yes',
      service_center_name: formData.service_center_name,
      mechanic_name: formData.mechanic_name,
      contact_number: formData.contact_number,
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
      actual_cost: parseFloat(formData.actual_cost) || 0,
      status: formData.status,
      remarks: formData.remarks,
      attachment: formData.attachment
    };

    try {
      if (editingEntry) {
        await api.put(`/fleet/breakdowns/${editingEntry.id}`, payload);
        showSuccess('Breakdown entry updated successfully');
      } else {
        await api.post('/fleet/breakdowns', payload);
        showSuccess('Breakdown entry created successfully');
      }
      await fetchInitialData();
      backToList();
    } catch (error) {
      console.error('Failed to save breakdown entry:', error);
      showError(error.response?.data?.detail || 'Failed to save breakdown entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Breakdown Entry',
      description: 'Are you sure you want to delete this specific breakdown record?',
      confirmText: 'Delete',
      variant: 'destructive'
    }).catch(() => false);
    
    if (!confirmed) return;

    try {
      await api.delete(`/fleet/breakdowns/${id}`);
      showSuccess('Breakdown entry deleted successfully');
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to delete breakdown entry:', error);
      showError(error.response?.data?.detail || 'Failed to delete breakdown entry');
    }
  };

  const getStatusColor = (status) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'REPORTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'IN REPAIR': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'RESOLVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'text-yellow-600 bg-yellow-100';
      case 'Medium': return 'text-orange-600 bg-orange-100';
      case 'High': return 'text-red-600 bg-red-100 font-bold';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleVehicleChange = (e) => {
    const vehicleId = e.target.value;
    const selectedVehicle = vehicles.find(v => v.id.toString() === vehicleId);
    
    let driverId = '';
    if (selectedVehicle) {
      // Find driver assigned to this vehicle
      const assignedDriver = drivers.find(d => d.assigned_vehicle_id === selectedVehicle.id);
      if (assignedDriver) {
        driverId = assignedDriver.id;
      }
    }

    setFormData({
      ...formData,
      vehicle_id: vehicleId,
      driver_id: driverId,
      route_id: '' // Reset route when vehicle changes
    });
  };

  const filteredRoutes = formData.vehicle_id 
    ? routes.filter(r => r.fuel_vehicle_number === vehicles.find(v => v.id.toString() === formData.vehicle_id)?.vehicle_number)
    : routes;

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
                <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  {editingEntry ? 'Edit Breakdown Entry' : 'New Breakdown Entry'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleCancel} className="btn btn-secondary">
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSaving}
                  className="btn btn-danger"
                >
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="form-row">
              {/* Basic Details */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-500" /> Basic Details
                </h3>
                <div className="form-row">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Vehicle *</label>
                    <select required value={formData.vehicle_id} onChange={handleVehicleChange} className="form-control">
                      <option value="">Select Vehicle</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Driver *</label>
                    <select required value={formData.driver_id} onChange={(e) => setFormData({...formData, driver_id: e.target.value})} className="form-control">
                      <option value="">Select Driver</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Breakdown Date *</label>
                    <input type="date" required value={formData.breakdown_date} onChange={(e) => setFormData({...formData, breakdown_date: e.target.value})} className="form-control" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Breakdown Time *</label>
                    <input type="time" required value={formData.breakdown_time} onChange={(e) => setFormData({...formData, breakdown_time: e.target.value})} className="form-control" />
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" /> Location Details
                </h3>
                <div className="form-row">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Breakdown Location *</label>
                    <input type="text" required placeholder="Highway mile marker, City name..." value={formData.breakdown_location} onChange={(e) => setFormData({...formData, breakdown_location: e.target.value})} className="form-control" />
                  </div>
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Route (Optional)</label>
                      <select value={formData.route_id} onChange={(e) => setFormData({...formData, route_id: e.target.value})} className="form-control">
                        <option value="">Select Route</option>
                        {filteredRoutes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Current KM (Odometer)</label>
                      <input type="number" step="0.1" value={formData.current_odometer} onChange={(e) => setFormData({...formData, current_odometer: e.target.value})} className="form-control" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-gray-500" /> Issue Details
              </h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Breakdown Type *</label>
                  <select required value={formData.breakdown_type} onChange={(e) => setFormData({...formData, breakdown_type: e.target.value})} className="form-control">
                    <option value="">Select Issue Type</option>
                    {breakdownTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Severity *</label>
                  <select required value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} className="form-control">
                    {severities.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Issue Description *</label>
                  <textarea required rows="3" placeholder="Describe the breakdown incident in detail..." value={formData.issue_description} onChange={(e) => setFormData({...formData, issue_description: e.target.value})} className="form-control"></textarea>
                </div>
              </div>
            </div>

            <div className="form-row">
              {/* Action Details */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-gray-500" /> Action & Service Details
                </h3>
                <div className="form-row">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Action Taken</label>
                    <input type="text" placeholder="Towed to workshop, roadside fix..." value={formData.action_taken} onChange={(e) => setFormData({...formData, action_taken: e.target.value})} className="form-control" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Repair Type</label>
                    <select value={formData.repair_type} onChange={(e) => setFormData({...formData, repair_type: e.target.value})} className="form-control">
                      {repairTypes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Sent to Service?</label>
                    <select value={formData.sent_to_service} onChange={(e) => setFormData({...formData, sent_to_service: e.target.value})} className="form-control">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div className="col-span-2 pt-2">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Service Center Name</label>
                    <input type="text" value={formData.service_center_name} onChange={(e) => setFormData({...formData, service_center_name: e.target.value})} className="form-control" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Mechanic Name</label>
                    <input type="text" value={formData.mechanic_name} onChange={(e) => setFormData({...formData, mechanic_name: e.target.value})} className="form-control" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Contact Number</label>
                    <input type="text" value={formData.contact_number} onChange={(e) => setFormData({...formData, contact_number: e.target.value})} className="form-control" />
                  </div>
                </div>
              </div>

              {/* Status & Costs Details */}
              <div className="card">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-gray-500" /> Cost & Status Tracking
                  </h3>
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Estimated Cost (₹)</label>
                      <input type="number" step="0.01" value={formData.estimated_cost} onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})} className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Actual Cost (₹)</label>
                      <input type="number" step="0.01" value={formData.actual_cost} onChange={(e) => setFormData({...formData, actual_cost: e.target.value})} className="form-control" />
                    </div>
                    <div className="col-span-2 pt-2">
                      <label className="block text-sm font-medium mb-1 text-gray-700">Status Tracking *</label>
                      <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="form-control">
                        {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <h3 className="text-sm font-bold text-gray-700 border-b pb-1 mb-3">Additional Files/Notes</h3>
                  <div className="space-y-3">
                    <div>
                      <input type="text" placeholder="Remarks / Notes" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="form-control" />
                    </div>
                    <div>
                      <input type="text" placeholder="Attachment Link (Photo / Bill URL)" value={formData.attachment} onChange={(e) => setFormData({...formData, attachment: e.target.value})} className="form-control" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-red-500" /> Breakdown Entry
          </h1>
          <p className="text-gray-600 mt-1">Report and track vehicle breakdowns</p>
        </div>
        <button onClick={openAddForm} className="btn btn-danger">
          <Plus className="h-4 w-4" /> Log Breakdown
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breakdown Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle & Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue & Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {breakdowns.map((entry) => (
                <tr key={entry.id} className="btn btn-secondary">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{entry.breakdown_type}</div>
                    <div className="text-sm text-gray-500">{new Date(entry.breakdown_date).toLocaleDateString()} at {entry.breakdown_time}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 flex items-center gap-1">
                      <Truck className="h-4 w-4 text-gray-400" /> {getVehicleName(entry.vehicle_id)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" /> {entry.breakdown_location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-800 line-clamp-1 max-w-[200px]" title={entry.issue_description}>{entry.issue_description}</div>
                    <span className={`inline-flex px-2 mt-1 text-xs font-semibold rounded ${getSeverityColor(entry.severity)}`}>
                      {entry.severity} Severity
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">₹{(entry.actual_cost || 0).toFixed(2)} Actual</div>
                    <div className="text-xs text-gray-500 mt-1">₹{(entry.estimated_cost || 0).toFixed(2)} Est.</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
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
                    </div>
                  </td>
                </tr>
              ))}
              {breakdowns.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No breakdown entries found. Log a new incident above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal Popup */}
      {viewingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card">
            <div className="btn btn-danger">
              <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" /> Breakdown Incident Record
              </h2>
              <button 
                onClick={() => setViewingEntry(null)}
                className="btn btn-danger"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[80vh] bg-white text-gray-800">
              <div className="form-row">
                
                {/* Vehicle & Core Metadata */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</p>
                  <p className="font-semibold text-gray-900 text-lg">{getVehicleName(viewingEntry.vehicle_id)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Driver</p>
                  <p className="font-semibold text-gray-900">{getDriverName(viewingEntry.driver_id)}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Incident Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(viewingEntry.breakdown_date).toLocaleDateString()} at {viewingEntry.breakdown_time}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(viewingEntry.status)}`}>
                    {viewingEntry.status}
                  </span>
                </div>

                {/* Location & Trip */}
                <div className="col-span-2 bg-gray-50 border rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                    <p className="font-semibold text-gray-900">{viewingEntry.breakdown_location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Route Reference</p>
                    <p className="font-medium text-gray-800">{viewingEntry.route_id ? getRouteName(viewingEntry.route_id) : 'No route assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Odometer (KM)</p>
                    <p className="font-medium text-gray-800">{viewingEntry.current_odometer ? `${viewingEntry.current_odometer} KM` : 'Unknown'}</p>
                  </div>
                </div>

                {/* Issue Context */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Breakdown Type</p>
                  <p className="font-medium text-red-600 font-semibold">{viewingEntry.breakdown_type}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Severity</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase rounded border ${getSeverityColor(viewingEntry.severity)}`}>
                    {viewingEntry.severity}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Issue Description</p>
                  <p className="btn btn-danger">
                    "{viewingEntry.issue_description}"
                  </p>
                </div>

                {/* Repairs & Cost */}
                <div className="col-span-2 pt-4 border-t mt-2">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-gray-500" /> Actions & Financials
                  </h3>
                  <div className="form-row">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Action Taken</p>
                      <p className="font-medium text-gray-900">{viewingEntry.action_taken || 'Pending action...'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Repair Environment</p>
                      <p className="font-medium text-gray-900">
                        {viewingEntry.repair_type} • {viewingEntry.sent_to_service ? 'Sent to Service Center' : 'Field Resolved'}
                      </p>
                    </div>
                    <div className="card">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Service Contact</p>
                      <p className="font-medium text-gray-900">{viewingEntry.service_center_name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{viewingEntry.mechanic_name} {viewingEntry.contact_number}</p>
                    </div>
                    <div className="card">
                      <div className="card-header">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated</span>
                        <span className="text-sm font-semibold text-gray-600">₹{(viewingEntry.estimated_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actual</span>
                        <span className="text-lg font-bold text-red-600">₹{(viewingEntry.actual_cost || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks & Attachments */}
                {(viewingEntry.remarks || viewingEntry.attachment) && (
                  <div className="col-span-2 pt-4 border-t mt-2 flex flex-col gap-4">
                    {viewingEntry.remarks && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Additional Remarks</p>
                        <p className="font-medium text-gray-800 text-sm">{viewingEntry.remarks}</p>
                      </div>
                    )}
                    {viewingEntry.attachment && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Attachments</p>
                        <a href={viewingEntry.attachment} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline break-all inline-flex items-center gap-1">
                          View Linked Bill / Media
                        </a>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingEntry(null)}
                className="btn btn-secondary"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BreakdownEntry;
