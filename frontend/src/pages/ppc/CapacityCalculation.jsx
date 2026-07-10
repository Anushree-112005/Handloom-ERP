import React, { useState, useEffect } from 'react';
import { Activity, Search, Save, ArrowLeft, Plus, Trash2, Eye, Edit2, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../services/api';

export default function CapacityCalculation() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    loom_id: '',
    max_capacity: '',
    efficiency: '',
    effective_capacity: '',
    working_days: 26,
    monthly_capacity: '',
    shift_hours: '16 hrs'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomsRes] = await Promise.all([
        subMasterAPI.list('ppc_capacity_calc'),
        ppcAPI.getLooms()
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomsRes?.data || []);
    } catch (err) {
      if (err?.message !== 'Request aborted' && err?.code !== 'ERR_CANCELED') {
        console.error("Failed to fetch data", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoomChange = (e) => {
    const selectedLoomName = e.target.value;
    if (!selectedLoomName) {
       setFormData(prev => ({ 
         ...prev, loom_id: '', max_capacity: '', efficiency: '', effective_capacity: '', monthly_capacity: ''
       }));
       return;
    }
    
    const loom = looms.find(l => l.loom_name === selectedLoomName);
    if (!loom) return;

    const maxCap = loom.capacity_per_day || 0;
    const eff = loom.efficiency_pct || 0;
    const effectiveCap = maxCap * (eff / 100);
    const monthlyCap = effectiveCap * formData.working_days;

    setFormData(prev => ({
      ...prev,
      loom_id: loom.loom_name,
      max_capacity: maxCap,
      efficiency: eff,
      effective_capacity: effectiveCap.toFixed(2),
      monthly_capacity: monthlyCap.toFixed(2)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'working_days') {
        const days = parseFloat(value) || 0;
        const effCap = parseFloat(next.effective_capacity) || 0;
        next.monthly_capacity = (effCap * days).toFixed(2);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_capacity_calc', {
        name: formData.loom_id,
        code: `${formData.monthly_capacity} m/month`,
        extra_field_1: `${formData.max_capacity} max`,
        extra_field_2: `${formData.efficiency}% eff`,
        description: `Working Days: ${formData.working_days}, Shift: ${formData.shift_hours}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving record.');
    }
  };

  const handleEdit = (record) => {
    setFormData(prev => ({ ...prev, loom_id: record.name, monthly_capacity: parseFloat(record.code), max_capacity: parseFloat(record.extra_field_1), efficiency: parseFloat(record.extra_field_2) }));
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await subMasterAPI.delete('ppc_capacity_calc', id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete record');
    }
  };

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLooms = looms.length;
  const runningLooms = looms.filter(l => l.status === 'Running').length;
  const breakdownLooms = looms.filter(l => l.status === 'Breakdown').length;
  const maintenanceLooms = looms.filter(l => l.status === 'Maintenance').length;

  if (isFormOpen) {
    return (
      <div className="animate-fade" style={{ height: '100%' }}>
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#0ea5e918', borderRadius: 10, color: '#0ea5e9' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Perform Capacity Calculation</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Analyzes efficiency and working days</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" name="loom_id" value={formData.loom_id} onChange={handleLoomChange} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(loom => (
                    <option key={loom.id} value={loom.loom_name}>{loom.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Max Capacity (m/day) (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.max_capacity} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Efficiency (%) (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.efficiency} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Effective Capacity (m/day) (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.effective_capacity} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Working Days</label>
                <input type="number" className="form-control" name="working_days" value={formData.working_days} onChange={handleInputChange} min="1" max="31" required />
              </div>
              <div className="form-group">
                <label>Shift Hours (Auto-fill)</label>
                <input type="text" className="form-control" name="shift_hours" value={formData.shift_hours} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Monthly Capacity (m) (Auto-calc)</label>
              <input type="text" className="form-control" value={formData.monthly_capacity} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
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
      
      {/* Header (Title Only) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity style={{ color: '#0ea5e9' }} /> Capacity Calculation
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Calculate effective machine capacity per month</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#e0e7ff', padding: 12, borderRadius: 12, display: 'flex' }}>
            <Activity size={24} style={{ color: '#4f46e5' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Looms</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{totalLooms}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12, display: 'flex' }}>
            <CheckCircle size={24} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Running</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{runningLooms}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fef3c7', padding: 12, borderRadius: 12, display: 'flex' }}>
            <AlertTriangle size={24} style={{ color: '#d97706' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Breakdown</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{breakdownLooms}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
            <Settings size={24} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Maintenance</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{maintenanceLooms}</div>
          </div>
        </div>
      </div>

      {/* Inline Form */}

        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Saved Calculations ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search calculations..."
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
                    loom_id: '', max_capacity: '', efficiency: '', effective_capacity: '',
                    working_days: 26, monthly_capacity: '', shift_hours: '16 hrs'
                  });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#4f46e5', borderColor: '#4f46e5', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> New Calculation
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loom ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Capacity</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Max Capacity</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Efficiency</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Details</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{record.name}</td>
                    <td style={{ padding: '16px', color: '#047857', fontWeight: 600 }}>{record.code}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{record.extra_field_1}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{record.extra_field_2}</td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button style={{ padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => handleEdit(record)} title="View">
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
