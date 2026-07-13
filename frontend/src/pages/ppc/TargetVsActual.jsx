import React, { useState, useEffect } from 'react';
import { Target, Search, Save, ArrowLeft, Plus, Trash2, Edit2, Eye, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function TargetVsActual() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    loom_id: '',
    planned_meters: 0,
    actual_meters: 0,
    shortfall: 0,
    efficiency: 0,
    status: 'On Track'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, allocRes, logsRes] = await Promise.all([
        subMasterAPI.list('ppc_target_actual').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        ppcAPI.getAllocations().catch(() => ({ data: [] })),
        ppcAPI.getDailyEntries().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setAllocations(allocRes?.data || []);
      setLogs(logsRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoomDateChange = (name, value) => {
    const updated = { ...formData, [name]: value };
    
    if (updated.loom_id) {
      const loom = looms.find(l => l.id.toString() === updated.loom_id);
      const alloc = allocations.find(a => a.loom_id.toString() === updated.loom_id && a.allocation_status !== 'Completed');
      
      let planned = loom ? loom.capacity_per_day * (loom.efficiency_pct / 100) : 425;
      let actual = 0;

      if (updated.date) {
         // Filter logs for this loom and date
         const dayLogs = logs.filter(l => 
             (l.loom_id === parseInt(updated.loom_id) || l.loom_name === updated.loom_id) && 
             l.timestamp.startsWith(updated.date)
         );
         actual = dayLogs.reduce((acc, curr) => acc + (curr.meters_produced || 0), 0);
      }

      const shortfall = planned - actual;
      const eff = planned > 0 ? (actual / planned) * 100 : 0;
      const status = shortfall > 0 ? 'Delayed' : 'On Track';

      updated.planned_meters = planned;
      updated.actual_meters = actual;
      updated.shortfall = shortfall;
      updated.efficiency = eff;
      updated.status = status;
    }

    setFormData(updated);
  };

  const activeAllocs = allocations.filter(a => a.allocation_status === 'Active');

  const computedRecords = activeAllocs.map(alloc => {
    const loom = looms.find(l => l.id === alloc.loom_id);
    const allocLogs = logs.filter(l => l.allocation_id === alloc.id);
    const actual = allocLogs.reduce((acc, curr) => acc + (curr.meters_produced || 0), 0);
    const planned = alloc.assigned_meters || 1;
    const efficiency = (actual / planned) * 100;
    const shortfall = planned - actual;
    
    // Simulate expected progress based on start_time and loom capacity
    const daysElapsed = Math.max(1, Math.floor((Date.now() - new Date(alloc.start_time).getTime()) / (1000 * 60 * 60 * 24)));
    const expected = loom ? Math.min(planned, loom.capacity_per_day * (loom.efficiency_pct / 100) * daysElapsed) : actual;
    
    let status = 'On Track';
    if (actual < expected * 0.9) status = 'Delayed';
    else if (actual >= planned) status = 'Completed';

    return {
      id: alloc.id,
      name: `ALLOC-${alloc.id} (${alloc.order_id})`,
      code: loom ? loom.loom_name : `Loom ${alloc.loom_id}`,
      extra_field_1: `${actual.toFixed(1)} / ${planned.toFixed(1)} m`,
      extra_field_2: status,
      description: `Shortfall: ${Math.max(0, shortfall).toFixed(1)} m | Eff: ${efficiency.toFixed(1)}%`,
    };
  });

  const filteredRecords = computedRecords.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isFormOpen) {
    return (
      <div className="animate-fade" style={{ height: '100%' }}>
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#ec489918', borderRadius: 10, color: '#ec4899' }}>
                <Target size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Performance Evaluation</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Identify shortfalls and delivery risks</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" value={formData.date} onChange={e => handleLoomDateChange('date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={(e) => handleLoomDateChange('loom_id', e.target.value)} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Planned Meters (Auto)</label>
                <input type="text" className="form-control" value={`${formData.planned_meters.toFixed(1)} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Actual Meters (Auto)</label>
                <input type="text" className="form-control" value={`${formData.actual_meters.toFixed(1)} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Shortfall (Auto-calc)</label>
                <input type="text" className="form-control" value={`${formData.shortfall.toFixed(1)} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Efficiency % (Auto-calc)</label>
                <input type="text" className="form-control" value={`${formData.efficiency.toFixed(1)}%`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Status (Auto-flag)</label>
                <input type="text" className="form-control" value={formData.status} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ec4899', borderColor: '#ec4899' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Evaluation
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
            <Target style={{ color: '#ec4899' }} /> Target vs Actual
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Compare planned metrics against real outputs</p>
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
            <div style={{ background: '#fce7f3', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Target size={24} style={{ color: '#ec4899' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Active Allocations</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{computedRecords.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12, display: 'flex' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>On Track</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{computedRecords.filter(r => r.extra_field_2 === 'On Track').length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Delayed</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{computedRecords.filter(r => r.extra_field_2 === 'Delayed').length}</div>
            </div>
          </div>
        </div>
      )}


        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Performance Evaluations ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    loom_id: '', planned_meters: 0, actual_meters: 0, shortfall: 0, efficiency: 0, status: 'On Track'
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#ec4899', borderColor: '#ec4899', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> Evaluate Performance
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Record ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loom ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Actual / Target</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Details</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => {
                  const status = record.extra_field_2;
                  let color = '#047857';
                  let bg = '#10b98120';
                  if (status === 'Delayed' || status === 'Critical') {
                    color = '#b91c1c';
                    bg = '#ef444420';
                  } else if (status === 'Warning') {
                    color = '#c2410c';
                    bg = '#f9731620';
                  }
                  return (
                    <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>{record.code}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{record.extra_field_1}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          color: color, 
                          fontWeight: 600, 
                          backgroundColor: bg, 
                          padding: '4px 10px', 
                          borderRadius: 12, 
                          fontSize: 12 
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button style={{ padding: '4px 6px', border: '1px solid #fee2e2', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleDelete(record.id)} title="Delete">
                            <Trash2 size={16} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
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
