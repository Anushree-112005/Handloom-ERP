import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Filter, Edit2, Trash2, X, Save, Phone, Award, ArrowLeft, Eye, Download, User, Globe, Mail, FileText, MapPin } from 'lucide-react';
import api from '../../services/api';
import MasterDropdown from '../../components/MasterDropdown';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';
import { fetchEmployees } from '../../services/hrService';
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

export default function DriverList() {
  const [view, setView] = useState('list');
  const [drivers, setDrivers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const profilePreviewRef = React.useRef(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewDriver, setSelectedViewDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    driver_name: '',
    driver_license: '',
    license_expiry_date: '',
    phone_number: '',
    address: '',
    years_of_experience: '0',
    status: '',
    qualification: '',
    aadhar_number: '',
    emergency_contact: '',
    assigned_vehicle_id: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const statuses = ['Active', 'Inactive', 'On Leave'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [driversRes, empData, vehiclesRes] = await Promise.all([
        api.get('/fleet/drivers'),
        fetchEmployees().catch(() => []),
        api.get('/fleet/vehicles').catch(() => ({ data: [] }))
      ]);
      setDrivers(driversRes.data || []);
      setEmployees(empData || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load driver list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (driver = null) => {
    if (driver) {
      setEditingId(driver.id);
      setFormData({
        ...initialForm,
        ...driver,
        assigned_vehicle_id: driver.assigned_vehicle_id !== null && driver.assigned_vehicle_id !== undefined ? String(driver.assigned_vehicle_id) : ''
      });
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
        years_of_experience: Number(formData.years_of_experience) || 0,
        assigned_vehicle_id: formData.assigned_vehicle_id ? parseInt(formData.assigned_vehicle_id, 10) : null
      };

      if (editingId) {
        await api.put(`/fleet/drivers/${editingId}`, payload);
        showSuccess('Driver updated successfully');
      } else {
        await api.post('/fleet/drivers', payload);
        showSuccess('Driver created successfully');
      }
      setView('list');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to save driver');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Driver',
      description: 'Are you sure you want to delete this driver record?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/drivers/${id}`);
      showSuccess('Driver deleted successfully');
      if (selectedViewDriver?.id === id) setSelectedViewDriver(null);
      fetchData();
    } catch (error) {
      showError('Failed to delete driver');
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = searchTerm === '' ||
      d.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.driver_license?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDrivers = drivers.length;
  const activeCount = drivers.filter(d => d.status === 'Active').length;
  const inactiveCount = drivers.filter(d => d.status === 'Inactive').length;
  const avgExperience = drivers.length > 0 ? (drivers.reduce((sum, d) => sum + (Number(d.years_of_experience || 0)), 0) / drivers.length).toFixed(1) : 0;
  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.driver_name || 'Driver').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Driver_Profile_${safeName}.pdf`);
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
            {editingId ? 'Edit Driver' : 'New Driver'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form id="driverForm" onSubmit={handleSubmit}>
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Driver Information</h4>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="form-group">
                <label>Driver Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="driver_name"
                  value={formData.driver_name}
                  placeholder="Enter driver name"
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" className="form-control" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <MasterDropdown
                  entity="driver_status"
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={statuses.map(s => ({ value: s, label: s }))}
                  placeholder="--- Select Status ---"
                />
              </div>

              <div className="form-group">
                <label>License Number *</label>
                <input type="text" className="form-control" name="driver_license" value={formData.driver_license} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>License Expiry Date *</label>
                <input type="date" className="form-control" name="license_expiry_date" value={formData.license_expiry_date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Assigned Vehicle</label>
                <MasterDropdown
                  value={formData.assigned_vehicle_id}
                  onChange={(val) => setFormData({ ...formData, assigned_vehicle_id: val })}
                  options={vehicles.map(v => ({
                    value: v.id,
                    label: `${v.vehicle_number} (${v.make || ''} ${v.model || ''})`.trim()
                  }))}
                  placeholder="--- Select a Vehicle ---"
                />
              </div>

              <div className="form-group">
                <label>Years of Experience</label>
                <input type="number" className="form-control" name="years_of_experience" value={formData.years_of_experience} onChange={handleInputChange} min="0" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> {editingId ? 'Update Driver' : 'Save Driver'}
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
            <Users size={24} color="var(--primary)" /> Driver List
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage vehicle drivers and their qualifications</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton 
            data={filteredDrivers}
            filename="Vehicle_Assignment_Report"
            pdfTitle="Vehicle Assignment Report"
            columns={[
              { header: 'Name', key: 'driver_name' },
              { header: 'Phone', key: 'phone_number' },
              { header: 'License', key: 'driver_license' },
              { header: 'Assigned Vehicle', key: 'assigned_vehicle_id', render: (row) => vehicles.find(v => v.id === row.assigned_vehicle_id)?.vehicle_number || '-' },
              { header: 'Experience (yrs)', key: 'years_of_experience', render: (row) => Number(row.years_of_experience || 0) },
              { header: 'Status', key: 'status' }
            ]}
          />
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add Driver
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Drivers</h3>
            <div className="value">{totalDrivers}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Drivers</h3>
            <div className="value">{activeCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Inactive')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Inactive Drivers</h3>
            <div className="value">{inactiveCount}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Award size={24} />
          </div>
          <div className="stat-details">
            <h3>Avg Experience</h3>
            <div className="value">{avgExperience} yrs</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        
        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by name, phone or license..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                  <th>Name</th>
                  <th>Phone</th>
                  <th>License</th>
                  <th>Assigned Vehicle</th>
                  <th style={{ textAlign: 'right' }}>Experience</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredDrivers.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No drivers found</td></tr>
                ) : (
                  filteredDrivers.map(d => (
                    <tr key={d.id} onClick={() => setSelectedViewDriver(d)} style={{ cursor: 'pointer', background: selectedViewDriver?.id === d.id ? 'var(--bg-secondary)' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>{d.driver_name}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} color="var(--primary)" /> {d.phone_number}</div></td>
                      <td>{d.driver_license}</td>
                      <td>{vehicles.find(v => v.id === d.assigned_vehicle_id)?.vehicle_number || '-'}</td>
                      <td style={{ textAlign: 'right' }}>{Number(d.years_of_experience || 0)} yrs</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: d.status === 'Active' ? '#d1fae5' : d.status === 'On Leave' ? '#fef3c7' : '#fee2e2', color: d.status === 'Active' ? '#065f46' : d.status === 'On Leave' ? '#92400e' : '#7f1d1d' }}>
                          {d.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); setSelectedViewDriver(d); }} title="Preview Profile">
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleOpenForm(d); }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleDelete(d.id, e); }} title="Delete">
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
        {selectedViewDriver && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Driver Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(selectedViewDriver)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setSelectedViewDriver(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
                <div ref={profilePreviewRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden', flexShrink: 0 }}>

                  <div style={{ padding: '32px 40px 20px 40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div><img src={logoImg} alt="Handloom ERP" style={{ width: 56, height: 56, objectFit: 'contain' }} /></div>
                        <div>
                          <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>HANDLOOM ERP</h1>
                          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}></p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', width: 300 }}>
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>DRIVER PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewDriver.status || 'ACTIVE').toUpperCase()}</span></div>
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
                          <InfoRow2 label="Name" value={selectedViewDriver.driver_name} />
                          <InfoRow2 label="Phone" value={selectedViewDriver.phone_number} />
                          <InfoRow2 label="License" value={selectedViewDriver.driver_license} />
                          <InfoRow2 label="License Expiry" value={selectedViewDriver.license_expiry_date} />
                          <InfoRow2 label="Assigned Vehicle" value={vehicles.find(v => v.id === selectedViewDriver.assigned_vehicle_id)?.vehicle_number || '-'} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', padding: '16px 40px', display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, fontSize: 10, color: '#0f172a' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <MapPin size={16} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2, color: '#1e3a8a' }} />
                      <div>
                        <div style={{ fontWeight: 800, marginBottom: 2 }}>Handloom ERP</div>
                        <div style={{ color: '#475569', fontWeight: 500, lineHeight: '16px' }}>No. 123, Textile Street,<br/>Erode, Tamil Nadu - 638001, India</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Phone size={14} color="#1e3a8a" strokeWidth={2.5}/> 0424-1234567</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Mail size={14} color="#1e3a8a" strokeWidth={2.5}/> info@handloomerp.com</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><Globe size={14} color="#1e3a8a" strokeWidth={2.5}/> www.handloomerp.com</div>
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
