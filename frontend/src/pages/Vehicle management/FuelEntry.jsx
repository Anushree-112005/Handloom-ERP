import React, { useState, useEffect } from 'react';
import { Plus, Fuel, Search, Filter, Edit2, Trash2, X, Save, TrendingUp, Zap, ArrowLeft } from 'lucide-react';
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

export default function FuelEntry() {
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
    entry_date: new Date().toISOString().split('T')[0],
    odometer_reading: '',
    fuel_quantity: '',
    fuel_cost: '0',
    fuel_type: 'Diesel',
    fuel_station: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fuelTypes = ['Diesel', 'Petrol', 'LPG', 'CNG', 'Hybrid'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entriesRes, vehiclesRes] = await Promise.all([
        api.get('/fleet/fuel-entries'),
        api.get('/fleet/vehicles')
      ]);
      setEntries(entriesRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load fuel entries');
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
        odometer_reading: Number(formData.odometer_reading) || 0,
        fuel_quantity: Number(formData.fuel_quantity) || 0,
        fuel_cost: Number(formData.fuel_cost) || 0
      };

      if (editingId) {
        await api.put(`/fleet/fuel-entries/${editingId}`, payload);
        showSuccess('Fuel entry updated successfully');
      } else {
        await api.post('/fleet/fuel-entries', payload);
        showSuccess('Fuel entry created successfully');
      }
      setView('list');
      fetchData();
    } catch (error) {
      showError(error.response?.data?.detail || 'Failed to save fuel entry');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Fuel Entry',
      description: 'Are you sure you want to delete this fuel entry?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/fuel-entries/${id}`);
      showSuccess('Entry deleted successfully');
      if (selectedViewEntry?.id === id) setSelectedViewEntry(null);
      fetchData();
    } catch (error) {
      showError('Failed to delete entry');
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = searchTerm === '' ||
      e.fuel_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.fuel_station?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalEntries = entries.length;
  const totalFuelCost = entries.reduce((sum, e) => sum + (Number(e.fuel_cost || 0)), 0);
  const totalFuelQuantity = entries.reduce((sum, e) => sum + (Number(e.fuel_quantity || 0)), 0);
  const avgFuelCost = totalEntries > 0 ? (totalFuelCost / totalEntries).toFixed(2) : 0;

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
            {editingId ? 'Edit Fuel Entry' : 'New Fuel Entry'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form id="entryForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Fuel Entry Details</h4>
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
                  <input type="date" className="form-control" name="entry_date" value={formData.entry_date} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Fuel Type *</label>
                  <MasterDropdown
                    entity="fuel_type"
                    value={formData.fuel_type}
                    onChange={(val) => setFormData({ ...formData, fuel_type: val })}
                    options={fuelTypes.map(t => ({ value: t, label: t }))}
                    placeholder="Select Fuel Type"
                  />
                </div>

                <div className="form-group">
                  <label>Odometer Reading (km) *</label>
                  <input type="number" className="form-control" name="odometer_reading" value={formData.odometer_reading} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Fuel Quantity (Liters) *</label>
                  <input type="number" className="form-control" name="fuel_quantity" value={formData.fuel_quantity} onChange={handleInputChange} step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Fuel Cost (₹) *</label>
                  <input type="number" className="form-control" name="fuel_cost" value={formData.fuel_cost} onChange={handleInputChange} step="0.01" required />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Fuel Station</label>
                  <input type="text" className="form-control" name="fuel_station" value={formData.fuel_station} onChange={handleInputChange} placeholder="e.g., IOCL Pump, Shell Station" />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Notes</label>
                  <textarea className="form-control" name="notes" value={formData.notes} onChange={handleInputChange} rows="3" style={{ resize: 'vertical' }}></textarea>
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
            <Fuel size={24} color="var(--primary)" /> Fuel Entry Log
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Track fuel consumption and expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add Entry
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Fuel size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Entries</h3>
            <div className="value">{totalEntries}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(191,64,191,0.1)', color: '#bf40bf' }}>
            <Zap size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Fuel</h3>
            <div className="value">{totalFuelQuantity.toFixed(1)} L</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Spent</h3>
            <div className="value" style={{ fontSize: 14 }}>₹{totalFuelCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
            <Fuel size={24} />
          </div>
          <div className="stat-details">
            <h3>Avg Cost/Entry</h3>
            <div className="value" style={{ fontSize: 14 }}>₹{avgFuelCost}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by station or fuel type..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Type:</span>
        </div>
        <div style={{ width: 160 }}>
          <MasterDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val || 'All')}
            options={[
              { value: 'All', label: 'All Types' },
              ...fuelTypes.map(t => ({ value: t, label: t }))
            ]}
            placeholder="Filter Type"
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
                  <th>Fuel Type</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Odometer</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th>Station</th>
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
                      <td style={{ fontWeight: 600 }}>{e.entry_date}</td>
                      <td><span style={{ background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{e.fuel_type}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{Number(e.fuel_quantity || 0).toFixed(2)} L</td>
                      <td style={{ textAlign: 'right' }}>{Number(e.odometer_reading || 0).toLocaleString('en-IN')} km</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₹{Number(e.fuel_cost || 0).toFixed(2)}</td>
                      <td>{e.fuel_station || '-'}</td>
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
                  <Fuel size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Entry Details
                </h3>
                <button onClick={() => setSelectedViewEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto' }}>
                <DetailRow label="Date" value={selectedViewEntry.entry_date} />
                <DetailRow label="Fuel Type" value={selectedViewEntry.fuel_type} />
                <DetailRow label="Station" value={selectedViewEntry.fuel_station || '-'} />
                <DetailRow label="Odometer" value={`${Number(selectedViewEntry.odometer_reading || 0).toLocaleString('en-IN')} km`} />
                <DetailRow label="Quantity" value={`${Number(selectedViewEntry.fuel_quantity || 0).toFixed(2)} L`} />
                <DetailRow label="Cost" value={<span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{Number(selectedViewEntry.fuel_cost || 0).toFixed(2)}</span>} />
                <DetailRow label="Cost/Liter" value={`₹${(Number(selectedViewEntry.fuel_cost || 0) / Number(selectedViewEntry.fuel_quantity || 1)).toFixed(2)}`} />
                <DetailRow label="Notes" value={selectedViewEntry.notes || '-'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
