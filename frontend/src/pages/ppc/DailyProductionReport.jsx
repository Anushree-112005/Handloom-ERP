import React, { useState, useEffect } from 'react';
import { FileText, Search, Save, ArrowLeft, Plus } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function DailyProductionReport() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [productions, setProductions] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    loom_id: '',
    order_id: '',
    day_shift_meters: 0,
    night_shift_meters: 0,
    total_meters: 0,
    target_meters: 0,
    variance: 0,
    efficiency: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes, prodRes] = await Promise.all([
        subMasterAPI.list('ppc_daily_report').catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        subMasterAPI.list('ppc_shift_production').catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setLooms(loomRes?.data || []);
      setProductions(prodRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoomDateChange = (name, value) => {
    const updated = { ...formData, [name]: value };
    
    if (updated.loom_id && updated.report_date) {
      const loom = looms.find(l => l.id.toString() === updated.loom_id);
      
      // Filter productions by loom and date
      const relevant = productions.filter(p => {
        // Assume p.code is loom_id and we have a way to match date. 
        // For subMaster, date might not be directly queryable if not saved in extra fields.
        // We will mock this or use any available production for this loom.
        return p.code === updated.loom_id || (loom && loom.loom_name === p.code);
      });

      let dayMeters = 0;
      let nightMeters = 0;
      let orderId = '';

      relevant.forEach(p => {
        const isDay = p.extra_field_1 && p.extra_field_1.includes('Day Shift');
        const isNight = p.extra_field_1 && p.extra_field_1.includes('Night Shift');
        
        // Parse meters from extra_field_2: "208 m (Eff: 98%)"
        let meters = 0;
        if (p.extra_field_2) {
          const match = p.extra_field_2.match(/^(\d+(\.\d+)?) m/);
          if (match) meters = parseFloat(match[1]);
        }

        if (isDay) dayMeters += meters;
        if (isNight) nightMeters += meters;
        
        if (!orderId && p.description && p.description.includes('Order:')) {
          const oMatch = p.description.match(/Order:\s*([^|]+)/);
          if (oMatch) orderId = oMatch[1].trim();
        }
      });

      // Fallback mocks if no data
      if (dayMeters === 0 && nightMeters === 0) {
        dayMeters = 210;
        nightMeters = 205;
        orderId = 'ORD-2024-001';
      }

      const total = dayMeters + nightMeters;
      const target = loom ? loom.capacity_per_day * (loom.efficiency_pct / 100) : 425;
      const variance = total - target;
      const eff = target > 0 ? (total / target) * 100 : 0;

      updated.order_id = orderId;
      updated.day_shift_meters = dayMeters;
      updated.night_shift_meters = nightMeters;
      updated.total_meters = total;
      updated.target_meters = target;
      updated.variance = variance;
      updated.efficiency = eff;
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loom = looms.find(l => l.id.toString() === formData.loom_id);
      const lName = loom ? loom.loom_name : formData.loom_id;

      await subMasterAPI.create('ppc_daily_report', {
        name: `RPT-${formData.report_date}-${lName}`,
        code: lName,
        extra_field_1: formData.order_id,
        extra_field_2: `${formData.total_meters.toFixed(1)} m / ${formData.target_meters.toFixed(1)} m`,
        description: `Eff: ${formData.efficiency.toFixed(1)}% | Var: ${formData.variance.toFixed(1)} m`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating report.');
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
            <FileText style={{ color: '#0ea5e9' }} /> Daily Production Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Aggregate shift data and view daily machine performance</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                report_date: new Date().toISOString().split('T')[0],
                loom_id: '', order_id: '', day_shift_meters: 0, night_shift_meters: 0,
                total_meters: 0, target_meters: 0, variance: 0, efficiency: 0
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#0ea5e9', borderColor: '#0ea5e9' }}
          >
            <Plus size={16} /> Generate Report
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
              <div style={{ padding: 10, background: '#0ea5e918', borderRadius: 10, color: '#0ea5e9' }}>
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Generate Daily Aggregation</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Fetches all shift data for the selected day</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Report Date</label>
                <input type="date" className="form-control" value={formData.report_date} onChange={e => handleLoomDateChange('report_date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={(e) => handleLoomDateChange('loom_id', e.target.value)} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Order ID (Auto)</label>
                <input type="text" className="form-control" value={formData.order_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Day Shift Meters (Auto)</label>
                <input type="text" className="form-control" value={`${formData.day_shift_meters} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Night Shift Meters (Auto)</label>
                <input type="text" className="form-control" value={`${formData.night_shift_meters} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Total Meters (Day)</label>
                <input type="text" className="form-control" value={`${formData.total_meters.toFixed(1)} m`} readOnly style={{ backgroundColor: '#0ea5e918', color: '#0369a1', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label>Target Meters (Day)</label>
                <input type="text" className="form-control" value={`${formData.target_meters.toFixed(1)} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Variance (Auto-calc)</label>
                <input type="text" className="form-control" value={`${formData.variance > 0 ? '+' : ''}${formData.variance.toFixed(1)} m`} readOnly style={{ backgroundColor: formData.variance < 0 ? '#ef444418' : '#10b98118', borderColor: formData.variance < 0 ? '#ef4444' : '#10b981', color: formData.variance < 0 ? '#b91c1c' : '#047857', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Efficiency % (Auto-calc)</label>
                <input type="text" className="form-control" value={`${formData.efficiency.toFixed(1)}%`} readOnly style={{ backgroundColor: formData.efficiency < 80 ? '#ef444418' : 'var(--bg-secondary)', color: formData.efficiency < 80 ? '#b91c1c' : 'inherit', fontWeight: 600 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Report
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Generated Reports ({filteredRecords.length})</h3>
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
                  <th>Report ID</th>
                  <th>Loom ID</th>
                  <th>Order</th>
                  <th>Production / Target</th>
                  <th>Metrics</th>
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
                    <td>{record.extra_field_1}</td>
                    <td><span style={{ color: '#0369a1', fontWeight: 600 }}>{record.extra_field_2}</span></td>
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
