import React, { useState, useEffect } from 'react';
<<<<<<< Updated upstream
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
=======
import { Package, Search, Plus, X, UploadCloud, ImageIcon, Image, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api'; // Use main api instance

export default function WarehouseStock() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // New Item State
  const [newItem, setNewItem] = useState({
    material_name: '',
    category: '',
    quantity: '',
    uom: 'Kgs',
    location: '',
    notes: ''
  });
  const [newItemImage, setNewItemImage] = useState(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const response = await api.get('/warehouse-stock/');
      setStockItems(response.data);
    } catch (error) {
      console.error("Error fetching warehouse stock:", error);
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
<<<<<<< Updated upstream
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
=======
    fetchStock();
  }, []);

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newItem, quantity: parseFloat(newItem.quantity) || 0 };
      const response = await api.post('/warehouse-stock/', payload);
      
      if (newItemImage && response.data?.data?.id) {
        const formData = new FormData();
        formData.append("file", newItemImage);
        await api.post(`/warehouse-stock/${response.data.data.id}/images`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setShowAddModal(false);
      setNewItem({ material_name: '', category: '', quantity: '', uom: 'Kgs', location: '', notes: '' });
      setNewItemImage(null);
      fetchStock();
    } catch (error) {
      console.error("Error creating stock record:", error);
    }
  };

  const handleImageUpload = async (e, itemId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/warehouse-stock/${itemId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchStock();
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete this inventory record?")) return;
    try {
      await api.delete(`/warehouse-stock/${itemId}`);
      fetchStock();
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const handleSearchByImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(`/warehouse-stock/search-by-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (response.data.status === "success") {
        setStockItems([response.data.data]);
      } else {
        alert("No matching image found in the database.");
        fetchStock();
      }
    } catch (error) {
      console.error("Error searching by image:", error);
      alert("Error searching by image");
    } finally {
      setLoading(false);
      e.target.value = null;
>>>>>>> Stashed changes
    }
  };

  return (
<<<<<<< Updated upstream
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
=======
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={24} color="var(--primary)" /> Warehouse Stock & Photos
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage physical inventory and verify stock with photo evidence.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label className="btn" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600 }}>
            <Search size={16} /> Search by Image
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleSearchByImage} />
          </label>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> New Stock Record
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading stock records...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', padding: '20px' }}>
            {stockItems.map(item => (
              <div key={item.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{item.material_name}</h3>
                      <span style={{ fontSize: '12px', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)', display: 'inline-block', marginTop: '4px' }}>{item.category || 'General'}</span>
                    </div>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600,
                      background: item.status === 'Verified' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      color: item.status === 'Verified' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{item.quantity} {item.uom}</div>
                    </div>
                    <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{item.location || '-'}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-secondary)', flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                    <span>Photos ({item.images?.length || 0})</span>
                    <label style={{ cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <UploadCloud size={14} /> Upload
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(e, item.id)} />
                    </label>
                  </div>
                  
                  {item.images && item.images.length > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {item.images.map(img => (
                        <div key={img.id} style={{ 
                          width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', 
                          border: '2px solid white', flexShrink: 0, boxShadow: 'var(--shadow-sm)',
                          backgroundImage: `url(${api.defaults.baseURL.replace('/api/v1', '')}${img.image_url})`,
                          backgroundSize: 'cover', backgroundPosition: 'center'
                        }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                      <ImageIcon size={20} style={{ opacity: 0.5, marginBottom: '8px', margin: '0 auto' }} />
                      <div style={{ fontSize: '12px' }}>No photos yet</div>
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
                   <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                     Delete Record
                   </button>
                </div>
              </div>
            ))}
            {stockItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No stock records found. Click "New Stock Record" to add one.
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ 
            background: 'var(--bg-card)', width: '100%', maxWidth: '500px', 
            borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Add Warehouse Stock</h3>
              <button type="button" onClick={() => { setShowAddModal(false); setNewItemImage(null); }} style={{ background: 'var(--bg-secondary)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRecord} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Material Name / Item Code *</label>
                  <input type="text" required value={newItem.material_name} onChange={e => setNewItem({...newItem, material_name: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', background: 'var(--bg-card)' }}>
                    <option value="">Select...</option>
                    <option value="Yarn">Yarn</option>
                    <option value="Greige Fabric">Greige Fabric</option>
                    <option value="Finished Fabric">Finished Fabric</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Dyes & Chemicals">Dyes & Chemicals</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Location (Godown/Rack)</label>
                  <input type="text" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Quantity *</label>
                  <input type="number" step="0.01" required value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>UOM</label>
                  <select value={newItem.uom} onChange={e => setNewItem({...newItem, uom: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', background: 'var(--bg-card)' }}>
                    <option value="Kgs">Kgs</option>
                    <option value="Mtrs">Mtrs</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Bags">Bags</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Pcs">Pcs</option>
                  </select>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</label>
                  <textarea rows="2" value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', resize: 'vertical' }}></textarea>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Upload Image (Optional)</label>
                  <input type="file" accept="image/*" onChange={e => setNewItemImage(e.target.files[0])}
                    style={{ width: '100%', padding: '10px 12px', border: '1px dashed var(--border)', borderRadius: '8px', outline: 'none', background: 'var(--bg-primary)', cursor: 'pointer' }} />
                  {newItemImage && <p style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>Selected: {newItemImage.name}</p>}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => { setShowAddModal(false); setNewItemImage(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Record
                </button>
>>>>>>> Stashed changes
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
<<<<<<< Updated upstream
};

export default WarehouseStock;
=======
}
>>>>>>> Stashed changes
