import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, MapPin, Grid, Layers, Edit, X } from 'lucide-react';
import { warehouseAPI } from '../../../services/api';

export default function GodownMaster() {
  const [godowns, setGodowns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', type: 'RAW', is_active: true });

  useEffect(() => {
    fetchGodowns();
  }, []);

  const fetchGodowns = async () => {
    try {
      const res = await warehouseAPI.getGodowns();
      if (res.data) setGodowns(res.data);
    } catch (err) {
      console.error("Error fetching godowns", err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await warehouseAPI.createGodown(formData);
      setShowModal(false);
      setFormData({ name: '', location: '', type: 'RAW', is_active: true });
      fetchGodowns();
    } catch (err) {
      console.error("Error creating godown", err);
    }
  };

  const filteredGodowns = godowns.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box size={24} color="var(--primary)" /> Godown / Bin Master
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Define physical locations, racks, and bins for warehouse storage.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add New Godown
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search Godown Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredGodowns.map(g => (
          <div key={g.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>

            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>ID: GD-{g.id}</p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, background: g.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: g.is_active ? '#10b981' : '#ef4444' }}>
                  {g.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <MapPin size={16} color="var(--text-muted)" />
                  <span>{g.location || 'No Location Set'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Grid size={14} /> Racks
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', fontSize: '16px' }}>{g.racks}</div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Layers size={14} /> Total Bins
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', fontSize: '16px' }}>{g.bins}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <Grid size={14} /> Manage Bins
              </button>
              <button className="btn" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px' }}>
                <Edit size={14} /> Edit
              </button>
            </div>

          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Add New Godown</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>Godown Name</label>
                <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>Location (Block/Area)</label>
                <input type="text" className="form-control" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>Type</label>
                <select className="form-control" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%' }}>
                  <option value="RAW">Raw Material</option>
                  <option value="YARN">Yarn</option>
                  <option value="FINISHED">Finished Goods</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Godown</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
