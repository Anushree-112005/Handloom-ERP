import React, { useState, useEffect } from 'react';
import { Plane, Plus, Filter, LayoutList, LayoutGrid, MapPin, Calendar, Hotel, Car, CheckCircle, XCircle, Clock, X, Save, Eye, Edit2, Trash2, DollarSign } from 'lucide-react';
import { fetchTravelRequests, createTravelRequest, updateTravelRequest, deleteTravelRequest, fetchEmployees } from '../../../services/hrService';

const transportModes = ['Flight', 'Train', 'Bus', 'Car', 'Self-Drive'];
const transportClasses = ['Economy', 'Business', 'First Class', 'Sleeper', 'AC'];

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Manager Approved': 'bg-blue-100 text-blue-700',
  'Travel Booked': 'bg-purple-100 text-purple-700',
  'Completed': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-red-100 text-red-700'
};

export default function TravelRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [viewingRequest, setViewingRequest] = useState(null);

  const initialForm = {
    employee_id: '',
    employee_name: '',
    purpose: '',
    travel_type: 'Domestic',
    from_location: '',
    to_location: '',
    departure_date: '',
    return_date: '',
    transport_mode: '',
    transport_class: '',
    hotel_required: false,
    hotel_name: '',
    check_in_date: '',
    check_out_date: '',
    estimated_cost: '',
    advance_required: ''
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, empData] = await Promise.all([
        fetchTravelRequests(),
        fetchEmployees()
      ]);
      setRequests(reqData);
      setEmployees(empData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.purpose || !form.from_location || !form.to_location || !form.departure_date || !form.return_date) {
      alert('Please fill required fields');
      return;
    }

    try {
      const payload = {
        employee_id: parseInt(form.employee_id),
        employee_name: form.employee_name,
        purpose: form.purpose,
        travel_type: form.travel_type,
        from_location: form.from_location,
        to_location: form.to_location,
        departure_date: new Date(form.departure_date).toISOString(),
        return_date: new Date(form.return_date).toISOString(),
        transport_mode: form.transport_mode || null,
        transport_class: form.transport_class || null,
        hotel_required: form.hotel_required,
        hotel_name: form.hotel_name || null,
        check_in_date: form.check_in_date ? form.check_in_date : null,
        check_out_date: form.check_out_date ? form.check_out_date : null,
        estimated_cost: parseFloat(form.estimated_cost) || 0,
        advance_required: parseFloat(form.advance_required) || 0
      };

      if (editingId) {
        await updateTravelRequest(editingId, payload);
      } else {
        await createTravelRequest(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      loadData();
    } catch (error) {
      console.error('Error saving request:', error);
      alert('Failed to save travel request. Please check all fields.');
    }
  };

  const handleEdit = (req) => {
    setForm({
      employee_id: req.employee_id,
      employee_name: req.employee_name,
      purpose: req.purpose,
      travel_type: req.travel_type,
      from_location: req.from_location,
      to_location: req.to_location,
      departure_date: req.departure_date?.split('T')[0] || '',
      return_date: req.return_date?.split('T')[0] || '',
      transport_mode: req.transport_mode || '',
      transport_class: req.transport_class || '',
      hotel_required: req.hotel_required,
      hotel_name: req.hotel_name || '',
      check_in_date: req.check_in_date || '',
      check_out_date: req.check_out_date || '',
      estimated_cost: req.estimated_cost || '',
      advance_required: req.advance_required || ''
    });
    setEditingId(req.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this travel request?')) return;
    try {
      await deleteTravelRequest(id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleStatusChange = async (id, newStatus, approvedBy = null) => {
    try {
      await updateTravelRequest(id, { status: newStatus, approved_by: approvedBy });
      loadData();
      setViewingRequest(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(e => e.id === parseInt(empId));
    setForm({
      ...form,
      employee_id: empId,
      employee_name: emp?.name || ''
    });
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = !filterStatus || req.status === filterStatus;
    const matchesType = !filterType || req.travel_type === filterType;
    return matchesStatus && matchesType;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Manager Approved').length,
    booked: requests.filter(r => r.status === 'Travel Booked').length
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans text-slate-800 relative">
      {/* HEADER */}
      <div className="btn btn-secondary">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Travel Requests</h1>
          <span className="btn btn-primary">
            {filteredRequests.length} Records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${
                showFilters || filterStatus || filterType
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              Filter
              {(filterStatus || filterType) && (
                <span className="btn btn-primary" />
              )}
            </button>
            {showFilters && (
              <div className="btn btn-secondary">
                <div className="card-header">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Filters</span>
                  <button
                    onClick={() => { setFilterStatus(''); setFilterType(''); setShowFilters(false); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Manager Approved">Approved</option>
                      <option value="Travel Booked">Booked</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Travel Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="form-control"
                    >
                      <option value="">All Types</option>
                      <option value="Domestic">Domestic</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="btn btn-secondary">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
            className="btn btn-primary"
          >
            <Plus size={14} /> New Request
          </button>
        </div>
      </div>

      {/* DATA AREA */}
      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">

      {/* Stats */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Plane className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Requests</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.approved}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="btn btn-primary">
              <Hotel className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.booked}</p>
              <p className="text-xs text-slate-500">Booked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Grid View */}
      {viewMode === 'grid' && (
        <div className="form-row">
          {filteredRequests.map(req => (
          <div key={req.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-indigo-600">{req.request_id}</span>
                <h3 className="card-title">{req.employee_name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                {req.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{req.from_location}</span>
              <span className="text-slate-400">→</span>
              <span>{req.to_location}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDate(req.departure_date)} - {formatDate(req.return_date)}</span>
            </div>
            
            <div className="btn btn-secondary">
              <div className="flex items-center gap-2">
                {req.transport_mode && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{req.transport_mode}</span>
                )}
                {req.hotel_required && (
                  <span className="btn btn-primary">Hotel</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setViewingRequest(req)} className="btn btn-secondary">
                  <Eye className="w-4 h-4 text-slate-500" />
                </button>
                {req.status === 'Pending' && (
                  <>
                    <button onClick={() => handleEdit(req)} className="btn btn-secondary">
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(req.id)} className="btn btn-danger">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
          {filteredRequests.length === 0 && (
            <div className="btn btn-secondary">
              <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No travel requests found</p>
            </div>
          )}
        </div>
      )}

      {/* Requests List View */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="btn btn-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Route</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Travel Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Transport</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRequests.map(req => (
                  <tr key={req.id} className="btn btn-secondary">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">{req.request_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{req.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <span>{req.from_location}</span>
                        <span className="text-slate-400">→</span>
                        <span>{req.to_location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(req.departure_date)} - {formatDate(req.return_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {req.transport_mode && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{req.transport_mode}</span>
                        )}
                        {req.hotel_required && (
                          <span className="btn btn-primary">Hotel</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingRequest(req)} className="btn btn-secondary">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        {req.status === 'Pending' && (
                          <>
                            <button onClick={() => handleEdit(req)} className="btn btn-secondary">
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </button>
                            <button onClick={() => handleDelete(req.id)} className="btn btn-danger">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No travel requests found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>{/* END DATA AREA */}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Travel Request</h2>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                  <select
                    value={form.employee_id}
                    onChange={handleEmployeeChange}
                    className="form-control"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Travel Type</label>
                  <select
                    value={form.travel_type}
                    onChange={(e) => setForm({ ...form, travel_type: e.target.value })}
                    className="form-control"
                  >
                    <option value="Domestic">Domestic</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose *</label>
                <textarea
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  rows={2}
                  className="form-control"
                  placeholder="Purpose of travel..."
                />
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Location *</label>
                  <input
                    type="text"
                    value={form.from_location}
                    onChange={(e) => setForm({ ...form, from_location: e.target.value })}
                    className="form-control"
                    placeholder="Departure city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To Location *</label>
                  <input
                    type="text"
                    value={form.to_location}
                    onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                    className="form-control"
                    placeholder="Destination city"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departure Date *</label>
                  <input
                    type="date"
                    value={form.departure_date}
                    onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Return Date *</label>
                  <input
                    type="date"
                    value={form.return_date}
                    onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Transport Mode</label>
                  <select
                    value={form.transport_mode}
                    onChange={(e) => setForm({ ...form, transport_mode: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Mode</option>
                    {transportModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                  <select
                    value={form.transport_class}
                    onChange={(e) => setForm({ ...form, transport_class: e.target.value })}
                    className="form-control"
                  >
                    <option value="">Select Class</option>
                    {transportClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <input
                  type="checkbox"
                  id="hotelRequired"
                  checked={form.hotel_required}
                  onChange={(e) => setForm({ ...form, hotel_required: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="hotelRequired" className="text-sm font-medium text-slate-700">Hotel/Accommodation Required</label>
              </div>
              
              {form.hotel_required && (
                <div className="form-row">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Name</label>
                    <input
                      type="text"
                      value={form.hotel_name}
                      onChange={(e) => setForm({ ...form, hotel_name: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Check-in</label>
                    <input
                      type="date"
                      value={form.check_in_date}
                      onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Check-out</label>
                    <input
                      type="date"
                      value={form.check_out_date}
                      onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>
              )}
              
              <div className="form-row">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={form.estimated_cost}
                    onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                    className="form-control"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Advance Required (₹)</label>
                  <input
                    type="number"
                    value={form.advance_required}
                    onChange={(e) => setForm({ ...form, advance_required: e.target.value })}
                    className="form-control"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="btn btn-secondary">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card">
            <div className="btn btn-secondary">
              <h2 className="text-lg font-semibold">Travel Request Details</h2>
              <button onClick={() => setViewingRequest(null)} className="btn btn-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-indigo-600">{viewingRequest.request_id}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[viewingRequest.status]}`}>
                  {viewingRequest.status}
                </span>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-1">Employee</p>
                <p className="font-semibold">{viewingRequest.employee_name}</p>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500 mb-1">Purpose</p>
                <p className="text-slate-700">{viewingRequest.purpose}</p>
              </div>
              
              <div className="form-row">
                <div>
                  <p className="text-sm text-slate-500 mb-1">From</p>
                  <p className="font-medium">{viewingRequest.from_location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">To</p>
                  <p className="font-medium">{viewingRequest.to_location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Departure</p>
                  <p className="font-medium">{formatDate(viewingRequest.departure_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Return</p>
                  <p className="font-medium">{formatDate(viewingRequest.return_date)}</p>
                </div>
              </div>
              
              {viewingRequest.estimated_cost > 0 && (
                <div className="form-row">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Estimated Cost</p>
                    <p className="font-bold text-lg">₹{viewingRequest.estimated_cost?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Advance Required</p>
                    <p className="font-bold text-lg">₹{viewingRequest.advance_required?.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
            
            {viewingRequest.status === 'Pending' && (
              <div className="btn btn-secondary">
                <button 
                  onClick={() => handleStatusChange(viewingRequest.id, 'Cancelled')}
                  className="btn btn-danger"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleStatusChange(viewingRequest.id, 'Manager Approved', 'HR Admin')}
                  className="btn btn-success"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
            {viewingRequest.status === 'Manager Approved' && (
              <div className="btn btn-secondary">
                <button 
                  onClick={() => handleStatusChange(viewingRequest.id, 'Travel Booked')}
                  className="btn btn-primary"
                >
                  <Plane className="w-4 h-4" /> Mark as Booked
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
