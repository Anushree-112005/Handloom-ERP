import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Search, Settings2, Trash2, Clock, Database, ToggleRight, ToggleLeft, Edit2, X, ArrowLeft } from 'lucide-react';
import { subMasterAPI } from '../../services/api';

export default function ShiftMaster() {
  const [shifts, setShifts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    break_duration: '30',
    shift_type: 'Day',
    is_active: true
  });

  useEffect(() => {
    fetchShifts();
    fetchStats();
  }, []);

  const fetchShifts = async () => {
    try {
      const { data } = await subMasterAPI.list('ppc_shift_master');
      setShifts(data);
    } catch (error) {
      if (error?.message === 'Request aborted' || error?.code === 'ERR_CANCELED') return;
      console.error("Failed to fetch shifts", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await subMasterAPI.stats('ppc_shift_master');
      setStats(data);
    } catch (error) {
      if (error?.message === 'Request aborted' || error?.code === 'ERR_CANCELED') return;
      console.error("Failed to fetch stats", error);
    }
  };

  const calculateHours = (start, end, breakMin) => {
    if (!start || !end) return { total: 0, working: 0 };
    
    let [startH, startM] = start.split(':').map(Number);
    let [endH, endM] = end.split(':').map(Number);
    
    let startTotal = startH * 60 + startM;
    let endTotal = endH * 60 + endM;
    
    // Handle overnight shifts
    if (endTotal <= startTotal) {
      endTotal += 24 * 60;
    }
    
    const totalMinutes = endTotal - startTotal;
    const workingMinutes = totalMinutes - (Number(breakMin) || 0);
    
    return {
      total: (totalMinutes / 60).toFixed(1),
      working: (workingMinutes / 60).toFixed(1)
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEdit = (record) => {
    setFormData({
      name: record.name,
      start_time: record.extra_field_1 || '',
      end_time: record.extra_field_2 || '',
      break_duration: record.extra_field_3 || '30',
      shift_type: record.code || 'Day',
      is_active: record.is_active
    });
    setEditingId(record.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        code: formData.shift_type,
        extra_field_1: formData.start_time,
        extra_field_2: formData.end_time,
        extra_field_3: formData.break_duration.toString(),
        is_active: formData.is_active
      };

      if (editingId) {
        await subMasterAPI.update('ppc_shift_master', editingId, payload);
      } else {
        await subMasterAPI.create('ppc_shift_master', payload);
      }
      setEditingId(null);
      setIsFormOpen(false);
      fetchShifts();
      fetchStats();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this shift?")) {
      try {
        await subMasterAPI.delete('ppc_shift_master', id);
        fetchShifts();
        fetchStats();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={24} color="var(--primary)" />
            Shift Master
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Manage your factory shifts</p>
        </div>
        {!isFormOpen && (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '', start_time: '', end_time: '', break_duration: '30', shift_type: 'Day', is_active: true
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <Clock size={16} /> Add Shift
          </button>
        )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Total Shifts</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.total || 0}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ToggleRight size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Active</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stats?.active || 0}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ToggleLeft size={24} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Inactive</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{(stats?.total || 0) - (stats?.active || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: 'var(--primary-light)', borderRadius: 10, color: 'white' }}>
                <Settings2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editingId ? 'Edit Shift' : 'Add New Shift'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Shift Configuration Details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            
            <div className="form-group">
              <label>Shift Name</label>
              <input type="text" className="form-control" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Morning Shift" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleInputChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Break Duration (Mins)</label>
                <input type="number" className="form-control" name="break_duration" value={formData.break_duration} onChange={handleInputChange} min="0" />
              </div>
              <div className="form-group">
                <label>Shift Type</label>
                <select className="form-control" name="shift_type" value={formData.shift_type} onChange={handleInputChange}>
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                  <option value="General">General Shift</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 24 }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Status Active</label>
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} style={{ marginRight: 8 }} /> {editingId ? 'Update Shift' : 'Save Shift'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Configured Shifts</h3>
          </div>
          
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', whiteSpace: 'nowrap', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Shift Name</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Type</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Timings</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Break</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Total / Work Hrs</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Status</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift, i) => {
                  const { total, working } = calculateHours(shift.extra_field_1, shift.extra_field_2, shift.extra_field_3);
                  return (
                    <tr key={i}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{shift.name}</span></td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: shift.code === 'Night' ? '#312e81' : '#e0f2fe', color: shift.code === 'Night' ? '#a5b4fc' : '#0369a1', fontWeight: 600 }}>
                          {shift.code || 'Day'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {shift.extra_field_1} - {shift.extra_field_2}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{shift.extra_field_3 || 0} min</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 13 }}>
                          <span>{total}h</span> / <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{working}h</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                          backgroundColor: shift.is_active ? '#10b98120' : '#ef444420',
                          color: shift.is_active ? '#10b981' : '#ef4444'
                        }}>
                          {shift.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                        <button className="btn" onClick={() => handleEdit(shift)} style={{ padding: '4px 8px', color: '#3b82f6', marginRight: 8 }}><Edit2 size={16}/></button>
                        <button className="btn" onClick={() => handleDelete(shift.id)} style={{ padding: '4px 8px', color: '#ef4444' }}><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  );
                })}
                {shifts.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No shifts configured yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
