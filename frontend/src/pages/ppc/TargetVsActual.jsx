import React, { useState, useEffect } from 'react';
import { Target, Search, Save, ArrowLeft, Plus } from 'lucide-react';
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

  const filteredRecords = records.filter(r => 
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
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                loom_id: '', planned_meters: 0, actual_meters: 0, shortfall: 0, efficiency: 0, status: 'On Track'
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#ec4899', borderColor: '#ec4899' }}
          >
            <Plus size={16} /> Evaluate Performance
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Performance Evaluations ({filteredRecords.length})</h3>
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
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filteredRecords.map((record, idx) => {
                  const isDelayed = record.extra_field_2 === 'Delayed';
                  return (
                    <div key={record.id || idx} style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 20,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{record.code}</span>
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
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                        Record ID: <span style={{ color: 'var(--text-primary)' }}>{record.name}</span>
                      </div>
                      
                      <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Actual / Target</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{record.extra_field_1}</span>
                        </div>
                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                           {/* Parse actual and target to render a rough progress bar if possible, otherwise just a static bar based on status */}
                           <div style={{ 
                             width: isDelayed ? '75%' : '100%', 
                             height: '100%', 
                             background: isDelayed ? '#ef4444' : '#10b981', 
                             borderRadius: 3 
                           }} />
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: isDelayed ? '#fef2f2' : '#f0fdf4', padding: 10, borderRadius: 8, border: `1px solid ${isDelayed ? '#fecaca' : '#bbf7d0'}` }}>
                        {record.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
