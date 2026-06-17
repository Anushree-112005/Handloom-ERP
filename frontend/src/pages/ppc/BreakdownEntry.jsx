import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Save, ArrowLeft, Plus } from 'lucide-react';
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
        subMasterAPI.list('ppc_breakdown_entry').catch(() => ({ data: [] })),
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
      const loom = looms.find(l => l.id.toString() === formData.loom_id);
      const lName = loom ? loom.loom_name : formData.loom_id;

      await subMasterAPI.create('ppc_breakdown_entry', {
        name: formData.breakdown_id,
        code: lName,
        extra_field_1: `${formData.reason_category} - ${formData.status}`,
        extra_field_2: `${formData.total_downtime} hrs`,
        description: `Action: ${formData.action_taken} | Attended: ${formData.attended_by}`,
        is_active: true
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

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ color: '#ef4444' }} /> Breakdown Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Log machine failures and calculate precise downtime</p>
        </div>
        {!isFormOpen ? (
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
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#ef4444', borderColor: '#ef4444' }}
          >
            <Plus size={16} /> Report Breakdown
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
                <input type="text" className="form-control" value={formData.total_downtime ? `${formData.total_downtime} hrs` : ''} readOnly style={{ backgroundColor: '#ef444418', color: '#b91c1c', fontWeight: 700 }} />
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
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Incident Logs ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
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
                  <th>Incident ID</th>
                  <th>Loom ID</th>
                  <th>Category & Status</th>
                  <th>Downtime</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td>{record.code}</td>
                    <td>
                      <span style={{ 
                        color: record.extra_field_1?.includes('Open') ? '#b91c1c' : '#047857', 
                        backgroundColor: record.extra_field_1?.includes('Open') ? '#ef444420' : '#10b98120', 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600
                      }}>
                        {record.extra_field_1}
                      </span>
                    </td>
                    <td><span style={{ color: '#b91c1c', fontWeight: 700 }}>{record.extra_field_2}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
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
