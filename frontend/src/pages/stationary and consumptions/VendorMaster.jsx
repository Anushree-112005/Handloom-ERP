import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Loader, Users, AlertCircle } from 'lucide-react';

export default function VendorMaster() {
  const [view, setView] = useState('list');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    vendor_code: '',
    vendor_name: '',
    contact_person: '',
    phone: '',
    email: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    payment_terms: '30 Days',
    vendor_type: 'Raw Material Supplier',
    status: 'Active'
  });

  const paymentTermsList = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "LC 90 Days"];
  const vendorTypeList = ["Raw Material Supplier", "Consumables Supplier", "Chemical Supplier", "Spare Parts Vendor", "Service Provider", "Others"];

  const fetchVendors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storesService.getVendors(searchTerm);
      setVendors(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [searchTerm, view]);

  const handleOpenForm = (vendor = null) => {
    setError('');
    if (vendor) {
      setFormData({
        vendor_code: vendor.vendor_code,
        vendor_name: vendor.vendor_name,
        contact_person: vendor.contact_person || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        gst_number: vendor.gst_number || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        country: vendor.country || 'India',
        payment_terms: vendor.payment_terms || '30 Days',
        vendor_type: vendor.vendor_type || 'Raw Material Supplier',
        status: vendor.status || 'Active'
      });
      setEditingId(vendor.id);
    } else {
      setFormData({
        vendor_code: '',
        vendor_name: '',
        contact_person: '',
        phone: '',
        email: '',
        gst_number: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        payment_terms: '30 Days',
        vendor_type: 'Consumables Supplier',
        status: 'Active'
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor? This will soft delete the record.')) {
      try {
        setLoading(true);
        await storesService.deleteVendor(id);
        await fetchVendors();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.detail || 'Failed to delete vendor.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendor_code.trim() || !formData.vendor_name.trim()) {
      setError('Vendor Code and Vendor Name are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await storesService.updateVendor(editingId, formData);
      } else {
        await storesService.createVendor(formData);
      }
      setView('list');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the vendor. Code might be duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header Card */}
          <div className="card" style={{ 
            padding: "24px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 0,
            background: "linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%)",
            border: "1px solid var(--border)"
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'rgb(99, 102, 241)',
                padding: '12px',
                borderRadius: '12px'
              }}>
                <Users size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Vendor Master</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 14, margin: '4px 0 0 0' }}>Manage suppliers of stationery, safety and office supplies</p>
              </div>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
              <Plus size={16} /> Add Vendor
            </button>
          </div>

          {/* Search & Table Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                <input 
                  type="text" 
                  placeholder="Search vendors..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="form-control" style={{ paddingLeft: 38 }} 
                />
              </div>
              {loading && <Loader className="animate-spin" size={18} style={{ color: 'var(--primary)' }} />}
            </div>

            {error && (
              <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: 14 }}>{error}</span>
              </div>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor Code</th>
                    <th>Vendor Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>GST Number</th>
                    <th>Payment Terms</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        {loading ? 'Loading vendors...' : 'No vendors found. Click Add Vendor to create one.'}
                      </td>
                    </tr>
                  ) : (
                    vendors.map(v => (
                      <tr key={v.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: 'var(--primary)' }}>{v.vendor_code}</td>
                        <td style={{ fontWeight: 600 }}>{v.vendor_name}</td>
                        <td>{v.contact_person || '-'}</td>
                        <td>{v.phone || '-'}</td>
                        <td>{v.email || '-'}</td>
                        <td style={{ fontFamily: "monospace" }}>{v.gst_number || '-'}</td>
                        <td>{v.payment_terms || '-'}</td>
                        <td>{v.vendor_type || '-'}</td>
                        <td>
                          <span className={`badge ${v.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ borderRadius: '6px', fontWeight: 'bold' }}>
                            {v.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <button onClick={() => handleOpenForm(v)} style={{ padding: 6, borderRadius: "8px", color: "var(--primary)", background: "rgba(99, 102, 241, 0.1)", cursor: "pointer", border: "none" }} title="Edit Vendor">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(v.id)} style={{ padding: 6, borderRadius: "8px", color: "var(--danger)", background: "rgba(239, 68, 68, 0.1)", cursor: "pointer", border: "none" }} title="Delete Vendor">
                              <Trash2 size={14} />
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
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Vendor' : 'New Vendor'}
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                {editingId ? 'Update' : 'Save'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}>
                <X size={16} /> Close
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form Content - Multi Columns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Section 1: Basic Information */}
            <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Basic Information
              </legend>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Vendor Code *</label>
                  <input 
                    type="text" required disabled={!!editingId} value={formData.vendor_code} 
                    onChange={(e) => setFormData({...formData, vendor_code: e.target.value.toUpperCase().replace(/\s+/g, '-')})} 
                    placeholder="E.g. VEN-ABC"
                    className="form-control" 
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Unique identifier (uppercase, no spaces)</small>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Vendor Name *</label>
                  <input 
                    type="text" required value={formData.vendor_name} 
                    onChange={(e) => setFormData({...formData, vendor_name: e.target.value})} 
                    placeholder="E.g. ABC Chemical Suppliers"
                    className="form-control" 
                  />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>GST Number</label>
                  <input 
                    type="text" value={formData.gst_number} 
                    onChange={(e) => setFormData({...formData, gst_number: e.target.value.toUpperCase()})} 
                    placeholder="E.g. 33AABCC1234F1Z1"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Vendor Type *</label>
                  <select 
                    value={formData.vendor_type} 
                    onChange={(e) => setFormData({...formData, vendor_type: e.target.value})} 
                    className="form-control"
                  >
                    {vendorTypeList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Status *</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})} 
                    className="form-control"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Section 2: Contact & Payments */}
            <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contact & Payment Information
              </legend>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Contact Person</label>
                  <input 
                    type="text" value={formData.contact_person} 
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})} 
                    placeholder="E.g. John Doe"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Mobile Number</label>
                  <input 
                    type="text" value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="E.g. 9876543210"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Email Address</label>
                  <input 
                    type="email" value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    placeholder="E.g. info@vendor.com"
                    className="form-control" 
                  />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Payment Terms *</label>
                  <select 
                    value={formData.payment_terms} 
                    onChange={(e) => setFormData({...formData, payment_terms: e.target.value})} 
                    className="form-control"
                  >
                    {paymentTermsList.map(term => <option key={term} value={term}>{term}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Section 3: Address details */}
            <fieldset style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '24px 32px', margin: 0 }}>
              <legend style={{ padding: '0 12px', fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Address Details
              </legend>
              <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>City</label>
                  <input 
                    type="text" value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                    placeholder="E.g. Coimbatore"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>State</label>
                  <input 
                    type="text" value={formData.state} 
                    onChange={(e) => setFormData({...formData, state: e.target.value})} 
                    placeholder="E.g. Tamil Nadu"
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Country</label>
                  <input 
                    type="text" value={formData.country} 
                    onChange={(e) => setFormData({...formData, country: e.target.value})} 
                    className="form-control" 
                  />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: 20 }}>
                <div className="form-group" style={{ width: '100%' }}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Full Address</label>
                  <textarea 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    placeholder="Building name, street, road, landmark..."
                    className="form-control" 
                    rows="3"
                  />
                </div>
              </div>
            </fieldset>
          </div>
        </form>
      )}
    </div>
  );
}
