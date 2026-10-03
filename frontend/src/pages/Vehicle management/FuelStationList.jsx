import React, { useState } from 'react';
import { Plus, MapPin, Phone, DollarSign, Fuel, ArrowLeft, Save, X, Edit2, Trash2, Eye, Download, User, Mail, Globe, FileText } from 'lucide-react';
import { showConfirm } from '../../components/ConfirmDialog';
import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import jsPDF from 'jspdf';
import logoImg from '../../assets/logo.png';

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
                        className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setViewingStation(station)}
                        title="Preview Profile"
                      >
                        <Eye className="h-4 w-4" color="var(--primary)" />
                      </button>
                      <button
                        onClick={() => openEditForm(station)}
                        className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(station.id)}
                        className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" color="var(--danger, #ef4444)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile View Modal */}
      {viewingStation && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Fuel Station Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(viewingStation)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setViewingStation(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
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
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>FUEL STATION PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: viewingStation.isActive ? '#22c55e' : '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{viewingStation.isActive ? 'ACTIVE' : 'INACTIVE'}</span></div>
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
                          <InfoRow2 label="Station ID" value={viewingStation.id} />
                          <InfoRow2 label="Station Name" value={viewingStation.stationName} />
                          <InfoRow2 label="Location" value={viewingStation.location} />
                          <InfoRow2 label="Contact Person" value={viewingStation.contactPerson} />
                          <InfoRow2 label="Phone" value={viewingStation.phone} />
                          <InfoRow2 label="Diesel Price" value={`₹${viewingStation.currentDieselPrice}/L`} />
                          <InfoRow2 label="Petrol Price" value={`₹${viewingStation.currentPetrolPrice}/L`} />
                          <InfoRow2 label="Credit Facility" value={viewingStation.creditFacility ? 'Available' : 'No'} />
                          <InfoRow2 label="Credit Limit" value={viewingStation.creditLimit ? `₹${viewingStation.creditLimit}` : '-'} />
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
  );
};

export default FuelStationList;
