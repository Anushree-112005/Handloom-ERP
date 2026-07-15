import React, { useState, useEffect } from 'react';
import { Plus, X, Package, Save, FileText, Image as ImageIcon, UploadCloud } from 'lucide-react';

const WarehouseStock = () => {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null); // For Image Gallery Modal

  const [formData, setFormData] = useState({
    material_code: '',
    material_name: '',
    warehouse_location: 'Chennai',
    quantity: '',
    remarks: ''
  });
  
  const [images, setImages] = useState([]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/warehouse/materials');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      // Convert FileList to Array and append to existing images
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the material record
      const res = await fetch('http://localhost:8000/api/v1/warehouse/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_code: formData.material_code,
          material_name: formData.material_name,
          warehouse_location: formData.warehouse_location,
          quantity: parseFloat(formData.quantity) || 0,
          remarks: formData.remarks
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create material record');
      }

      const createdMaterial = await res.json();

      // 2. Upload images if any are selected
      if (images.length > 0) {
        const imgData = new FormData();
        images.forEach(img => {
          imgData.append('images', img);
        });

        const imgRes = await fetch(`http://localhost:8000/api/v1/warehouse/materials/${createdMaterial.id}/images`, {
          method: 'POST',
          body: imgData,
        });

        if (!imgRes.ok) {
          console.error("Failed to upload some images");
        }
      }

      setShowForm(false);
      fetchRecords();
      setFormData({
        material_code: '',
        material_name: '',
        warehouse_location: 'Chennai',
        quantity: '',
        remarks: ''
      });
      setImages([]);

    } catch (err) {
      console.error('Submit failed', err);
      alert('Error saving record: ' + err.message);
    }
  };

  return (
    <div className="animate-fade">
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={24} color="var(--primary)" /> Warehouse Stock
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage warehouse materials and view image galleries.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> New Stock Entry
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Material Code</th>
                      <th>Material Name</th>
                      <th>Location</th>
                      <th>Stock Qty</th>
                      <th>Remarks</th>
                      <th>Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
                    ) : records.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No warehouse stock records found.</td></tr>
                    ) : records.map(record => (
                      <tr key={record.id} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.material_code || `MAT-${record.id}`}</td>
                        <td style={{ fontWeight: 500 }}>{record.material_name}</td>
                        <td><span className="badge badge-active">{record.warehouse_location}</span></td>
                        <td>{record.quantity}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{record.remarks || '-'}</td>
                        <td>
                          {record.images && record.images.length > 0 ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' }}
                              onClick={() => setSelectedRecord(record)}
                            >
                              <ImageIcon size={14} /> View ({record.images.length})
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No Images</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* IMAGE GALLERY MODAL */}
          {selectedRecord && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ImageIcon size={20} color="var(--primary)" /> 
                    {selectedRecord.material_name} ({selectedRecord.warehouse_location})
                  </h3>
                  <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>
                    <X size={16} /> Close
                  </button>
                </div>
                
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {selectedRecord.images.map((img, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
                      <a href={`http://localhost:8000${img.image_url}`} target="_blank" rel="noreferrer">
                        <img 
                          src={`http://localhost:8000${img.image_url}`} 
                          alt={`Material ${idx + 1}`} 
                          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} 
                        />
                      </a>
                      <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Img {idx + 1}</span>
                        <span>{new Date(img.uploaded_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New Warehouse Material Entry</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                <Save size={16} /> Save Material
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)', overflowX: 'auto' }}>
            <button
              type="button"
              style={{
                padding: '16px 24px',
                background: '#fff',
                border: 'none',
                borderBottom: '3px solid var(--primary)',
                fontWeight: 600,
                color: 'var(--primary)',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
              }}
            >
              <FileText size={18} /> Material Details
            </button>
          </div>

          <div style={{ padding: 24, background: '#fff' }}>
            <form onSubmit={handleCreate}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                Main Details
              </h4>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label>Material Code</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="material_code" 
                    value={formData.material_code} 
                    onChange={handleChange} 
                    placeholder="e.g. MAT001"
                  />
                </div>
                <div className="form-group">
                  <label>Material Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="material_name" 
                    value={formData.material_name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Cotton Fabric"
                  />
                </div>
                <div className="form-group">
                  <label>Warehouse Location *</label>
                  <select 
                    className="form-control" 
                    name="warehouse_location" 
                    value={formData.warehouse_location} 
                    onChange={handleChange}
                    required
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Tirupur">Tirupur</option>
                    <option value="Erode">Erode</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleChange} 
                    required 
                    step="0.01"
                    placeholder="500.00"
                  />
                </div>
              </div>

              <div className="form-row" style={{ gridTemplateColumns: '1fr', marginTop: '16px' }}>
                <div className="form-group">
                  <label>Remarks</label>
                  <textarea 
                    className="form-control" 
                    name="remarks" 
                    value={formData.remarks} 
                    onChange={handleChange} 
                    rows={2} 
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <h4 style={{ color: 'var(--primary)', margin: '24px 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 16, fontWeight: 700 }}>
                Material Images (Optional)
              </h4>
              
              <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '32px', 
                      border: '2px dashed var(--border)', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <UploadCloud size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                    <span style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>Click to upload images</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You can select multiple files at once (JPG, PNG, GIF)</span>
                    <input 
                      type="file" 
                      multiple
                      accept="image/*"
                      onChange={handleImageChange} 
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {images.length > 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {images.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px', backgroundColor: '#fff' }}>
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${idx}`} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                          />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            style={{ 
                              position: 'absolute', 
                              top: '-8px', 
                              right: '-8px', 
                              backgroundColor: '#ef4444', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '50%', 
                              width: '20px', 
                              height: '20px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseStock;
