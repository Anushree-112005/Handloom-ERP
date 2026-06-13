import React, { useState } from 'react';
import { Wrench, AlertCircle, Clock, Search, Save } from 'lucide-react';

export default function DowntimeTracking() {
  const [downtimes, setDowntimes] = useState([
    { loom: 'Loom L1', reason: 'Yarn Breakage', duration: '45 mins', date: 'Today, 10:30 AM', loggedBy: 'Operator 12' },
    { loom: 'Loom L3', reason: 'Warp Changeover', duration: '4 hours', date: 'Yesterday', loggedBy: 'Supervisor A' },
    { loom: 'Loom L5', reason: 'Mechanical Fault', duration: '2 hours', date: 'Yesterday', loggedBy: 'Maintenance Team' },
  ]);

  const [formData, setFormData] = useState({
    loom: '', reason: '', duration: '', loggedBy: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setDowntimes([{ 
      loom: formData.loom, reason: formData.reason, 
      duration: formData.duration + ' mins', 
      loggedBy: formData.loggedBy, 
      date: 'Just Now' 
    }, ...downtimes]);
    setFormData({ loom: '', reason: '', duration: '', loggedBy: '' });
  };

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
              <input type="text" placeholder="Search logs..." className="form-control" style={{ paddingLeft: 36, width: 200 }} />
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
                {downtimes.map((log, i) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 600 }}>{log.loom}</span></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ef4444', fontWeight: 500 }}>
                        <AlertCircle size={14} /> {log.reason}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                        <Clock size={14} /> {log.duration}
                      </span>
                    </td>
                    <td>{log.date}</td>
                    <td>{log.loggedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
          <h4 style={{ color: '#ef4444', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '0 0 16px 0' }}>Log Immediate Stoppage</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Loom ID *</label>
              <input 
                type="text" className="form-control" 
                value={formData.loom} onChange={e => setFormData({...formData, loom: e.target.value})}
                required placeholder="e.g. Loom L1"
              />
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
                value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}
                required placeholder="e.g. 45"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Logged By *</label>
              <input 
                type="text" className="form-control" 
                value={formData.loggedBy} onChange={e => setFormData({...formData, loggedBy: e.target.value})}
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
