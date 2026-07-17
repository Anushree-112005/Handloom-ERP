import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Wrench, Search, Filter, Edit2, Trash2, Eye, X, Save, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function ServiceSchedule() {
  const [view, setView] = useState('list');
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewSchedule, setSelectedViewSchedule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const initialForm = {
    vehicle_id: '',
    service_type: 'General Service',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: '',
    service_provider: '',
    estimated_cost: '',
    status: 'Scheduled'
  };

  const [formData, setFormData] = useState(initialForm);

  const serviceTypes = ['General Service', 'Oil Change', 'Tire Replacement', 'Engine Repair', 'Body Work', 'Battery Replacement'];
  const statuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, vehiclesRes] = await Promise.all([
        api.get('/fleet/service-schedules'),
        api.get('/fleet/vehicles')
      ]);
      setSchedules(schedulesRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load service schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (schedule = null) => {
    if (schedule) {
      setEditingId(schedule.id);
      setFormData(schedule);
    } else {
      setEditingId(null);
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
    
    try {
      const payload = {
        ...formData,
        vehicle_id: parseInt(formData.vehicle_id),
        estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : 0
      };

      if (editingId) {
        await api.put(`/fleet/service-schedules/${editingId}`, payload);
        showSuccess('Service schedule updated successfully');
      } else {
        await api.post('/fleet/service-schedules', payload);
        showSuccess('Service schedule created successfully');
      }
      setView('list');
      setSearchTerm('');
      setStatusFilter('All Status');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to save service schedule');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Service Schedule',
      description: 'Are you sure you want to delete this schedule?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/service-schedules/${id}`);
      showSuccess('Schedule deleted successfully');
      if (selectedViewSchedule?.id === id) setSelectedViewSchedule(null);
      fetchData();
    } catch (error) {
      showError('Failed to delete schedule');
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = search === '' ||
      (s.service_type || '').toLowerCase().includes(search) ||
      (s.service_provider || '').toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'All Status' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const scheduledCount = schedules.filter(s => s.status === 'Scheduled').length;
  const inProgressCount = schedules.filter(s => s.status === 'In Progress').length;
  const completedCount = schedules.filter(s => s.status === 'Completed').length;

  // FORM VIEW
  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Service Schedule' : 'Add New Schedule'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              <button type="submit" form="scheduleForm" className="btn btn-primary"><Save size={16} /> Save Schedule</button>
            </div>
          </div>

          <div style={{ padding: 32 }}>
            <form id="scheduleForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Schedule Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Vehicle *</label>
                  <select className="form-control" name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} required>
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Service Type *</label>
                  <select className="form-control" name="service_type" value={formData.service_type} onChange={handleInputChange} required>
                    {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleInputChange} required>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Schedule Date *</label>
                  <input type="date" className="form-control" name="scheduled_date" value={formData.scheduled_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" className="form-control" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional notes..." />
                </div>
                <div className="form-group">
                  <label>Estimated Cost (₹)</label>
                  <input type="number" className="form-control" name="estimated_cost" value={formData.estimated_cost} onChange={handleInputChange} step="0.01" />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Service Center Name</label>
                  <input className="form-control" name="service_provider" value={formData.service_provider} onChange={handleInputChange} />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={24} color="var(--primary)" /> Service Schedule
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage vehicle maintenance and service schedules</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add Schedule
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => setStatusFilter('All Status')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Schedules</h3>
            <div className="value">{schedules.length}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Scheduled')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-details">
            <h3>Scheduled</h3>
            <div className="value">{scheduledCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('In Progress')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Wrench size={24} />
          </div>
          <div className="stat-details">
            <h3>In Progress</h3>
            <div className="value">{inProgressCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Completed')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <h3>Completed</h3>
            <div className="value">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by service type or center..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Status:</span>
        </div>
        <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All Status">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Split Layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service Type</th>
                  <th>Center Name</th>
                  <th>Schedule Date</th>
                  <th>Estimated Cost</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No schedules found</td></tr>
                ) : (
                  filteredSchedules.map(s => (
                    <tr key={s.id} onClick={() => setSelectedViewSchedule(s)} style={{ cursor: 'pointer', background: selectedViewSchedule?.id === s.id ? 'var(--bg-secondary)' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>{s.service_type}</td>
                      <td>{s.service_provider || '-'}</td>
                      <td>{s.scheduled_date}</td>
                      <td>₹{Number(s.estimated_cost || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.status === 'Completed' ? '#d1fae5' : s.status === 'In Progress' ? '#fef3c7' : s.status === 'Scheduled' ? '#dbeafe' : '#f3f4f6', color: s.status === 'Completed' ? '#065f46' : s.status === 'In Progress' ? '#92400e' : s.status === 'Scheduled' ? '#1e40af' : '#374151' }}>
                          {s.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(s)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(e) => handleDelete(s.id, e)}>
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Panel */}
        {selectedViewSchedule && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                  <Wrench size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Schedule Details
                </h3>
                <button onClick={() => setSelectedViewSchedule(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto' }}>
                <DetailRow label="Service Type" value={selectedViewSchedule.service_type} />
                <DetailRow label="Center Name" value={selectedViewSchedule.service_provider} />
                <DetailRow label="Schedule Date" value={selectedViewSchedule.scheduled_date} />
                <DetailRow label="Notes" value={selectedViewSchedule.notes} />
                <DetailRow label="Estimated Cost" value={`₹${Number(selectedViewSchedule.estimated_cost || 0).toFixed(2)}`} />
                <DetailRow label="Status" value={<span style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedViewSchedule.status}</span>} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
