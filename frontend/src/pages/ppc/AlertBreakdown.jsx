import React, { useState, useEffect } from 'react';
import { Wrench, Search, Save, ArrowLeft, AlertOctagon, Settings, CheckCircle } from 'lucide-react';
import { ppcAPI, subMasterAPI } from '../../services/api';

export default function AlertBreakdown() {
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
    
    // Breakdown specific
    breakdown_id: 'BD-001',
    breakdown_start: '11:00 AM',
    reason_category: 'Mechanical',
    reason_details: 'Reed wire broken',
    trigger_condition: 'Loom status changed to Breakdown',
    alert_triggered: 'Yes',
    
    // Impact
    loom_speed: 25,
    est_repair_time: 1.5,
    expected_lost_meters: 37.5,
    loss_value: 1687,
    impact_eta: 0.09,
    reallocation_needed: 'Yes',
    suggested_loom: 'LM-005',

    // Message
    alert_title: '',
    alert_message: '',
    priority: '🔴 High',
    suggested_action: 'Send maintenance team immediately',

    // Delivery
    sent_to: 'Maintenance Team / Production Manager',
    sent_via: ['App', 'SMS'],
    sent_at: '',
    maintenance_notified: 'Yes',
    maintenance_arrived_at: '11:10 AM',
    repair_completed_at: '12:30 PM',
    total_downtime: 1.5,
    acknowledged_by: 'Maintenance Head',
    status: 'In Progress'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_alert_breakdown').catch(() => ({ data: [] })),
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
      setFormData({
        ...formData,
        alert_id: `BDA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        loom_id: lId,
        loom_name: loom.loom_name,
        order_id: 'ORD-2024-001',
        date_time: new Date().toLocaleString(),
        
        alert_title: `Breakdown on ${loom.loom_name}`,
        alert_message: `${loom.loom_name} broke down. Reason: ${formData.reason_category}. Est. repair: ${formData.est_repair_time} hrs. Lost: ${formData.expected_lost_meters} m`,
        sent_at: new Date().toLocaleString()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_alert_breakdown', {
        name: formData.alert_id,
        code: formData.loom_name,
        extra_field_1: formData.reason_category,
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
            <AlertOctagon style={{ color: '#b91c1c' }} /> Breakdown Alert
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Instant escalation for machine stoppages</p>
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
            <div style={{ background: '#fef2f2', padding: 12, borderRadius: 12, display: 'flex' }}>
              <AlertOctagon size={24} style={{ color: '#b91c1c' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Active Breakdowns</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.filter(r => !r.extra_field_2?.includes('Resolved')).length}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#fef3c7', padding: 12, borderRadius: 12, display: 'flex' }}>
              <Settings size={24} style={{ color: '#d97706' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>In Progress</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {records.filter(r => r.extra_field_2?.includes('In Progress')).length}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: '#d1fae5', padding: 12, borderRadius: 12, display: 'flex' }}>
              <CheckCircle size={24} style={{ color: '#059669' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Resolved Today</div>
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
              <div style={{ padding: 10, background: '#ef444418', borderRadius: 10, color: '#b91c1c' }}>
                <AlertOctagon size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Breakdown Incident Log</h3>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#ef444418', color: '#991b1b', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.alert_id || 'BDA-NEW'}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Trigger Details</h4>
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
                <label>Category</label>
                <input type="text" className="form-control" value={formData.reason_category} onChange={e => setFormData({...formData, reason_category: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Details</label>
                <input type="text" className="form-control" value={formData.reason_details} onChange={e => setFormData({...formData, reason_details: e.target.value})} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Impact Assessment</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Est Repair (hrs)</label>
                <input type="number" step="0.1" className="form-control" value={formData.est_repair_time} onChange={e => setFormData({...formData, est_repair_time: e.target.value})} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Expected Loss (m)</label>
                <input type="text" className="form-control" value={formData.expected_lost_meters} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Loss Value (₹)</label>
                <input type="text" className="form-control" value={`₹${formData.loss_value}`} readOnly style={{ backgroundColor: '#f59e0b18', color: '#b45309', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Reallocation Needed?</label>
                <select className="form-control" value={formData.reallocation_needed} onChange={e => setFormData({...formData, reallocation_needed: e.target.value})}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Suggested Loom</label>
                <input type="text" className="form-control" value={formData.suggested_loom} onChange={e => setFormData({...formData, suggested_loom: e.target.value})} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Message & Delivery Log</h4>
            <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ color: '#b91c1c' }}>{formData.alert_title}</strong>
                <span style={{ fontSize: 12, padding: '2px 8px', background: '#b91c1c', color: 'white', borderRadius: 12 }}>{formData.priority}</span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: 14 }}>{formData.alert_message}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ fontWeight: 600 }}>
                  <option value="Pending">❌ Pending</option>
                  <option value="In Progress">🕐 In Progress</option>
                  <option value="Resolved">✅ Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label>Arrived At</label>
                <input type="text" className="form-control" value={formData.maintenance_arrived_at} onChange={e => setFormData({...formData, maintenance_arrived_at: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Completed At</label>
                <input type="text" className="form-control" value={formData.repair_completed_at} onChange={e => setFormData({...formData, repair_completed_at: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Acknowledged By</label>
                <input type="text" className="form-control" value={formData.acknowledged_by} onChange={e => setFormData({...formData, acknowledged_by: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#b91c1c', borderColor: '#b91c1c' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Update Alert log
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Breakdown Escalations ({filteredRecords.length})</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="search-bar" style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" style={{ paddingLeft: 36 }} />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsFormOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#b91c1c', borderColor: '#b91c1c', color: '#fff', borderRadius: '8px', fontWeight: 500 }}
              >
                <Wrench size={16} /> Simulate Breakdown
              </button>
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg-secondary)' }}>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Alert ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Loom ID</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Message</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No breakdown alerts!</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</td>
                    <td style={{ padding: '16px' }}><span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{record.code}</span></td>
                    <td style={{ padding: '16px', color: '#b91c1c', fontWeight: 600 }}>{record.extra_field_1}</td>
                    <td style={{ padding: '16px', fontWeight: 700 }}>{record.extra_field_2}</td>
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
