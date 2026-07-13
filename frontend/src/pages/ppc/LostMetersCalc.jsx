import React, { useState, useEffect } from 'react';
import { Calculator, Search, Save, ArrowLeft, Plus, Trash2, Edit2, Eye, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function LostMetersCalc() {
  const [records, setRecords] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    breakdown_id: '',
    loom_speed: 0,
    downtime: 0,
    lost_meters: 0,
    lost_value: 0,
    delivery_impact: 0
  });

  const MOCK_RATE_PER_METER = 45; // ₹45

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, bdRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_lost_meters').catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_breakdown_entry').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setBreakdowns(bdRes?.data || []);
      setLooms(loomRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakdownChange = (e) => {
    const bdId = e.target.value;
    const bd = breakdowns.find(b => b.name === bdId || b.id.toString() === bdId);
    
    if (bd) {
      const loomName = bd.code;
      const loom = looms.find(l => l.loom_name === loomName);
      
      const speed = loom ? (loom.capacity_per_day / 24) : 25; // m/hr
      let downtime = 0;
      if (bd.extra_field_2) {
        downtime = parseFloat(bd.extra_field_2.replace(' hrs', '')) || 0;
      }
      
      const lostMeters = speed * downtime;
      const lostValue = lostMeters * MOCK_RATE_PER_METER;
      // 24 hours per day, lost impact = downtime / 24 or more specifically based on target
      const impact = downtime / 24; 

      setFormData({
        breakdown_id: bd.name,
        loom_speed: speed.toFixed(1),
        downtime: downtime,
        lost_meters: lostMeters.toFixed(1),
        lost_value: lostValue.toFixed(0),
        delivery_impact: impact.toFixed(2)
      });
    } else {
      setFormData({
        breakdown_id: '', loom_speed: 0, downtime: 0, lost_meters: 0, lost_value: 0, delivery_impact: 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_lost_meters', {
        name: `LMC-${formData.breakdown_id}`,
        code: formData.breakdown_id,
        extra_field_1: `${formData.lost_meters} m`,
        extra_field_2: `₹${formData.lost_value}`,
        description: `Delay: +${formData.delivery_impact} days | Speed: ${formData.loom_speed} m/hr`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving calculation.');
    }
  };

  const handleEdit = (record) => {
    // Mock parsing for edit
    setFormData({
      id: record.id,
      breakdown_id: record.code,
      loom_speed: parseFloat(record.description?.match(/Speed: (.*?) m\/hr/)?.[1] || 0).toFixed(1),
      downtime: 0, // In reality, we'd fetch this from the breakdown linked
      lost_meters: parseFloat(record.extra_field_1?.replace(' m', '')) || 0,
      lost_value: parseFloat(record.extra_field_2?.replace('₹', '')) || 0,
      delivery_impact: parseFloat(record.description?.match(/Delay: \+(.*?) days/)?.[1] || 0)
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculation?')) return;
    try {
      await subMasterAPI.delete('ppc_lost_meters', id);
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
              <div style={{ padding: 10, background: '#8b5cf618', borderRadius: 10, color: '#8b5cf6' }}>
                <Calculator size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Assess Breakdown Impact</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Automatically linked to breakdown logs</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Breakdown ID (Link)</label>
                <select className="form-control" value={formData.breakdown_id} onChange={handleBreakdownChange} required>
                  <option value="">-- Select Incident --</option>
                  {breakdowns.map(b => (
                    <option key={b.id} value={b.name || b.id}>{b.name || b.id} - {b.code}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loom Speed (m/hr) (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.loom_speed ? `${formData.loom_speed} m/hr` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Downtime (hrs) (Auto-fill)</label>
                <input type="text" className="form-control" value={formData.downtime ? `${formData.downtime} hrs` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="form-group">
                <label>Lost Meters (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.lost_meters ? `${formData.lost_meters} m` : ''} readOnly style={{ backgroundColor: formData.lost_meters > 0 ? '#ef444418' : 'var(--bg-secondary)', color: formData.lost_meters > 0 ? '#b91c1c' : 'inherit', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label>Lost Value (₹) (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.lost_value ? `₹${formData.lost_value}` : ''} readOnly style={{ backgroundColor: formData.lost_value > 0 ? '#ef444418' : 'var(--bg-secondary)', color: formData.lost_value > 0 ? '#b91c1c' : 'inherit', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label>Impact on Delivery (Auto-calc)</label>
                <input type="text" className="form-control" value={formData.delivery_impact ? `+${formData.delivery_impact} days delay` : ''} readOnly style={{ backgroundColor: formData.delivery_impact > 0 ? '#f59e0b18' : 'var(--bg-secondary)', color: formData.delivery_impact > 0 ? '#b45309' : 'inherit', fontWeight: 700 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Impact Analysis
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
            <Calculator style={{ color: '#8b5cf6' }} /> Lost Meters Calculation
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Translate downtime into exact production loss and delay metrics</p>
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
            <div style={{ background: '#ede9fe', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Calculator size={24} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Calculations</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <TrendingDown size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Lost Meters</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.reduce((sum, r) => sum + (parseFloat(r.extra_field_1?.replace(' m', '')) || 0), 0).toFixed(1)} <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>m</span>
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Calculated Impacts ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setFormData({ breakdown_id: '', loom_speed: 0, downtime: 0, lost_meters: 0, lost_value: 0, delivery_impact: 0 });
                  setIsFormOpen(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Plus size={16} /> New Calculation
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Calc ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Breakdown Ref</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Lost Meters</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Financial Impact</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Delivery Delay</th>
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
                    <td style={{ padding: '16px' }}><span style={{ color: '#b91c1c', fontWeight: 700 }}>{record.extra_field_1}</span></td>
                    <td style={{ padding: '16px' }}><span style={{ color: '#b91c1c', fontWeight: 700 }}>{record.extra_field_2}</span></td>
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
