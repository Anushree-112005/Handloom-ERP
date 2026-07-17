import React, { useState, useEffect } from 'react';
import { Wrench, AlertCircle, Clock, Search, Save } from 'lucide-react';
import { ppcAPI } from '../../services/api';

export default function DowntimeTracking() {
  const [downtimes, setDowntimes] = useState([]);
  const [looms, setLooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    loom_id: '', reason: '', duration_minutes: '', logged_by: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [breakRes, loomRes] = await Promise.all([
        ppcAPI.getBreakdowns().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setDowntimes(breakRes?.data || []);
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
      await ppcAPI.logBreakdown({
        loom_id: parseInt(formData.loom_id),
        breakdown_id: `BD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        start_time: new Date().toLocaleTimeString(),
        reason_category: formData.reason,
        total_downtime: parseFloat(formData.duration_minutes),
        reported_by: formData.logged_by
      });
      setFormData({ loom_id: '', reason: '', duration_minutes: '', logged_by: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to log downtime.');
    }
  };

  const filteredDowntimes = downtimes.filter(log => {
    const term = searchTerm.toLowerCase();
    const lName = looms.find(l => l.id === log.loom_id)?.loom_name || '';
    return lName.toLowerCase().includes(term) || log.reason_category?.toLowerCase().includes(term);
  });

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench style={{ color: 'var(--primary)' }} /> Downtime & Stoppage Tracking
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Monitor machine idle hours and maintenance logs.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Stoppage Log</h3>
            <div className="search-bar" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search logs..." className="form-control" style={{ paddingLeft: 36, width: 200 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Loom</th>
                  <th>Reason</th>
                  <th>Duration</th>
                  <th>Time Logged</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                ) : filteredDowntimes.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>No records found.</td></tr>
                ) : filteredDowntimes.map((log, i) => {
                  const lName = looms.find(l => l.id === log.loom_id)?.loom_name || `Loom ${log.loom_id}`;
                  return (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 600 }}>{lName}</span></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', fontWeight: 500 }}>
                        <AlertCircle size={14} /> {log.reason_category}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                        <Clock size={14} /> {log.total_downtime} mins
                      </span>
                    </td>
                    <td>{new Date(log.date).toLocaleString()}</td>
                    <td>{log.reported_by || 'Unknown'}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
          <h4 style={{ color: '#ef4444', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 16px 0' }}>Log Immediate Stoppage</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Loom ID *</label>
              <select 
                className="form-control" 
                value={formData.loom_id} onChange={e => setFormData({...formData, loom_id: e.target.value})}
                required
              >
                <option value="">-- Select Loom --</option>
                {looms.map(l => (
                  <option key={l.id} value={l.id}>{l.loom_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Reason *</label>
              <select 
                className="form-control" 
                value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}
                required
              >
                <option value="">-- Select Reason --</option>
                <option value="Yarn Breakage">Yarn Breakage</option>
                <option value="Warp Changeover">Warp Changeover</option>
                <option value="Mechanical Fault">Mechanical Fault</option>
                <option value="Electrical Fault">Electrical Fault</option>
                <option value="No Operator">No Operator</option>
              </select>
            </div>
            <div className="form-group">
              <label>Duration (Minutes) *</label>
              <input 
                type="number" className="form-control" 
                value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})}
                required placeholder="e.g. 45"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Logged By *</label>
              <input 
                type="text" className="form-control" 
                value={formData.logged_by} onChange={e => setFormData({...formData, logged_by: e.target.value})}
                required placeholder="Operator/Supervisor Name"
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
              <AlertCircle size={16} style={{ marginRight: 8 }} /> Record Stoppage
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
