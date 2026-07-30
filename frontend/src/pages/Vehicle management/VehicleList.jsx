import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Truck, Search, Filter, Eye, Download, FilePlus, Save, X, ArrowLeft, User, Phone, MapPin, IndianRupee, Briefcase, FileText, Mail, Globe } from 'lucide-react';
import * as XLSX from 'xlsx';
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

export default function VehicleList() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewVehicle, setSelectedViewVehicle] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  const fileInputRef = useRef(null);
  const profilePreviewRef = useRef(null);

  const generateProfilePDF = async (vehicle) => {
    if (profilePreviewRef.current) {
      const safeName = (vehicle?.vehicle_number || 'Vehicle').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Vehicle_Profile_${safeName}.pdf`);
      return;
    }
  };

  // Form state
  const initialForm = {
    vehicle_number: '',
    vehicle_type: '',
    make: '',
    model: '',
    year_of_manufacture: '',
    chassis_number: '',
    engine_number: '',
    capacity_tons: '',
    rc_number: '',
    insurance_number: '',
    insurance_expiry: '',
    fitness_expiry: '',
    permit_expiry: '',
    pollution_expiry: '',
    current_mileage: '',
    status: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const vehicleTypes = [
    { value: 'YARN_CARRIER', label: 'Yarn Carrier' },
    { value: 'FABRIC_TRUCK', label: 'Fabric Roll Truck' },
    { value: 'GARMENT_CONTAINER', label: 'Garment Container' },
    { value: 'GENERAL_CARGO', label: 'General Cargo' },
    { value: 'SUBCONTRACT_VAN', label: 'Subcontracting Van' },
    { value: 'DELIVERY_VAN', label: 'Local Delivery Van' }
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' }
  ];

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fleet/vehicles');
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showError('Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (vehicle = null) => {
    if (vehicle) {
      setEditingId(vehicle.id);
      setFormData(vehicle);
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

    if (!formData.vehicle_number || !formData.make || !formData.model) {
      showError('Please fill required fields: Vehicle Number, Make, Model');
      return;
    }

    const payload = {
      vehicle_number: formData.vehicle_number,
      vehicle_type: formData.vehicle_type,
      make: formData.make,
      model: formData.model,
      year_of_manufacture: formData.year_of_manufacture ? Number(formData.year_of_manufacture) : null,
      chassis_number: formData.chassis_number || null,
      engine_number: formData.engine_number || null,
      capacity_tons: formData.capacity_tons ? Number(formData.capacity_tons) : null,
      rc_number: formData.rc_number || null,
      insurance_number: formData.insurance_number || null,
      insurance_expiry: formData.insurance_expiry || null,
      fitness_expiry: formData.fitness_expiry || null,
      permit_expiry: formData.permit_expiry || null,
      pollution_expiry: formData.pollution_expiry || null,
      current_mileage: formData.current_mileage ? Number(formData.current_mileage) : 0,
      status: formData.status
    };

    try {
      if (editingId) {
        await api.put(`/fleet/vehicles/${editingId}`, payload);
        showSuccess('Vehicle updated successfully');
      } else {
        await api.post('/fleet/vehicles', payload);
        showSuccess('Vehicle created successfully');
      }
      setView('list');
      setSelectedViewVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showError(error.response?.data?.detail || 'Failed to save vehicle');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Vehicle',
      description: 'Are you sure you want to delete this vehicle? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/vehicles/${id}`);
      showSuccess('Vehicle deleted successfully');
      if (selectedViewVehicle?.id === id) setSelectedViewVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError('Failed to delete vehicle');
    }
  };

  const handleExportExcel = () => {
    // Replaced by ExportButton component
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = searchTerm === '' ||
      v.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'INACTIVE').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'UNDER_MAINTENANCE').length;

  const handleCardClick = (status) => {
    if (status === 'Total') {
      setStatusFilter('All Status');
    } else {
      setStatusFilter(status);
    }
  };

  // ── FORM VIEW ──
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
            {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form id="vehicleForm" onSubmit={handleSubmit}>
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Vehicle Information</h4>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="form-group">
                <label>Vehicle Number *</label>
                <input className="form-control" name="vehicle_number" value={formData.vehicle_number} onChange={handleInputChange} placeholder="MH-02-AB-1234" required />
              </div>
              <div className="form-group">
                <label>Vehicle Type *</label>
                <MasterDropdown
                  entity="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={(val) => setFormData({ ...formData, vehicle_type: val })}
                  options={vehicleTypes}
                  placeholder="--- Select Vehicle Type ---"
                />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <MasterDropdown
                  entity="vehicle_status"
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={statusOptions}
                  placeholder="--- Select Status ---"
                />
              </div>

              <div className="form-group">
                <label>Make *</label>
                <input className="form-control" name="make" value={formData.make} onChange={handleInputChange} placeholder="Tata" required />
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input className="form-control" name="model" value={formData.model} onChange={handleInputChange} placeholder="3118" required />
              </div>
              <div className="form-group">
                <label>Year of Manufacture</label>
                <input type="number" className="form-control" name="year_of_manufacture" value={formData.year_of_manufacture} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Chassis Number</label>
                <input className="form-control" name="chassis_number" value={formData.chassis_number} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Engine Number</label>
                <input className="form-control" name="engine_number" value={formData.engine_number} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" className="form-control" name="capacity_tons" value={formData.capacity_tons} onChange={handleInputChange} step="0.1" />
              </div>

              <div className="form-group">
                <label>RC Number</label>
                <input className="form-control" name="rc_number" value={formData.rc_number} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Insurance Number</label>
                <input className="form-control" name="insurance_number" value={formData.insurance_number} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Insurance Expiry</label>
                <input type="date" className="form-control" name="insurance_expiry" value={formData.insurance_expiry} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Fitness Expiry</label>
                <input type="date" className="form-control" name="fitness_expiry" value={formData.fitness_expiry} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Permit Expiry</label>
                <input type="date" className="form-control" name="permit_expiry" value={formData.permit_expiry} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Pollution Expiry</label>
                <input type="date" className="form-control" name="pollution_expiry" value={formData.pollution_expiry} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Current Mileage (km)</label>
                <input type="number" className="form-control" name="current_mileage" value={formData.current_mileage} onChange={handleInputChange} step="0.1" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> {editingId ? 'Update Vehicle' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={24} color="var(--primary)" /> Vehicle Management
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your vehicle fleet with comprehensive details and tracking</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton 
            data={filteredVehicles}
            filename="Vehicle_List_Report"
            pdfTitle="Vehicle List Report"
            columns={[
              { header: 'Vehicle Number', key: 'vehicle_number' },
              { header: 'Type', key: 'vehicle_type' },
              { header: 'Make', key: 'make' },
              { header: 'Model', key: 'model' },
              { header: 'Year', key: 'year_of_manufacture' },
              { header: 'Capacity', key: 'capacity_tons' },
              { header: 'Chassis No', key: 'chassis_number' },
              { header: 'Engine No', key: 'engine_number' },
              { header: 'RC No', key: 'rc_number' },
              { header: 'Insurance', key: 'insurance_number' },
              { header: 'Insurance Expiry', key: 'insurance_expiry' },
              { header: 'Fitness Expiry', key: 'fitness_expiry' },
              { header: 'Permit Expiry', key: 'permit_expiry' },
              { header: 'Pollution Expiry', key: 'pollution_expiry' },
              { header: 'Current Mileage', key: 'current_mileage' },
              { header: 'Status', key: 'status' }
            ]}
          />
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add New Vehicle
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => handleCardClick('Total')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Vehicles</h3>
            <div className="value">{totalVehicles}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('ACTIVE')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Active</h3>
            <div className="value">{activeVehicles}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('INACTIVE')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Inactive</h3>
            <div className="value">{inactiveVehicles}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => handleCardClick('UNDER_MAINTENANCE')} style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <h3>Maintenance</h3>
            <div className="value">{maintenanceVehicles}</div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        
        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Vehicle No, Registration No, Model..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Vehicles</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">In Service</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
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

      {/* Split Layout: Table & Details */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle No</th>
                  <th>Registration No</th>
                  <th>Vehicle Type</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Driver</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>Loading vehicles...</td></tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No vehicles found</td></tr>
                ) : (
                  filteredVehicles.map(v => (
                    <tr key={v.id} onClick={() => setSelectedViewVehicle(v)} style={{ cursor: 'pointer', background: selectedViewVehicle?.id === v.id ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ fontWeight: 600 }}>{v.vehicle_number}</td>
                      <td>{v.rc_number || '-'}</td>
                      <td>{v.vehicle_type}</td>
                      <td>{v.make} {v.model}</td>
                      <td>{v.capacity_tons ? `${v.capacity_tons} Tons` : '-'}</td>
                      <td>{v.driver_name || 'Unassigned'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: v.status === 'ACTIVE' ? '#d1fae5' : v.status === 'INACTIVE' ? '#f3f4f6' : '#fef3c7', color: v.status === 'ACTIVE' ? '#065f46' : v.status === 'INACTIVE' ? '#374151' : '#92400e' }}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); setSelectedViewVehicle(v); }} title="Preview Profile">
                            <Eye size={16} color="var(--primary)" />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleOpenForm(v)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleDelete(v.id, e)} title="Delete">
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

        {/* Profile Preview Modal */}
        {selectedViewVehicle && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} /> 
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Vehicle Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(selectedViewVehicle)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setSelectedViewVehicle(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
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
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>VEHICLE PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewVehicle.status || 'ACTIVE').toUpperCase()}</span></div>
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
                        <User size={14} /> 1. VEHICLE DETAILS
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="Vehicle Number" value={selectedViewVehicle.vehicle_number} />
                          <InfoRow2 label="Type" value={selectedViewVehicle.vehicle_type} />
                          <InfoRow2 label="Make" value={selectedViewVehicle.make} />
                          <InfoRow2 label="Model" value={selectedViewVehicle.model} />
                        </div>
                        <div>
                          <InfoRow2 label="Year" value={selectedViewVehicle.year_of_manufacture} />
                          <InfoRow2 label="Capacity" value={selectedViewVehicle.capacity_tons ? `${selectedViewVehicle.capacity_tons} Tons` : '-'} />
                          <InfoRow2 label="Chassis No" value={selectedViewVehicle.chassis_number} />
                          <InfoRow2 label="Engine No" value={selectedViewVehicle.engine_number} />
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: 6, padding: '24px 20px 12px 20px', marginTop: 24 }}>
                      <div style={{ position: 'absolute', top: -14, left: -1, background: '#0f172a', color: 'white', padding: '6px 16px', borderRadius: '6px 6px 6px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                        <FileText size={14} /> 2. DOCUMENT EXPIRES
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                        <div>
                          <InfoRow2 label="RC No" value={selectedViewVehicle.rc_number || '-'} />
                          <InfoRow2 label="Insurance No" value={selectedViewVehicle.insurance_number || '-'} />
                          <InfoRow2 label="Insurance Expiry" value={selectedViewVehicle.insurance_expiry || '-'} />
                        </div>
                        <div>
                          <InfoRow2 label="Fitness Expiry" value={selectedViewVehicle.fitness_expiry || '-'} />
                          <InfoRow2 label="Permit Expiry" value={selectedViewVehicle.permit_expiry || '-'} />
                          <InfoRow2 label="Pollution Expiry" value={selectedViewVehicle.pollution_expiry || '-'} />
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
