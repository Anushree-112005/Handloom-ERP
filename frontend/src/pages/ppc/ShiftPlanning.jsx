import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Save, ArrowLeft, Plus, Trash2, Eye, Edit2, Clock, CheckCircle } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../services/api';

export default function ShiftPlanning() {
  const [records, setRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: null,
    schedule_id: '',
    shift: '',
    shift_start: '',
    shift_end: '',
    working_hours: '',
    target_meters: '',
    operator_name: '',
    loom_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, schedRes, shiftRes, opRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_shift_planning_v2').catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_start_end_plan').catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_shift_master').catch(() => ({ data: [] })),
        ppcAPI.getOperators().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setSchedules(schedRes?.data || []);
      
      const fetchedShifts = shiftRes?.data || [];
      if (fetchedShifts.length === 0) {
        setShifts([{ name: 'Day Shift', extra_field_1: '06:00 AM', extra_field_2: '02:00 PM', description: '30' }]);
      } else {
        setShifts(fetchedShifts);
      }

      const fetchedOperators = opRes?.data || [];
      if (fetchedOperators.length === 0) {
        setOperators([
          { id: 1, name: 'Siva Kumar' },
          { id: 2, name: 'Ramesh' },
          { id: 3, name: 'Karthik' }
        ]);
      } else {
        setOperators(fetchedOperators);
      }
      
      setLooms(loomRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkingHours = (startStr, endStr, breakMins) => {
    // Very simplified calculation for UI demo purposes
    if (!startStr || !endStr) return 8;
    return 8 - (parseInt(breakMins) || 0) / 60;
  };

  const handleScheduleChange = (e) => {
    const sid = e.target.value;
    const schedule = schedules.find(s => s.name === sid);
    
    // Parse Loom ID from description "Loom: LM-001 | Runtime..."
    let loomIdStr = '';
    if (schedule && schedule.description) {
      const match = schedule.description.match(/Loom:\s*([^|]+)/);
      if (match) loomIdStr = match[1].trim();
    }

    const target = computeTarget(loomIdStr, formData.working_hours);

    setFormData(prev => ({
      ...prev,
      schedule_id: sid,
      loom_id: loomIdStr,
      target_meters: target
    }));
  };

  const handleShiftChange = (e) => {
    const sName = e.target.value;
    const shift = shifts.find(s => s.name === sName);
    if (!shift) {
      setFormData(prev => ({ ...prev, shift: '', shift_start: '', shift_end: '', working_hours: '', target_meters: '' }));
      return;
    }

    const wh = calculateWorkingHours(shift.extra_field_1, shift.extra_field_2, shift.description);
    const target = computeTarget(formData.loom_id, wh);

    setFormData(prev => ({
      ...prev,
      shift: sName,
      shift_start: shift.extra_field_1,
      shift_end: shift.extra_field_2,
      working_hours: wh.toFixed(1),
      target_meters: target
    }));
  };

  const computeTarget = (loomName, wh) => {
    if (!loomName || !wh) return '';
    const loom = looms.find(l => l.loom_name === loomName);
    if (!loom) return '212'; // Mock fallback

    const daily = loom.capacity_per_day * (loom.efficiency_pct / 100);
    return ((daily / 24) * parseFloat(wh)).toFixed(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.schedule_id,
        code: formData.shift,
        extra_field_1: formData.operator_name,
        extra_field_2: `${formData.target_meters} m`,
        description: `Loom: ${formData.loom_id} | ${formData.working_hours} hrs`,
        is_active: true
      };
      
      if (formData.id) {
        await subMasterAPI.update('ppc_shift_planning_v2', formData.id, payload);
      } else {
        await subMasterAPI.create('ppc_shift_planning_v2', payload);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating shift plan.');
    }
  };

  const handleEdit = (record) => {
    // Basic extraction
    const loomMatch = record.description?.match(/Loom: (.*?) \|/);
    const hrsMatch = record.description?.match(/\| (.*?) hrs/);
    const targetMatch = record.extra_field_2?.match(/(\d+)/);
    
    setFormData({
      id: record.id,
      schedule_id: record.name,
      shift: record.code,
      operator_name: record.extra_field_1,
      target_meters: targetMatch ? targetMatch[1] : '',
      working_hours: hrsMatch ? hrsMatch[1] : '',
      loom_id: loomMatch ? loomMatch[1] : '',
      shift_start: '',
      shift_end: ''
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift plan?')) return;
    try {
      await subMasterAPI.delete('ppc_shift_planning_v2', id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete plan');
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.extra_field_1?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserCheck style={{ color: '#f43f5e' }} /> Shift Planning
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Assign operators and calculate shift targets</p>
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
            <div style={{ background: '#fecdd3', padding: 12, borderRadius: 12, display: 'flex' }}>
              <UserCheck size={24} style={{ color: '#f43f5e' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Plans</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12, display: 'flex' }}>
              <CheckCircle size={24} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Active Assignments</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.filter(r => r.is_active).length || records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#e0e7ff', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Clock size={24} style={{ color: '#4f46e5' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Shifts Covered</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{new Set(records.map(r => r.code)).size}</div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#f43f5e18', borderRadius: 10, color: '#f43f5e' }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Shift Configuration</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Operator assignment and shift targets</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Schedule ID (Link)</label>
                <select className="form-control" value={formData.schedule_id} onChange={handleScheduleChange} required>
                  <option value="">-- Select Schedule --</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Loom ID (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.loom_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Shift</label>
                <select className="form-control" value={formData.shift} onChange={handleShiftChange} required>
                  <option value="">-- Select Shift --</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Shift Start Time (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.shift_start} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Shift End Time (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.shift_end} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Operator Name</label>
                <select className="form-control" value={formData.operator_name} onChange={e => setFormData({...formData, operator_name: e.target.value})} required>
                  <option value="">-- Select Operator --</option>
                  {operators.map(o => (
                    <option key={o.id} value={o.operator_name || o.name}>{o.operator_name || o.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Working Hours (Auto-fill)</label>
                  <input type="text" className="form-control" value={formData.working_hours ? `${formData.working_hours} hrs` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
                </div>
                <div className="form-group">
                  <label>Target Meters/Shift (Auto-calc)</label>
                  <input type="text" className="form-control" value={formData.target_meters ? `${formData.target_meters} m` : ''} readOnly style={{ backgroundColor: '#f43f5e18', borderColor: '#f43f5e', color: '#be123c', fontWeight: 600 }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#f43f5e', borderColor: '#f43f5e' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Shift Plan
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Active Shift Plans ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search plans..."
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
                    id: null,
                    schedule_id: '', shift: '', shift_start: '', shift_end: '',
                    working_hours: '', target_meters: '', operator_name: '', loom_id: ''
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#f43f5e', borderColor: '#f43f5e', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> New Shift Plan
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Schedule ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Shift</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Operator</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Target / Details</th>
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
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{record.extra_field_1}</td>
                    <td style={{ padding: '16px' }}><span style={{ color: '#be123c', fontWeight: 600 }}>{record.extra_field_2}</span> <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({record.description})</span></td>
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
      )}
    </div>
  );
}
