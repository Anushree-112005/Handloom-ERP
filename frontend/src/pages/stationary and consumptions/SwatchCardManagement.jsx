import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Save, Trash2, X, FileText, Image, ImageIcon, Search, Filter, Upload, Download } from 'lucide-react';
import MasterDropdown from '../../components/MasterDropdown';


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
    const matchesTab = activeTab === 'All' || item?.swatch_type === activeTab;
    const matchesSearch = 
      (item?.digital_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.design_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.count_spec || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });


  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {view === 'list' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText style={{ color: '#6366f1' }} /> Swatch Card Management
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Quality assurance specifications & buyer sample tracking</p>
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
            }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Add Swatch Card
            </button>
          </div>

          <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                <button 
                  onClick={() => setActiveTab('All')}
                  className={`btn ${activeTab === 'All' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: 13 }}
                >
                  All Swatches
                </button>
                {swatchTypes.map(t => (
                  <button 
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`btn ${activeTab === t ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: 600, fontSize: 13 }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="search-bar" style={{ position: 'relative', width: 280 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search by ID, buyer, count, design..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: 36, fontSize: 13 }}
                />
              </div>
            </div>

            <div className="table-responsive" style={{ flex: 1 }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Digital ID</th>
                    <th>Type</th>
                    <th>Count Spec</th>
                    <th>Construction</th>
                    <th>Design & Color</th>
                    <th>Buyer</th>
                    <th style={{ textAlign: 'center' }}>Attachment</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSwatches.map(card => (
                    <tr key={card?.id}>
                      <td style={{ fontFamily: 'monospace', color: '#4f46e5', fontWeight: 600 }}>{card?.digital_id}</td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '20px', background: '#6366f115', color: '#6366f1', textTransform: 'uppercase' }}>
                          {card?.swatch_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{card?.count_spec}</td>
                      <td>{card?.construction_spec}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          {card?.design_no && <div><span style={{ color: 'var(--text-muted)' }}>Design:</span> {card?.design_no}</div>}
                          {card?.color && <div><span style={{ color: 'var(--text-muted)' }}>Color:</span> {card?.color}</div>}
                          {!card?.design_no && !card?.color && '-'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{card?.party_name || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        {card?.attachment_path ? (
                          <a href={`${api.defaults.baseURL || ''}${card?.attachment_path}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Download size={12} /> View File
                          </a>
                        ) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(card)} className="btn btn-outline" style={{ padding: '6px', minWidth: 0, borderRadius: '8px' }} title="Edit">
                            <FileText size={14} />
                          </button>
                          <button onClick={() => handleDelete(card?.id)} className="btn btn-outline" style={{ padding: '6px', minWidth: 0, color: '#dc2626', borderColor: '#fee2e2', borderRadius: '8px' }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredSwatches.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Swatch Cards found</h3>
                        <p style={{ margin: 0 }}>Add a new card to start tracking technical metadata.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText style={{ color: '#6366f1' }} /> {editingId ? 'Edit Swatch Card' : 'New Swatch Card Entry'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Enter swatch specifications and digital footprint details</p>
            </div>
          </div>

          <div className="card animate-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label>Swatch Type <span style={{ color: '#ef4444' }}>*</span></label>
                  <MasterDropdown
                    label="Swatch Type"
                    name="swatch_type"
                    entity="swatch_type"
                    value={formData.swatch_type}
                    onChange={(val) => setFormData({ ...formData, swatch_type: val })}
                    options={swatchTypes}
                    allowCustom={true}
                  />
                </div>

                <div className="form-group">
                  <label>Digital ID / Punching ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. SW-YA-1004" 
                      value={formData.digital_id}
                      onChange={(e) => setFormData({ ...formData, digital_id: e.target.value })}
                      className="form-control"
                    />
                    <button type="button" onClick={generateDigitalId} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
                      Auto-Gen
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Count Specification <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 40S combed, 2/80S polyester" 
                      value={formData.count_spec}
                      onChange={(e) => setFormData({ ...formData, count_spec: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Construction Specification <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 92x88 airjet, plain weave" 
                      value={formData.construction_spec}
                      onChange={(e) => setFormData({ ...formData, construction_spec: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label>Design Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DS-9921" 
                    value={formData.design_no}
                    onChange={(e) => setFormData({ ...formData, design_no: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Indigo Blue, Off-White" 
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Buyer / Party Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. H&M Global, Zara Trading" 
                    value={formData.party_name}
                    onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Buyer Approval Comments</label>
                <textarea 
                  rows="3" 
                  placeholder="Enter comments, buyer approval feedback, or QA remarks..."
                  value={formData.buyer_comments}
                  onChange={(e) => setFormData({ ...formData, buyer_comments: e.target.value })}
                  className="form-control"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ border: '1px dashed var(--border)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                {formData.attachment_path ? (
                  <div style={{ textAlign: 'center' }}>
                    <ImageIcon size={32} style={{ color: '#6366f1', marginBottom: 12 }} />
                    <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px 0' }}>Attachment Linked Successfully</p>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{formData.attachment_path}</span>
                    <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <a href={`${api.defaults.baseURL || ''}${formData.attachment_path}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 13 }}>View File</a>
                      <button type="button" onClick={() => setFormData({ ...formData, attachment_path: '' })} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 13, color: '#dc2626' }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                    <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Upload Swatch Card Attachment (Image or PDF)</p>
                    <input 
                      type="file" 
                      onChange={handleFileUpload} 
                      id="file-upload" 
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      {isUploading ? 'Uploading...' : 'Choose File'}
                    </label>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <button type="button" onClick={() => setView('list')} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Swatch Card
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
