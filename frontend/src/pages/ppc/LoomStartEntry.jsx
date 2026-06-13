import React, { useState, useEffect } from 'react';
import { PlayCircle, Search, Save, ArrowLeft, Plus } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function LoomStartEntry() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    entry_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    loom_id: '',
    order_id: '',
    shift: '',
    operator_name: '',
    warp_beam_no: '',
    start_time: '',
    start_meter: 0,
    status: 'Running'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, shiftRes, assignRes] = await Promise.all([
        subMasterAPI.list('ppc_loom_start').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_shift_master').catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_operator_assignment').catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setShifts(shiftRes?.data || []);
      setAssignments(assignRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoomShiftChange = (name, value) => {
    const updated = { ...formData, [name]: value };
    
    // Auto-fill logic
    if (updated.loom_id && updated.shift) {
      const loom = looms.find(l => l.id.toString() === updated.loom_id);
      const lName = loom ? loom.loom_name : updated.loom_id;
      
      const assign = assignments.find(a => 
        a.extra_field_1 && a.extra_field_1.includes(lName) && a.extra_field_1.includes(updated.shift)
      );

      if (assign) {
         updated.operator_name = assign.code || assign.extra_field_1;
         
         const orderMatch = assign.description ? assign.description.match(/Order:\s*([^|]+)/) : null;
         updated.order_id = orderMatch ? orderMatch[1].trim() : '';
      }
    }
    
    // Auto-fill time if shift is selected
    if (name === 'shift' && value) {
       const shiftMatch = shifts.find(s => s.name === value);
       if (shiftMatch) {
         // rough format conversion from 06:00 AM to 06:00
         const tStr = shiftMatch.extra_field_1; // e.g. "06:00 AM"
         if (tStr) {
           const [time, modifier] = tStr.split(' ');
           if (time && modifier) {
             let [hours, minutes] = time.split(':');
             if (hours === '12') hours = '00';
             if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
             updated.start_time = `${hours.toString().padStart(2, '0')}:${minutes}`;
           } else {
             updated.start_time = tStr;
           }
         }
       }
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_loom_start', {
        name: formData.entry_id,
        code: formData.loom_id,
        extra_field_1: formData.order_id,
        extra_field_2: `${formData.shift} - ${formData.operator_name}`,
        description: `Beam: ${formData.warp_beam_no} | Start: ${formData.start_meter}m`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating entry.');
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
            <PlayCircle style={{ color: '#10b981' }} /> Loom Start Entry
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Log machine kick-offs and baseline readings</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                entry_id: `PE-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                entry_date: new Date().toISOString().split('T')[0],
                loom_id: '', order_id: '', shift: '', operator_name: '',
                warp_beam_no: '', start_time: '', start_meter: 0, status: 'Running'
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#10b981', borderColor: '#10b981' }}
          >
            <Plus size={16} /> New Start Entry
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
                <PlayCircle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Initiate Production Run</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Record beam and initial meter readings</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#10b98118', color: '#047857', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.entry_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" value={formData.entry_date} onChange={e => setFormData({...formData, entry_date: e.target.value})} required />
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
                  {shifts.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Order ID (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.order_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Operator Name (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.operator_name} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Warp Beam No.</label>
                <input type="text" className="form-control" value={formData.warp_beam_no} onChange={e => setFormData({...formData, warp_beam_no: e.target.value})} required placeholder="e.g. WB-045" />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" className="form-control" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Start Meter Reading</label>
                <input type="number" className="form-control" value={formData.start_meter} onChange={e => setFormData({...formData, start_meter: e.target.value})} required />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: 300 }}>
              <label>Status (Auto)</label>
              <input type="text" className="form-control" value={formData.status} readOnly style={{ backgroundColor: '#10b98118', borderColor: '#10b981', color: '#047857', fontWeight: 600 }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Confirm Start
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Recent Starts ({filteredRecords.length})</h3>
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
                  <th>Order</th>
                  <th>Shift & Operator</th>
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
                    <td><span style={{ color: '#0369a1', fontWeight: 600 }}>{record.extra_field_1}</span></td>
                    <td>{record.extra_field_2}</td>
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
