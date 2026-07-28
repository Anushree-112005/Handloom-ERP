import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Search, Filter, Edit2, Trash2, X, Save, MapPin, Clock, ArrowLeft } from 'lucide-react';
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

export default function BreakdownEntry() {
  const [view, setView] = useState('list');
  const [entries, setEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewEntry, setSelectedViewEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const initialForm = {
    vehicle_id: '',
    breakdown_date: new Date().toISOString().split('T')[0],
    location: '',
    issue_description: '',
    repair_required: '',
    status: 'Reported',
    resolution_time_hours: '',
    assistance_type: 'Roadside Assistance'
  };

  const [formData, setFormData] = useState(initialForm);

  const statuses = ['Reported', 'In Progress', 'Resolved'];
  const assistanceTypes = ['Roadside Assistance', 'Towing', 'Mechanical Repair', 'Parts Replacement'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entriesRes, vehiclesRes] = await Promise.all([
        api.get('/fleet/breakdowns'),
        api.get('/fleet/vehicles')
      ]);
      setEntries(entriesRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load breakdown entries');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (entry = null) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData(entry);
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
        resolution_time_hours: Number(formData.resolution_time_hours) || 0
      };

      if (editingId) {
        await api.put(`/fleet/breakdowns/${editingId}`, payload);
        showSuccess('Breakdown entry updated successfully');
      } else {
        await api.post('/fleet/breakdowns', payload);
        showSuccess('Breakdown entry created successfully');
      }
      setView('list');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to save breakdown entry');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Breakdown Entry',
      description: 'Are you sure you want to delete this breakdown entry?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/breakdowns/${id}`);
      showSuccess('Entry deleted successfully');
      if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
      fetchData();
    } catch (error) {
      showError('Failed to delete entry');
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = searchTerm === '' ||
      e.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.issue_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBreakdowns = entries.length;
  const reportedCount = entries.filter(e => e.status === 'Reported').length;
  const resolvedCount = entries.filter(e => e.status === 'Resolved').length;
  const avgResolutionTime = entries.length > 0 ? (entries.reduce((sum, e) => sum + (Number(e.resolution_time_hours || 0)), 0) / entries.length).toFixed(1) : 0;

  // FORM VIEW
  if (view === 'form') {
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
            {editingId ? 'Edit Breakdown Entry' : 'New Breakdown Entry'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form id="entryForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Breakdown Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Vehicle *</label>
                  <MasterDropdown
                    value={formData.vehicle_id}
                    onChange={(val) => setFormData({ ...formData, vehicle_id: val })}
                    options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                    placeholder="Select Vehicle"
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" className="form-control" name="breakdown_date" value={formData.breakdown_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <MasterDropdown
                    entity="breakdown_status"
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={statuses.map(s => ({ value: s, label: s }))}
                    placeholder="Select Status"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Location *</label>
                  <input type="text" className="form-control" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g., NH-48 near Bangalore" required />
                </div>
                <div className="form-group">
                  <label>Assistance Type *</label>
                  <MasterDropdown
                    entity="assistance_type"
                    value={formData.assistance_type}
                    onChange={(val) => setFormData({ ...formData, assistance_type: val })}
                    options={assistanceTypes.map(a => ({ value: a, label: a }))}
                    placeholder="Select Assistance Type"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Issue Description *</label>
                  <textarea className="form-control" name="issue_description" value={formData.issue_description} onChange={handleInputChange} rows="2" placeholder="Describe the issue" required></textarea>
                </div>
                <div className="form-group">
                  <label>Resolution Time (hours)</label>
                  <input type="number" className="form-control" name="resolution_time_hours" value={formData.resolution_time_hours} onChange={handleInputChange} step="0.5" />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Repair Required</label>
                  <textarea className="form-control" name="repair_required" value={formData.repair_required} onChange={handleInputChange} rows="3" placeholder="List repairs needed"></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                  <X size={16} /> Close
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingId ? 'Update Entry' : 'Save Entry'}
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
            <AlertTriangle size={24} color="var(--primary)" /> Breakdown Log
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Track vehicle breakdowns and road assistance</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add Entry
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => setStatusFilter('All')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Breakdowns</h3>
            <div className="value">{totalBreakdowns}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Reported')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Reported</h3>
            <div className="value">{reportedCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Resolved')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>Resolved</h3>
            <div className="value">{resolvedCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h3>Avg Resolution Time</h3>
            <div className="value">{avgResolutionTime} hrs</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by location or issue..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Status:</span>
        </div>
        <div style={{ width: 180 }}>
          <MasterDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || 'All')}
            options={[
              { value: 'All', label: 'All Status' },
              ...statuses.map(s => ({ value: s, label: s }))
            ]}
            placeholder="Filter Status"
            allowClear={false}
          />
        </div>
      </div>

      {/* Split Layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Issue</th>
                  <th>Assistance Type</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Time (hrs)</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredEntries.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No entries found</td></tr>
                ) : (
                  filteredEntries.map(e => (
                    <tr key={e.id} onClick={() => setSelectedViewEntry(e)} style={{ cursor: 'pointer', background: selectedViewEntry?.id === e.id ? 'var(--bg-secondary)' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>{e.breakdown_date}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} color="#8b5cf6" /> {e.location}</div></td>
                      <td>{e.issue_description?.substring(0, 25) + (e.issue_description?.length > 25 ? '...' : '')}</td>
                      <td>{e.assistance_type}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: e.status === 'Resolved' ? '#d1fae5' : e.status === 'In Progress' ? '#fef3c7' : '#fee2e2', color: e.status === 'Resolved' ? '#065f46' : e.status === 'In Progress' ? '#92400e' : '#7f1d1d' }}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(e.resolution_time_hours || 0).toFixed(1)} hrs</td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(e)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(evt) => handleDelete(e.id, evt)}>
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
        {selectedViewEntry && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Entry Details
                </h3>
                <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto' }}>
                <DetailRow label="Date" value={selectedViewEntry.breakdown_date} />
                <DetailRow label="Status" value={<span style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedViewEntry.status}</span>} />
                <DetailRow label="Location" value={selectedViewEntry.location} />
                <DetailRow label="Assistance Type" value={selectedViewEntry.assistance_type} />
                <DetailRow label="Issue" value={selectedViewEntry.issue_description} />
                <DetailRow label="Repairs Needed" value={selectedViewEntry.repair_required || '-'} />
                <DetailRow label="Resolution Time" value={`${Number(selectedViewEntry.resolution_time_hours || 0).toFixed(1)} hours`} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
