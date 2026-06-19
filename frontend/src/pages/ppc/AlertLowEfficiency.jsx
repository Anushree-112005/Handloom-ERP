import React, { useState, useEffect } from 'react';
import { Activity, Search, Save, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../services/api';

export default function AlertLowEfficiency() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    alert_id: '',
    date_time: new Date().toLocaleString(),
    loom_id: '',
    loom_name: '',
    order_id: '',
    shift: 'Day',
    operator_name: 'Ramesh Kumar',
    
    // Trigger
    std_efficiency: 85,
    threshold_limit: 75,
    current_efficiency: 0,
    efficiency_drop: 0,
    trigger_condition: 'Below 75% threshold',
    alert_triggered: 'Yes',
    
    // Loss
    target_meters: 212,
    actual_meters: 0,
    loss_meters: 0,
    loss_value: 0,
    downtime: 0,
    speed_drop: 0,
    reason: 'Yarn Break',
    impact_eta: 0,

    // Message
    alert_title: '',
    alert_message: '',
    priority: '🔴 High',
    suggested_action: 'Check yarn quality / operator / machine speed',

    // Delivery
    sent_to: 'Production Manager / Maintenance',
    sent_via: ['App', 'SMS'],
    sent_at: '',
    read_at: '',
    acknowledged_by: '',
    action_taken: '',
    resolved_at: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_alert_low_eff').catch(() => ({ data: [] })),
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

  const handleLoomChange = (e) => {
    const lId = e.target.value;
    const loom = looms.find(l => l.id.toString() === lId);
    
    if (loom) {
      const currEff = Math.floor(Math.random() * 20 + 50); // 50-70%
      const drop = currEff - 85;
      const actual = Math.floor(212 * (currEff / 100));
      const loss = 212 - actual;
      const val = loss * 45; // 45 per meter
      const dt = Math.floor(Math.random() * 30) / 10 + 0.5; // 0.5 - 3.5 hrs
      
      setFormData({
        ...formData,
        alert_id: `LEA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        loom_id: lId,
        loom_name: loom.loom_name,
        order_id: 'ORD-2024-001',
        date_time: new Date().toLocaleString(),
        
        current_efficiency: currEff,
        efficiency_drop: drop,
        actual_meters: actual,
        loss_meters: loss,
        loss_value: val,
        downtime: dt,
        speed_drop: -Math.floor(Math.random() * 10 + 2),
        impact_eta: +(dt / 24).toFixed(2),
        
        alert_title: `Low efficiency on ${loom.loom_name}`,
        alert_message: `${loom.loom_name} efficiency dropped to ${currEff}% in Day shift. Target: 85%. Loss: ${loss} m`,
        sent_at: new Date().toLocaleString()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_alert_low_eff', {
        name: formData.alert_id,
        code: formData.loom_name,
        extra_field_1: `${formData.current_efficiency}%`,
        extra_field_2: formData.status,
        description: formData.alert_message,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving alert.');
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
            <Activity style={{ color: '#ef4444' }} /> Low Efficiency Alert
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Triggered when production falls below standard threshold limits</p>
        </div>
        {isFormOpen && (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to Log
          </button>
        )}
      </div>

      {!isFormOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Activity size={24} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Alerts</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{records.length}</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fef3c7', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Clock size={24} style={{ color: '#d97706' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Resolution</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.filter(r => !r.extra_field_2?.includes('Resolved')).length}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#d1fae5', padding: 12, borderRadius: 12, display: 'flex' }}>
              <CheckCircle2 size={24} style={{ color: '#059669' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Resolved Alerts</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.filter(r => r.extra_field_2?.includes('Resolved')).length}
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#ef444418', borderRadius: 10, color: '#ef4444' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Alert Details & Impact</h3>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#ef444418', color: '#b91c1c', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.alert_id || 'LEA-NEW'}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Alert Trigger</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" onChange={handleLoomChange} required>
                  <option value="">Select Loom</option>
                  {looms.map(l => <option key={l.id} value={l.id}>{l.loom_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Order ID</label>
                <input type="text" className="form-control" value={formData.order_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Standard Eff %</label>
                <input type="text" className="form-control" value={`${formData.std_efficiency}%`} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Current Eff %</label>
                <input type="text" className="form-control" value={formData.current_efficiency ? `${formData.current_efficiency}%` : ''} readOnly style={{ backgroundColor: '#ef444418', color: '#b91c1c', fontWeight: 700 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Loss Impact</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Target Meters</label>
                <input type="text" className="form-control" value={formData.target_meters} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Actual Meters</label>
                <input type="text" className="form-control" value={formData.actual_meters} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Loss Meters</label>
                <input type="text" className="form-control" value={formData.loss_meters} readOnly style={{ backgroundColor: '#f59e0b18', color: '#b45309', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Loss Value (₹)</label>
                <input type="text" className="form-control" value={`₹${formData.loss_value}`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>ETA Impact</label>
                <input type="text" className="form-control" value={`+${formData.impact_eta} days`} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Message & Delivery</h4>
            <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ color: '#b91c1c' }}>{formData.alert_title}</strong>
                <span style={{ fontSize: 12, padding: '2px 8px', background: '#ef4444', color: 'white', borderRadius: 12 }}>{formData.priority}</span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: 14 }}>{formData.alert_message}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Suggested Action: {formData.suggested_action}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ fontWeight: 600, color: formData.status === 'Resolved' ? '#047857' : '#b91c1c' }}>
                  <option value="Pending">🕐 Pending</option>
                  <option value="Resolved">✅ Resolved</option>
                  <option value="Missed">❌ Missed</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label>Action Taken to Resolve</label>
                <input type="text" className="form-control" value={formData.action_taken} onChange={e => setFormData({...formData, action_taken: e.target.value})} placeholder="e.g. Yarn replaced, speed restored" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Alert Status
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Alert History ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" style={{ paddingLeft: 36 }} />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsFormOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#ef4444', borderColor: '#ef4444', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <AlertTriangle size={16} /> Simulate Alert
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Alert ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Loom ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Efficiency</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Message</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No low efficiency alerts!</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                    <td style={{ padding: '16px' }}><span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{record.code}</span></td>
                    <td style={{ padding: '16px', color: '#b91c1c', fontWeight: 600 }}>{record.extra_field_1}</td>
                    <td style={{ padding: '16px', fontWeight: 700, color: record.extra_field_2?.includes('Resolved') ? '#047857' : '#b91c1c' }}>{record.extra_field_2}</td>
                    <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>{record.description}</td>
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
