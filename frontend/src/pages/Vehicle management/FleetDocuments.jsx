import React, { useState, useEffect } from 'react';
import { 
  Plus, Folder, Search, Filter, Edit2, Trash2, X, Save, 
  Calendar, AlertCircle, CheckCircle, FileText, Upload, ArrowLeft 
} from 'lucide-react';
import api from '../../services/api';
import { showError, showSuccess } from '../../utils/notifications';
import { showConfirm } from '../../components/ConfirmDialog';

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

  const initialForm = {
    vehicle_id: '',
    document_type: 'RC (Registration Certificate)',
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
    today.setHours(0,0,0,0);
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
        today.setHours(0,0,0,0);
        const exp = new Date(d.expiry_date);
        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesStatus = diffDays > 0 && diffDays <= 30;
      }
    }
    
    const matchesType = typeFilter === 'All Types' || d.document_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // FORM VIEW
  if (view === 'form') {
    return (
      <div className="animate-fade">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Compliance Document' : 'New Compliance Document'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setView('list')}><X size={16} /> Close</button>
              <button type="submit" form="docForm" className="btn btn-primary"><Save size={16} /> Save Document</button>
            </div>
          </div>

          <div style={{ padding: 32 }}>
            <form id="docForm" onSubmit={handleSubmit}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>Document Details</h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group">
                  <label>Vehicle *</label>
                  <select className="form-control" name="vehicle_id" value={formData.vehicle_id} onChange={handleInputChange} required>
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select className="form-control" name="document_type" value={formData.document_type} onChange={handleInputChange} required>
                    {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
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
            </form>
          </div>
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
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          <Plus size={18} /> Add Document
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card" onClick={() => setStatusFilter('All Status')} style={{ cursor: 'pointer', border: statusFilter === 'All Status' ? '2px solid var(--primary)' : '1px solid transparent' }}>
          <div className="stat-icon" style={{ background: 'rgba(79,70,229,0.1)', color: 'var(--primary)' }}>
            <Folder size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Docs</h3>
            <div className="value">{totalDocs}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Active')} style={{ cursor: 'pointer', border: statusFilter === 'Active' ? '2px solid #10b981' : '1px solid transparent' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Active</h3>
            <div className="value">{activeCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Expired')} style={{ cursor: 'pointer', border: statusFilter === 'Expired' ? '2px solid #ef4444' : '1px solid transparent' }}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Expired</h3>
            <div className="value">{expiredCount}</div>
          </div>
        </div>

        <div className="card stat-card" onClick={() => setStatusFilter('Soon Expiring')} style={{ cursor: 'pointer', border: statusFilter === 'Soon Expiring' ? '2px solid #f59e0b' : '1px solid transparent' }}>
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
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by type, ref no, vehicle..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Type:</span>
        </div>
        <select className="form-control" style={{ width: 200, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All Types">All Types</option>
          {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Status:</span>
        </div>
        <select className="form-control" style={{ width: 150, margin: 0 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All Status">All Status</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Soon Expiring">Soon Expiring</option>
        </select>
      </div>

      {/* Split Layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Table */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Document Type</th>
                  <th>Ref Number</th>
                  <th>Expiry Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredDocs.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No compliance documents found</td></tr>
                ) : (
                  filteredDocs.map(d => {
                    const docStatus = getDocStatus(d.expiry_date);
                    return (
                      <tr key={d.id} onClick={() => setSelectedViewDoc(d)} style={{ cursor: 'pointer', background: selectedViewDoc?.id === d.id ? 'var(--bg-secondary)' : 'transparent' }}>
                        <td style={{ fontWeight: 600 }}>{getVehicleNumber(d.vehicle_id)}</td>
                        <td>{d.document_type}</td>
                        <td>{d.reference_number || '-'}</td>
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
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleOpenForm(d)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={(e) => handleDelete(d.id, e)}>
                              <Trash2 size={16} color="#ef4444" />
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

        {/* Details Panel */}
        {selectedViewDoc && (
          <div style={{ flex: '0 0 380px' }}>
            <div className="card animate-slide" style={{ position: 'sticky', top: 24, padding: '24px 20px' }}>
              <div style={{ display: 'flex', justifyView: 'space-between', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                  <FileText size={16} style={{ display: 'inline', marginRight: 8 }} />
                  Document Details
                </h3>
                <button onClick={() => setSelectedViewDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, maxHeight: '65vh', overflowY: 'auto' }}>
                <DetailRow label="Vehicle" value={getVehicleNumber(selectedViewDoc.vehicle_id)} />
                <DetailRow label="Document Type" value={selectedViewDoc.document_type} />
                <DetailRow label="Ref Number" value={selectedViewDoc.reference_number} />
                <DetailRow label="Issue Date" value={selectedViewDoc.issued_date} />
                <DetailRow label="Expiry Date" value={selectedViewDoc.expiry_date} />
                <DetailRow label="Issued By" value={selectedViewDoc.authority} />
                <DetailRow label="Notes" value={selectedViewDoc.notes} />
                <DetailRow label="Status" value={
                  <span style={{ 
                    fontWeight: 800, 
                    color: getDocStatus(selectedViewDoc.expiry_date) === 'Active' ? 'var(--success)' : 'var(--danger)' 
                  }}>
                    {getDocStatus(selectedViewDoc.expiry_date)}
                  </span>
                } />
                {selectedViewDoc.document_name && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Attached File</span>
                    <a 
                      href={selectedViewDoc.document_path} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary" 
                      style={{ width: '100%', justifyContent: 'center', gap: 6, fontSize: 12 }}
                    >
                      <FileText size={14} /> {selectedViewDoc.document_name}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}