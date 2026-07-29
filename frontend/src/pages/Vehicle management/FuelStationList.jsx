import React, { useState } from 'react';
import { Plus, MapPin, Phone, DollarSign, Fuel, ArrowLeft, Save, X, Edit2, Trash2 } from 'lucide-react';
import { showConfirm } from '../../components/ConfirmDialog';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value || '-'}</div>
  </div>
);

const FuelStationList = () => {
  const [fuelStations, setFuelStations] = useState([]);
  const [mode, setMode] = useState('list');
  const [viewingStation, setViewingStation] = React.useState(null);
  const profilePreviewRef = React.useRef(null);
  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.stationName || 'Station').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Station_Profile_${safeName}.pdf`);
    }
  };
 // 'list' or 'form'
  const [editingStation, setEditingStation] = useState(null);
  const [formData, setFormData] = useState({
    stationName: '',
    location: '',
    contactPerson: '',
    phone: '',
    currentDieselPrice: '',
    currentPetrolPrice: '',
    creditFacility: false,
    creditLimit: '',
    paymentTerms: 'Cash Only'
  });

  const resetForm = () => {
    setFormData({
      stationName: '',
      location: '',
      contactPerson: '',
      phone: '',
      currentDieselPrice: '',
      currentPetrolPrice: '',
      creditFacility: false,
      creditLimit: '',
      paymentTerms: 'Cash Only'
    });
  };

  const openAddForm = () => {
    setEditingStation(null);
    resetForm();
    setMode('form');
  };

  const openEditForm = (station) => {
    setEditingStation(station);
    setFormData({
      stationName: station.stationName,
      location: station.location,
      contactPerson: station.contactPerson,
      phone: station.phone,
      currentDieselPrice: station.currentDieselPrice.toString(),
      currentPetrolPrice: station.currentPetrolPrice.toString(),
      creditFacility: station.creditFacility,
      creditLimit: station.creditLimit.toString(),
      paymentTerms: station.paymentTerms
    });
    setMode('form');
  };

  const handleCancel = async () => {
    const isFormEmpty = !formData.stationName && !formData.location;
    if (!isFormEmpty) {
      const confirmed = await showConfirm({
        title: 'Cancel Changes',
        description: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
        confirmText: 'Yes, Cancel',
        cancelText: 'No, Stay',
        variant: 'destructive'
      });
      if (!confirmed) return;
    }
    backToList();
  };

  const backToList = () => {
    setMode('list');
    setEditingStation(null);
    resetForm();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingStation) {
      setFuelStations(fuelStations.map(s =>
        s.id === editingStation.id
          ? {
              ...s,
              ...formData,
              currentDieselPrice: parseFloat(formData.currentDieselPrice),
              currentPetrolPrice: parseFloat(formData.currentPetrolPrice),
              creditLimit: formData.creditFacility ? parseFloat(formData.creditLimit) : 0
            }
          : s
      ));
    } else {
      const stationId = 'FS' + String(fuelStations.length + 1).padStart(3, '0');
      const station = {
        id: stationId,
        ...formData,
        currentDieselPrice: parseFloat(formData.currentDieselPrice),
        currentPetrolPrice: parseFloat(formData.currentPetrolPrice),
        creditLimit: formData.creditFacility ? parseFloat(formData.creditLimit) : 0,
        fuelTypes: ['Diesel', 'Petrol'],
        isActive: true
      };
      setFuelStations([...fuelStations, station]);
    }

    backToList();
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: 'Delete Fuel Station',
      description: 'Are you sure you want to delete this fuel station?',
      confirmText: 'Delete',
      variant: 'destructive'
    });
    if (confirmed) {
      setFuelStations(fuelStations.filter(s => s.id !== id));
    }
  };

  // Form View
  if (mode === 'form') {
    return (
      <div className="animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button 
            type="button"
            onClick={handleCancel} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: '50%', color: 'var(--text-muted)', transition: 'all 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {editingStation ? 'Edit Fuel Station' : 'New Fuel Station'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Station Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="HP Petrol Station"
                    value={formData.stationName}
                    onChange={(e) => setFormData({...formData, stationName: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Salem Main Road"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mr. Ramesh Kumar"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 44444"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Diesel Price (₹/L) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="92.50"
                    value={formData.currentDieselPrice}
                    onChange={(e) => setFormData({...formData, currentDieselPrice: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Petrol Price (₹/L) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    placeholder="100.20"
                    value={formData.currentPetrolPrice}
                    onChange={(e) => setFormData({...formData, currentPetrolPrice: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.creditFacility}
                      onChange={(e) => setFormData({...formData, creditFacility: e.target.checked})}
                      className="btn btn-secondary"
                    />
                    <span className="text-sm font-medium text-slate-700">Credit Facility Available</span>
                  </label>
                </div>

                {formData.creditFacility && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Credit Limit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50000"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                      className="form-control"
                    />
                  </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                <X size={16} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> {editingStation ? 'Update Station' : 'Save Station'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Fuel className="h-7 w-7 text-red-600" />
              Fuel Station Management
            </h1>
            <p className="text-gray-600 mt-1">Manage fuel stations and pricing information</p>
          </div>
          <button
            onClick={openAddForm}
            className="btn btn-danger"
          >
            <Plus className="h-4 w-4" />
            New Fuel Station
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="form-row">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stations</p>
              <p className="text-2xl font-bold text-gray-900">{fuelStations.length}</p>
            </div>
            <Fuel className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Stations</p>
              <p className="text-2xl font-bold text-green-600">
                {fuelStations.filter(s => s.isActive).length}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Credit Facilities</p>
              <p className="text-2xl font-bold text-blue-600">
                {fuelStations.filter(s => s.creditFacility).length}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Diesel Price</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{fuelStations.length > 0 ? (fuelStations.reduce((sum, s) => sum + s.currentDieselPrice, 0) / fuelStations.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <Fuel className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Fuel Stations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Prices</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Facility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fuelStations.map((station) => (
                <tr key={station.id} className="btn btn-secondary">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{station.stationName}</div>
                      <div className="text-sm text-gray-500">ID: {station.id}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-blue-600">{station.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{station.contactPerson}</div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-500">{station.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Diesel: ₹{station.currentDieselPrice}/L
                      </div>
                      <div className="text-sm text-gray-500">
                        Petrol: ₹{station.currentPetrolPrice}/L
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${station.creditFacility ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {station.creditFacility ? 'Available' : 'Not Available'}
                      </span>
                      {station.creditFacility && (
                        <div className="text-xs text-gray-500 mt-1">
                          Limit: ₹{station.creditLimit.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${station.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {station.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(station)}
                        className="btn btn-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(station.id)}
                        className="btn btn-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FuelStationList;
