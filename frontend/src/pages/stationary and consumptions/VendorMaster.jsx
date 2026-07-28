import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Plus, Save, Edit2, Trash2, Search, X, Loader, Users, AlertCircle, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';
import { confirmDialog, alertDialog } from '../../utils/dialogs';

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
    country: '',
    payment_terms: '',
    vendor_type: '',
    status: ''
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
        vendor_code: vendor.vendor_code || '',
        vendor_name: vendor.vendor_name || '',
        contact_person: vendor.contact_person || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        gst_number: vendor.gst_number || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        country: vendor.country || '',
        payment_terms: vendor.payment_terms || '',
        vendor_type: vendor.vendor_type || '',
        status: vendor.status || ''
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
        country: '',
        payment_terms: '',
        vendor_type: '',
        status: ''
      });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this vendor? This will soft delete the record.',
      type: 'delete',
      confirmText: 'Delete'
    });
    if (confirmed) {
      try {
        setLoading(true);
        await storesService.deleteVendor(id);
        await fetchVendors();
      } catch (err) {
        console.error(err);
        alertDialog({ title: 'Error', message: err.response?.data?.detail || 'Failed to delete vendor.', type: 'error' });
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
        alertDialog({ title: 'Success', message: 'Vendor updated successfully!', type: 'success' });
      } else {
        await storesService.createVendor(formData);
        alertDialog({ title: 'Success', message: 'Vendor saved successfully!', type: 'success' });
      }
      setView('list');
      await fetchVendors();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving the vendor. Code might be duplicate.');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { label: 'Total Vendors', value: vendors.length, icon: <Users size={24} />, color: '#6366f1' },
    { label: 'Active Vendors', value: vendors.filter(v => v.status === 'Active').length, icon: <CheckCircle size={24} />, color: '#10b981' },
    { label: 'Inactive Vendors', value: vendors.filter(v => v.status !== 'Active').length, icon: <XCircle size={24} />, color: '#ef4444' }
  ];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {view === 'list' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users style={{ color: '#6366f1' }} /> Vendor Master
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Manage suppliers of stationery, safety and office supplies</p>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Add Vendor
            </button>
          </div>

          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ '--stat-color': s.color }}>
                <div className="stat-icon" style={{ background: `${s.color}1a`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-info">
                  <h3>{s.value}</h3>
                  <p>{s.label}</p>
                </div>
              </div>
            ))}
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
        </>
      ) : (
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
              {editingId ? 'Edit Vendor Details' : 'Add New Vendor'}
            </h2>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
              <button
                type="button"
                style={{
                  padding: '16px 24px', background: '#fff',
                  border: 'none', borderBottom: '3px solid var(--primary)',
                  fontWeight: 600, color: 'var(--primary)',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Basic Information
              </button>
            </div>

            <div style={{ padding: 24, background: '#fff' }}>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
                  </div>
                )}
                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <div className="animate-fade">
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Vendor Code *</label>
                        <input
                          type="text" required disabled={!!editingId} value={formData.vendor_code}
                          onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                          placeholder="Enter Vendor Code"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Vendor Name *</label>
                        <input
                          type="text" required value={formData.vendor_name}
                          onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                          placeholder="Enter Vendor Name"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>GST Number</label>
                        <input
                          type="text" value={formData.gst_number}
                          onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                          placeholder="Enter GST Number"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Vendor Type"
                          name="vendor_type"
                          value={formData.vendor_type}
                          options={vendorTypeList}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Status"
                          name="status"
                          value={formData.status}
                          options={['Active', 'Inactive']}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Contact & Payment Information
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input
                          type="text" value={formData.contact_person}
                          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                          placeholder="Enter Contact Person"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Mobile Number</label>
                        <input
                          type="text" value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter Mobile Number"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email" value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter Email Address"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <MasterDropdown
                          label="Payment Terms"
                          name="payment_terms"
                          value={formData.payment_terms}
                          options={paymentTermsList}
                          required={true}
                          onChange={(name, val) => setFormData({ ...formData, [name]: val })}
                        />
                      </div>
                    </div>

                    <h4 style={{ color: 'var(--primary)', margin: '32px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                      Address Details
                    </h4>
                    <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text" value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Enter City"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text" value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="Enter State"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input
                          type="text" value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="Enter Country"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label>Full Address</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Enter Full Address"
                          className="form-control"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                    <X size={16} /> Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

