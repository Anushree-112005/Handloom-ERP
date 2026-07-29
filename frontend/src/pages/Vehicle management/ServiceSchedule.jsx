import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Wrench, Search, Filter, Edit2, Trash2, Eye, X, Save, TrendingUp, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
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
    service_type: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    notes: '',
    service_provider: '',
    estimated_cost: '',
    status: ''
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
    
  const profilePreviewRef = useRef(null);
  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.service_type || 'Service Schedule').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Service Schedule_Profile_${safeName}.pdf`);
    }
  };

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
            {editingId ? 'Edit Service Schedule' : 'Add New Schedule'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form id="scheduleForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Schedule Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
                  <label>Service Type *</label>
                  <MasterDropdown
                    entity="service_type"
                    value={formData.service_type}
                    onChange={(val) => setFormData({ ...formData, service_type: val })}
                    options={serviceTypes.map(t => ({ value: t, label: t }))}
                    placeholder="--- Select Service Type ---"
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <MasterDropdown
                    entity="service_status"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={statuses.map(s => ({ value: s, label: s }))}
                    placeholder="--- Select Status ---"
                  />
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                  <X size={16} /> Close
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingId ? 'Update Schedule' : 'Save Schedule'}
                </button>
              </div>
            </form>
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
        <div style={{ width: 180 }}>
          <MasterDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || 'All Status')}
            options={[
              { value: 'All Status', label: 'All Status' },
              ...statuses.map(s => ({ value: s, label: s }))
            ]}
            placeholder="--- Filter Status ---"
            allowClear={false}
          />
        </div>
      </div>

      {/* Split Layout */}
      {/* Full Width Table */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
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
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); setSelectedViewSchedule(v); }} title="Preview Profile">
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleOpenForm(v)(); }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleDelete(v.id, e); }} title="Delete">
                            <Trash2 size={16} color="var(--danger, #ef4444)" />
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

        
        {/* Profile View Modal */}
        {selectedViewSchedule && (
          <div className="fixed inset-0" style={{ zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}>
            <div className="animate-scale-up" style={{ background: '#f8fafc', width: '95%', maxWidth: 900, height: '90vh', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} /> 
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Service Schedule Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(selectedViewSchedule)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setSelectedViewSchedule(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div ref={profilePreviewRef} style={{ width: '100%', maxWidth: 794, background: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>
                  
                  <div style={{ padding: '32px 40px 20px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div><img src={logoImg} alt="Dinesh Exports" style={{ width: 56, height: 56, objectFit: 'contain' }} /></div>
                        <div>
                           <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                           <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', width: 300 }}>
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>SERVICE SCHEDULE PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewSchedule.status || 'ACTIVE').toUpperCase()}</span></div>
                        </div>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6 }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Generated On</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div style={{ fontWeight: 500, color: '#0f172a' }}>{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderBottom: '3px solid #0f172a' }}></div>

                  <div style={{ padding: '10px 40px 40px 40px' }}>
                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <User size={14} /> 1. DETAILS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                        <div>
                          <InfoRow2 label="Service Type" value={selectedViewSchedule.service_type} />\n                          <InfoRow2 label="Center Name" value={selectedViewSchedule.service_provider} />\n                          <InfoRow2 label="Schedule Date" value={selectedViewSchedule.scheduled_date} />\n                          <InfoRow2 label="Notes" value={selectedViewSchedule.notes} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
