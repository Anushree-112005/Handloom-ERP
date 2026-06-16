import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Filter, Edit2, Trash2, X, Save, Phone, Award } from 'lucide-react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

const DetailRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: 4 }}>
    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{value || '-'}</span>
  </div>
);

export default function DriverList() {
  const [view, setView] = useState('list');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewDriver, setSelectedViewDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const initialForm = {
    driver_name: '',
    driver_license: '',
    license_expiry_date: '',
    phone_number: '',
    address: '',
    years_of_experience: '0',
    status: 'Active',
    qualification: 'HMV',
    aadhar_number: '',
    emergency_contact: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const statuses = ['Active', 'Inactive', 'On Leave'];
  const qualifications = ['LMV', 'HMV', 'Multi-Axle', 'Hazmat'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fleet/drivers');
      setDrivers(res.data || []);
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
      setFormData(driver);
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
        years_of_experience: Number(formData.years_of_experience) || 0
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

  // FORM VIEW
  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Driver' : 'New Driver'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              <button type="submit" form="driverForm" className="btn btn-primary"><Save size={16} /> Save Driver</button>
            </div>
          </div>

          <div style={{ padding: 32 }}>
            <form id="driverForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Driver Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Driver Name *</label>
                  <input type="text" className="form-control" name="driver_name" value={formData.driver_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" className="form-control" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleInputChange} required>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
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
                  <label>Qualification *</label>
                  <select className="form-control" name="qualification" value={formData.qualification} onChange={handleInputChange} required>
                    {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Years of Experience</label>
                  <input type="number" className="form-control" name="years_of_experience" value={formData.years_of_experience} onChange={handleInputChange} min="0" />
                </div>
                <div className="form-group">
                  <label>Aadhar Number</label>
                  <input type="text" className="form-control" name="aadhar_number" value={formData.aadhar_number} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input type="tel" className="form-control" name="emergency_contact" value={formData.emergency_contact} onChange={handleInputChange} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Address</label>
                  <textarea className="form-control" name="address" value={formData.address} onChange={handleInputChange} rows="3" style={{ resize: 'vertical' }}></textarea>
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
            <Users size={24} color="var(--primary)" /> Driver List
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage vehicle drivers and their qualifications</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add Driver
        </button>
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

        <div className="card stat-card" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #10b981' : '1px solid transparent' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Drivers</h3>
            <div className="value">{activeCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Inactive')} style={{ cursor: 'pointer', border: statusFilter === 'Inactive' ? '2px solid #ef4444' : '1px solid transparent' }}>
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
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by name, phone or license..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Status:</span>
        </div>
        <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
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
                  <th>Name</th>
                  <th>Phone</th>
                  <th>License</th>
                  <th>Qualification</th>
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
                      <td><span style={{ background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{d.qualification}</span></td>
                      <td style={{ textAlign: 'right' }}>{Number(d.years_of_experience || 0)} yrs</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: d.status === 'Active' ? '#d1fae5' : d.status === 'On Leave' ? '#fef3c7' : '#fee2e2', color: d.status === 'Active' ? '#065f46' : d.status === 'On Leave' ? '#92400e' : '#7f1d1d' }}>
                          {d.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(d)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(e) => handleDelete(d.id, e)}>
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
        {selectedViewDriver && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                  <Users size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Driver Details
                </h3>
                <button onClick={() => setSelectedViewDriver(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto' }}>
                <DetailRow label="Name" value={selectedViewDriver.driver_name} />
                <DetailRow label="Phone" value={selectedViewDriver.phone_number} />
                <DetailRow label="License" value={selectedViewDriver.driver_license} />
                <DetailRow label="License Expiry" value={selectedViewDriver.license_expiry_date} />
                <DetailRow label="Qualification" value={selectedViewDriver.qualification} />
                <DetailRow label="Experience" value={`${Number(selectedViewDriver.years_of_experience || 0)} years`} />
                <DetailRow label="Status" value={<span style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedViewDriver.status}</span>} />
                <DetailRow label="Aadhar" value={selectedViewDriver.aadhar_number || '-'} />
                <DetailRow label="Emergency Contact" value={selectedViewDriver.emergency_contact || '-'} />
                <DetailRow label="Address" value={selectedViewDriver.address || '-'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
