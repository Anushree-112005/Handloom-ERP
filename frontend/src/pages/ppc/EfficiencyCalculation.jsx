import React, { useState, useEffect } from 'react';
import { BarChart2, Search, Save, ArrowLeft, Plus } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function EfficiencyCalculation() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [productions, setProductions] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [downtimes, setDowntimes] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    efficiency_id: '',
    date: new Date().toISOString().split('T')[0],
    loom_id: '',
    loom_name: '',
    order_id: '',
    shift: 'Day',
    operator_name: '',
    planned_meters: '',
    actual_meters: '',
    defect_meters: 0,
    good_meters: '',
    downtime_hrs: '',
    available_hours: 8,
    working_hours: '',
    speed_efficiency: '',
    quality_efficiency: '',
    overall_efficiency: '',
    oee: '',
    efficiency_status: '✅ Good',
    loss_meters: '',
    loss_reason: '',
    remarks: '',
    calculated_by: 'Login User',
    calculated_at: new Date().toLocaleString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, prodRes, allocRes, schedRes, dtRes] = await Promise.all([
        subMasterAPI.list('ppc_efficiency_calc').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_shift_production').catch(() => ({ data: [] })),
        ppcAPI.getAllocations().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_start_end_plan').catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_downtime_calc').catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setProductions(prodRes?.data || []);
      setAllocations(allocRes?.data || []);
      setSchedules(schedRes?.data || []);
      setDowntimes(dtRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalc = (name, value, currentData) => {
    const updated = { ...currentData, [name]: value };
    
    if (updated.loom_id) {
      const loomIdStr = updated.loom_id.toString();
      const loom = looms.find(l => l.id.toString() === loomIdStr || l.loom_name === loomIdStr);
      const lName = loom ? loom.loom_name : loomIdStr;
      const lIdNum = loom ? loom.id : parseInt(loomIdStr) || 0;
      updated.loom_name = lName;
      
      if (name === 'loom_id' || name === 'shift' || name === 'date') {
         // 1. Find Order ID from allocations or schedule
         const alloc = allocations.find(a => a.loom_id?.toString() === lIdNum.toString() && a.allocation_status !== 'Completed');
         if (alloc) {
            updated.order_id = alloc.order_id || alloc.order_no || '';
         } else {
            const sched = schedules.find(s => s.description && s.description.includes(lName));
            if (sched) updated.order_id = sched.code;
            else updated.order_id = '';
         }

         // 2. Find actual production
         const prod = productions.find(p => p.code?.toString() === loomIdStr && p.extra_field_1?.includes(updated.shift));
         if (prod) {
            const opMatch = prod.extra_field_1?.match(/Op:\s*(.+)/);
            updated.operator_name = opMatch ? opMatch[1] : '';

            const defectMatch = prod.description?.match(/Defects:\s*(\d+)m/);
            const defects = defectMatch ? parseFloat(defectMatch[1]) : 0;
            updated.defect_meters = defects;

            const goodMeters = parseFloat(prod.extra_field_2) || 0;
            updated.actual_meters = goodMeters + defects;
         } else {
            updated.operator_name = '';
            updated.actual_meters = '';
            updated.defect_meters = 0;
         }

         // 3. Planned meters based on loom capacity
         updated.planned_meters = loom ? Math.round(loom.capacity_per_day / (24 / parseFloat(updated.available_hours || 8))) : 400;

         // 4. Default downtime, can be adjusted manually
         updated.downtime_hrs = 0;
         updated.loss_reason = '';
      }
      
      const actual = parseFloat(updated.actual_meters) || 0;
      const planned = parseFloat(updated.planned_meters) || 1;
      const defect = parseFloat(updated.defect_meters) || 0;
      const good = Math.max(0, actual - defect);
      const down = parseFloat(updated.downtime_hrs) || 0;
      const avail = parseFloat(updated.available_hours) || 8;
      const work = Math.max(0, avail - down);

      const maxCap = loom ? loom.capacity_per_day / (24 / avail) : 500; // shift max capacity
      
      const availabilityPct = avail > 0 ? (work / avail) : 0;
      const speedPct = maxCap > 0 ? (actual / maxCap) : 0;
      const qualityPct = actual > 0 ? (good / actual) : 0;

      const oee = (availabilityPct * speedPct * qualityPct) * 100;
      const overall = (actual / planned) * 100;

      updated.good_meters = good;
      updated.working_hours = work.toFixed(1);
      updated.speed_efficiency = (speedPct * 100).toFixed(1);
      updated.quality_efficiency = (qualityPct * 100).toFixed(1);
      updated.overall_efficiency = overall.toFixed(1);
      updated.oee = oee.toFixed(1);
      updated.loss_meters = (planned - actual).toFixed(1);

      if (oee >= 85) updated.efficiency_status = '✅ Good';
      else if (oee >= 60) updated.efficiency_status = '⚠️ Average';
      else updated.efficiency_status = '❌ Poor';
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_efficiency_calc', {
        name: formData.efficiency_id,
        code: formData.loom_name,
        extra_field_1: `${formData.shift} Shift`,
        extra_field_2: `OEE: ${formData.oee}%`,
        description: `Overall: ${formData.overall_efficiency}% | Loss: ${formData.loss_meters}m`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating efficiency record.');
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
            <BarChart2 style={{ color: '#8b5cf6' }} /> Efficiency Calculation (OEE)
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Calculate Availability, Speed, Quality, and OEE metrics</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                ...formData,
                efficiency_id: `EF-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                calculated_at: new Date().toLocaleString()
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#8b5cf6', borderColor: '#8b5cf6' }}
          >
            <Plus size={16} /> Calculate OEE
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
              <div style={{ padding: 10, background: '#8b5cf618', borderRadius: 10, color: '#8b5cf6' }}>
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>OEE Diagnostics</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Automated Overall Equipment Effectiveness Calculation</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#8b5cf618', color: '#6d28d9', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.efficiency_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Context & Inputs</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" value={formData.date} onChange={e => handleRecalc('date', e.target.value, formData)} required />
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={e => handleRecalc('loom_id', e.target.value, formData)} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Shift</label>
                <select className="form-control" value={formData.shift} onChange={e => handleRecalc('shift', e.target.value, formData)} required>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Operator Name (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.operator_name} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Order ID (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.order_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Performance & Quality Logs</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Planned Meters</label>
                <input type="number" className="form-control" value={formData.planned_meters} onChange={e => handleRecalc('planned_meters', e.target.value, formData)} />
              </div>
              <div className="form-group">
                <label>Actual Meters</label>
                <input type="number" className="form-control" value={formData.actual_meters} onChange={e => handleRecalc('actual_meters', e.target.value, formData)} />
              </div>
              <div className="form-group">
                <label>Defect Meters</label>
                <input type="number" className="form-control" value={formData.defect_meters} onChange={e => handleRecalc('defect_meters', e.target.value, formData)} />
              </div>
              <div className="form-group">
                <label>Good Meters (Auto)</label>
                <input type="text" className="form-control" value={formData.good_meters} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Availability Logs</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Available Hours</label>
                <input type="number" className="form-control" value={formData.available_hours} onChange={e => handleRecalc('available_hours', e.target.value, formData)} />
              </div>
              <div className="form-group">
                <label>Downtime (hrs)</label>
                <input type="number" step="0.1" className="form-control" value={formData.downtime_hrs} onChange={e => handleRecalc('downtime_hrs', e.target.value, formData)} />
              </div>
              <div className="form-group">
                <label>Working Hours (Auto)</label>
                <input type="text" className="form-control" value={formData.working_hours} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. OEE Calculations</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Speed Eff %</label>
                <input type="text" className="form-control" value={formData.speed_efficiency ? `${formData.speed_efficiency}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Quality Eff %</label>
                <input type="text" className="form-control" value={formData.quality_efficiency ? `${formData.quality_efficiency}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Overall Eff %</label>
                <input type="text" className="form-control" value={formData.overall_efficiency ? `${formData.overall_efficiency}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>OEE %</label>
                <input type="text" className="form-control" value={formData.oee ? `${formData.oee}%` : ''} readOnly style={{ backgroundColor: '#8b5cf618', borderColor: '#8b5cf6', color: '#6d28d9', fontWeight: 800, fontSize: 16 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Status</label>
                <input type="text" className="form-control" value={formData.efficiency_status} readOnly style={{ backgroundColor: formData.efficiency_status.includes('Good') ? '#10b98118' : formData.efficiency_status.includes('Poor') ? '#ef444418' : '#f59e0b18', color: formData.efficiency_status.includes('Good') ? '#047857' : formData.efficiency_status.includes('Poor') ? '#b91c1c' : '#b45309', fontWeight: 800 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginTop: 16 }}>
              <div className="form-group">
                <label>Loss Meters</label>
                <input type="text" className="form-control" value={formData.loss_meters ? `${formData.loss_meters} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#ef4444' }} />
              </div>
              <div className="form-group">
                <label>Loss Reason</label>
                <input type="text" className="form-control" value={formData.loss_reason} onChange={e => setFormData({...formData, loss_reason: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <input type="text" className="form-control" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 16, color: 'var(--text-muted)', fontSize: 12 }}>
              <span>Calculated By: {formData.calculated_by}</span>
              <span>Calculated At: {formData.calculated_at}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Calculation
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>OEE Records ({filteredRecords.length})</h3>
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
                  <th>Efficiency ID</th>
                  <th>Loom ID</th>
                  <th>Shift</th>
                  <th>OEE %</th>
                  <th>Status Details</th>
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
                    <td>{record.extra_field_1}</td>
                    <td><span style={{ color: '#6d28d9', fontWeight: 800 }}>{record.extra_field_2}</span></td>
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
