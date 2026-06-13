import React, { useState, useEffect } from 'react';
import { Settings2, Save, Search, Trash2, X, ArrowLeft } from 'lucide-react';
import { ppcAPI } from '../../services/api';

export default function LoomRegistration() {
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    loom_name: '',
    loom_type: 'Rapier',
    manufacturer: '',
    model_number: '',
    installation_date: '',
    capacity_per_day: '',
    running_speed_per_hr: '',
    efficiency_pct: '80',
    reed_width: '',
    total_ends: '',
    status: 'Idle',
    location: '',
    last_service_date: '',
    next_service_date: '',
    remarks: ''
  });

  useEffect(() => {
    fetchLooms();
  }, []);

  const fetchLooms = async () => {
    try {
      const { data } = await ppcAPI.getLooms();
      setLooms(data);
    } catch (error) {
      if (error?.message === 'Request aborted' || error?.code === 'ERR_CANCELED') return;
      console.error("Failed to fetch looms", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ppcAPI.createLoom({
        ...formData,
        capacity_per_day: parseFloat(formData.capacity_per_day) || 0,
        running_speed_per_hr: parseFloat(formData.running_speed_per_hr) || 0,
        efficiency_pct: parseFloat(formData.efficiency_pct) || 0,
        reed_width: formData.reed_width ? parseFloat(formData.reed_width) : null,
        total_ends: formData.total_ends ? parseInt(formData.total_ends, 10) : null,
        installation_date: formData.installation_date ? new Date(formData.installation_date).toISOString() : null,
        last_service_date: formData.last_service_date ? new Date(formData.last_service_date).toISOString() : null,
        next_service_date: formData.next_service_date ? new Date(formData.next_service_date).toISOString() : null
      });
      alert('Loom successfully registered and configured!');
      setFormData({ 
        loom_name: '', loom_type: 'Rapier', manufacturer: '', model_number: '', 
        installation_date: '', capacity_per_day: '', running_speed_per_hr: '', 
        efficiency_pct: '80', reed_width: '', total_ends: '', status: 'Idle', 
        location: '', last_service_date: '', next_service_date: '', remarks: '' 
      });
      setIsFormOpen(false);
      fetchLooms();
    } catch (error) {
      console.error("Failed to register loom", error);
      alert('Error registering loom. Ensure the name is unique.');
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings2 style={{ color: 'var(--primary)' }} /> Loom Registration & Configuration
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Register new machines and define their base production characteristics.</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({ 
                loom_name: '', loom_type: 'Rapier', manufacturer: '', model_number: '', 
                installation_date: '', capacity_per_day: '', running_speed_per_hr: '', 
                efficiency_pct: '80', reed_width: '', total_ends: '', status: 'Idle', 
                location: '', last_service_date: '', next_service_date: '', remarks: '' 
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <Settings2 size={16} /> Add Loom
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

      {/* Inline Form */}
      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: 'var(--primary-light)', borderRadius: 10, color: 'white' }}>
                <Settings2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Register New Loom</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Loom Configuration Details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loom Name / ID *</label>
                <input type="text" className="form-control" name="loom_name" value={formData.loom_name} onChange={handleInputChange} required placeholder="e.g. LM-001" />
              </div>
              <div className="form-group">
                <label>Loom Type</label>
                <select className="form-control" name="loom_type" value={formData.loom_type} onChange={handleInputChange}>
                  <option value="Rapier">Rapier</option>
                  <option value="Air Jet">Air Jet</option>
                  <option value="Water Jet">Water Jet</option>
                  <option value="Shuttle">Shuttle</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Manufacturer</label>
                <input type="text" className="form-control" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} placeholder="e.g. Toyota" />
              </div>
              <div className="form-group">
                <label>Model Number</label>
                <input type="text" className="form-control" name="model_number" value={formData.model_number} onChange={handleInputChange} placeholder="e.g. JAT910" />
              </div>
            </div>
            
            <div className="form-group">
              <label>Location / Section</label>
              <input type="text" className="form-control" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Shed A" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Max Capacity (m/day) *</label>
                <input type="number" className="form-control" name="capacity_per_day" value={formData.capacity_per_day} onChange={handleInputChange} required placeholder="e.g. 500" />
              </div>
              <div className="form-group">
                <label>Speed (m/hour) *</label>
                <input type="number" className="form-control" name="running_speed_per_hr" value={formData.running_speed_per_hr} onChange={handleInputChange} required placeholder="e.g. 25" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Efficiency (%) *</label>
                <input type="number" className="form-control" name="efficiency_pct" value={formData.efficiency_pct} onChange={handleInputChange} required max="100" min="0" />
              </div>
              <div className="form-group">
                <label>Reed Width (cm)</label>
                <input type="number" className="form-control" name="reed_width" value={formData.reed_width} onChange={handleInputChange} placeholder="e.g. 190" />
              </div>
            </div>

            <div className="form-group">
              <label>Total Ends</label>
              <input type="number" className="form-control" name="total_ends" value={formData.total_ends} onChange={handleInputChange} placeholder="e.g. 4800" />
            </div>

            <div className="form-group">
              <label>Installation Date</label>
              <input type="date" className="form-control" name="installation_date" value={formData.installation_date} onChange={handleInputChange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Last Service Date</label>
                <input type="date" className="form-control" name="last_service_date" value={formData.last_service_date} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Next Service Date</label>
                <input type="date" className="form-control" name="next_service_date" value={formData.next_service_date} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Current Status</label>
              <select className="form-control" name="status" value={formData.status} onChange={handleInputChange}>
                <option value="Running">Running</option>
                <option value="Idle">Idle</option>
                <option value="Breakdown">Breakdown</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Remarks</label>
              <textarea className="form-control" name="remarks" value={formData.remarks} onChange={handleInputChange} placeholder="Additional notes..." rows="3" />
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} style={{ marginRight: 8 }} /> Save Loom Profile
              </button>
            </div>
          </form>
        </div>
      ) : (
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Active Looms Roster</h3>
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search looms..." className="form-control" style={{ paddingLeft: 36, width: 200 }} />
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Loom ID/Name</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Type</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Make/Model</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Location</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Capacity (m/d)</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Status</th>
                <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {looms.map((loom, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><span style={{ fontWeight: 600, color: 'var(--primary)' }}>{loom.loom_name}</span></td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{loom.loom_type || '-'}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{loom.manufacturer} {loom.model_number}</span></td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{loom.location || '-'}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{loom.capacity_per_day}</td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      backgroundColor: loom.status === 'Running' ? '#10b98120' : loom.status === 'Maintenance' ? '#ef444420' : loom.status === 'Breakdown' ? '#f59e0b20' : '#64748b20',
                      color: loom.status === 'Running' ? '#10b981' : loom.status === 'Maintenance' ? '#ef4444' : loom.status === 'Breakdown' ? '#f59e0b' : '#64748b'
                    }}>
                      {loom.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <button className="btn" style={{ padding: '4px 8px', color: '#ef4444' }}><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
              {looms.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No looms registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      )}
    </div>
  );
}
