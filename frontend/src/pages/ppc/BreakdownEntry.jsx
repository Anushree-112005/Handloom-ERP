import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Save, ArrowLeft, Plus, Activity, CheckCircle, Clock, Trash2, Edit2, Eye } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function BreakdownEntry() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    breakdown_id: '',
    loom_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    total_downtime: '',
    reason_category: 'Mechanical',
    reason_details: '',
    reported_by: 'Login User',
    attended_by: '',
    action_taken: '',
    status: 'Open'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        ppcAPI.getBreakdowns().catch(() => ({ data: [] })),
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

  const calculateDowntime = (start, end) => {
    if (!start || !end) return '';
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 24 * 60; // crossed midnight
    
    return (diff / 60).toFixed(2);
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    updated.total_downtime = calculateDowntime(updated.start_time, updated.end_time);
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ppcAPI.logBreakdown({
        loom_id: parseInt(formData.loom_id),
        breakdown_id: formData.breakdown_id,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        total_downtime: parseFloat(formData.total_downtime) || 0,
        reason_category: formData.reason_category,
        reason_details: formData.reason_details,
        reported_by: formData.reported_by,
        attended_by: formData.attended_by,
        action_taken: formData.action_taken,
        status: formData.status
      });

      // Update actual Loom status
      const newStatus = formData.status === 'Open' ? 'Breakdown' : 'Running';
      await ppcAPI.updateLoomStatus(formData.loom_id, newStatus);

      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving breakdown entry.');
    }
  };

  const handleEdit = (record) => {
    // Mock parsing for edit
    setFormData({
      id: record.id,
      breakdown_id: record.breakdown_id,
      loom_id: record.loom_id.toString(),
      date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
      start_time: record.start_time || '',
      end_time: record.end_time || '',
      total_downtime: record.total_downtime || '',
      reason_category: record.reason_category || 'Mechanical',
      reason_details: record.reason_details || '',
      reported_by: record.reported_by || 'Login User',
      attended_by: record.attended_by || '',
      action_taken: record.action_taken || '',
      status: record.status || 'Open'
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this incident?')) return;
    try {
      // If we had a delete endpoint: await ppcAPI.deleteBreakdown(id);
      // For now just refresh, as we didn't define a delete breakdown
      alert('Delete breakdown not implemented on backend yet.');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = records.filter(r => 
    r.breakdown_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    looms.find(l => l.id === r.loom_id)?.loom_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isFormOpen) {
    return (
      <div className="animate-fade" style={{ height: '100%' }}>
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#ef444418', borderRadius: 10, color: '#ef4444' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Log Maintenance Incident</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Tracks machine halts for OEE calculations</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#ef444418', color: '#b91c1c', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.breakdown_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Incident Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" name="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
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
                <label>Status</label>
                <select className="form-control" name="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} required>
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Downtime Calculation</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Breakdown Start Time</label>
                <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleTimeChange} required />
              </div>
              <div className="form-group">
                <label>Breakdown End Time</label>
                <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleTimeChange} required={formData.status === 'Resolved'} />
              </div>
              <div className="form-group">
                <label>Total Downtime (hrs) (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.total_downtime ? `${formData.total_downtime} hrs` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Root Cause & Action</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div className="form-group">
                <label>Reason Category</label>
                <select className="form-control" name="reason_category" value={formData.reason_category} onChange={e => setFormData({...formData, reason_category: e.target.value})} required>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Yarn">Yarn</option>
                  <option value="Power">Power</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason Details</label>
                <input type="text" className="form-control" name="reason_details" value={formData.reason_details} onChange={e => setFormData({...formData, reason_details: e.target.value})} placeholder="e.g. Reed wire broken" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Attended By</label>
                <input type="text" className="form-control" name="attended_by" value={formData.attended_by} onChange={e => setFormData({...formData, attended_by: e.target.value})} placeholder="e.g. Maintenance team" />
              </div>
              <div className="form-group">
                <label>Action Taken</label>
                <input type="text" className="form-control" name="action_taken" value={formData.action_taken} onChange={e => setFormData({...formData, action_taken: e.target.value})} placeholder="e.g. Reed replaced" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Incident
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }


  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ color: '#ef4444' }} /> Breakdown Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Log machine failures and calculate precise downtime</p>
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
            <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Incidents</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#ffedd5', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Activity size={24} style={{ color: '#f97316' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Open Incidents</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.filter(r => r.status === 'Open').length}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#f3e8ff', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Clock size={24} style={{ color: '#a855f7' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Downtime</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.reduce((sum, r) => sum + (parseFloat(r.total_downtime) || 0), 0).toFixed(1)} <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>hrs</span>
              </div>
            </div>
          </div>
        </div>
      )}


        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Incident Logs ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search incidents..."
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
                    ...formData,
                    breakdown_id: `BD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    loom_id: '', start_time: '', end_time: '', total_downtime: '',
                    reason_category: 'Mechanical', reason_details: '', attended_by: '', action_taken: '', status: 'Open'
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#ef4444', borderColor: '#ef4444', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> Report Breakdown
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Incident ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loom ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Category & Status</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Downtime</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Details</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => {
                  const loomName = looms.find(l => l.id === record.loom_id)?.loom_name || 'Unknown';
                  return (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.breakdown_id}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{loomName}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        color: record.status === 'Open' ? '#b91c1c' : '#047857', 
                        backgroundColor: record.status === 'Open' ? '#ef444420' : '#10b98120', 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600
                      }}>
                        {record.reason_category} - {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}><span style={{ color: '#b91c1c', fontWeight: 700 }}>{record.total_downtime} hrs</span></td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>Action: {record.action_taken} | Attended: {record.attended_by}</td>
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
                )})}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
