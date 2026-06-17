import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Edit2, Trash2, Search, X } from 'lucide-react';

export default function UOMMaster() {
  const [view, setView] = useState('list');
  const [uoms, setUoms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '', active: 'Yes' });

  useEffect(() => {
    setUoms(mockDb.get('consumables_uoms'));
  }, [view]);

  const handleOpenForm = (uom = null) => {
    if (uom) {
      setFormData(uom);
      setEditingId(uom.id);
    } else {
      setFormData({ name: '', description: '', active: 'Yes' });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this UOM?')) {
      mockDb.delete('consumables_uoms', id);
      setUoms(mockDb.get('consumables_uoms'));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      mockDb.update('consumables_uoms', editingId, formData);
    } else {
      mockDb.add('consumables_uoms', {
        id: 'UOM' + Math.floor(Math.random() * 1000),
        ...formData
      });
    }
    setView('list');
  };

  const filtered = uoms.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>UOM Master</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Standardize units of measurements</p>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary">
              <Plus size={16} /> Add UOM
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="card" style={{ padding: "12px 20px", marginBottom: 0, borderRadius: 0, display: "flex", alignItems: "center", gap: 16, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 250, maxWidth: 350 }}>
                <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
                <input 
                  type="text" 
                  placeholder="Search UOMs..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="form-control" style={{ paddingLeft: 38 }} 
                />
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th >UOM ID</th>
                  <th >UOM Name</th>
                  <th >Description</th>
                  <th >Active</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody >
                {filtered.map(uom => (
                  <tr key={uom.id} >
                    <td style={{ fontFamily: "monospace" }}>{uom.id}</td>
                    <td style={{ fontWeight: 600 }}>{uom.name}</td>
                    <td >{uom.description}</td>
                    <td >
                      <span className={`badge ${(uom.active === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}`}>
                        {uom.active}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(uom)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--primary)", cursor: "pointer", background: "none", border: "none" }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(uom.id)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--danger)", cursor: "pointer", background: "none", border: "none" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit UOM' : 'Add New UOM'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save UOM
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label >UOM Name *</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="E.g., Nos, Box, Kg"
                className="form-control" 
              />
            </div>
            <div>
              <label >Description</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="form-control" 
                rows="3"
              />
            </div>
            <div>
              <label >Active *</label>
              <select 
                value={formData.active} 
                onChange={(e) => setFormData({...formData, active: e.target.value})} 
                className="form-control"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
