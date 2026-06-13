import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Save, ArrowLeft, Activity } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../services/api';

export default function LoomStatusUpdate() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    loom_id: '',
    previous_status: '',
    new_status: 'Running',
    changed_at: new Date().toLocaleString(),
    changed_by: 'Login User',
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_status_update').catch(() => ({ data: [] })),
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

  const handleLoomChange = (e) => {
    const lId = e.target.value;
    const loom = looms.find(l => l.id.toString() === lId);
    setFormData(prev => ({
      ...prev,
      loom_id: lId,
      previous_status: loom ? loom.status : '',
      changed_at: new Date().toLocaleString()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const actualLoom = looms.find(l => l.id.toString() === formData.loom_id);
      const lName = actualLoom ? actualLoom.loom_name : formData.loom_id;

      // Log the status update
      await subMasterAPI.create('ppc_status_update', {
        name: lName,
        code: formData.new_status,
        extra_field_1: `Prev: ${formData.previous_status}`,
        extra_field_2: formData.changed_at,
        description: `Reason: ${formData.reason} | By: ${formData.changed_by}`,
        is_active: true
      });

      // Actually update the loom in DB
      if (actualLoom) {
        await ppcAPI.updateLoom(actualLoom.id, {
          loom_name: actualLoom.loom_name,
          capacity_per_day: actualLoom.capacity_per_day,
          efficiency_pct: actualLoom.efficiency_pct,
          status: formData.new_status
        });
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity style={{ color: '#f97316' }} /> Loom Status Update
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Record machine state changes and breakdowns</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                loom_id: '', previous_status: '', new_status: 'Running',
                changed_at: new Date().toLocaleString(), changed_by: 'Login User', reason: ''
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f97316', borderColor: '#f97316' }}
          >
            <AlertTriangle size={16} /> Update Status
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to List
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0, maxWidth: 800 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#f9731618', borderRadius: 10, color: '#ea580c' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Change Machine State</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>This updates the live dashboard immediately</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={handleLoomChange} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name} (Current: {l.status})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Previous Status (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.previous_status} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>New Status</label>
                <select className="form-control" value={formData.new_status} onChange={e => setFormData({...formData, new_status: e.target.value})} required>
                  <option value="Running">Running</option>
                  <option value="Idle">Idle</option>
                  <option value="Breakdown">Breakdown</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input type="text" className="form-control" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Yarn break, Scheduled maintenance" required={formData.new_status === 'Breakdown' || formData.new_status === 'Maintenance'} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Changed At (Auto)</label>
                <input type="text" className="form-control" value={formData.changed_at} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Changed By (Auto)</label>
                <input type="text" className="form-control" value={formData.changed_by} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#f97316', borderColor: '#f97316' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Confirm Status Change
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Status Change Log ({filteredRecords.length})</h3>
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
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Loom ID</th>
                  <th>Status Change</th>
                  <th>Timestamp</th>
                  <th>Reason & Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No logs found</td></tr>
                ) : filteredRecords.map((record, idx) => {
                  const isBad = record.code === 'Breakdown' || record.code === 'Maintenance';
                  return (
                    <tr key={record.id || idx}>
                      <td style={{ fontWeight: 600 }}>{record.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{record.extra_field_1?.replace('Prev: ', '')}</span>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span style={{ 
                            color: isBad ? '#b91c1c' : '#047857', 
                            fontWeight: 600, 
                            backgroundColor: isBad ? '#ef444420' : '#10b98120', 
                            padding: '2px 8px', borderRadius: 12, fontSize: 12 
                          }}>
                            {record.code}
                          </span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{record.extra_field_2}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
