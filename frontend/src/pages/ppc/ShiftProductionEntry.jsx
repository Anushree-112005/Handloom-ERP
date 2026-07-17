import React, { useState, useEffect } from 'react';
import { Activity, Search, Save, ArrowLeft, Plus } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function ShiftProductionEntry() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [operators, setOperators] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    entry_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    loom_id: '',
    shift: '',
    operator: '',
    opening_meter: 0,
    closing_meter: '',
    meters_produced: '',
    target_meters: '',
    efficiency: '',
    defect_meters: 0,
    good_meters: '',
    yarn_used: '',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, allocRes, opRes] = await Promise.all([
        ppcAPI.getDailyEntries().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        ppcAPI.getAllocations().catch(() => ({ data: [] })),
        ppcAPI.getOperators().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setAllocations(allocRes?.data || []);
      setOperators(opRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoomShiftChange = (name, value) => {
    const updated = { ...formData, [name]: value };

    if (updated.loom_id) {
      const alloc = allocations.find(a => (a.loom_id.toString() === updated.loom_id || a.loom_name === updated.loom_id) && a.allocation_status !== 'Completed');
      if (alloc) {
        updated.target_meters = alloc.assigned_meters;
        // Find operator assigned to this loom
        const loom = looms.find(l => l.id.toString() === updated.loom_id || l.loom_name === updated.loom_id);
        const op = operators.find(o => String(o.assigned_loom) === String(loom ? loom.loom_name : ''));
        updated.operator = op ? op.operator_name : (operators[0] ? operators[0].operator_name : 'Operator 1');
        updated.opening_meter = alloc.completed_meters || 0;
      } else {
        updated.target_meters = '';
        updated.operator = '';
        updated.opening_meter = 0;
      }
    }

    recalc(updated);
  };

  const recalc = (data) => {
    const open = parseFloat(data.opening_meter) || 0;
    const close = parseFloat(data.closing_meter) || 0;
    const produced = Math.max(0, close - open);
    const target = parseFloat(data.target_meters) || 1;
    const eff = (produced / target) * 100;

    const defect = parseFloat(data.defect_meters) || 0;
    const good = Math.max(0, produced - defect);

    setFormData({
      ...data,
      meters_produced: data.closing_meter ? produced : '',
      efficiency: data.closing_meter ? eff.toFixed(1) : '',
      good_meters: data.closing_meter ? good : ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    recalc({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const alloc = allocations.find(a => (a.loom_id.toString() === formData.loom_id || a.loom_name === formData.loom_id) && a.allocation_status !== 'Completed');
      if (!alloc) {
         alert("No active allocation found for this loom!");
         return;
      }

      await ppcAPI.logProduction({
        allocation_id: alloc.id,
        meters_produced: parseFloat(formData.meters_produced) || 0,
        downtime_minutes: parseFloat(formData.defect_meters) || 0, // Mocking downtime using defect field for now
        remarks: `Yarn: ${formData.yarn_used}kg | Defects: ${formData.defect_meters}m | Remarks: ${formData.remarks}`
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error logging production entry.');
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
              <div style={{ padding: 10, background: '#8b5cf618', borderRadius: 10, color: '#8b5cf6' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Log Shift Output</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Automated efficiency and defect calculation</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#8b5cf618', color: '#6d28d9', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.entry_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Assignment Context</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" name="entry_date" value={formData.entry_date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={(e) => handleLoomShiftChange('loom_id', e.target.value)} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Shift</label>
                <select className="form-control" value={formData.shift} onChange={(e) => handleLoomShiftChange('shift', e.target.value)} required>
                  <option value="">-- Select Shift --</option>
                  <option value="Shift A">Shift A</option>
                  <option value="Shift B">Shift B</option>
                  <option value="Shift C">Shift C</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Operator (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.operator} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Target Meters (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.target_meters ? `${formData.target_meters} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Production Output</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Opening Meter (Auto-fill)</label>
                <input type="number" className="form-control" value={formData.opening_meter} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Closing Meter</label>
                <input type="number" className="form-control" name="closing_meter" value={formData.closing_meter} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Meters Produced (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.meters_produced !== '' ? `${formData.meters_produced} m` : ''} readOnly style={{ backgroundColor: '#8b5cf618', borderColor: '#8b5cf6', color: '#6d28d9', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Efficiency % (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.efficiency ? `${formData.efficiency}%` : ''} readOnly style={{ backgroundColor: formData.efficiency >= 90 ? '#10b98118' : formData.efficiency >= 75 ? '#f59e0b18' : '#ef444418', borderColor: formData.efficiency >= 90 ? '#10b981' : formData.efficiency >= 75 ? '#f59e0b' : '#ef4444', color: formData.efficiency >= 90 ? '#047857' : formData.efficiency >= 75 ? '#b45309' : '#b91c1c', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Defect Meters</label>
                <input type="number" className="form-control" name="defect_meters" value={formData.defect_meters} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Good Meters (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.good_meters !== '' ? `${formData.good_meters} m` : ''} readOnly style={{ backgroundColor: '#10b98118', color: '#047857', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginTop: 16 }}>
              <div className="form-group">
                <label>Yarn Used (kg)</label>
                <input type="number" step="0.1" className="form-control" name="yarn_used" value={formData.yarn_used} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <input type="text" className="form-control" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Any issues during shift?" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Production
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
            <Activity style={{ color: '#8b5cf6' }} /> Shift Production Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Log end-of-shift metrics and calculate true efficiency</p>
        </div>
        {!isFormOpen ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData({
                entry_id: `SPE-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                entry_date: new Date().toISOString().split('T')[0],
                loom_id: '', shift: '', operator: '', opening_meter: 0,
                closing_meter: '', meters_produced: '', target_meters: '',
                efficiency: '', defect_meters: 0, good_meters: '', yarn_used: '', remarks: ''
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#8b5cf6', borderColor: '#8b5cf6' }}
          >
            <Plus size={16} /> New Entry
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


        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Logs ({filteredRecords.length})</h3>
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
                  <th>Entry ID</th>
                  <th>Loom ID</th>
                  <th>Shift Details</th>
                  <th>Production</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>SPE-{String(record.id).padStart(3, '0')}</td>
                    <td>{record.loom_id || 'Unknown Loom'}</td>
                    <td>{new Date(record.timestamp).toLocaleDateString()}</td>
                    <td><span style={{ color: '#047857', fontWeight: 600, backgroundColor: '#10b98120', padding: '4px 8px', borderRadius: 12 }}>{record.meters_produced} m</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{record.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
