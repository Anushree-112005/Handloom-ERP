import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { Plus, Wrench, Truck, Calendar, Settings, DollarSign, ShieldCheck, ArrowLeft, Save, X, Edit2, Trash2, Eye, MapPin } from 'lucide-react';

const MaintenanceLog = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);
  
  const [mode, setMode] = useState('list');
  const [editingLog, setEditingLog] = useState(null);
  const [viewingLog, setViewingLog] = useState(null);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_schedule_id: '',
    breakdown_id: '',
    service_date: new Date().toISOString().split('T')[0],
    odometer_km: '',
    
    maintenance_type: '',
    work_description: '',
    parts_replaced: '',
    
    service_center_name: '',
    mechanic_name: '',
    contact_number: '',
    
    labor_cost: '0',
    parts_cost: '0',
    total_cost: '0',
    
    warranty: 'No',
    warranty_expiry_date: '',
    next_service_date: '',
    next_service_km: '',
    
    status: 'In Progress',
    remarks: '',
    attachment: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const maintenanceTypes = [
    { value: 'General Service', label: 'General Service' },
    { value: 'Oil Change', label: 'Oil Change' },
    { value: 'Repair', label: 'Repair' },
    { value: 'Breakdown Fix', label: 'Breakdown Fix' },
    { value: 'Preventive Maintenance', label: 'Preventive Maintenance' }
  ];

  const statuses = [
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Verified', label: 'Verified' }
  ];

  // Auto-calculate total cost
  useEffect(() => {
    const labor = parseFloat(formData.labor_cost) || 0;
    const parts = parseFloat(formData.parts_cost) || 0;
    setFormData(prev => ({
      ...prev,
      total_cost: (labor + parts).toFixed(2)
    }));
  }, [formData.labor_cost, formData.parts_cost]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Reset linked IDs when vehicle changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      service_schedule_id: '',
      breakdown_id: ''
    }));
  }, [formData.vehicle_id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [logsRes, vehiclesRes, schedulesRes, breakdownsRes] = await Promise.all([
        api.get('/fleet/maintenance-logs'),
        api.get('/fleet/vehicles'),
        api.get('/fleet/service-schedules'),
        api.get('/fleet/breakdowns')
      ]);
      setLogs(logsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setSchedules(schedulesRes.data || []);
      setBreakdowns(breakdownsRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load maintenance logs');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (id) => vehicles.find(v => v.id === id)?.vehicle_number || 'Unknown';
  
  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      service_schedule_id: '',
      breakdown_id: '',
      service_date: new Date().toISOString().split('T')[0],
      odometer_km: '',
      maintenance_type: [], // Changed to array for multi-select
      work_description: '',
      parts_replaced: '',
      service_center_name: '',
      mechanic_name: '',
      contact_number: '',
      labor_cost: '0',
      parts_cost: '0',
      total_cost: '0',
      warranty: 'No',
      warranty_expiry_date: '',
      next_service_date: '',
      next_service_km: '',
      status: 'In Progress',
      remarks: '',
      attachment: ''
    });
  };

  const openAddForm = () => {
    setEditingLog(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (log) => {
    setEditingLog(log);
    setFormData({
      vehicle_id: log.vehicle_id || '',
      service_schedule_id: log.service_schedule_id || '',
      breakdown_id: log.breakdown_id || '',
      service_date: log.service_date || '',
      odometer_km: (log.odometer_km || '').toString(),
      maintenance_type: log.maintenance_type ? log.maintenance_type.split(', ') : [],
      work_description: log.work_description || '',
      parts_replaced: log.parts_replaced || '',
      service_center_name: log.service_center_name || '',
      mechanic_name: log.mechanic_name || '',
      contact_number: log.contact_number || '',
      labor_cost: (log.labor_cost || 0).toString(),
      parts_cost: (log.parts_cost || 0).toString(),
      total_cost: (log.total_cost || 0).toString(),
      warranty: log.warranty ? 'Yes' : 'No',
      warranty_expiry_date: log.warranty_expiry_date || '',
      next_service_date: log.next_service_date || '',
      next_service_km: (log.next_service_km || '').toString(),
      status: log.status || 'Completed',
      remarks: log.remarks || '',
      attachment: log.attachment || ''
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.vehicle_id && (!formData.maintenance_type || formData.maintenance_type.length === 0);
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
    setEditingLog(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      vehicle_id: parseInt(formData.vehicle_id),
      service_schedule_id: formData.service_schedule_id ? parseInt(formData.service_schedule_id) : null,
      breakdown_id: formData.breakdown_id ? parseInt(formData.breakdown_id) : null,
      service_date: formData.service_date,
      odometer_km: parseFloat(formData.odometer_km) || 0,
      
      maintenance_type: Array.isArray(formData.maintenance_type) ? formData.maintenance_type.join(', ') : formData.maintenance_type,
      work_description: formData.work_description,
      parts_replaced: formData.parts_replaced,
      
      service_center_name: formData.service_center_name,
      mechanic_name: formData.mechanic_name,
      contact_number: formData.contact_number,
      
      labor_cost: parseFloat(formData.labor_cost) || 0,
      parts_cost: parseFloat(formData.parts_cost) || 0,
      total_cost: parseFloat(formData.total_cost) || 0,
      
      warranty: formData.warranty === 'Yes',
      warranty_expiry_date: formData.warranty_expiry_date ? formData.warranty_expiry_date : null,
      next_service_date: formData.next_service_date ? formData.next_service_date : null,
      next_service_km: formData.next_service_km ? parseFloat(formData.next_service_km) : null,
      
      status: formData.status,
      remarks: formData.remarks,
      attachment: formData.attachment
    };

    try {
      if (editingLog) {
        await api.put(`/fleet/maintenance-logs/${editingLog.id}`, payload);
        showSuccess('Maintenance log updated successfully');
      } else {
        await api.post('/fleet/maintenance-logs', payload);
        showSuccess('Maintenance log created successfully');
      }
      await fetchInitialData();
      backToList();
    } catch (error) {
      console.error('Failed to save log:', error);
      showError(error.response?.data?.detail || 'Failed to save maintenance log');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Maintenance Log',
      description: 'Are you sure you want to permanently delete this maintenance log?',
      confirmText: 'Delete',
      variant: 'destructive'
    }).catch(() => false);
    
    if (!confirmed) return;

    try {
      await api.delete(`/fleet/maintenance-logs/${id}`);
      showSuccess('Maintenance log deleted successfully');
      await fetchInitialData();
    } catch (error) {
      console.error('Failed to delete log:', error);
      showError(error.response?.data?.detail || 'Failed to delete maintenance log');
    }
  };

  const getStatusColor = (status) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VERIFIED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    if (!type) return 'text-gray-600 bg-gray-50';
    if (type.includes('Breakdown')) return 'text-red-600 bg-red-50';
    if (type.includes('Preventive')) return 'text-emerald-600 bg-emerald-50';
    return 'text-blue-600 bg-blue-50';
  };

  const handleMaintenanceTypeToggle = (type) => {
    const current = Array.isArray(formData.maintenance_type) ? formData.maintenance_type : [];
    if (current.includes(type)) {
      setFormData({ ...formData, maintenance_type: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, maintenance_type: [...current, type] });
    }
  };

  const filteredSchedules = formData.vehicle_id 
    ? schedules.filter(s => s.vehicle_id.toString() === formData.vehicle_id.toString())
    : [];
  
  const filteredBreakdowns = formData.vehicle_id 
    ? breakdowns.filter(b => b.vehicle_id.toString() === formData.vehicle_id.toString())
    : [];

  if (mode === 'form') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="btn btn-secondary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mx-auto max-w-6xl">
              <div className="flex items-center gap-4">
                <button onClick={backToList} className="btn btn-secondary">
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-indigo-600" />
                  {editingLog ? 'Edit Maintenance Log' : 'New Maintenance Log'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleCancel} className="btn btn-secondary">
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

        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="form-row">
              
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Basic Details */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-indigo-500" /> Basic Details
                  </h3>
                  <div className="form-row">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Vehicle *</label>
                      <select required value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} className="form-control">
                        <option value="">Select Vehicle</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Service Date *</label>
                        <input type="date" required value={formData.service_date} onChange={(e) => setFormData({...formData, service_date: e.target.value})} className="form-control" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Odometer (KM) *</label>
                        <input type="number" step="0.1" required value={formData.odometer_km} onChange={(e) => setFormData({...formData, odometer_km: e.target.value})} className="form-control" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maintenance Details */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-indigo-500" /> Maintenance Details
                  </h3>
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Maintenance Type *</label>
                      <div className="btn btn-secondary">
                        {maintenanceTypes.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => handleMaintenanceTypeToggle(t.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                              (Array.isArray(formData.maintenance_type) && formData.maintenance_type.includes(t.value))
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            {t.label}
                            {(Array.isArray(formData.maintenance_type) && formData.maintenance_type.includes(t.value)) && (
                              <span className="ml-1.5 text-[10px]">✕</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {(Array.isArray(formData.maintenance_type) && formData.maintenance_type.length === 0) && (
                        <p className="text-[10px] text-red-500 mt-1 font-bold">Please select at least one type</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Work Description *</label>
                      <textarea required rows="3" placeholder="Describe the maintenance procedures carried out..." value={formData.work_description} onChange={(e) => setFormData({...formData, work_description: e.target.value})} className="form-control"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Parts Replaced</label>
                      <textarea rows="2" placeholder="List components swapped out (e.g. Air filter, timing belt)..." value={formData.parts_replaced} onChange={(e) => setFormData({...formData, parts_replaced: e.target.value})} className="form-control"></textarea>
                    </div>
                  </div>
                </div>

                {/* Service Provider Details */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-indigo-500" /> Service Provider Details
                  </h3>
                  <div className="form-row">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Service Center Name</label>
                      <input type="text" value={formData.service_center_name} onChange={(e) => setFormData({...formData, service_center_name: e.target.value})} className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Mechanic Name</label>
                      <input type="text" value={formData.mechanic_name} onChange={(e) => setFormData({...formData, mechanic_name: e.target.value})} className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Contact Number</label>
                      <input type="text" value={formData.contact_number} onChange={(e) => setFormData({...formData, contact_number: e.target.value})} className="form-control" />
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Cost Details */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-indigo-500" /> Cost Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Labor Cost (₹)</label>
                      <input type="number" step="0.01" value={formData.labor_cost} onChange={(e) => setFormData({...formData, labor_cost: e.target.value})} className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700">Parts Cost (₹)</label>
                      <input type="number" step="0.01" value={formData.parts_cost} onChange={(e) => setFormData({...formData, parts_cost: e.target.value})} className="form-control" />
                    </div>
                    <div className="pt-2 border-t">
                      <label className="block text-sm font-bold mb-1 text-gray-900">Total Cost (₹) *</label>
                      <input type="number" step="0.01" required value={formData.total_cost} onChange={(e) => setFormData({...formData, total_cost: e.target.value})} className="form-control" />
                      <p className="text-xs text-gray-500 mt-1 italic">Calculates automatically, or tap to override.</p>
                    </div>
                  </div>
                </div>

                {/* Warranty & Next Service */}
                <div className="card">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" /> Warranty & Planning
                  </h3>
                  <div className="space-y-4">
                    <div className="form-row">
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">Warranty</label>
                        <select value={formData.warranty} onChange={(e) => setFormData({...formData, warranty: e.target.value})} className="form-control">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700 text-xs truncate">Warranty Expiry</label>
                        <input type="date" disabled={formData.warranty === 'No'} value={formData.warranty_expiry_date} onChange={(e) => setFormData({...formData, warranty_expiry_date: e.target.value})} className="form-control" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 flex items-center gap-1"><Calendar className="h-4 w-4" /> Next Service Date</label>
                      <input type="date" value={formData.next_service_date} onChange={(e) => setFormData({...formData, next_service_date: e.target.value})} className="form-control" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1 text-gray-700 flex items-center gap-1">Next Service (KM)</label>
                      <input type="number" step="0.1" value={formData.next_service_km} onChange={(e) => setFormData({...formData, next_service_km: e.target.value})} className="form-control" />
                    </div>
                  </div>
                </div>

                {/* Status & Add-ons */}
                <div className="card">
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2 text-gray-900">Sign-off Status *</label>
                    <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="form-control">
                      {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div>
                      <input type="text" placeholder="Remarks / Notes" value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="form-control" />
                    </div>
                    <div>
                      <input type="text" placeholder="Bill / Invoice URL" value={formData.attachment} onChange={(e) => setFormData({...formData, attachment: e.target.value})} className="form-control" />
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
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="card">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
            <Wrench className="btn btn-primary" /> Maintenance Log
          </h1>
          <p className="text-slate-600 mt-1 pl-11">Comprehensive service tracking and preventive maintenance records</p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add Maintenance Log
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Log Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Maintenance Overview</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="btn btn-secondary">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                       {log.id.toString().padStart(4, '0')}
                       <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getTypeColor(log.maintenance_type)}`}>{log.maintenance_type}</span>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-1 mt-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> {new Date(log.service_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-indigo-700 flex items-center gap-1">
                      <Truck className="h-4 w-4" /> {getVehicleName(log.vehicle_id)}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 font-medium">{log.odometer_km} KM logged</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-800 line-clamp-1 max-w-[250px] font-medium" title={log.work_description}>{log.work_description}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[200px]">Center: {log.service_center_name || 'In-House'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-emerald-700">₹{(log.total_cost || 0).toFixed(2)}</div>
                    <div className="text-xs text-slate-500 mt-1">{log.warranty ? 'Warranty claims applied' : 'No warranty'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setViewingLog(log)} className="btn btn-primary" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditForm(log)} className="btn btn-primary" title="Edit Log">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(log.id)} className="btn btn-danger" title="Delete Log">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                       <Wrench className="h-12 w-12 text-slate-300 mb-3" />
                       <p className="font-medium text-lg">No maintenance logs found</p>
                       <p className="text-sm">Securely log completed vehicle maintenance here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal Popup */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="card">
            <div className="btn btn-primary">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-3">
                <Wrench className="h-6 w-6 text-indigo-600" /> Maintenance Report <span className="text-indigo-400 font-medium">{viewingLog.id.toString().padStart(4, '0')}</span>
              </h2>
              <button 
                onClick={() => setViewingLog(null)}
                className="btn btn-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[75vh] bg-white text-slate-800">
              <div className="form-row">
                
                {/* Top Section */}
                <div className="md:col-span-12 flex items-center justify-between border-b pb-6">
                  <div>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1.5">Vehicle Investigated</p>
                     <p className="font-black text-slate-900 text-3xl flex items-center gap-3">
                         {getVehicleName(viewingLog.vehicle_id)}
                         <span className={`inline-flex items-center px-3 py-1 text-sm font-bold uppercase tracking-wider rounded-lg border ${getStatusColor(viewingLog.status)}`}>
                            {viewingLog.status}
                         </span>
                     </p>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1.5">Service Date</p>
                     <p className="font-bold text-slate-700 text-xl">{new Date(viewingLog.service_date).toLocaleDateString()}</p>
                     <p className="text-sm font-semibold text-slate-500 mt-1">{viewingLog.odometer_km} KM Current Odometer</p>
                  </div>
                </div>

                {/* Left Column: Maintenance Info */}
                <div className="md:col-span-7 space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                      <Settings className="h-5 w-5 text-indigo-500" /> Maintenance Scope
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Service Type</p>
                        <p className="font-bold text-indigo-600 text-lg">{viewingLog.maintenance_type}</p>
                      </div>
                      <div className="btn btn-secondary">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Work Executed</p>
                        <p className="font-medium text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{viewingLog.work_description}</p>
                      </div>
                      {viewingLog.parts_replaced && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Parts Replaced</p>
                          <p className="font-medium text-slate-800">{viewingLog.parts_replaced}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Linked Docs */}
                  <div className="form-row">
                     {viewingLog.service_schedule_id && (
                        <div className="bg-slate-50 border p-3 rounded-lg">
                           <p className="text-xs font-bold text-slate-500 uppercase">Linked Schedule</p>
                           <p className="font-semibold text-indigo-600">ID #{viewingLog.service_schedule_id}</p>
                        </div>
                     )}
                     {viewingLog.breakdown_id && (
                        <div className="bg-slate-50 border p-3 rounded-lg">
                           <p className="text-xs font-bold text-slate-500 uppercase">Linked Breakdown</p>
                           <p className="font-semibold text-red-600">ID #{viewingLog.breakdown_id}</p>
                        </div>
                     )}
                  </div>
                </div>

                {/* Right Column: Cost & Provider Info */}
                <div className="md:col-span-5 space-y-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                      <MapPin className="h-5 w-5 text-indigo-500" /> Center Details
                    </h3>
                    <div className="card">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Station</p>
                        <p className="font-semibold text-slate-900">{viewingLog.service_center_name || 'In-House Garage'}</p>
                      </div>
                      {(viewingLog.mechanic_name || viewingLog.contact_number) && (
                        <div className="flex gap-4 pt-2 border-t mt-2">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mechanic</p>
                                <p className="font-medium text-slate-800">{viewingLog.mechanic_name || '--'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                                <p className="font-medium text-slate-800">{viewingLog.contact_number || '--'}</p>
                            </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                      <DollarSign className="h-5 w-5 text-indigo-500" /> Final Bill
                    </h3>
                    <div className="btn btn-success">
                      <div className="btn btn-success"></div>
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                         <span>Labor Cost</span>
                         <span>₹{(viewingLog.labor_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                         <span>Parts Cost</span>
                         <span>₹{(viewingLog.parts_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-emerald-200/50">
                         <span className="font-bold text-emerald-900 uppercase tracking-wider text-xs">Total Charged</span>
                         <span className="font-black text-2xl text-emerald-700">₹{(viewingLog.total_cost || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Warranties & Future planning */}
                <div className="btn btn-secondary">
                    <div className="btn btn-secondary">
                        <ShieldCheck className={`h-8 w-8 ${viewingLog.warranty ? 'text-indigo-600' : 'text-slate-300'}`} />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Warranty Details</p>
                            <p className="font-semibold text-slate-800">{viewingLog.warranty ? 'Warranty Active' : 'No Warranty Applied'}</p>
                            {viewingLog.warranty && viewingLog.warranty_expiry_date && (
                                <p className="text-sm font-medium text-indigo-600 mt-1">Valid until {new Date(viewingLog.warranty_expiry_date).toLocaleDateString()}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="btn btn-secondary">
                        <Calendar className="h-8 w-8 text-indigo-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Future Planning</p>
                            <div className="flex gap-6 mt-1">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Next Service Date</p>
                                    <p className="font-bold text-slate-800">{viewingLog.next_service_date ? new Date(viewingLog.next_service_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Next Service KM</p>
                                    <p className="font-bold text-slate-800">{viewingLog.next_service_km ? `${viewingLog.next_service_km} KM` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Optional Attachments */}
                {(viewingLog.remarks || viewingLog.attachment) && (
                  <div className="md:col-span-12 pt-2 flex flex-col gap-3">
                    {viewingLog.remarks && (
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                        <p className="text-xs font-bold text-amber-800/60 uppercase tracking-wider mb-1">Inspector Remarks</p>
                        <p className="font-medium text-amber-900 text-sm">{viewingLog.remarks}</p>
                      </div>
                    )}
                    {viewingLog.attachment && (
                      <div>
                        <a href={viewingLog.attachment} target="_blank" rel="noreferrer" className="btn btn-primary">
                          View Uploaded Bill / Invoice Attachment &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
            
            <div className="px-8 py-5 border-t bg-slate-50 shadow-inner flex justify-end">
              <button
                onClick={() => setViewingLog(null)}
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

export default MaintenanceLog;
