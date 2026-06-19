import React, { useState, useEffect } from 'react';
import { Wrench, Search, Save, ArrowLeft, Plus, Trash2, Edit2, Eye, Calendar, DollarSign } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function MaintenanceLog() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    log_id: '',
    loom_id: '',
    service_type: 'Preventive',
    service_date: new Date().toISOString().split('T')[0],
    parts_replaced: '',
    service_done_by: '',
    cost: '',
    next_service_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_maintenance_log').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loom = looms.find(l => l.id.toString() === formData.loom_id);
      const lName = loom ? loom.loom_name : formData.loom_id;

      await subMasterAPI.create('ppc_maintenance_log', {
        name: formData.log_id,
        code: lName,
        extra_field_1: `${formData.service_type} - ₹${formData.cost}`,
        extra_field_2: `Next: ${formData.next_service_date}`,
        description: `Parts: ${formData.parts_replaced} | By: ${formData.service_done_by}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving maintenance log.');
    }
  };

  const handleEdit = (record) => {
    // Mock parsing for edit
    setFormData({
      id: record.id,
      log_id: record.name,
      loom_id: looms.find(l => l.loom_name === record.code)?.id?.toString() || '',
      service_type: record.extra_field_1?.split(' - ')[0] || 'Preventive',
      service_date: new Date().toISOString().split('T')[0],
      parts_replaced: record.description?.match(/Parts: (.*?) \|/)?.[1] || '',
      service_done_by: record.description?.match(/By: (.*)/)?.[1] || '',
      cost: parseFloat(record.extra_field_1?.match(/₹(\d+)/)?.[1] || 0),
      next_service_date: record.extra_field_2?.replace('Next: ', '') || ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await subMasterAPI.delete('ppc_maintenance_log', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wrench style={{ color: '#14b8a6' }} /> Maintenance Log
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Record machine servicing, replaced parts, and costs</p>
        </div>
        {isFormOpen && (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {!isFormOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#ccfbf1', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Wrench size={24} style={{ color: '#14b8a6' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Service Logs</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#e0f2fe', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Calendar size={24} style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Preventive Count</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.filter(r => r.extra_field_1?.includes('Preventive')).length}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fef3c7', padding: 12, borderRadius: 12, display: 'flex' }}>
              <DollarSign size={24} style={{ color: '#d97706' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Maintenance Cost</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                ₹{records.reduce((sum, r) => sum + (parseFloat(r.extra_field_1?.match(/₹(\d+)/)?.[1]) || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#14b8a618', borderRadius: 10, color: '#14b8a6' }}>
                <Wrench size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Log Service Details</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Track preventive and corrective maintenance</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#14b8a618', color: '#0f766e', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.log_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" name="loom_id" value={formData.loom_id} onChange={e => setFormData({...formData, loom_id: e.target.value})} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Service Date</label>
                <input type="date" className="form-control" name="service_date" value={formData.service_date} onChange={e => setFormData({...formData, service_date: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Service Type</label>
                <select className="form-control" name="service_type" value={formData.service_type} onChange={e => setFormData({...formData, service_type: e.target.value})} required>
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                </select>
              </div>
              <div className="form-group">
                <label>Service Done By</label>
                <input type="text" className="form-control" name="service_done_by" value={formData.service_done_by} onChange={e => setFormData({...formData, service_done_by: e.target.value})} placeholder="e.g. Vendor / In-house" required />
              </div>
            </div>

            <div className="form-group">
              <label>Parts Replaced</label>
              <input type="text" className="form-control" name="parts_replaced" value={formData.parts_replaced} onChange={e => setFormData({...formData, parts_replaced: e.target.value})} placeholder="e.g. Reed, Shuttle" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Cost (₹)</label>
                <input type="number" className="form-control" name="cost" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} required placeholder="e.g. 2500" />
              </div>
              <div className="form-group">
                <label>Next Service Date</label>
                <input type="date" className="form-control" name="next_service_date" value={formData.next_service_date} onChange={e => setFormData({...formData, next_service_date: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#14b8a6', borderColor: '#14b8a6' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Maintenance Log
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Maintenance History ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setFormData({
                    log_id: `ML-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    loom_id: '', service_type: 'Preventive', service_date: new Date().toISOString().split('T')[0],
                    parts_replaced: '', service_done_by: '', cost: '', next_service_date: ''
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#14b8a6', borderColor: '#14b8a6', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> New Log Entry
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Log ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loom ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Service Details</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Next Service</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Notes</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                    <td style={{ padding: '16px' }}><span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{record.code}</span></td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        color: record.extra_field_1?.includes('Preventive') ? '#047857' : '#b45309', 
                        backgroundColor: record.extra_field_1?.includes('Preventive') ? '#10b98120' : '#f59e0b20', 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600
                      }}>
                        {record.extra_field_1}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}><span style={{ color: '#0369a1', fontWeight: 600 }}>{record.extra_field_2}</span></td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button style={{ padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleEdit(record)} title="View/Edit">
                          <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button style={{ padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleEdit(record)} title="Edit">
                          <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button style={{ padding: '4px 6px', border: '1px solid #fee2e2', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleDelete(record.id)} title="Delete">
                          <Trash2 size={16} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
