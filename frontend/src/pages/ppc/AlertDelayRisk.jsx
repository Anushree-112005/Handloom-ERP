import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Save, ArrowLeft, Clock } from 'lucide-react';
import { buyerOrderAPI, ppcAPI, subMasterAPI } from '../../services/api';

export default function AlertDelayRisk() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    alert_id: '',
    date: new Date().toISOString().split('T')[0],
    order_id: '',
    buyer_name: '',
    loom_id: '',
    buyer_delivery_date: '',
    current_eta: '',
    delay_days: 0,
    risk_score: 0,
    risk_level: '🔴 High',
    trigger_condition: 'ETA exceeds delivery date',
    alert_triggered: 'Yes',

    // Reason
    primary_reason: 'Cumulative downtime',
    total_downtime: 0,
    lost_meters: 0,
    efficiency_drop: 0,
    required_rate: 0,
    current_rate: 0,
    rate_gap: 0,
    days_behind: 0,

    // Recovery
    recovery_opt_1: 'Add 1 more loom',
    recovery_opt_2: 'Run overtime (extra 2 hrs/day)',
    recovery_opt_3: 'Increase speed to 28 m/hr',
    revised_eta: '',
    action_selected: '',
    action_taken_by: 'Production Manager',
    action_date: new Date().toISOString().split('T')[0],

    // Message
    alert_title: '',
    alert_message: '',
    priority: '🔴 High',
    suggested_action: 'Add loom or run overtime',

    // Delivery
    sent_to: 'Production Manager / Planning Head',
    sent_via: ['App', 'SMS', 'Email'],
    sent_at: '',
    acknowledged_by: 'Planning Head',
    action_taken: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes] = await Promise.all([
        subMasterAPI.list('ppc_alert_delay_risk').catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setOrders(ordRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (e) => {
    const oId = e.target.value;
    const order = orders.find(o => o.order_no === oId || o.id.toString() === oId);
    
    if (order) {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 28);
      const etaDate = new Date();
      etaDate.setDate(etaDate.getDate() + 30); // 2 days late
      const delay = 2;

      setFormData({
        ...formData,
        alert_id: `DRA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        order_id: oId,
        buyer_name: order.party_name || 'H&M Sweden',
        loom_id: 'LM-002',
        
        buyer_delivery_date: deliveryDate.toISOString().split('T')[0],
        current_eta: etaDate.toISOString().split('T')[0],
        delay_days: delay,
        risk_score: 72,
        
        total_downtime: 18.5,
        lost_meters: 462,
        efficiency_drop: 12.4,
        required_rate: 480,
        current_rate: 398,
        rate_gap: -82,
        days_behind: delay,

        alert_title: `Delay risk — ${oId}`,
        alert_message: `Order ${oId} ETA is ${etaDate.toISOString().split('T')[0]}, delivery due ${deliveryDate.toISOString().split('T')[0]}. Delay: ${delay} days. Immediate action needed.`,
        sent_at: new Date().toLocaleString()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_alert_delay_risk', {
        name: formData.alert_id,
        code: formData.order_id,
        extra_field_1: `${formData.delay_days} days`,
        extra_field_2: formData.status,
        description: `Score: ${formData.risk_score} | Action: ${formData.action_taken}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving alert log.');
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
            <Clock style={{ color: '#ef4444' }} /> Delay Risk Alert Log
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Escalations for orders missing delivery dates</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => setIsFormOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#ef4444', borderColor: '#ef4444' }}
          >
            <AlertTriangle size={16} /> Simulate Risk Trigger
          </button>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsFormOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}
          >
            <ArrowLeft size={16} /> Back to Log
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#ef444418', borderRadius: 10, color: '#ef4444' }}>
                <Clock size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Schedule Violation</h3>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#ef444418', color: '#b91c1c', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.alert_id || 'DRA-NEW'}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Trigger Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" onChange={handleOrderChange} required>
                  <option value="">Select Order</option>
                  {orders.map(o => <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <input type="text" className="form-control" value={formData.loom_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Buyer Delivery</label>
                <input type="text" className="form-control" value={formData.buyer_delivery_date} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Current ETA</label>
                <input type="text" className="form-control" value={formData.current_eta} readOnly style={{ backgroundColor: '#ef444418', color: '#b91c1c', fontWeight: 700 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Reason & Root Cause</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Primary Reason</label>
                <input type="text" className="form-control" value={formData.primary_reason} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Total Downtime</label>
                <input type="text" className="form-control" value={`${formData.total_downtime} hrs`} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Rate Gap</label>
                <input type="text" className="form-control" value={`${formData.rate_gap} m/d`} readOnly style={{ backgroundColor: '#f59e0b18', color: '#b45309', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Days Behind</label>
                <input type="text" className="form-control" value={`${formData.days_behind} days`} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600, color: '#b91c1c' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Recovery Planning</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Action Selected</label>
                <select className="form-control" value={formData.action_selected} onChange={e => setFormData({...formData, action_selected: e.target.value})}>
                  <option value="">Select Action</option>
                  <option value={formData.recovery_opt_1}>{formData.recovery_opt_1}</option>
                  <option value={formData.recovery_opt_2}>{formData.recovery_opt_2}</option>
                  <option value={formData.recovery_opt_3}>{formData.recovery_opt_3}</option>
                </select>
              </div>
              <div className="form-group">
                <label>Revised ETA</label>
                <input type="date" className="form-control" value={formData.revised_eta} onChange={e => setFormData({...formData, revised_eta: e.target.value})} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. Delivery & Resolution</h4>
            <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ color: '#b91c1c' }}>{formData.alert_title}</strong>
                <span style={{ fontSize: 12, padding: '2px 8px', background: '#b91c1c', color: 'white', borderRadius: 12 }}>{formData.priority}</span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: 14 }}>{formData.alert_message}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ fontWeight: 600 }}>
                  <option value="Pending">🕐 Pending</option>
                  <option value="Resolved">✅ Resolved</option>
                  <option value="Critical">❌ Critical</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Action Taken Log</label>
                <input type="text" className="form-control" value={formData.action_taken} onChange={e => setFormData({...formData, action_taken: e.target.value})} placeholder="e.g. LM-006 added to order" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Alert Log
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Delay Risk Incidents ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" style={{ paddingLeft: 36 }} />
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Order ID</th>
                  <th>Delay</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No delay risks!</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td><span style={{ fontWeight: 700 }}>{record.code}</span></td>
                    <td style={{ color: '#b91c1c', fontWeight: 600 }}>{record.extra_field_1}</td>
                    <td style={{ fontWeight: 700 }}>{record.extra_field_2}</td>
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
