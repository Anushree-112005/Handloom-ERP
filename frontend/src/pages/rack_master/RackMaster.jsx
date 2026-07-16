import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Box, Image as ImageIcon } from 'lucide-react';
import { rackAPI } from '../../services/api';
import { API_BASE } from '../../services/api';

export default function RackMaster() {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialForm = {
    name: '',
    category: '',
    specific_data: '',
    is_active: true,
  };
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const loadData = async () => {
    try {
      const res = await rackAPI.list();
      setRacks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      if (form.category) formData.append('category', form.category);
      if (form.specific_data) formData.append('specific_data', form.specific_data);
      formData.append('is_active', form.is_active);
      if (imageFile) formData.append('file', imageFile);

      if (editingId) {
        await rackAPI.update(editingId, formData);
      } else {
        await rackAPI.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);
      setImageFile(null);
      setPreviewImage(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving rack');
    }
  };

  const handleEdit = (rack) => {
    setForm({
      name: rack.name,
      category: rack.category || '',
      specific_data: rack.specific_data || '',
      is_active: rack.is_active,
    });
    setPreviewImage(rack.image_url ? (rack.image_url.startsWith('http') ? rack.image_url : `http://localhost:8000${rack.image_url}`) : null);
    setImageFile(null);
    setEditingId(rack.id);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete rack ${name}?`)) {
      try {
        await rackAPI.delete(id);
        loadData();
      } catch (err) {
        alert('Error deleting rack');
      }
    }
  };

  const filteredRacks = racks.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="animate-fade" style={{ padding: '24px' }}>
      {!showForm ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box size={24} color="var(--primary)" /> Rack Management
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Manage racks with images and categories.</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(initialForm); setPreviewImage(null); setImageFile(null); setShowForm(true); }}>
              <Plus size={18} /> New Rack
            </button>
          </div>

          <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" placeholder="Search racks..." style={{ paddingLeft: 38, width: '100%', margin: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {loading ? (
              <p>Loading...</p>
            ) : filteredRacks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No racks found.</p>
            ) : (
              filteredRacks.map(rack => (
                <div key={rack.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 160, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
                    {rack.image_url ? (
                      <img src={rack.image_url.startsWith('http') ? rack.image_url : `http://localhost:8000${rack.image_url}`} alt={rack.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box size={48} color="var(--text-muted)" opacity={0.5} />
                    )}
                  </div>
                  <div style={{ padding: 16, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{rack.name}</h3>
                      <span className={`badge ${rack.is_active ? 'badge-active' : 'badge-draft'}`}>{rack.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    {rack.category && <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Category: {rack.category}</p>}
                    {rack.specific_data && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{rack.specific_data}</p>}
                  </div>
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--bg-secondary)' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handleEdit(rack)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', color: '#ef4444' }} onClick={() => handleDelete(rack.id, rack.name)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="card animate-slide" style={{ maxWidth: 600, margin: '0 auto', padding: '24px 32px' }}>
          <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            {editingId ? 'Edit Rack' : 'Create New Rack'}
          </h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Rack Name *</label>
              <input type="text" className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rack A1" />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <input type="text" className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Cotton Yarns" />
            </div>

            <div className="form-group">
              <label>Specific Data / Notes</label>
              <textarea className="form-control" rows={3} value={form.specific_data} onChange={e => setForm({...form, specific_data: e.target.value})} placeholder="Any unique details about this rack..."></textarea>
            </div>

            <div className="form-group">
              <label>Rack Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: 8, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon size={24} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="file" accept="image/*" id="rack_image" style={{ display: 'none' }} onChange={handleImageChange} />
                  <label htmlFor="rack_image" className="btn btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                    Choose Image
                  </label>
                  <p style={{ margin: '8px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Upload a photo of the rack (JPG, PNG)</p>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <input type="checkbox" id="rack_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
              <label htmlFor="rack_active" style={{ margin: 0, cursor: 'pointer' }}>Active</label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? 'Update Rack' : 'Save Rack'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
