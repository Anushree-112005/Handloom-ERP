import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, Calendar, Settings, DollarSign, Truck, MapPin, ArrowLeft, Save, X, Edit2, Trash2, Eye } from 'lucide-react';

const ServiceSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [mode, setMode] = useState('list');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [viewingSchedule, setViewingSchedule] = useState(null);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    service_mode: '',
    schedule_date: new Date().toISOString().split('T')[0],
    next_service_due_date: '',
    current_odometer: '',
    next_service_km: '',
    service_center_name: '',
    contact_person: '',
    contact_number: '',
    estimated_cost: '',
    actual_cost: '',
    status: 'Scheduled',
    priority: 'Normal',
    remarks: '',
    attachment: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const statuses = [
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const priorities = [
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' }
  ];

  const serviceModes = [
    { value: 'In-House', label: 'In-House' },
    { value: 'External Workshop', label: 'External Workshop' },
    { value: 'On-Site', label: 'On-Site' }
  ];

  const serviceTypes = [
    { value: 'General Service', label: 'General Service' },
    { value: 'Oil Change', label: 'Oil Change' },
    { value: 'Tire Replacement', label: 'Tire Replacement' },
    { value: 'Engine Repair', label: 'Engine Repair' },
    { value: 'Body Work', label: 'Body Work' },
    { value: 'Battery Replacement', label: 'Battery Replacement' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, vehiclesRes] = await Promise.all([
        api.get('/fleet/service-schedules'),
        api.get('/fleet/vehicles')
      ]);
      setSchedules(schedulesRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load service schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.vehicle_number || '';

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      service_type: '',
      service_mode: '',
      schedule_date: new Date().toISOString().split('T')[0],
      next_service_due_date: '',
      current_odometer: '',
      next_service_km: '',
      service_center_name: '',
      contact_person: '',
      contact_number: '',
      estimated_cost: '',
      actual_cost: '',
      status: 'Scheduled',
      priority: 'Normal',
      remarks: '',
      attachment: ''
    });
  };

  const openAddForm = () => {
    setEditingSchedule(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      vehicle_id: schedule.vehicle_id || '',
      service_type: schedule.service_type || '',
      service_mode: schedule.service_mode || '',
      schedule_date: schedule.schedule_date || '',
      next_service_due_date: schedule.next_service_due_date || '',
      current_odometer: (schedule.current_odometer || '').toString(),
      next_service_km: (schedule.next_service_km || '').toString(),
      service_center_name: schedule.service_center_name || '',
      contact_person: schedule.contact_person || '',
      contact_number: schedule.contact_number || '',
      estimated_cost: (schedule.estimated_cost || 0).toString(),
      actual_cost: (schedule.actual_cost || 0).toString(),
      status: schedule.status || 'Scheduled',
      priority: schedule.priority || 'Normal',
      remarks: schedule.remarks || '',
      attachment: schedule.attachment || ''
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.vehicle_id && !formData.service_type;
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
    setEditingSchedule(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      vehicle_id: parseInt(formData.vehicle_id),
      service_type: formData.service_type,
      service_mode: formData.service_mode,
      schedule_date: formData.schedule_date,
      next_service_due_date: formData.next_service_due_date ? formData.next_service_due_date : null,
      current_odometer: parseFloat(formData.current_odometer) || 0,
      next_service_km: formData.next_service_km ? parseFloat(formData.next_service_km) : null,
      service_center_name: formData.service_center_name,
      contact_person: formData.contact_person,
      contact_number: formData.contact_number,
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
      actual_cost: parseFloat(formData.actual_cost) || 0,
      status: formData.status,
      priority: formData.priority,
      remarks: formData.remarks,
      attachment: formData.attachment
    };

    try {
      if (editingSchedule) {
        await api.put(`/fleet/service-schedules/${editingSchedule.id}`, payload);
        showSuccess('Service schedule updated successfully');
      } else {
        await api.post('/fleet/service-schedules', payload);
        showSuccess('Service schedule created successfully');
      }
      await fetchInitialData();
      backToList();
    } catch (error) {
      console.error('Failed to save service schedule:', error);
      showError(error.response?.data?.detail || 'Failed to save service schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Service Schedule',
      description: 'Are you sure you want to delete this schedule?',
      confirmText: 'Delete',
      variant: 'destructive'
    }).catch(() => false);
    
    if (!confirmed) return;

    try {
      await api.delete(`/fleet/service-schedules/${id}`);
      showSuccess('Service schedule deleted successfully');
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to delete service schedule:', error);
      showError(error.response?.data?.detail || 'Failed to delete service schedule');
    }
  };

  const getStatusColor = (status) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN PROGRESS': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'text-gray-600 bg-gray-100';
      case 'Normal': return 'text-blue-600 bg-blue-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
                <h1 className="text-xl font-semibold text-slate-900">
                  {editingSchedule ? 'Edit Service Schedule' : 'New Service Schedule'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleCancel} className="flex items-center gap-2 border px-4 py-2 rounded-lg bg-white">
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSaving}
                  className="btn btn-primary"
                >
                  <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-purple-600" /> Basic Details</h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle *</label>
                  <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} className="form-control">
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Service Type *</label>
                  <select required value={formData.service_type} onChange={(e) => setFormData({...formData, service_type: e.target.value})} className="form-control">
                    <option value="">Select Service Type</option>
                    {serviceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Service Mode *</label>
                  <select required value={formData.service_mode} onChange={(e) => setFormData({...formData, service_mode: e.target.value})} className="form-control">
                    <option value="">Select Mode</option>
                    {serviceModes.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Scheduling Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" /> Scheduling Details</h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule Date *</label>
                  <input type="date" required value={formData.schedule_date} onChange={(e) => setFormData({...formData, schedule_date: e.target.value})} className="form-control" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Next Service Due Date</label>
                  <input type="date" value={formData.next_service_due_date} onChange={(e) => setFormData({...formData, next_service_due_date: e.target.value})} className="form-control" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Odometer (KM) *</label>
                  <input type="number" step="0.1" required value={formData.current_odometer} onChange={(e) => setFormData({...formData, current_odometer: e.target.value})} className="form-control" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Next Service (KM)</label>
                  <input type="number" step="0.1" value={formData.next_service_km} onChange={(e) => setFormData({...formData, next_service_km: e.target.value})} className="form-control" />
                </div>
              </div>
            </div>

            {/* Service Center Details */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-purple-600" /> Service Center Details</h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Center Name</label>
                  <input type="text" value={formData.service_center_name} onChange={(e) => setFormData({...formData, service_center_name: e.target.value})} className="form-control" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Person</label>
                  <input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="form-control" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Number</label>
                  <input type="text" value={formData.contact_number} onChange={(e) => setFormData({...formData, contact_number: e.target.value})} className="form-control" />
                </div>
              </div>
            </div>

            {/* Cost Details & Status */}
            <div className="form-row">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-purple-600" /> Cost Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Cost (₹)</label>
                    <input type="number" step="0.01" value={formData.estimated_cost} onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})} className="form-control" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Actual Cost (₹)</label>
                    <input type="number" step="0.01" value={formData.actual_cost} onChange={(e) => setFormData({...formData, actual_cost: e.target.value})} className="form-control" />
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">Status & Priority</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status *</label>
                    <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="form-control">
                      {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="form-control">
                      {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">Additional</h3>
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium mb-2">Remarks / Notes</label>
                  <textarea rows="3" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="form-control"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Attachment URL (Optional Document)</label>
                  <input type="text" placeholder="https://..." value={formData.attachment} onChange={(e) => setFormData({...formData, attachment: e.target.value})} className="form-control" />
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
            <Settings className="h-7 w-7 text-purple-600" /> Service Schedule
          </h1>
          <p className="text-gray-600 mt-1">Schedule and manage vehicle maintenance services</p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus className="h-4 w-4" /> New Service
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle & Odometer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="btn btn-secondary">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{schedule.service_type}</div>
                    <div className="text-sm text-gray-500">{schedule.service_mode}</div>
                    <span className={`inline-flex px-2 mt-1 text-xs font-semibold rounded ${getPriorityColor(schedule.priority)}`}>
                      {schedule.priority} Priority
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 flex items-center gap-1">
                      <Truck className="h-4 w-4 text-gray-400" /> {getVehicleName(schedule.vehicle_id)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{schedule.current_odometer} KM logged</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <Calendar className="h-4 w-4 text-purple-600" /> {new Date(schedule.schedule_date).toLocaleDateString()}
                    </div>
                    {schedule.next_service_due_date && (
                      <div className="text-xs text-gray-500 mt-1">Due: {new Date(schedule.next_service_due_date).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">₹{(schedule.actual_cost || 0).toFixed(2)} Actual</div>
                    <div className="text-xs text-gray-500 mt-1">₹{(schedule.estimated_cost || 0).toFixed(2)} Est.</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setViewingSchedule(schedule)} className="btn btn-success" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditForm(schedule)} className="btn btn-primary" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(schedule.id)} className="btn btn-danger" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No service schedules found. Schedule a new vehicle maintenance to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal Popup */}
      {viewingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" /> Service Details ({getVehicleName(viewingSchedule.vehicle_id)})
              </h2>
              <button 
                onClick={() => setViewingSchedule(null)}
                className="btn btn-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="form-row">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Type</p>
                  <p className="font-medium text-gray-900">{viewingSchedule.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(viewingSchedule.status)}`}>
                    {viewingSchedule.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Schedule Date</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" /> 
                    {new Date(viewingSchedule.schedule_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Next Service Due Date</p>
                  <p className="font-medium text-gray-900">
                    {viewingSchedule.next_service_due_date ? new Date(viewingSchedule.next_service_due_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Current Odometer (KM)</p>
                  <p className="font-medium text-gray-900">{viewingSchedule.current_odometer} KM</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Next Service (KM)</p>
                  <p className="font-medium text-gray-900">{viewingSchedule.next_service_km ? `${viewingSchedule.next_service_km} KM` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Mode</p>
                  <p className="font-medium text-gray-900">{viewingSchedule.service_mode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(viewingSchedule.priority)}`}>
                    {viewingSchedule.priority}
                  </span>
                </div>
                
                <div className="col-span-2 pt-4 border-t mt-2">
                  <h3 className="font-semibold text-gray-900 mb-4">Service Center & Costs</h3>
                  <div className="form-row">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Service Center Name</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" /> {viewingSchedule.service_center_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Contact Details</p>
                      <p className="font-medium text-gray-900">{viewingSchedule.contact_person || 'N/A'} {viewingSchedule.contact_number ? `(${viewingSchedule.contact_number})` : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Estimated Cost</p>
                      <p className="font-medium text-gray-900 text-gray-600">₹{(viewingSchedule.estimated_cost || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Actual Cost</p>
                      <p className="font-medium text-gray-900 text-blue-700 font-bold">₹{(viewingSchedule.actual_cost || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {(viewingSchedule.remarks || viewingSchedule.attachment) && (
                  <div className="col-span-2 pt-4 border-t mt-2">
                    <h3 className="font-semibold text-gray-900 mb-4">Additional Details</h3>
                    <div className="form-row">
                      {viewingSchedule.remarks && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Remarks / Notes</p>
                          <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border">
                            {viewingSchedule.remarks}
                          </p>
                        </div>
                      )}
                      {viewingSchedule.attachment && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Attachment</p>
                          <a href={viewingSchedule.attachment} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                            {viewingSchedule.attachment}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingSchedule(null)}
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

export default ServiceSchedule;
