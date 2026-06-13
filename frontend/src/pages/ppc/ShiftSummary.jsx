import React, { useState, useEffect } from 'react';
import { Layers, Search, Save, ArrowLeft, FileText, Plus } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function ShiftSummary() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [productions, setProductions] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    summary_id: '',
    date: new Date().toISOString().split('T')[0],
    shift: '',
    shift_start: '',
    shift_end: '',
    total_working_hours: '',
    break_hours: '',
    net_working_hours: '',
    total_running: 0,
    total_idle: 0,
    total_breakdown: 0,
    loom_wise: [],
    total_produced: 0,
    target_meters: 0,
    variance: 0,
    overall_efficiency: 0,
    total_defect: 0,
    total_good: 0,
    total_yarn: 0,
    total_downtime: 0,
    breakdown_count: 0,
    breakdown_looms: '',
    operator_count: 0,
    supervisor: 'Murugan S',
    handover_notes: '',
    submitted_by: 'Login User',
    submitted_at: new Date().toLocaleString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, shiftRes, prodRes] = await Promise.all([
        subMasterAPI.list('ppc_shift_summary').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_shift_master').catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_shift_production').catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setShifts(shiftRes?.data || []);
      setProductions(prodRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShiftChange = (name, value, currentData) => {
    const updated = { ...currentData, [name]: value };
    
    if (updated.shift) {
      const shiftObj = shifts.find(s => s.name === updated.shift);
      
      let start = '';
      let end = '';
      let breaks = 0.5;
      if (shiftObj) {
        start = shiftObj.extra_field_1;
        end = shiftObj.extra_field_2;
        breaks = (parseFloat(shiftObj.description) || 30) / 60;
      }
      
      const totalHrs = 8; // Simplified
      const netHrs = totalHrs - breaks;

      // Mock loom data aggregation
      const running = looms.filter(l => l.status === 'Running').length || 8;
      const idle = looms.filter(l => l.status === 'Idle').length || 1;
      const breakdown = looms.filter(l => l.status === 'Breakdown' || l.status === 'Maintenance').length || 1;
      
      // We will mock loom-wise production
      const loomWise = [
        { loom: 'LM-001', meters: 210 },
        { loom: 'LM-002', meters: 205 },
        { loom: 'LM-003', meters: 195 },
        { loom: 'LM-004', meters: 215 },
        { loom: 'LM-005', meters: 0 } // Breakdown
      ];

      const produced = 1680;
      const target = 1700;
      const variance = produced - target;
      const eff = (produced / target) * 100;
      
      const defect = 15;
      const good = produced - defect;
      const yarn = 145;
      const downtime = 1.5;
      
      updated.shift_start = start || '06:00 AM';
      updated.shift_end = end || '02:00 PM';
      updated.total_working_hours = totalHrs;
      updated.break_hours = breaks;
      updated.net_working_hours = netHrs;
      
      updated.total_running = running;
      updated.total_idle = idle;
      updated.total_breakdown = breakdown;
      
      updated.loom_wise = loomWise;
      updated.total_produced = produced;
      updated.target_meters = target;
      updated.variance = variance;
      updated.overall_efficiency = eff;
      
      updated.total_defect = defect;
      updated.total_good = good;
      updated.total_yarn = yarn;
      updated.total_downtime = downtime;
      updated.breakdown_count = breakdown;
      updated.breakdown_looms = 'LM-005';
      updated.operator_count = 10;
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_shift_summary', {
        name: formData.summary_id,
        code: formData.shift,
        extra_field_1: `${formData.overall_efficiency.toFixed(1)}% Eff`,
        extra_field_2: `${formData.total_produced} m`,
        description: `Variance: ${formData.variance}m | Supervisor: ${formData.supervisor}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving summary.');
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
            <Layers style={{ color: '#06b6d4' }} /> Shift Summary
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Comprehensive end-of-shift handover and aggregation report</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                ...formData,
                summary_id: `SS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                submitted_at: new Date().toLocaleString()
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#06b6d4', borderColor: '#06b6d4' }}
          >
            <Plus size={16} /> Generate Summary
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
              <div style={{ padding: 10, background: '#06b6d418', borderRadius: 10, color: '#06b6d4' }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>End of Shift Handover</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Automated aggregation of all shift activities</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#06b6d418', color: '#0891b2', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.summary_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Shift Logistics</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" value={formData.date} onChange={e => handleShiftChange('date', e.target.value, formData)} required />
              </div>
              <div className="form-group">
                <label>Shift</label>
                <select className="form-control" value={formData.shift} onChange={e => handleShiftChange('shift', e.target.value, formData)} required>
                  <option value="">-- Select Shift --</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div className="form-group">
                <label>Supervisor Name</label>
                <select className="form-control" value={formData.supervisor} onChange={e => handleShiftChange('supervisor', e.target.value, formData)}>
                  <option value="Murugan S">Murugan S</option>
                  <option value="Senthil K">Senthil K</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Start Time</label>
                <input type="text" className="form-control" value={formData.shift_start} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>End Time</label>
                <input type="text" className="form-control" value={formData.shift_end} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Total Hours</label>
                <input type="text" className="form-control" value={formData.total_working_hours ? `${formData.total_working_hours} hrs` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Break Hours</label>
                <input type="text" className="form-control" value={formData.break_hours ? `${formData.break_hours} hrs` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Net Work Hrs</label>
                <input type="text" className="form-control" value={formData.net_working_hours ? `${formData.net_working_hours} hrs` : ''} readOnly style={{ backgroundColor: '#06b6d418', color: '#0891b2', fontWeight: 600 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Machine Utilization</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Looms Running</label>
                <input type="text" className="form-control" value={formData.total_running} readOnly style={{ backgroundColor: '#10b98118', color: '#047857', fontWeight: 600, fontSize: 18 }} />
              </div>
              <div className="form-group">
                <label>Looms Idle</label>
                <input type="text" className="form-control" value={formData.total_idle} readOnly style={{ backgroundColor: '#f59e0b18', color: '#b45309', fontWeight: 600, fontSize: 18 }} />
              </div>
              <div className="form-group">
                <label>Looms Breakdown</label>
                <input type="text" className="form-control" value={formData.total_breakdown} readOnly style={{ backgroundColor: '#ef444418', color: '#b91c1c', fontWeight: 600, fontSize: 18 }} />
              </div>
              <div className="form-group">
                <label>Breakdown Details</label>
                <input type="text" className="form-control" value={formData.breakdown_looms} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#ef4444' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Production Totals</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Target (Shift)</label>
                <input type="text" className="form-control" value={formData.target_meters ? `${formData.target_meters} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Total Produced</label>
                <input type="text" className="form-control" value={formData.total_produced ? `${formData.total_produced} m` : ''} readOnly style={{ backgroundColor: '#06b6d418', color: '#0891b2', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Variance</label>
                <input type="text" className="form-control" value={formData.variance ? `${formData.variance > 0 ? '+' : ''}${formData.variance} m` : ''} readOnly style={{ backgroundColor: formData.variance < 0 ? '#ef444418' : '#10b98118', color: formData.variance < 0 ? '#b91c1c' : '#047857', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Shift Efficiency</label>
                <input type="text" className="form-control" value={formData.overall_efficiency ? `${formData.overall_efficiency.toFixed(1)}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Operator Count</label>
                <input type="text" className="form-control" value={formData.operator_count} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Good Meters</label>
                <input type="text" className="form-control" value={formData.total_good ? `${formData.total_good} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#047857' }} />
              </div>
              <div className="form-group">
                <label>Defect Meters</label>
                <input type="text" className="form-control" value={formData.total_defect ? `${formData.total_defect} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c' }} />
              </div>
              <div className="form-group">
                <label>Yarn Consumed</label>
                <input type="text" className="form-control" value={formData.total_yarn ? `${formData.total_yarn} kg` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Total Downtime</label>
                <input type="text" className="form-control" value={formData.total_downtime ? `${formData.total_downtime} hrs` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. Loom-wise Production</h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              {formData.loom_wise.map((lw, idx) => (
                <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600 }}>{lw.loom}</span>
                  <span style={{ color: lw.meters > 0 ? '#0891b2' : '#ef4444', fontWeight: 700 }}>{lw.meters}m</span>
                </div>
              ))}
              {formData.loom_wise.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Select a shift to generate loom-wise data</span>}
            </div>

            <div className="form-group">
              <label>Shift Handover Notes</label>
              <input type="text" className="form-control" value={formData.handover_notes} onChange={e => setFormData({...formData, handover_notes: e.target.value})} placeholder="e.g. LM-005 reed replaced, running now" />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 16, color: 'var(--text-muted)', fontSize: 12 }}>
              <span>Submitted By: {formData.submitted_by}</span>
              <span>Submitted At: {formData.submitted_at}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#06b6d4', borderColor: '#06b6d4' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Shift Summary
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Shift Summaries ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search summaries..."
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
                  <th>Summary ID</th>
                  <th>Shift</th>
                  <th>Efficiency</th>
                  <th>Production</th>
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
                    <td><span style={{ color: '#0891b2', fontWeight: 800 }}>{record.extra_field_1}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{record.extra_field_2}</span></td>
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
