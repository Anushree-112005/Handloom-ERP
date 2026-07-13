import React, { useState, useEffect } from 'react';
import { Clock, Search, Save, ArrowLeft, BarChart2, AlertTriangle, FileText, Plus, Activity, CheckCircle, Trash2, Edit2, Eye, DollarSign } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../services/api';

export default function DowntimeCalc() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    calc_id: '',
    date: new Date().toISOString().split('T')[0],
    loom_id: '',
    loom_name: '',
    order_id: '',
    shift: 'Both',
    operator_name: 'Ramesh Kumar',
    
    // Downtime Detail
    breakdown_id: '',
    breakdown_start: '',
    breakdown_end: '',
    breakdown_duration: 0,
    breakdown_category: '',
    breakdown_details: '',
    num_breakdowns: 0,
    total_breakdown_time: 0,
    idle_time: 0,
    planned_maint_time: 0,
    total_downtime: 0,

    // Time Analysis
    total_shift_hours: 16,
    planned_working_hours: 15.5,
    actual_downtime: 0,
    actual_running_hours: 0,
    downtime_pct: 0,
    availability_pct: 0,
    downtime_status: 'Normal',

    // Loss Calc
    loom_speed: 25,
    lost_meters: 0,
    fabric_rate: 45,
    loss_value: 0,
    impact_delivery: 0,
    cumulative_lost: 210,
    cumulative_value: 9450,

    // Breakup
    mech_downtime: 0,
    elec_downtime: 0,
    yarn_downtime: 0,
    power_downtime: 0,
    abs_downtime: 0,
    other_downtime: 0,
    highest_reason: '',

    // Footer
    week_total: 14.5,
    month_total: 48,
    avg_daily: 1.6,
    best_day: '10-Jun-2026 — 0.5 hrs',
    worst_day: '08-Jun-2026 — 4.0 hrs',
    trend: 'Decreasing',
    calculated_by: 'Login User',
    calculated_at: new Date().toLocaleString()
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, bdRes] = await Promise.all([
        subMasterAPI.list('ppc_downtime_calc').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_breakdown_entry').catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setBreakdowns(bdRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAll = (updated) => {
    const totalDowntime = (parseFloat(updated.total_breakdown_time) || 0) + (parseFloat(updated.idle_time) || 0) + (parseFloat(updated.planned_maint_time) || 0);
    updated.total_downtime = totalDowntime;
    updated.actual_downtime = totalDowntime;

    const actualRunning = updated.planned_working_hours - totalDowntime;
    updated.actual_running_hours = actualRunning < 0 ? 0 : actualRunning;

    updated.downtime_pct = (totalDowntime / updated.planned_working_hours) * 100 || 0;
    updated.availability_pct = (updated.actual_running_hours / updated.planned_working_hours) * 100 || 0;

    if (updated.downtime_pct > 25) updated.downtime_status = 'Critical';
    else if (updated.downtime_pct > 15) updated.downtime_status = 'High';
    else updated.downtime_status = 'Normal';

    updated.lost_meters = updated.loom_speed * totalDowntime;
    updated.loss_value = updated.lost_meters * updated.fabric_rate;
    updated.impact_delivery = totalDowntime / 24;

    const breakups = [
      { name: 'Mechanical', val: parseFloat(updated.mech_downtime) || 0 },
      { name: 'Electrical', val: parseFloat(updated.elec_downtime) || 0 },
      { name: 'Yarn', val: parseFloat(updated.yarn_downtime) || 0 },
      { name: 'Power', val: parseFloat(updated.power_downtime) || 0 },
      { name: 'Operator Absence', val: parseFloat(updated.abs_downtime) || 0 },
      { name: 'Other', val: parseFloat(updated.other_downtime) || 0 }
    ];
    const maxVal = Math.max(...breakups.map(b => b.val));
    const maxReason = breakups.find(b => b.val === maxVal);
    updated.highest_reason = maxVal > 0 ? `${maxReason.name} — ${maxVal} hrs` : 'None';

    return updated;
  };

  const handleLoomChange = (e) => {
    const lId = e.target.value;
    const loom = looms.find(l => l.id.toString() === lId);
    
    let updated = { ...formData, loom_id: lId, loom_name: loom ? loom.loom_name : '', order_id: loom ? 'ORD-2024-001' : '' };
    
    // Auto-pull breakdown data if any
    if (loom) {
      const loomBreakdowns = breakdowns.filter(b => b.code === loom.loom_name);
      if (loomBreakdowns.length > 0) {
        const bd = loomBreakdowns[0];
        const bdDur = parseFloat(bd.extra_field_2?.replace(' hrs', '') || 0);
        
        updated.breakdown_id = bd.name || '';
        updated.breakdown_duration = bdDur;
        updated.breakdown_category = bd.extra_field_1?.split(' - ')[0] || 'Mechanical';
        updated.num_breakdowns = loomBreakdowns.length;
        
        const totalBdTime = loomBreakdowns.reduce((sum, b) => sum + parseFloat(b.extra_field_2?.replace(' hrs', '') || 0), 0);
        updated.total_breakdown_time = totalBdTime;
        
        // Populate breakup dynamically
        updated.mech_downtime = updated.breakdown_category === 'Mechanical' ? totalBdTime : 0;
        updated.elec_downtime = updated.breakdown_category === 'Electrical' ? totalBdTime : 0;
        updated.yarn_downtime = updated.breakdown_category === 'Yarn' ? totalBdTime : 0;
        updated.power_downtime = updated.breakdown_category === 'Power' ? totalBdTime : 0;
      }
    }

    updated = calculateAll(updated);
    setFormData(updated);
  };

  const handleManualEntryChange = (e) => {
    let updated = { ...formData, [e.target.name]: e.target.value };
    updated = calculateAll(updated);
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_downtime_calc', {
        name: formData.calc_id,
        code: formData.loom_name,
        extra_field_1: `${formData.downtime_pct.toFixed(1)}% DT`,
        extra_field_2: `₹${formData.loss_value.toFixed(0)}`,
        description: `Loss: ${formData.lost_meters.toFixed(1)}m | Status: ${formData.downtime_status}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving downtime calculation.');
    }
  };

  const handleEdit = (record) => {
    // Mock parsing for edit
    setFormData({
      id: record.id,
      calc_id: record.name,
      loom_name: record.code,
      loom_id: looms.find(l => l.loom_name === record.code)?.id?.toString() || '',
      date: new Date().toISOString().split('T')[0],
      order_id: 'ORD-2024-001',
      shift: 'Both',
      operator_name: 'Ramesh Kumar',
      breakdown_id: '',
      breakdown_start: '',
      breakdown_end: '',
      breakdown_duration: 0,
      breakdown_category: '',
      breakdown_details: '',
      num_breakdowns: 0,
      total_breakdown_time: 0,
      idle_time: 0,
      planned_maint_time: 0,
      total_downtime: 0,
      total_shift_hours: 16,
      planned_working_hours: 15.5,
      actual_downtime: 0,
      actual_running_hours: 0,
      downtime_pct: parseFloat(record.extra_field_1) || 0,
      availability_pct: 0,
      downtime_status: record.description?.match(/Status: (.*)/)?.[1] || 'Normal',
      loom_speed: 25,
      lost_meters: parseFloat(record.description?.match(/Loss: (.*?)m/)?.[1] || 0),
      fabric_rate: 45,
      loss_value: parseFloat(record.extra_field_2?.replace('₹', '')) || 0,
      impact_delivery: 0,
      cumulative_lost: 210,
      cumulative_value: 9450,
      mech_downtime: 0,
      elec_downtime: 0,
      yarn_downtime: 0,
      power_downtime: 0,
      abs_downtime: 0,
      other_downtime: 0,
      highest_reason: '',
      calculated_by: 'Login User',
      calculated_at: new Date().toLocaleString()
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculation?')) return;
    try {
      await subMasterAPI.delete('ppc_downtime_calc', id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = records.filter(r => 
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
                <BarChart2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Downtime Diagnostic Form</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Automated aggregation of all machine delays</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#ec489918', color: '#be185d', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.calc_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24, overflowX: 'hidden' }}>
            
            {/* Header / Filter */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Select Machine & Shift</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" name="date" value={formData.date} onChange={handleManualEntryChange} required />
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" name="loom_id" value={formData.loom_id} onChange={handleLoomChange} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Order ID (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.order_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Shift</label>
                <select className="form-control" name="shift" value={formData.shift} onChange={handleManualEntryChange}>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                  <option value="Both">Both (Full Day)</option>
                </select>
              </div>
            </div>

            {/* Downtime Detail */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Downtime Component Editor</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Total Breakdown Time (hrs)</label>
                <input type="number" step="0.1" className="form-control" name="total_breakdown_time" value={formData.total_breakdown_time} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group">
                <label>Idle Time (hrs)</label>
                <input type="number" step="0.1" className="form-control" name="idle_time" value={formData.idle_time} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group">
                <label>Planned Maintenance (hrs)</label>
                <input type="number" step="0.1" className="form-control" name="planned_maint_time" value={formData.planned_maint_time} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group">
                <label>Total Downtime (hrs)</label>
                <input type="text" className="form-control" value={formData.total_downtime ? `${formData.total_downtime.toFixed(2)} hrs` : '0 hrs'} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            {/* Time Analysis */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Time Analysis</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Planned Working Hrs</label>
                <input type="text" className="form-control" value={`${formData.planned_working_hours} hrs`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Actual Running Hrs</label>
                <input type="text" className="form-control" value={`${formData.actual_running_hours.toFixed(2)} hrs`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Availability %</label>
                <input type="text" className="form-control" value={`${formData.availability_pct.toFixed(2)}%`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Downtime %</label>
                <input type="text" className="form-control" value={`${formData.downtime_pct.toFixed(2)}%`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Downtime Status</label>
                <div style={{ padding: '8px 12px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', height: 38,
                  backgroundColor: 'var(--bg-secondary)',
                  color: formData.downtime_status === 'Normal' ? '#047857' : formData.downtime_status === 'High' ? '#b45309' : '#b91c1c'
                }}>
                  {formData.downtime_status === 'Normal' && '✅'}
                  {formData.downtime_status === 'High' && '⚠️'}
                  {formData.downtime_status === 'Critical' && '❌'} {formData.downtime_status}
                </div>
              </div>
            </div>

            {/* Category Breakup */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. Category Breakup (hrs)</h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 11 }}>Mechanical</label>
                <input type="number" step="0.1" className="form-control" name="mech_downtime" value={formData.mech_downtime} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 11 }}>Electrical</label>
                <input type="number" step="0.1" className="form-control" name="elec_downtime" value={formData.elec_downtime} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 11 }}>Yarn Issue</label>
                <input type="number" step="0.1" className="form-control" name="yarn_downtime" value={formData.yarn_downtime} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 11 }}>Power Fail</label>
                <input type="number" step="0.1" className="form-control" name="power_downtime" value={formData.power_downtime} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label style={{ fontSize: 11 }}>Op. Absence</label>
                <input type="number" step="0.1" className="form-control" name="abs_downtime" value={formData.abs_downtime} onChange={handleManualEntryChange} />
              </div>
            </div>
            {formData.highest_reason !== 'None' && (
               <div style={{ display: 'inline-block', padding: '6px 12px', background: '#f59e0b15', border: '1px solid #f59e0b40', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#b45309', marginTop: 8 }}>
                 Highest Reason: {formData.highest_reason}
               </div>
            )}

            {/* Loss Calculation */}
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>5. Loss Translation</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Loom Speed (m/hr)</label>
                <input type="number" className="form-control" name="loom_speed" value={formData.loom_speed} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Fabric Rate (₹/m)</label>
                <input type="number" className="form-control" name="fabric_rate" value={formData.fabric_rate} onChange={handleManualEntryChange} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Lost Meters</label>
                <input type="text" className="form-control" value={`${formData.lost_meters.toFixed(1)} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Loss Value (₹)</label>
                <input type="text" className="form-control" value={`₹${formData.loss_value.toFixed(0)}`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Delivery Impact</label>
                <input type="text" className="form-control" value={`+${formData.impact_delivery.toFixed(2)} days`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ec4899', borderColor: '#ec4899' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Calculation
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
            <Clock style={{ color: '#ec4899' }} /> Downtime Calculation
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Comprehensive downtime analytics, loss tracking, and categorization</p>
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
            <div style={{ background: '#fbcfe8', padding: 12, borderRadius: 12, display: 'flex' }}>
              <BarChart2 size={24} style={{ color: '#ec4899' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Analytics Run</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Critical Status</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.filter(r => r.description?.includes('Critical')).length}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#ffedd5', padding: 12, borderRadius: 12, display: 'flex' }}>
              <DollarSign size={24} style={{ color: '#f97316' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Value Lost</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                ₹{records.reduce((sum, r) => sum + (parseFloat(r.extra_field_2?.replace('₹', '')) || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}


        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Downtime Analytics Archive ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search analytics..."
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
                    calc_id: `DT-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    loom_id: '', loom_name: '', order_id: '', breakdown_id: '', breakdown_duration: 0,
                    num_breakdowns: 0, total_breakdown_time: 0, idle_time: 0, planned_maint_time: 0,
                    mech_downtime: 0, elec_downtime: 0, yarn_downtime: 0, power_downtime: 0, abs_downtime: 0, other_downtime: 0
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#ec4899', borderColor: '#ec4899', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> Run Calculation
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Calc ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loom ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Status & %</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loss Value</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loss Summary</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{record.code}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        color: record.description?.includes('Critical') ? '#b91c1c' : record.description?.includes('High') ? '#b45309' : '#047857', 
                        fontWeight: 800 
                      }}>
                        {record.extra_field_1}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}><span style={{ color: '#b91c1c', fontWeight: 600 }}>{record.extra_field_2}</span></td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
