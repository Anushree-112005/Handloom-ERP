import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Search, Filter, Edit2, Trash2, X, Save, Calendar, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function MaintenanceLog() {
  const [view, setView] = useState('list');
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewLog, setSelectedViewLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const initialForm = {
    vehicle_id: '',
    service_date: new Date().toISOString().split('T')[0],
    maintenance_type: 'General Service',
    work_description: '',
    labor_cost: '0',
    parts_cost: '0',
    status: 'In Progress'
  };

  const [formData, setFormData] = useState(initialForm);

  const maintenanceTypes = ['General Service', 'Oil Change', 'Repair', 'Preventive Maintenance', 'Breakdown Fix'];
  const statuses = ['In Progress', 'Completed', 'Verified'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get('/fleet/maintenance-logs'),
        api.get('/fleet/vehicles')
      ]);
      setLogs(logsRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load maintenance logs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (log = null) => {
    if (log) {
      setEditingId(log.id);
      setFormData(log);
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
        labor_cost: Number(formData.labor_cost) || 0,
        parts_cost: Number(formData.parts_cost) || 0
      };

      if (editingId) {
        await api.put(`/fleet/maintenance-logs/${editingId}`, payload);
        showSuccess('Maintenance log updated successfully');
      } else {
        await api.post('/fleet/maintenance-logs', payload);
        showSuccess('Maintenance log created successfully');
      }
      setView('list');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to save maintenance log');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Maintenance Log',
      description: 'Are you sure you want to delete this maintenance log?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/maintenance-logs/${id}`);
      showSuccess('Log deleted successfully');
      if (selectedViewLog?.id === id) setSelectedViewLog(null);
      fetchData();
    } catch (error) {
      showError('Failed to delete log');
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = searchTerm === '' ||
      l.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.work_description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalLogs = logs.length;
  const completedCount = logs.filter(l => l.status === 'Completed').length;
  const inProgressCount = logs.filter(l => l.status === 'In Progress').length;
  const totalCost = logs.reduce((sum, l) => sum + (Number(l.labor_cost || 0) + Number(l.parts_cost || 0)), 0);

  // FORM VIEW
  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Maintenance Log' : 'New Maintenance Log'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              <button type="submit" form="logForm" className="btn btn-primary"><Save size={16} /> Save Log</button>
            </div>
          </div>

          <div style={{ padding: 32 }}>
            <form id="logForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Maintenance Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Vehicle *</label>
                  <select className="form-control" name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} required>
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Maintenance Type *</label>
                  <select className="form-control" name="maintenance_type" value={formData.maintenance_type} onChange={handleInputChange} required>
                    {maintenanceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleInputChange} required>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Date *</label>
                  <input type="date" className="form-control" name="service_date" value={formData.service_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Labor Cost (₹)</label>
                  <input type="number" className="form-control" name="labor_cost" value={formData.labor_cost} onChange={handleInputChange} step="0.01" />
                </div>
                <div className="form-group">
                  <label>Parts Cost (₹)</label>
                  <input type="number" className="form-control" name="parts_cost" value={formData.parts_cost} onChange={handleInputChange} step="0.01" />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Work Description</label>
                  <textarea className="form-control" name="work_description" value={formData.work_description} onChange={handleInputChange} rows="4" style={{ resize: 'vertical' }}></textarea>
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
            <Wrench size={24} color="var(--primary)" /> Maintenance Log
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Track all vehicle maintenance and repairs</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add Log
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => setStatusFilter('All Status')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Wrench size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Logs</h3>
            <div className="value">{totalLogs}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('In Progress')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-details">
            <h3>In Progress</h3>
            <div className="value">{inProgressCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Completed')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Wrench size={24} />
          </div>
          <div className="stat-details">
            <h3>Completed</h3>
            <div className="value">{completedCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Cost</h3>
            <div className="value" style={{ fontSize: 16 }}>₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by type or description..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No logs found</td></tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id} onClick={() => setSelectedViewLog(l)} style={{ cursor: 'pointer', background: selectedViewLog?.id === l.id ? 'var(--bg-secondary)' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>{l.service_date}</td>
                      <td>{l.maintenance_type}</td>
                      <td>{l.work_description ? l.work_description.substring(0, 30) + '...' : '-'}</td>
                      <td style={{ textAlign: 'right' }}>₹{(Number(l.labor_cost || 0) + Number(l.parts_cost || 0)).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: l.status === 'Completed' ? '#d1fae5' : l.status === 'Verified' ? '#d1fae5' : '#fef3c7', color: l.status === 'Completed' ? '#065f46' : l.status === 'Verified' ? '#065f46' : '#92400e' }}>
                          {l.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(l)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(e) => handleDelete(l.id, e)}>
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
        {selectedViewLog && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                  <Wrench size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Log Details
                </h3>
                <button onClick={() => setSelectedViewLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto' }}>
                <DetailRow label="Service Date" value={selectedViewLog.service_date} />
                <DetailRow label="Type" value={selectedViewLog.maintenance_type} />
                <DetailRow label="Work Description" value={selectedViewLog.work_description} />
                <DetailRow label="Labor Cost" value={`₹${Number(selectedViewLog.labor_cost || 0).toFixed(2)}`} />
                <DetailRow label="Parts Cost" value={`₹${Number(selectedViewLog.parts_cost || 0).toFixed(2)}`} />
                <DetailRow label="Total Cost" value={<span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{(Number(selectedViewLog.labor_cost || 0) + Number(selectedViewLog.parts_cost || 0)).toFixed(2)}</span>} />
                <DetailRow label="Status" value={<span style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedViewLog.status}</span>} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
