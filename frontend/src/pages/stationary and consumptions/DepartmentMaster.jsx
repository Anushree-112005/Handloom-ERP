import React, { useState, useEffect } from 'react';
import { mockDb } from './mockDb';
import { Plus, Save, Edit2, Trash2, Search, X } from 'lucide-react';

export default function DepartmentMaster() {
  const [view, setView] = useState('list');
  const [departments, setDepartments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', code: '', active: 'Yes' });

  useEffect(() => {
    setDepartments(mockDb.get('consumables_departments'));
  }, [view]);

  const handleOpenForm = (dept = null) => {
    if (dept) {
      setFormData(dept);
      setEditingId(dept.id);
    } else {
      setFormData({ name: '', code: '', active: 'Yes' });
      setEditingId(null);
    }
    setView('form');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this department?')) {
      mockDb.delete('consumables_departments', id);
      setDepartments(mockDb.get('consumables_departments'));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      mockDb.update('consumables_departments', editingId, formData);
    } else {
      const currentData = mockDb.get('consumables_departments');
      const maxIdNum = currentData.reduce((max, item) => {
        const numMatch = item.id.match(/\d+/);
        return numMatch ? Math.max(max, parseInt(numMatch[0], 10)) : max;
      }, 0);
      const nextId = 'DEP' + String(maxIdNum + 1).padStart(3, '0');
      mockDb.add('consumables_departments', {
        id: nextId,
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
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>Department Master</h1>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Configure company departments for material issue tracking</p>
            </div>
            <button onClick={() => handleOpenForm()} className="btn btn-primary">
              <Plus size={16} /> Add Department
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="p-4 border-b">
              <input 
                type="text" 
                placeholder="Search departments..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="form-control" 
              />
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th >ID</th>
                  <th >Department Name</th>
                  <th >Code</th>
                  <th >Active</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody >
                {departments.filter(d => (d?.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(d => (
                  <tr key={d?.id} >
                    <td style={{ fontFamily: "monospace" }}>{d?.id}</td>
                    <td style={{ fontWeight: 600 }}>{d?.name || ''}</td>
                    <td className="px-6 py-4 text-sm font-mono">{d?.code || ''}</td>
                    <td >
                      <span className={`badge ${(d?.active === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}`}>
                        {d?.active || 'No'}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <button onClick={() => handleOpenForm(d)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--primary)", cursor: "pointer", background: "none", border: "none" }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(d?.id)} style={{ padding: 4, borderRadius: "var(--radius-sm)", color: "var(--danger)", cursor: "pointer", background: "none", border: "none" }}>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{editingId ? 'Edit Department' : 'Add New Department'}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setView('list')}>
                <X size={16} /> Close
              </button>
              <button className="btn btn-primary" type="submit">
                <Save size={16} /> Save Department
              </button>
            </div>
          </div>
          <div style={{ padding: 24, background: '#fff', display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label >Department Name *</label>
              <input 
                type="text" required value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="form-control" 
              />
            </div>
            <div>
              <label >Code *</label>
              <input 
                type="text" required value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})} 
                className="form-control" 
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
