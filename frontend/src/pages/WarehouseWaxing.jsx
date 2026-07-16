import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, X, UploadCloud, ImageIcon, Image, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api'; // Use main api instance

export default function WarehouseStock() {
  const [stockItems, setStockItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    }
  };

  const filteredItems = stockItems.filter(item => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (
      item.id.toString().includes(lowerTerm) ||
      (item.material_name && item.material_name.toLowerCase().includes(lowerTerm)) ||
      (item.category && item.category.toLowerCase().includes(lowerTerm)) ||
      (item.location && item.location.toLowerCase().includes(lowerTerm)) ||
      (item.notes && item.notes.toLowerCase().includes(lowerTerm)) ||
      (item.images && item.images.some(img => img.id.toString().includes(lowerTerm) || `img-${img.id}`.includes(lowerTerm)))
    );
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    const loc = item.location || 'Unassigned Location';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(item);
    return acc;
  }, {});

  return (
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={24} color="var(--primary)" /> Warehouse Stock & Photos
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage physical inventory and verify stock with photo evidence.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search ID, Name, Image ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: '8px', outline: 'none', width: '250px' }} />
          </div>
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
          <div style={{ padding: '20px' }}>
            {Object.entries(groupedItems).map(([rack, items]) => (
              <div key={rack} style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                  <Package size={20} /> {rack}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {items.map(item => (
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
                              <div key={img.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ 
                                  width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', 
                                  border: '2px solid white', flexShrink: 0, boxShadow: 'var(--shadow-sm)',
                                  backgroundImage: `url(${api.defaults.baseURL.replace('/api/v1', '')}${img.image_url})`,
                                  backgroundSize: 'cover', backgroundPosition: 'center'
                                }} title={`Image ID: IMG-${img.id}`} />
                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>IMG-{img.id}</span>
                              </div>
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
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No stock records match your search criteria.
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
