import React, { useState, useEffect } from 'react';
import {
  Plus, Folder, Search, Filter, Edit2, Trash2, X, Save,
  Calendar, AlertCircle, CheckCircle, FileText, Upload, ArrowLeft, Eye, Download, User, MapPin, Phone, Globe, Mail
} from 'lucide-react';
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

export default function FleetDocuments() {
  const [view, setView] = useState('list');
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [selectedViewDoc, setSelectedViewDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const initialForm = {
    vehicle_id: '',
    document_type: '',
    reference_number: '',
    issued_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    authority: '',
    notes: '',
    document_name: '',
    document_path: '',
  };

  const [formData, setFormData] = useState(initialForm);

  const docTypes = [
    'RC (Registration Certificate)',
    'Insurance',
    'Permit',
    'Fitness Certificate',
    'Pollution (PUC)'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docsRes, vehiclesRes] = await Promise.all([
        api.get('/fleet/documents'),
        api.get('/fleet/vehicles')
      ]);
      setDocuments(docsRes.data || []);
      setVehicles(vehiclesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load compliance documents');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleNumber = (vehicleId) => {
    const v = vehicles.find(item => item.id === vehicleId);
    return v ? v.vehicle_number : `ID: ${vehicleId}`;
  };

  const getDocStatus = (expiryDate) => {
    if (!expiryDate) return 'Active';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    return exp < today ? 'Expired' : 'Active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleOpenForm = (doc = null) => {
    if (doc) {
      setEditingId(doc.id);
      setFormData({
        vehicle_id: doc.vehicle_id || '',
        document_type: doc.document_type || 'RC (Registration Certificate)',
        reference_number: doc.reference_number || '',
        issued_date: doc.issued_date || '',
        expiry_date: doc.expiry_date || '',
        authority: doc.authority || '',
        notes: doc.notes || '',
        document_name: doc.document_name || '',
        document_path: doc.document_path || '',
      });
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        document_name: file.name,
        document_path: `/uploads/${file.name}`
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.document_type || !formData.reference_number || !formData.issued_date || !formData.expiry_date) {
      showError("Please fill in all required fields marked with *");
      return;
    }

    try {
      const payload = {
        vehicle_id: Number(formData.vehicle_id),
        document_type: formData.document_type,
        document_name: formData.document_name || null,
        document_path: formData.document_path || null,
        expiry_date: formData.expiry_date,
        issued_date: formData.issued_date,
        authority: formData.authority || null,
        reference_number: formData.reference_number,
        notes: formData.notes || null,
      };

      if (editingId) {
        await api.put(`/fleet/documents/${editingId}`, payload);
        showSuccess("Document updated successfully!");
      } else {
        await api.post('/fleet/documents', payload);
        showSuccess("Document created successfully!");
      }
      setView('list');
      fetchData();
    } catch (error) {
      console.error("Error saving document:", error);
      showError(error.response?.data?.detail || "Failed to save document");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: 'Delete Document',
      description: 'Are you sure you want to delete this document? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/fleet/documents/${id}`);
      showSuccess('Document deleted successfully');
      if (selectedViewDoc?.id === id) setSelectedViewDoc(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting document:", error);
      showError('Failed to delete document');
    }
  };

  // Stats calculations
  const totalDocs = documents.length;

  const activeCount = documents.filter(d => getDocStatus(d.expiry_date) === 'Active').length;

  const expiredCount = documents.filter(d => getDocStatus(d.expiry_date) === 'Expired').length;

  const soonToExpireCount = documents.filter(d => {
    if (!d.expiry_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(d.expiry_date);
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }).length;

  // Filtering
  const filteredDocs = documents.filter(d => {
    const vehicleNo = getVehicleNumber(d.vehicle_id).toLowerCase();
    const docType = (d.document_type || '').toLowerCase();
    const refNo = (d.reference_number || '').toLowerCase();
    const notes = (d.notes || '').toLowerCase();
    const authority = (d.authority || '').toLowerCase();

    const matchesSearch = searchTerm === '' ||
      vehicleNo.includes(searchTerm.toLowerCase()) ||
      docType.includes(searchTerm.toLowerCase()) ||
      refNo.includes(searchTerm.toLowerCase()) ||
      notes.includes(searchTerm.toLowerCase()) ||
      authority.includes(searchTerm.toLowerCase());

    const docStatus = getDocStatus(d.expiry_date);
    let matchesStatus = true;
    if (statusFilter === 'Active') {
      matchesStatus = docStatus === 'Active';
    } else if (statusFilter === 'Expired') {
      matchesStatus = docStatus === 'Expired';
    } else if (statusFilter === 'Soon Expiring') {
      if (!d.expiry_date) {
        matchesStatus = false;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(d.expiry_date);
        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesStatus = diffDays > 0 && diffDays <= 30;
      }
    }

    const matchesType = typeFilter === 'All Types' || d.document_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const profilePreviewRef = React.useRef(null);
  const generateProfilePDF = async (item) => {
    if (profilePreviewRef.current) {
      const safeName = (item?.document_type || 'Fleet Document').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(profilePreviewRef.current, `Fleet Document_Profile_${safeName}.pdf`);
    }
  };

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
            {editingId ? 'Edit Compliance Document' : 'New Compliance Document'}
          </h2>
        </div>

        <div className="card" style={{ padding: 32, background: '#fff' }}>
          <form id="docForm" onSubmit={handleSubmit}>
            <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Document Details</h4>
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="form-group">
                <label>Vehicle *</label>
                <MasterDropdown
                  value={formData.vehicle_id}
                  onChange={(val) => setFormData({ ...formData, vehicle_id: val })}
                  options={vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))}
                  placeholder="--- Select Vehicle ---"
                />
              </div>
              <div className="form-group">
                <label>Document Type *</label>
                <MasterDropdown
                  entity="document_type"
                  value={formData.document_type}
                  onChange={(val) => setFormData({ ...formData, document_type: val })}
                  options={docTypes.map(t => ({ value: t, label: t }))}
                  placeholder="--- Select Document Type ---"
                />
              </div>
              <div className="form-group">
                <label>Document / Ref Number *</label>
                <input type="text" className="form-control" name="reference_number" value={formData.reference_number} onChange={handleInputChange} placeholder="Enter Ref No" required />
              </div>

              <div className="form-group">
                <label>Issue Date *</label>
                <input type="date" className="form-control" name="issued_date" value={formData.issued_date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Expiry Date *</label>
                <input type="date" className="form-control" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Issued By / Authority</label>
                <input type="text" className="form-control" name="authority" value={formData.authority} onChange={handleInputChange} placeholder="E.g. RTO, Insurance Co" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Document File (PDF / Image)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="form-control" style={{ flex: 1 }} />
                  {formData.document_name && (
                    <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={16} /> {formData.document_name.substring(0, 20)}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Notes / Remarks</label>
                <textarea className="form-control" name="notes" value={formData.notes} onChange={handleInputChange} rows="4" style={{ resize: 'vertical' }} placeholder="Any additional details..."></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, padding: '24px 0 0 0', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> {editingId ? 'Update Document' : 'Save Document'}
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
            <Folder size={24} color="var(--primary)" /> RC / Insurance / Permit
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage vehicle compliance and safety documents</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <ExportButton 
            data={filteredDocs}
            filename="Fleet_Documents_Report"
            pdfTitle="Fleet Documents Report"
            columns={[
              { header: 'Vehicle', key: 'vehicle_id', render: (row) => getVehicleNumber(row.vehicle_id) },
              { header: 'Type', key: 'document_type' },
              { header: 'Ref Number', key: 'reference_number' },
              { header: 'Issued Date', key: 'issued_date' },
              { header: 'Expiry Date', key: 'expiry_date' },
              { header: 'Authority', key: 'authority' },
              { header: 'Status', key: 'expiry_date', render: (row) => getDocStatus(row.expiry_date) }
            ]}
          />
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={18} /> Add Document
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => setStatusFilter('All Status')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(79,70,229,0.1)', color: 'var(--primary)' }}>
            <Folder size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Docs</h3>
            <div className="value">{totalDocs}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Active</h3>
            <div className="value">{activeCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Expired')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Expired</h3>
            <div className="value">{expiredCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Soon Expiring')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-details">
            <h3>Soon Expiring</h3>
            <div className="value">{soonToExpireCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        
        {/* Left Side: Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by type, ref no, vehicle..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {/* Right Side: Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All Types">All Types</option>
            {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="form-control" style={{ width: 120, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Soon Expiring">Soon Expiring</option>
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

      {/* Split Layout */}
      {/* Full Width Table */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document No</th>
                  <th>Vehicle</th>
                  <th>Document Type</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredDocs.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No compliance documents found</td></tr>
                ) : (
                  filteredDocs.map(d => {
                    const docStatus = getDocStatus(d.expiry_date);
                    return (
                      <tr key={d.id} onClick={() => setSelectedViewDoc(d)} style={{ cursor: 'pointer', background: selectedViewDoc?.id === d.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.reference_number || d.id}</td>
                        <td style={{ fontWeight: 600 }}>{getVehicleNumber(d.vehicle_id)}</td>
                        <td>{d.document_type}</td>
                        <td>{d.issued_date}</td>
                        <td style={{ color: docStatus === 'Expired' ? '#ef4444' : 'inherit', fontWeight: docStatus === 'Expired' ? 600 : 'normal' }}>
                          {d.expiry_date}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${docStatus === 'Active' ? 'badge-active' : 'badge-pending'}`} style={{
                            background: docStatus === 'Active' ? '#d1fae5' : '#fee2e2',
                            color: docStatus === 'Active' ? '#065f46' : '#991b1b'
                          }}>
                            {docStatus}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); setSelectedViewDoc(d); }} title="Preview Profile">
                              <Eye size={16} color="var(--primary)" />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleOpenForm(d); }} title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.stopPropagation(); handleDelete(d.id, e); }} title="Delete">
                              <Trash2 size={16} color="var(--danger, #ef4444)" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* Profile View Modal */}
        {selectedViewDoc && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div className="card animate-fade" style={{ background: '#cbd5e1', width: '100%', maxWidth: 900, height: '90vh', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', zIndex: 10, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} style={{ color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Fleet Document Profile Preview</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => generateProfilePDF(selectedViewDoc)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#e2e8f0', border: 'none', color: '#1e293b', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setSelectedViewDoc(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
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
                        <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', textAlign: 'right' }}>FLEET DOCUMENT PROFILE</h2>
                        <div style={{ display: 'flex', fontSize: 11, marginBottom: 6, alignItems: 'center' }}>
                          <div style={{ width: 100, fontWeight: 600, color: '#0f172a' }}>Status</div>
                          <div style={{ width: 20, textAlign: 'center' }}>:</div>
                          <div><span style={{ background: '#22c55e', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 700 }}>{(selectedViewDoc.status || 'ACTIVE').toUpperCase()}</span></div>
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
                          <InfoRow2 label="Vehicle" value={getVehicleNumber(selectedViewDoc.vehicle_id)} />
                          <InfoRow2 label="Document Type" value={selectedViewDoc.document_type} />
                          <InfoRow2 label="Ref Number" value={selectedViewDoc.reference_number} />
                          <InfoRow2 label="Issue Date" value={selectedViewDoc.issued_date} />
                          <InfoRow2 label="Expiry Date" value={selectedViewDoc.expiry_date} />
                          <InfoRow2 label="Issued By" value={selectedViewDoc.authority} />
                          <InfoRow2 label="Notes" value={selectedViewDoc.notes} />
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
