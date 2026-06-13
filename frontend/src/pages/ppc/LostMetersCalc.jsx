import React, { useState, useEffect } from 'react';
import { Calculator, Search, Save, ArrowLeft, Plus } from 'lucide-react';
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

  const filteredRecords = records.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator style={{ color: '#8b5cf6' }} /> Lost Meters Calculation
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Translate downtime into exact production loss and delay metrics</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({ breakdown_id: '', loom_speed: 0, downtime: 0, lost_meters: 0, lost_value: 0, delivery_impact: 0 });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#8b5cf6', borderColor: '#8b5cf6' }}
          >
            <Plus size={16} /> New Calculation
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
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Calculated Impacts ({filteredRecords.length})</h3>
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
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Calc ID</th>
                  <th>Breakdown Ref</th>
                  <th>Lost Meters</th>
                  <th>Financial Impact</th>
                  <th>Delivery Delay</th>
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
                    <td><span style={{ color: '#b91c1c', fontWeight: 700 }}>{record.extra_field_1}</span></td>
                    <td><span style={{ color: '#b91c1c', fontWeight: 700 }}>{record.extra_field_2}</span></td>
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
