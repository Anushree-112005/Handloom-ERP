import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Save, Trash2, X, FileText, Image, Search, Filter, Upload, Download } from 'lucide-react';

export default function SwatchCardManagement() {
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [swatches, setSwatches] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    swatch_type: 'Yarn',
    digital_id: '',
    count_spec: '',
    construction_spec: '',
    design_no: '',
    color: '',
    party_name: '',
    buyer_comments: '',
    attachment_path: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const swatchTypes = ['Yarn', 'Fabric', 'Dyeing', 'Printed', 'Solid', 'Buyer A4'];

  const fetchSwatches = async () => {
    try {
      const res = await api.get('/stationary/swatches/all');
      setSwatches(res.data);
    } catch (err) {
      console.error('Error fetching swatches:', err);
    }
  };

  useEffect(() => {
    fetchSwatches();
  }, [view]);

  const generateDigitalId = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    setFormData(prev => ({
      ...prev,
      digital_id: `SW-${formData.swatch_type.substring(0, 2).toUpperCase()}-${random}`
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    try {
      const res = await api.post('/stationary/swatches/upload-attachment', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, attachment_path: res.data.attachment_path }));
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.digital_id) {
      alert('Digital ID / Punching ID is required.');
      return;
    }
    
    try {
      if (editingId) {
        await api.put(`/stationary/swatches/${editingId}`, formData);
        alert('Swatch Card updated successfully.');
      } else {
        await api.post('/stationary/swatches/create', formData);
        alert('Swatch Card created successfully.');
      }
      setView('list');
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save Swatch Card.');
    }
  };

  const handleEdit = (card) => {
    setFormData({
      swatch_type: card.swatch_type,
      digital_id: card.digital_id,
      count_spec: card.count_spec,
      construction_spec: card.construction_spec,
      design_no: card.design_no || '',
      color: card.color || '',
      party_name: card.party_name || '',
      buyer_comments: card.buyer_comments || '',
      attachment_path: card.attachment_path || ''
    });
    setEditingId(card.id);
    setView('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Swatch Card?')) return;
    try {
      await api.delete(`/stationary/swatches/${id}`);
      fetchSwatches();
    } catch (err) {
      console.error(err);
      alert('Failed to delete Swatch Card.');
    }
  };

  const filteredSwatches = swatches.filter(item => {
    const matchesTab = activeTab === 'All' || item.swatch_type === activeTab;
    const matchesSearch = 
      item.digital_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.design_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.count_spec.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header section */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Swatch Card Management</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 0' }}>Quality assurance specifications & buyer sample tracking</p>
            </div>
            <button onClick={() => {
              setFormData({
                swatch_type: 'Yarn',
                digital_id: '',
                count_spec: '',
                construction_spec: '',
                design_no: '',
                color: '',
                party_name: '',
                buyer_comments: '',
                attachment_path: ''
              });
              setEditingId(null);
              setView('form');
            }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}>
              <Plus size={18} /> Add Swatch Card
            </button>
          </div>

          {/* Filtering and Search Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <button 
                onClick={() => setActiveTab('All')}
                className={`btn ${activeTab === 'All' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
              >
                All Swatches
              </button>
              {swatchTypes.map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`btn ${activeTab === t ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search by ID, buyer, count, design..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 38, borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          {/* Grid Layout of Swatch Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {filteredSwatches.map(card => (
              <div key={card.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 20, borderRadius: '12px', border: '1px solid var(--border)', background: 'white', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}>
                {/* Header of the card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {card.swatch_type}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 2px 0', fontFamily: 'monospace' }}>{card.digital_id}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEdit(card)} className="btn btn-outline" style={{ padding: '4px 8px', minWidth: 0, borderRadius: '6px' }} title="Edit">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(card.id)} className="btn btn-outline" style={{ padding: '4px 8px', minWidth: 0, color: '#dc2626', borderColor: '#fee2e2', borderRadius: '6px' }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content body */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, flex: 1, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Count Spec:</span>
                    <span style={{ fontWeight: 600 }}>{card.count_spec}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Construction:</span>
                    <span style={{ fontWeight: 600 }}>{card.construction_spec}</span>
                  </div>
                  {card.design_no && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Design No:</span>
                      <span style={{ fontWeight: 600 }}>{card.design_no}</span>
                    </div>
                  )}
                  {card.color && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Color:</span>
                      <span style={{ fontWeight: 600 }}>{card.color}</span>
                    </div>
                  )}
                  {card.party_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Buyer/Party:</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{card.party_name}</span>
                    </div>
                  )}
                  {card.buyer_comments && (
                    <div style={{ marginTop: 8, background: '#f8fafc', padding: 8, borderRadius: '6px', fontSize: 13, borderLeft: '3px solid #cbd5e1' }}>
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: 2, color: 'var(--text-secondary)' }}>Buyer Comments:</span>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{card.buyer_comments}</p>
                    </div>
                  )}
                </div>

                {/* Attachment Link */}
                {card.attachment_path && (
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                      <FileText size={14} /> Attachment added
                    </span>
                    <a href={`${api.defaults.baseURL || ''}${card.attachment_path}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Download size={12} /> View File
                    </a>
                  </div>
                )}
              </div>
            ))}

            {filteredSwatches.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <h3>No Swatch Cards found</h3>
                <p>Add a new card to start tracking technical metadata.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Create/Edit Form view */
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Swatch Card' : 'New Swatch Card Entry'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save Swatch Card
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-row">
              <div>
                <label>Swatch Type *</label>
                <select 
                  value={formData.swatch_type} 
                  onChange={(e) => setFormData({ ...formData, swatch_type: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                >
                  {swatchTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Digital ID / Punching ID *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. SW-YA-1004" 
                    value={formData.digital_id}
                    onChange={(e) => setFormData({ ...formData, digital_id: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '8px' }}
                  />
                  <button type="button" onClick={generateDigitalId} className="btn btn-outline" style={{ borderRadius: '8px', padding: '0 12px', fontWeight: 600 }}>
                    Auto-Gen
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Count Specification *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 40S combed, 2/80S polyester" 
                  value={formData.count_spec}
                  onChange={(e) => setFormData({ ...formData, count_spec: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Construction Specification *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 92x88 airjet, plain weave" 
                  value={formData.construction_spec}
                  onChange={(e) => setFormData({ ...formData, construction_spec: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Design Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. DS-9921" 
                  value={formData.design_no}
                  onChange={(e) => setFormData({ ...formData, design_no: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Color</label>
                <input 
                  type="text" 
                  placeholder="e.g. Indigo Blue, Off-White" 
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>

              <div>
                <label>Buyer / Party Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. H&M Global, Zara Trading" 
                  value={formData.party_name}
                  onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </div>

            <div>
              <label>Buyer Approval Comments</label>
              <textarea 
                rows="3" 
                placeholder="Enter comments, buyer approval feedback, or QA remarks..."
                value={formData.buyer_comments}
                onChange={(e) => setFormData({ ...formData, buyer_comments: e.target.value })}
                className="form-control"
                style={{ borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            <div style={{ border: '1px dashed var(--border)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
              {formData.attachment_path ? (
                <div style={{ textAlign: 'center' }}>
                  <FileText size={32} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px 0' }}>Attachment Linked Successfully</p>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{formData.attachment_path}</span>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <a href={`${api.defaults.baseURL || ''}${formData.attachment_path}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }}>View File</a>
                    <button type="button" onClick={() => setFormData({ ...formData, attachment_path: '' })} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12, color: '#dc2626' }}>Remove</button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 8px 0' }}>Upload Swatch Card Attachment (Image or PDF)</p>
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    id="file-upload" 
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-upload" className="btn btn-outline" style={{ cursor: 'pointer', borderRadius: '8px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isUploading ? 'Uploading...' : 'Choose File'}
                  </label>
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
