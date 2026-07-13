import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, Save, ArrowLeft, Plus } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function Reallocation() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    reallocation_id: '',
    original_loom: '',
    remaining_meters: 0,
    reallocation_reason: 'Breakdown',
    target_loom: '',
    meters_to_reallocate: 0,
    new_eta: '',
    approved_by: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_reallocation').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOriginalLoomChange = (e) => {
    const lId = e.target.value;
    const loom = looms.find(l => l.id.toString() === lId);
    
    // Mock remaining meters for the broken loom
    const remain = Math.floor(Math.random() * 5000 + 1000); // 1k-6k meters
    
    setFormData({
      ...formData,
      original_loom: loom ? loom.loom_name : '',
      remaining_meters: lId ? remain : 0,
      meters_to_reallocate: lId ? remain : 0
    });
  };

  const handleTargetLoomChange = (e) => {
    const lId = e.target.value;
    const targetLoom = looms.find(l => l.id.toString() === lId);
    
    let eta = '';
    if (targetLoom && formData.meters_to_reallocate > 0) {
       // Calc new ETA based on target loom capacity
       const dailyCap = targetLoom.capacity_per_day * (targetLoom.efficiency_pct / 100);
       const days = Math.ceil(formData.meters_to_reallocate / dailyCap);
       const d = new Date();
       d.setDate(d.getDate() + days);
       eta = d.toISOString().split('T')[0];
    }

    setFormData({
      ...formData,
      target_loom: targetLoom ? targetLoom.loom_name : '',
      new_eta: eta
    });
  };

  const handleMetersChange = (e) => {
    const meters = e.target.value;
    let eta = formData.new_eta;
    
    const targetLoom = looms.find(l => l.loom_name === formData.target_loom);
    if (targetLoom && meters > 0) {
       const dailyCap = targetLoom.capacity_per_day * (targetLoom.efficiency_pct / 100);
       const days = Math.ceil(meters / dailyCap);
       const d = new Date();
       d.setDate(d.getDate() + days);
       eta = d.toISOString().split('T')[0];
    }
    
    setFormData({
      ...formData,
      meters_to_reallocate: meters,
      new_eta: eta
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_reallocation', {
        name: formData.reallocation_id,
        code: `${formData.original_loom} -> ${formData.target_loom}`,
        extra_field_1: `${formData.meters_to_reallocate} m`,
        extra_field_2: formData.new_eta,
        description: `Reason: ${formData.reallocation_reason} | Appr: ${formData.approved_by}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving reallocation.');
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
              <div style={{ padding: 10, background: '#0ea5e918', borderRadius: 10, color: '#0ea5e9' }}>
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Shift Production Load</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Dynamically calculate new ETAs for target looms</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#0ea5e918', color: '#0369a1', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.reallocation_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              
              {/* Origin Loom */}
              <div style={{ padding: 16, background: '#ef444408', border: '1px solid #ef444430', borderRadius: 8 }}>
                <h4 style={{ color: '#b91c1c', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }}></span>
                  Source (Problem Loom)
                </h4>
                <div className="form-group">
                  <label>Original Loom</label>
                  <select className="form-control" onChange={handleOriginalLoomChange} required>
                    <option value="">-- Select Source Loom --</option>
                    {looms.map(l => (
                      <option key={l.id} value={l.id}>{l.loom_name} ({l.status})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Remaining Meters (Auto-fill)</label>
                  <input type="text" className="form-control" value={formData.remaining_meters ? `${formData.remaining_meters} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Reallocation Reason</label>
                  <input type="text" className="form-control" value={formData.reallocation_reason} onChange={e => setFormData({...formData, reallocation_reason: e.target.value})} required />
                </div>
              </div>

              {/* Target Loom */}
              <div style={{ padding: 16, background: '#10b98108', border: '1px solid #10b98130', borderRadius: 8 }}>
                <h4 style={{ color: '#047857', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span>
                  Target (Receiving Loom)
                </h4>
                <div className="form-group">
                  <label>Target Loom</label>
                  <select className="form-control" onChange={handleTargetLoomChange} required>
                    <option value="">-- Select Target Loom --</option>
                    {looms.map(l => (
                      <option key={l.id} value={l.id}>{l.loom_name} (Eff: {l.efficiency_pct}%)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Meters to Reallocate</label>
                  <input type="number" className="form-control" value={formData.meters_to_reallocate} onChange={handleMetersChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>New ETA (Auto-calc)</label>
                  <input type="date" className="form-control" value={formData.new_eta} readOnly style={{ backgroundColor: formData.new_eta ? '#10b98118' : 'var(--bg-secondary)', color: formData.new_eta ? '#047857' : 'inherit', fontWeight: 600 }} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 24, maxWidth: 300 }}>
              <label>Approved By</label>
              <input type="text" className="form-control" value={formData.approved_by} onChange={e => setFormData({...formData, approved_by: e.target.value})} placeholder="e.g. Production Manager" required />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Confirm Reallocation
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
            <ArrowRightLeft style={{ color: '#0ea5e9' }} /> Reallocation Engine
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Shift production loads from broken or delayed looms</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                reallocation_id: `RA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                original_loom: '', remaining_meters: 0, reallocation_reason: 'Breakdown',
                target_loom: '', meters_to_reallocate: 0, new_eta: '', approved_by: ''
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#0ea5e9', borderColor: '#0ea5e9' }}
          >
            <Plus size={16} /> Reallocate Order
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Reallocation History ({filteredRecords.length})</h3>
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
                  <th>Reallocation ID</th>
                  <th>Loom Transfer</th>
                  <th>Shifted Load</th>
                  <th>New ETA</th>
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
                    <td><span style={{ fontWeight: 700, color: '#0369a1' }}>{record.code}</span></td>
                    <td><span style={{ color: '#047857', fontWeight: 600 }}>{record.extra_field_1}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{record.extra_field_2}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
