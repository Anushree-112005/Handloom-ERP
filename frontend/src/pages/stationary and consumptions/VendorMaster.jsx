import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, Briefcase, CheckCircle, Download, Edit2, Eye, FileText, IndianRupee, Loader, MapPin, Phone, Plus, Save, Search, Trash2, User, Users, X, XCircle, Filter, Globe, Mail } from 'lucide-react';

import { storesService } from '../../services/storesService';
import MasterDropdown from '../../components/MasterDropdown';
import ExportButton from '../../components/ExportButton';
import { confirmDialog, alertDialog } from '../../utils/dialogs';

import { downloadElementAsPdf } from '../../components/A4DocumentPreview';
import logoImg from '../../assets/logo.png';

const InfoRow2 = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 11 }}>
    <div style={{ width: '40%', color: '#0f172a', fontWeight: 600 }}>{label}</div>
    <div style={{ width: '5%', color: '#0f172a', textAlign: 'center' }}>:</div>
    <div style={{ width: '55%', color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

export default function VendorMaster() {
  const [view, setView] = useState('list');

  const [selectedViewItem, setSelectedViewItem] = useState(null);
  const printRef = useRef(null);
  const generatePDF = async () => {
    if (printRef.current) {
      await downloadElementAsPdf(printRef.current, `Profile_${selectedViewItem?.id || selectedViewItem?.quotation_id || selectedViewItem?.vendor_id || selectedViewItem?.req_id || 'Doc'}.pdf`);
    }
  };

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
                <Users size={24} color="var(--primary)" /> Vendor Master
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Manage suppliers of stationery, safety and office supplies</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ExportButton
                data={vendors}
                filename="Vendor_Master_Report"
                pdfTitle="Vendor Master Report"
                columns={[
                  { header: 'Vendor Code', key: 'vendor_code' },
                  { header: 'Vendor Name', key: 'vendor_name' },
                  { header: 'Contact Person', key: 'contact_person' },
                  { header: 'Phone', key: 'phone' },
                  { header: 'Email', key: 'email' },
                  { header: 'GST Number', key: 'gst_number' },
                  { header: 'Payment Terms', key: 'payment_terms' },
                  { header: 'Type', key: 'vendor_type' },
                  { header: 'Status', key: 'status' }
                ]}
              />
              <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={16} /> Add Vendor
              </button>
            </div>
          </div>

          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {stats.map((s, i) => (
              <div key={i} className="stat-card" style={{ border: 'none', boxShadow: 'none' }}>
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

          {/* Search Card */}
          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search vendors..."
                style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {loading && <Loader className="animate-spin" size={18} style={{ color: 'var(--primary)', position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <Filter size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
              </div>
              
              <select className="form-control" style={{ width: 150, margin: 0 }}>
                <option>All Types</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>From:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>To:</span>
                <input type="date" className="form-control" style={{ width: 140, margin: 0 }} />
              </div>
            </div>
          </div>

            {error && (
              <div style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: 14 }}>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, overflowX: 'auto' }}>
                <div className="card" style={{ padding: 0 }}>
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
                      <tr key={v.id}
                        onClick={() => setSelectedViewItem(v)}
                        style={{
                          cursor: 'pointer',
                          background: selectedViewItem?.id === v.id ? 'var(--bg-secondary)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
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
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setSelectedViewItem(v)}
                              title="Preview"
                            >
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleOpenForm(v)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleDelete(v.id)}
                              title="Delete"
                            >
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

          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
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

      {/* Preview Modal */}
      {selectedViewItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Vendor Master Preview</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                  <Download size={14} /> Download PDF
                </button>
                <button onClick={() => setSelectedViewItem(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>
            </div>

            <div style={{ padding: '40px 20px', background: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flex: 1, overflowY: 'auto' }}>
              <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 850, padding: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', borderRadius: 4, position: 'relative', marginBottom: 20, overflow: 'hidden' }}>

                <div style={{ padding: '32px 40px 20px 40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                      </div>
                      <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>DINESH EXPORTS</h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>THE HOUSE OF FABRICS</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', width: 300 }}>
                      <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>VENDOR MASTER</h2>
                      <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Status</div>
                        <div style={{ width: 20, textAlign: 'center' }}>:</div>
                        <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewItem.status || 'ACTIVE').toUpperCase()}</span></div>
                      </div>
                      <div style={{ display: 'flex', fontSize: 11, justifyContent: 'flex-end' }}>
                        <div style={{ width: 100, fontWeight: 600, color: '#0f172a', textAlign: 'left' }}>Generated On</div>
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
                      <FileText size={14} /> 1. RECORD DETAILS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      <div>
                        {Object.entries(selectedViewItem).slice(0, 5).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
                      </div>
                      <div>
                        {Object.entries(selectedViewItem).slice(5, 10).map(([k, v]) => (
                          k !== 'id' && typeof v !== 'object' && <InfoRow2 key={k} label={k.replace(/_/g, ' ').toUpperCase()} value={String(v) || '-'} />
                        ))}
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
  );
}

