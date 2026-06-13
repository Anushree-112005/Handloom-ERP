import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Save, ArrowLeft, Plus } from 'lucide-react';
import { ppcAPI, buyerOrderAPI, subMasterAPI } from '../../services/api';

export default function OperatorAssignment() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [orders, setOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    assignment_id: '',
    loom_id: '',
    loom_name: '',
    order_id: '',
    schedule_id: '',
    planned_start: '',
    planned_end: '',
    shift: '',
    shift_start: '',
    shift_end: '',
    operator_id: '',
    operator_name: '',
    skill_level: '',
    designation: '',
    target_meters: '',
    backup_operator: '',
    assignment_from: new Date().toISOString().split('T')[0],
    assignment_to: '',
    assigned_by: 'Login User',
    assigned_at: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, ordRes, schedRes, shiftRes, opRes] = await Promise.all([
        subMasterAPI.list('ppc_operator_assignment').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_start_end_plan').catch(() => ({ data: [] })), // using start-end plan as schedules
        subMasterAPI.list('ppc_shift_master').catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_operator_master').catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setOrders(ordRes?.data || []);
      setSchedules(schedRes?.data || []);
      setShifts(shiftRes?.data || []);
      setOperators(opRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoomChange = (e) => {
    const lId = e.target.value;
    const loom = looms.find(l => l.id.toString() === lId);
    
    // Auto find schedule if we have loom and order
    const schedule = findSchedule(lId, formData.order_id);
    
    setFormData(prev => ({
      ...prev,
      loom_id: lId,
      loom_name: loom ? loom.loom_name : '',
      schedule_id: schedule ? schedule.name : prev.schedule_id,
      planned_start: schedule ? schedule.planned_start : prev.planned_start,
      planned_end: schedule ? schedule.planned_end : prev.planned_end
    }));
  };

  const handleOrderChange = (e) => {
    const oId = e.target.value;
    const schedule = findSchedule(formData.loom_id, oId);

    setFormData(prev => ({
      ...prev,
      order_id: oId,
      schedule_id: schedule ? schedule.name : prev.schedule_id,
      planned_start: schedule ? schedule.planned_start : prev.planned_start,
      planned_end: schedule ? schedule.planned_end : prev.planned_end
    }));
  };

  const findSchedule = (lId, oId) => {
    if (!lId || !oId) return null;
    const loom = looms.find(l => l.id.toString() === lId);
    const lName = loom ? loom.loom_name : '';
    
    // Attempt to match schedule. code = order, description contains loom name
    const match = schedules.find(s => s.code === oId && s.description && s.description.includes(lName));
    if (match) {
      // Parse start and end from extra_field_1: "YYYY-MM-DD to YYYY-MM-DD"
      const dates = match.extra_field_1.split(' to ');
      return {
        name: match.name,
        planned_start: dates[0] || '',
        planned_end: dates[1] || ''
      };
    }
    return null;
  };

  const handleShiftChange = (e) => {
    const sName = e.target.value;
    const shift = shifts.find(s => s.name === sName);
    
    let target = '';
    if (shift && formData.loom_id) {
       const loom = looms.find(l => l.id.toString() === formData.loom_id);
       const wh = 8 - (parseInt(shift.description) || 0) / 60;
       if (loom) {
         const daily = loom.capacity_per_day * (loom.efficiency_pct / 100);
         target = ((daily / 24) * wh).toFixed(0);
       }
    }

    setFormData(prev => ({
      ...prev,
      shift: sName,
      shift_start: shift ? shift.extra_field_1 : '',
      shift_end: shift ? shift.extra_field_2 : '',
      target_meters: target
    }));
  };

  const handleOperatorChange = (e) => {
    const opId = e.target.value;
    const op = operators.find(o => o.code === opId || o.id.toString() === opId);
    
    setFormData(prev => ({
      ...prev,
      operator_id: opId,
      operator_name: op ? op.name : '',
      skill_level: op ? op.extra_field_2 : '',
      designation: op ? op.extra_field_1 : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_operator_assignment', {
        name: formData.assignment_id,
        code: formData.operator_name,
        extra_field_1: `${formData.loom_name} | ${formData.shift}`,
        extra_field_2: formData.status,
        description: `Order: ${formData.order_id} | Backup: ${formData.backup_operator}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating assignment.');
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
            <UserCheck style={{ color: '#10b981' }} /> Operator Assignment
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Assign operators to specific machines and shifts</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                assignment_id: `OA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                loom_id: '', loom_name: '', order_id: '', schedule_id: '',
                planned_start: '', planned_end: '', shift: '', shift_start: '', shift_end: '',
                operator_id: '', operator_name: '', skill_level: '', designation: '', target_meters: '',
                backup_operator: '', assignment_from: new Date().toISOString().split('T')[0],
                assignment_to: '', assigned_by: 'Login User', assigned_at: new Date().toISOString().split('T')[0], status: 'Active'
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#10b981', borderColor: '#10b981' }}
          >
            <Plus size={16} /> New Assignment
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
              <div style={{ padding: 10, background: '#10b98118', borderRadius: 10, color: '#10b981' }}>
                <UserCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Create Operator Assignment</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Full shift and machine mapping</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#10b98118', color: '#047857', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.assignment_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Loom & Order Mapping</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={handleLoomChange} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Loom Name (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.loom_name} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" value={formData.order_id} onChange={handleOrderChange} required>
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Schedule ID (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.schedule_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Planned Start Date (Auto-fill)</label>
                <input type="date" className="form-control" value={formData.planned_start} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Planned End Date (Auto-fill)</label>
                <input type="date" className="form-control" value={formData.planned_end} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Shift Configuration</h4>
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

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Operator Assignment</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Operator ID</label>
                <select className="form-control" value={formData.operator_id} onChange={handleOperatorChange} required>
                  <option value="">-- Select Operator --</option>
                  {operators.map(o => (
                    <option key={o.id} value={o.code || o.id}>{o.code || o.id} - {o.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Operator Name (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.operator_name} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Backup Operator</label>
                <select className="form-control" value={formData.backup_operator} onChange={e => setFormData({...formData, backup_operator: e.target.value})}>
                  <option value="">-- Select Backup --</option>
                  {operators.map(o => (
                    <option key={o.id} value={o.name}>{o.code || o.id} - {o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Skill Level (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.skill_level} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Designation (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.designation} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Target Meters (shift) (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.target_meters ? `${formData.target_meters} m` : ''} readOnly style={{ backgroundColor: '#10b98118', borderColor: '#10b981', color: '#047857', fontWeight: 600 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. Assignment Timeline</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Assignment From Date</label>
                <input type="date" className="form-control" value={formData.assignment_from} onChange={e => setFormData({...formData, assignment_from: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Assignment To Date</label>
                <input type="date" className="form-control" value={formData.assignment_to} onChange={e => setFormData({...formData, assignment_to: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Assigned By (Auto)</label>
                <input type="text" className="form-control" value={formData.assigned_by} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Status (Auto)</label>
                <input type="text" className="form-control" value={formData.status} readOnly style={{ backgroundColor: '#10b98118', color: '#047857', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Assignments ({filteredRecords.length})</h3>
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
                  <th>Assign ID</th>
                  <th>Operator</th>
                  <th>Machine & Shift</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td>{record.code}</td>
                    <td>{record.extra_field_1}</td>
                    <td><span style={{ color: '#047857', fontWeight: 600, backgroundColor: '#10b98120', padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>{record.extra_field_2}</span></td>
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
