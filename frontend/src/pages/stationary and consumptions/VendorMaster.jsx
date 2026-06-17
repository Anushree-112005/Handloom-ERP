import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Edit2, Trash2, Search, X } from 'lucide-react';

export default function VendorMaster() {
  const [view, setView] = useState('list');
  const [vendors, setVendors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '', code: '', gst: '', phone: '', email: '', rating: 4.0
  });

  useEffect(() => {
    setVendors(mockDb.get('consumables_vendors'));
  }, [view]);

  const handleOpenForm = (vendor = null) => {
    if (vendor) {
      setFormData(vendor);
      setEditingId(vendor.id);
    } else {
      setFormData({ name: '', code: '', gst: '', phone: '', email: '', rating: 4.0 });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      mockDb.delete('consumables_vendors', id);
      setVendors(mockDb.get('consumables_vendors'));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      mockDb.update('consumables_vendors', editingId, formData);
    } else {
      mockDb.add('consumables_vendors', {
        id: 'VEN' + Math.floor(Math.random() * 1000),
        ...formData
      });
    }
    setView('list');
  };

  return (
    <div className="animate-fade">
      {view === 'list' ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Vendor Master</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Manage suppliers of stationery, safety and office supplies</p>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary">
              <Plus size={16} /> Add Vendor
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="p-4 border-b">
              <input 
                type="text" 
                placeholder="Search vendors..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="form-control" 
              />
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th >Code</th>
                  <th >Vendor Name</th>
                  <th >GST Number</th>
                  <th >Mobile</th>
                  <th >Email</th>
                  <th style={{ textAlign: "center" }}>Rating</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody >
                {vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())).map(v => (
                  <tr key={v.id} >
                    <td style={{ fontFamily: "monospace" }}>{v.code || v.id}</td>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td className="px-6 py-4 text-sm font-mono">{v.gst || '-'}</td>
                    <td >{v.phone || '-'}</td>
                    <td >{v.email || '-'}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">★ {v.rating}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(v)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--primary)", cursor: "pointer", background: "none", border: "none" }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--danger)", cursor: "pointer", background: "none", border: "none" }}>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Vendor' : 'Add New Vendor'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save Vendor
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-row" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              <div>
                <label >Vendor Name *</label>
                <input 
                  type="text" required value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Vendor Code *</label>
                <input 
                  type="text" required value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >GST Number</label>
                <input 
                  type="text" value={formData.gst} 
                  onChange={(e) => setFormData({...formData, gst: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Mobile / Phone</label>
                <input 
                  type="text" value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  className="form-control" 
                />
              </div>
              <div>
                <label >Email</label>
                <input 
                  type="email" value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="form-control" 
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
