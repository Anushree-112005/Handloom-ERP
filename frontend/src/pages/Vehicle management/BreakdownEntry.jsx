import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Search, Filter, Edit2, Trash2, X, Save, MapPin, Clock, ArrowLeft, Eye, Download, User, Phone, Globe, Mail, FileText } from 'lucide-react';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import jsPDF from 'jspdf';
import logoImg from '../../assets/logo.png';
import ExportButton from '../../components/ExportButton';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const profilePreviewRef = React.useRef(null);

  const initialForm = {
    vehicle_id: '',
    breakdown_date: new Date().toISOString().split('T')[0],
    location: '',
    issue_description: '',
    repair_required: '',
    status: '',
    resolution_time_hours: '',
    assistance_type: ''
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


  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.breakdown_date || 'Breakdown Entry').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Breakdown Entry_Profile_${safeName}.pdf`);
    }
  };

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
                  placeholder="--- Select Vehicle ---"
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
                  placeholder="--- Select Status ---"
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
                  placeholder="--- Select Assistance Type ---"
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton 
            data={filteredEntries}
            filename="Breakdown_Entry_Report"
            pdfTitle="Breakdown Entry Report"
            columns={[
              { header: 'Date', key: 'breakdown_date' },
              { header: 'Vehicle ID', key: 'vehicle_id' },
              { header: 'Location', key: 'location' },
              { header: 'Issue', key: 'issue_description' },
              { header: 'Assistance Type', key: 'assistance_type' },
              { header: 'Status', key: 'status' },
              { header: 'Time (hrs)', key: 'resolution_time_hours', render: (row) => `${Number(row.resolution_time_hours || 0).toFixed(1)} hrs` }
            ]}
          />
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add Entry
          </button>
        </div>
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
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        
        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by location or issue..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Status:</span>
          </div>
          
          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
            <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
            <input type="date" className="form-control" style={{ width: 140, margin: 0 }} value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
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
                  <th>Breakdown ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Breakdown Date</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
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
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.id}</td>
                      <td>{vehicles.find(v => v.id === e.vehicle_id)?.vehicle_number || '-'}</td>
                      <td>{vehicles.find(v => v.id === e.vehicle_id)?.driver_name || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{e.breakdown_date}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} color="#8b5cf6" /> {e.location}</div></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: e.status === 'Resolved' ? '#d1fae5' : e.status === 'In Progress' ? '#fef3c7' : '#fee2e2', color: e.status === 'Resolved' ? '#065f46' : e.status === 'In Progress' ? '#92400e' : '#7f1d1d' }}>
                          {e.status}
                        </span>
                      </td>
                      <td onClick={evt => evt.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(evt) => { evt.stopPropagation(); setSelectedViewEntry(e); }} title="Preview Profile">
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(evt) => { evt.stopPropagation(); handleOpenForm(e); }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(evt) => { evt.stopPropagation(); handleDelete(e.id, evt); }} title="Delete">
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
        {selectedViewEntry && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Breakdown Entry Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(selectedViewEntry)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
                <div ref={profilePreviewRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden', flexShrink: 0 }}>

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
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>BREAKDOWN ENTRY PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewEntry.status || 'ACTIVE').toUpperCase()}</span></div>
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
                          <InfoRow2 label="Date" value={selectedViewEntry.breakdown_date} />
                          <InfoRow2 label="Vehicle" value={vehicles.find(v => v.id === selectedViewEntry.vehicle_id)?.vehicle_number || '-'} />
                          <InfoRow2 label="Location" value={selectedViewEntry.location} />
                          <InfoRow2 label="Assistance Type" value={selectedViewEntry.assistance_type} />
                          <InfoRow2 label="Issue" value={selectedViewEntry.issue_description} />
                          <InfoRow2 label="Repairs Needed" value={selectedViewEntry.repair_required || '-'} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                      <div>
                        <div style={{ fontWeight: 800, marginBottom: 2 }}>Dinesh Exports</div>
                        <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@dineshexports.com</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.dineshexports.com</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', fontWeight: 700 }}>
                        <FileText size={16} color="#1e3a8a" strokeWidth={2.5}/> GSTIN : 33ABCDE1234F1Z5
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
