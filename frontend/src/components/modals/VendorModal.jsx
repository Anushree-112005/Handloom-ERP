import React, { useState, useEffect } from 'react';
import { storesService } from '../../services/storesService';
import { Save, X, Loader, AlertCircle } from 'lucide-react';

export default function VendorModal({ isOpen, onClose, onSave, editingId = null }) {
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentTermsList = ["Immediate", "15 Days", "30 Days", "45 Days", "60 Days", "LC 90 Days"];
  const vendorTypeList = ["Raw Material Supplier", "Consumables Supplier", "Chemical Supplier", "Spare Parts Vendor", "Service Provider", "Others"];

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        fetchVendorDetails(editingId);
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
        setError('');
      }
    }
  }, [isOpen, editingId]);

  const fetchVendorDetails = async (id) => {
    setLoading(true);
    try {
      const data = await storesService.getVendors();
      const vendor = data.find(v => v.id === id);
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
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch vendor details.');
    } finally {
      setLoading(false);
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
      let savedData;
      if (editingId) {
        savedData = await storesService.updateVendor(editingId, formData);
      } else {
        savedData = await storesService.createVendor(formData);
      }
      onSave(savedData);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, width: 900, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {editingId ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader className="animate-spin text-primary" size={24} /></div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Vendor Code *</label>
                  <input
                    type="text" required disabled={!!editingId} value={formData.vendor_code}
                    onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Vendor Name *</label>
                  <input
                    type="text" required value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input
                    type="text" value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Vendor Type *</label>
                  <select
                    value={formData.vendor_type} required
                    onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Vendor Type --</option>
                    {vendorTypeList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status} required
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <h4 style={{ color: 'var(--primary)', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                Contact & Payment Information
              </h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text" value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="text" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Terms *</label>
                  <select
                    value={formData.payment_terms} required
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="form-control"
                  >
                    <option value="">-- Select Payment Terms --</option>
                    {paymentTermsList.map(term => <option key={term} value={term}>{term}</option>)}
                  </select>
                </div>
              </div>

              <h4 style={{ color: 'var(--primary)', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                Address Details
              </h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text" value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text" value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text" value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Full Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-control"
                    rows="3"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader className="animate-spin" size={16} /> : <Save size={16} />} Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
