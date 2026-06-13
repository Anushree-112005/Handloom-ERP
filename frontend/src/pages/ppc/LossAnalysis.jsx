import React, { useState, useEffect } from 'react';
import { TrendingDown, Search, Save, ArrowLeft, Plus } from 'lucide-react';
import { subMasterAPI, ppcAPI } from '../../services/api';

export default function LossAnalysis() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    loom_id: '',
    total_loss_meters: 0,
    loss_reason: 'Yarn Break',
    downtime_hours: '',
    loss_value: 0,
    action_taken: ''
  });

  const MOCK_RATE_PER_METER = 45; // ₹45 per meter mock

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_loss_analysis').catch(() => ({ data: [] })),
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

  const handleRecalc = (name, value) => {
    const updated = { ...formData, [name]: value };
    
    if (updated.loom_id && updated.downtime_hours) {
      const loom = looms.find(l => l.id.toString() === updated.loom_id);
      const capPerDay = loom ? loom.capacity_per_day : 500;
      const speedPerHour = capPerDay / 24;
      
      const hours = parseFloat(updated.downtime_hours) || 0;
      const lossMeters = hours * speedPerHour;
      const lossValue = lossMeters * MOCK_RATE_PER_METER;

      updated.total_loss_meters = lossMeters;
      updated.loss_value = lossValue;
    } else {
      updated.total_loss_meters = 0;
      updated.loss_value = 0;
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loom = looms.find(l => l.id.toString() === formData.loom_id);
      const lName = loom ? loom.loom_name : formData.loom_id;

      await subMasterAPI.create('ppc_loss_analysis', {
        name: `${formData.date}-${lName}`,
        code: formData.loss_reason,
        extra_field_1: `${formData.total_loss_meters.toFixed(1)} m loss`,
        extra_field_2: `₹${formData.loss_value.toFixed(0)}`,
        description: `Downtime: ${formData.downtime_hours} hrs | Action: ${formData.action_taken}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating loss record.');
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
            <TrendingDown style={{ color: '#ef4444' }} /> Loss Analysis
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Quantify production loss and financial impact of machine downtime</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split('T')[0],
                loom_id: '', total_loss_meters: 0, loss_reason: 'Yarn Break',
                downtime_hours: '', loss_value: 0, action_taken: ''
              });
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#ef4444', borderColor: '#ef4444' }}
          >
            <Plus size={16} /> Log Downtime
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
              <div style={{ padding: 10, background: '#ef444418', borderRadius: 10, color: '#ef4444' }}>
                <TrendingDown size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Record Production Loss</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Translate downtime hours into meter and financial losses</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-control" value={formData.date} onChange={e => handleRecalc('date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={(e) => handleRecalc('loom_id', e.target.value)} required>
                  <option value="">-- Select Loom --</option>
                  {looms.map(l => (
                    <option key={l.id} value={l.id}>{l.loom_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Loss Reason</label>
                <select className="form-control" value={formData.loss_reason} onChange={e => handleRecalc('loss_reason', e.target.value)} required>
                  <option value="Yarn Break">Yarn Break</option>
                  <option value="Power Failure">Power Failure</option>
                  <option value="Mechanical Breakdown">Mechanical Breakdown</option>
                  <option value="Scheduled Maintenance">Scheduled Maintenance</option>
                  <option value="Operator Absence">Operator Absence</option>
                </select>
              </div>
              <div className="form-group">
                <label>Downtime Hours</label>
                <input type="number" step="0.1" className="form-control" value={formData.downtime_hours} onChange={e => handleRecalc('downtime_hours', e.target.value)} required placeholder="e.g. 0.4" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Total Loss (meters) (Auto-calc)</label>
                <input type="text" className="form-control" value={`${formData.total_loss_meters.toFixed(1)} m`} readOnly style={{ backgroundColor: formData.total_loss_meters > 0 ? '#ef444418' : 'var(--bg-secondary)', color: formData.total_loss_meters > 0 ? '#b91c1c' : 'inherit', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Loss Value (₹) (Auto-calc)</label>
                <input type="text" className="form-control" value={`₹${formData.loss_value.toFixed(0)}`} readOnly style={{ backgroundColor: formData.loss_value > 0 ? '#ef444418' : 'var(--bg-secondary)', borderColor: formData.loss_value > 0 ? '#ef4444' : 'var(--border)', color: formData.loss_value > 0 ? '#b91c1c' : 'inherit', fontWeight: 700 }} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Action Taken</label>
              <input type="text" className="form-control" value={formData.action_taken} onChange={e => setFormData({...formData, action_taken: e.target.value})} placeholder="e.g. Yarn replaced, maintenance called" required />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Log Financial Loss
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Loss Logs ({filteredRecords.length})</h3>
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
                  <th>Record ID</th>
                  <th>Reason</th>
                  <th>Lost Production</th>
                  <th>Financial Impact</th>
                  <th>Action</th>
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
                    <td>
                      <span style={{ 
                        color: '#b91c1c', fontWeight: 600, backgroundColor: '#ef444420', 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12 
                      }}>
                        {record.code}
                      </span>
                    </td>
                    <td><span style={{ fontWeight: 600 }}>{record.extra_field_1}</span></td>
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
