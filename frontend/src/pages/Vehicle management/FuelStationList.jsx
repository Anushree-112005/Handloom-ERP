import React, { useState } from 'react';
import { Plus, MapPin, Phone, DollarSign, Fuel, ArrowLeft, Save, X, Edit2, Trash2 } from 'lucide-react';
import { showConfirm } from '../../components/ConfirmDialog';

const FuelStationList = () => {
  const [fuelStations, setFuelStations] = useState([]);
  const [mode, setMode] = useState('list'); // 'list' or 'form'
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
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header */}
        <div className="btn btn-secondary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">
                    {editingStation ? 'Edit Fuel Station' : 'New Fuel Station'}
                  </h1>
                  <span className="btn btn-danger">
                    Not Saved
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn btn-danger"
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="mx-auto max-w-4xl">
            <div className="btn btn-secondary">
              <form onSubmit={handleSubmit} className="form-row">
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
              </form>
            </div>
          </div>
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
