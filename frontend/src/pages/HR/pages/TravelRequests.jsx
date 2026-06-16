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
    <div className="animate-in fade-in" style={{ padding: '4px 0px' }}>
      {!showForm && (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Travel Requests</h1>
              <span className="badge badge-active" style={{ padding: '4px 10px', fontSize: 12 }}>
                {filteredRequests.length} Records
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Filter size={16} /> Filter
                  {(filterStatus || filterType) && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />}
                </button>
                {showFilters && (
                  <div className="card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 220, zIndex: 10, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Filters</span>
                      <button
                        onClick={() => { setFilterStatus(''); setFilterType(''); setShowFilters(false); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--primary)' }}
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
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px' }}>
                <button
                  onClick={() => setViewMode('list')}
                  style={{ padding: 4, background: viewMode === 'list' ? 'var(--bg-primary)' : 'none', border: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                  title="List View"
                >
                  <LayoutList size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{ padding: 4, background: viewMode === 'grid' ? 'var(--bg-primary)' : 'none', border: 'none', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setForm(initialForm); }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> New Request
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Total Requests</p>
              </div>
            </div>
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: '#f59e0b18', color: '#b45309', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.pending}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Pending</p>
              </div>
            </div>
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: '#3b82f618', color: '#1d4ed8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.approved}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Approved</p>
              </div>
            </div>
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: '#a855f718', color: '#7e22ce', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hotel className="w-5 h-5" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.booked}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Booked</p>
              </div>
            </div>
          </div>

          {/* Requests Grid View */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {filteredRequests.map(req => (
                <div key={req.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{req.request_id}</span>
                      <h3 className="card-title" style={{ margin: '4px 0 0 0' }}>{req.employee_name}</h3>
                    </div>
                    <span className={`badge ${req.status === 'Completed' || req.status === 'Manager Approved' ? 'badge-active' : req.status === 'Cancelled' ? 'badge-inactive' : 'badge-pending'}`}>
                      {req.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{req.from_location}</span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span>{req.to_location}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                    <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{formatDate(req.departure_date)} - {formatDate(req.return_date)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {req.transport_mode && (
                        <span style={{ fontSize: 11, background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>{req.transport_mode}</span>
                      )}
                      {req.hotel_required && (
                        <span style={{ fontSize: 11, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4 }}>Hotel</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setViewingRequest(req)} className="btn btn-secondary" style={{ padding: 6 }}>
                        <Eye size={14} />
                      </button>
                      {req.status === 'Pending' && (
                        <>
                          <button onClick={() => handleEdit(req)} className="btn btn-secondary" style={{ padding: 6 }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(req.id)} className="btn btn-danger" style={{ padding: 6 }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredRequests.length === 0 && (
                <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 24px' }}>
                  <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>No travel requests found</p>
                </div>
              )}
            </div>
          )}

          {/* Requests List View */}
          {viewMode === 'list' && (
            <div className="card" style={{ padding: 0 }}>
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Request ID</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Employee</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Route</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Travel Dates</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Transport</th>
                      <th className="text-left px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Status</th>
                      <th className="text-right px-6 py-4 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(req => (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{req.request_id}</td>
                        <td className="px-6 py-4 text-sm text-slate-800 font-medium">{req.employee_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{req.from_location}</span>
                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                            <span>{req.to_location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatDate(req.departure_date)} - {formatDate(req.return_date)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {req.transport_mode && (
                              <span style={{ fontSize: 11, background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>{req.transport_mode}</span>
                            )}
                            {req.hotel_required && (
                              <span style={{ fontSize: 11, background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4 }}>Hotel</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`badge ${req.status === 'Completed' || req.status === 'Manager Approved' ? 'badge-active' : req.status === 'Cancelled' ? 'badge-inactive' : 'badge-pending'}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => setViewingRequest(req)} className="btn btn-secondary" style={{ padding: 6 }}>
                              <Eye size={14} />
                            </button>
                            {req.status === 'Pending' && (
                              <>
                                <button onClick={() => handleEdit(req)} className="btn btn-secondary" style={{ padding: 6 }}>
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(req.id)} className="btn btn-danger" style={{ padding: 6 }}>
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          No travel requests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Inline */}
      {showForm && (
        <form className="card" style={{ padding: 0 }} onSubmit={(e) => e.preventDefault()}>
          {/* Form Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {editingId ? 'Edit Travel Request' : 'New Travel Request'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSubmit} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Submit'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X className="w-5 h-5" /> Close
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Employee *</label>
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
              <div className="form-group">
                <label>Travel Type</label>
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
            
            <div className="form-group">
              <label>Purpose *</label>
              <textarea
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                rows={2}
                className="form-control"
                placeholder="Purpose of travel..."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>From Location *</label>
                <input
                  type="text"
                  value={form.from_location}
                  onChange={(e) => setForm({ ...form, from_location: e.target.value })}
                  className="form-control"
                  placeholder="Departure city"
                />
              </div>
              <div className="form-group">
                <label>To Location *</label>
                <input
                  type="text"
                  value={form.to_location}
                  onChange={(e) => setForm({ ...form, to_location: e.target.value })}
                  className="form-control"
                  placeholder="Destination city"
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Departure Date *</label>
                <input
                  type="date"
                  value={form.departure_date}
                  onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Return Date *</label>
                <input
                  type="date"
                  value={form.return_date}
                  onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                  className="form-control"
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Transport Mode</label>
                <select
                  value={form.transport_mode}
                  onChange={(e) => setForm({ ...form, transport_mode: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select Mode</option>
                  {transportModes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Class</label>
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
            
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100" style={{ margin: '16px 0' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Hotel Name</label>
                  <input
                    type="text"
                    value={form.hotel_name}
                    onChange={(e) => setForm({ ...form, hotel_name: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Check-in</label>
                  <input
                    type="date"
                    value={form.check_in_date}
                    onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Check-out</label>
                  <input
                    type="date"
                    value={form.check_out_date}
                    onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Estimated Cost (₹)</label>
                <input
                  type="number"
                  value={form.estimated_cost}
                  onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                  className="form-control"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Advance Required (₹)</label>
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
        </form>
      )}

      {/* View Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Travel Request Details</h2>
              <button onClick={() => setViewingRequest(null)} className="btn btn-secondary" style={{ padding: 6, borderRadius: '50%' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-indigo-600">{viewingRequest.request_id}</span>
                <span className={`badge ${viewingRequest.status === 'Completed' || viewingRequest.status === 'Manager Approved' ? 'badge-active' : viewingRequest.status === 'Cancelled' ? 'badge-inactive' : 'badge-pending'}`}>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
                <button 
                  onClick={() => handleStatusChange(viewingRequest.id, 'Cancelled')}
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button 
                  onClick={() => handleStatusChange(viewingRequest.id, 'Manager Approved', 'HR Admin')}
                  className="btn btn-success"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            )}
            {viewingRequest.status === 'Manager Approved' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', marginTop: 16 }}>
                <button 
                  onClick={() => handleStatusChange(viewingRequest.id, 'Travel Booked')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
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
