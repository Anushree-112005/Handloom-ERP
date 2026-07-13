import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Truck, Search, Filter, Eye, Download, FilePlus, Save, X, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

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
  const fileInputRef = useRef(null);

  // Form state
  const initialForm = {
    vehicle_number: '',
    vehicle_type: 'YARN_CARRIER',
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
    status: 'ACTIVE'
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
    const data = filteredVehicles.map(v => ({
      'Vehicle Number': v.vehicle_number,
      'Type': v.vehicle_type,
      'Make': v.make,
      'Model': v.model,
      'Year': v.year_of_manufacture,
      'Capacity': v.capacity_tons,
      'Chassis No': v.chassis_number,
      'Engine No': v.engine_number,
      'RC No': v.rc_number,
      'Insurance': v.insurance_number,
      'Insurance Expiry': v.insurance_expiry,
      'Fitness Expiry': v.fitness_expiry,
      'Permit Expiry': v.permit_expiry,
      'Pollution Expiry': v.pollution_expiry,
      'Current Mileage': v.current_mileage,
      'Status': v.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');
    XLSX.writeFile(workbook, `Vehicles_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              <button type="submit" form="vehicleForm" className="btn btn-primary"><Save size={16} /> {editingId ? 'Update Vehicle' : 'Save Vehicle'}</button>
            </div>
          </div>

          <div style={{ padding: 32, background: '#fff' }}>
            <form id="vehicleForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Vehicle Information</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Vehicle Number *</label>
                  <input className="form-control" name="vehicle_number" value={formData.vehicle_number} onChange={handleInputChange} placeholder="MH-02-AB-1234" required />
                </div>
                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <select className="form-control" name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} required>
                    {vehicleTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select className="form-control" name="status" value={formData.status} onChange={handleInputChange} required>
                    {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
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
            </form>
          </div>
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
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add New Vehicle
        </button>
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
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by vehicle number, make or model..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 180, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>

          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={16} /> Export Excel
          </button>
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
                  <th>Vehicle Number</th>
                  <th>Make / Model</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading vehicles...</td></tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No vehicles found</td></tr>
                ) : (
                  filteredVehicles.map(v => (
                    <tr key={v.id} onClick={() => setSelectedViewVehicle(v)} style={{ cursor: 'pointer', background: selectedViewVehicle?.id === v.id ? 'var(--bg-secondary)' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ fontWeight: 600 }}>{v.vehicle_number}</td>
                      <td>{v.make} {v.model}</td>
                      <td>{v.vehicle_type}</td>
                      <td>{v.capacity_tons ? v.capacity_tons : '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: v.status === 'ACTIVE' ? '#d1fae5' : v.status === 'INACTIVE' ? '#f3f4f6' : '#fef3c7', color: v.status === 'ACTIVE' ? '#065f46' : v.status === 'INACTIVE' ? '#374151' : '#92400e' }}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleOpenForm(v)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleDelete(v.id, e)} title="Delete">
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
        {selectedViewVehicle && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700 }}>
                  <Truck size={18} /> {selectedViewVehicle.vehicle_number}
                </h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleOpenForm(selectedViewVehicle)} title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => setSelectedViewVehicle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={18} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
                <DetailRow label="Vehicle Number" value={selectedViewVehicle.vehicle_number} />
                <DetailRow label="Type" value={selectedViewVehicle.vehicle_type} />
                <DetailRow label="Make" value={selectedViewVehicle.make} />
                <DetailRow label="Model" value={selectedViewVehicle.model} />
                <DetailRow label="Year" value={selectedViewVehicle.year_of_manufacture} />
                <DetailRow label="Capacity" value={selectedViewVehicle.capacity_tons ? selectedViewVehicle.capacity_tons : '-'} />
                <DetailRow label="Chassis No" value={selectedViewVehicle.chassis_number} />
                <DetailRow label="Engine No" value={selectedViewVehicle.engine_number} />
                <DetailRow label="RC No" value={selectedViewVehicle.rc_number} />
                <DetailRow label="Insurance No" value={selectedViewVehicle.insurance_number} />
                <DetailRow label="Insurance Expiry" value={selectedViewVehicle.insurance_expiry} />
                <DetailRow label="Fitness Expiry" value={selectedViewVehicle.fitness_expiry} />
                <DetailRow label="Permit Expiry" value={selectedViewVehicle.permit_expiry} />
                <DetailRow label="Pollution Expiry" value={selectedViewVehicle.pollution_expiry} />
                <DetailRow label="Current Mileage" value={selectedViewVehicle.current_mileage ? `${selectedViewVehicle.current_mileage} km` : '-'} />
                <DetailRow label="Status" value={<span style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedViewVehicle.status.replace('_', ' ')}</span>} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
