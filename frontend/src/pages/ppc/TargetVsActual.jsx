import React, { useState, useEffect } from 'react';
import { Target, Search, Save, ArrowLeft, Plus, Trash2, Edit2, Eye, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function TargetVsActual() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [reports, setReports] = useState([]);
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
      const [recRes, loomRes, rptRes] = await Promise.all([
        subMasterAPI.list('ppc_target_actual').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_daily_report').catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setReports(rptRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoomDateChange = (name, value) => {
    const updated = { ...formData, [name]: value };
    
    if (updated.loom_id && updated.date) {
      const loom = looms.find(l => l.id.toString() === updated.loom_id);
      const lName = loom ? loom.loom_name : updated.loom_id;
      
      const rpt = reports.find(r => r.code === updated.loom_id || r.code === lName);
      
      let planned = loom ? loom.capacity_per_day * (loom.efficiency_pct / 100) : 425;
      let actual = 0;

      if (rpt && rpt.extra_field_2) {
         // "415.0 m / 425.0 m"
         const parts = rpt.extra_field_2.split('/');
         if (parts[0]) actual = parseFloat(parts[0].replace(' m', '')) || 0;
         if (parts[1]) planned = parseFloat(parts[1].replace(' m', '')) || planned;
      } else {
         // Fallback mock
         actual = 415;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loom = looms.find(l => l.id.toString() === formData.loom_id);
      const lName = loom ? loom.loom_name : formData.loom_id;

      await subMasterAPI.create('ppc_target_actual', {
        name: `${formData.date}-${lName}`,
        code: lName,
        extra_field_1: `${formData.actual_meters.toFixed(1)} / ${formData.planned_meters.toFixed(1)} m`,
        extra_field_2: formData.status,
        description: `Shortfall: ${formData.shortfall.toFixed(1)} m | Eff: ${formData.efficiency.toFixed(1)}%`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving record.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this evaluation?')) return;
    try {
      await subMasterAPI.delete('ppc_target_actual', id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  // Remove duplicates based on name (Date + Loom ID), keeping the latest entry
  const uniqueRecords = Array.from(
    records.reduce((map, record) => map.set(record.name, record), new Map()).values()
  );

  const filteredRecords = uniqueRecords.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Evaluations</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{uniqueRecords.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12, display: 'flex' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>On Track</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{uniqueRecords.filter(r => r.extra_field_2 === 'On Track').length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Delayed</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{uniqueRecords.filter(r => r.extra_field_2 === 'Delayed').length}</div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
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
                <input type="text" className="form-control" value={`${formData.shortfall.toFixed(1)} m`} readOnly style={{ backgroundColor: formData.shortfall > 0 ? '#ef444418' : '#10b98118', color: formData.shortfall > 0 ? '#b91c1c' : '#047857', fontWeight: 700 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Efficiency % (Auto-calc)</label>
                <input type="text" className="form-control" value={`${formData.efficiency.toFixed(1)}%`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Status (Auto-flag)</label>
                <input type="text" className="form-control" value={formData.status} readOnly style={{ backgroundColor: formData.status === 'Delayed' ? '#ef444418' : '#10b98118', borderColor: formData.status === 'Delayed' ? '#ef4444' : '#10b981', color: formData.status === 'Delayed' ? '#b91c1c' : '#047857', fontWeight: 800 }} />
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
      ) : (
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
                  const isDelayed = record.extra_field_2 === 'Delayed';
                  return (
                    <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>{record.code}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{record.extra_field_1}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          color: isDelayed ? '#b91c1c' : '#047857', 
                          fontWeight: 600, 
                          backgroundColor: isDelayed ? '#ef444420' : '#10b98120', 
                          padding: '4px 10px', 
                          borderRadius: 12, 
                          fontSize: 12 
                        }}>
                          {record.extra_field_2}
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
      )}
    </div>
  );
}
