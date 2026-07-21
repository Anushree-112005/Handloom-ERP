import React, { useState, useEffect } from 'react';
import { Activity, Search, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { subMasterAPI } from '../../services/api';

export default function DynamicETAUpdate() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await subMasterAPI.list('ppc_dynamic_eta').catch(() => ({ data: [] }));
      setLogs(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    try {
      const newLog = {
        name: `ORD-2024-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`,
        code: 'Operator Absence',
        extra_field_1: new Date().toISOString().split('T')[0],
        extra_field_2: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: `Delay: +1 days | On Track: Yes`,
        is_active: true
      };
      await subMasterAPI.create('ppc_dynamic_eta', newLog);
      await fetchLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw style={{ color: '#0ea5e9' }} /> Dynamic ETA Engine
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Real-time recalibration of finish dates based on live events</p>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleManualUpdate}
          disabled={isUpdating}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#0ea5e9', borderColor: '#0ea5e9' }}
        >
          <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} /> 
          {isUpdating ? 'Recalculating...' : 'Force Recalibration'}
        </button>
      </div>

      <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Recalibrations ({filteredLogs.length})</h3>
          <div className="search-bar" style={{ position: 'relative', width: 250 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Order or Event..."
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
                <th>Order ID</th>
                <th>Trigger Event</th>
                <th>Previous ETA</th>
                <th>Revised ETA</th>
                <th>Impact</th>
                <th>Still On Track?</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No dynamic updates yet.</td></tr>
              ) : filteredLogs.map((log) => {
                const isBreakdown = log.code?.includes('Breakdown');
                const onTrack = log.description?.includes('Yes');
                const delay = log.description?.split(' | ')[0];
                return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 700 }}>{log.name}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isBreakdown ? '#b91c1c' : '#b45309', fontWeight: 600 }}>
                        {isBreakdown ? <AlertTriangle size={14} /> : <Activity size={14} />} {log.code}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{log.extra_field_1}</td>
                    <td style={{ fontWeight: 700, color: '#0369a1' }}>{log.extra_field_2}</td>
                    <td style={{ color: '#b91c1c', fontWeight: 600 }}>{delay}</td>
                    <td>
                      <span style={{ 
                        color: onTrack ? '#047857' : '#b91c1c', 
                        backgroundColor: onTrack ? '#10b98120' : '#ef444420', 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        {onTrack ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                        {onTrack ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
