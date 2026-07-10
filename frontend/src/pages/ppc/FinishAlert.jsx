import React, { useState, useEffect } from 'react';
import { Bell, Search, Save, ArrowLeft, Plus, Settings, MessageSquare, AlertCircle } from 'lucide-react';
import { buyerOrderAPI, ppcAPI, subMasterAPI } from '../../services/api';

export default function FinishAlert() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    alert_id: '',
    order_id: '',
    buyer_name: '',
    loom_id: '',
    trigger_type: 'Days Before Finish',
    trigger_value: 1,
    alert_channel: ['App', 'SMS'],
    alert_recipients: ['Production Manager'],

    // Status
    planned_finish_date: '',
    todays_date: new Date().toISOString().split('T')[0],
    days_to_finish: 0,
    remaining_meters: 0,
    completion_pct: 0,
    alert_triggered: 'Yes',
    trigger_reason: '1 day before finish',
    alert_triggered_at: '',

    // Message
    alert_title: '',
    alert_message: '',
    priority: '🔴 High',
    next_order_available: 'Yes',
    next_order_id: '',
    suggested_action: '',

    // Log
    sent_to: '',
    sent_via: '',
    sent_at: '',
    read_at: '',
    acknowledged_by: '',
    acknowledged_at: '',
    action_taken: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_finish_alert_log').catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setOrders(ordRes?.data || []);
      setLooms(loomRes?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoomOrderChange = () => {
    // Mock simulation
    const compPct = 95;
    const remain = 3800;
    const days = 1;
    const eta = new Date();
    eta.setDate(eta.getDate() + 1);
    
    setFormData({
      ...formData,
      planned_finish_date: eta.toISOString().split('T')[0],
      days_to_finish: days,
      remaining_meters: remain,
      completion_pct: compPct,
      alert_triggered: 'Yes',
      trigger_reason: `${days} day before finish`,
      alert_triggered_at: new Date(Date.now() - 3600000).toLocaleString(),
      
      alert_title: `Loom ${formData.loom_id} finishing tomorrow`,
      alert_message: `${formData.loom_id} will complete ${formData.order_id} on ${eta.toISOString().split('T')[0]}. Next order assignment required.`,
      next_order_id: 'ORD-2024-002',
      suggested_action: `Assign ORD-2024-002 to ${formData.loom_id} from ${eta.toISOString().split('T')[0]}`,
      
      sent_to: 'Murugan S (Supervisor)',
      sent_via: formData.alert_channel.join(' + '),
      sent_at: new Date(Date.now() - 3600000).toLocaleString()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_finish_alert_log', {
        name: formData.alert_id,
        code: formData.loom_id,
        extra_field_1: formData.order_id,
        extra_field_2: formData.status,
        description: `Message: ${formData.alert_title} | Action: ${formData.action_taken}`,
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

  if (isFormOpen) {
    return (
      <div className="animate-fade" style={{ height: '100%' }}>
        <div className="card animate-fade" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, background: '#f59e0b18', borderRadius: 10, color: '#f59e0b' }}>
                <Settings size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Alert Rule Editor</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Define when and how finish alerts are triggered</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#f59e0b18', color: '#b45309', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.alert_id}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24, overflowX: 'hidden' }}>
            
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Alert Setup</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" value={formData.order_id} onChange={e => {setFormData({...formData, order_id: e.target.value}); handleLoomOrderChange();}}>
                  <option value="">Select Order</option>
                  {orders.map(o => <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Loom ID</label>
                <select className="form-control" value={formData.loom_id} onChange={e => {setFormData({...formData, loom_id: e.target.value}); handleLoomOrderChange();}}>
                  <option value="">Select Loom</option>
                  {looms.map(l => <option key={l.id} value={l.loom_name}>{l.loom_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Trigger Type</label>
                <select className="form-control" value={formData.trigger_type} onChange={e => setFormData({...formData, trigger_type: e.target.value})}>
                  <option value="Days Before Finish">Days Before Finish</option>
                  <option value="% Completion">% Completion</option>
                  <option value="Meters Remaining">Meters Remaining</option>
                </select>
              </div>
              <div className="form-group">
                <label>Trigger Value</label>
                <input type="text" className="form-control" value={formData.trigger_value} onChange={e => setFormData({...formData, trigger_value: e.target.value})} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Trigger Status</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Planned Finish Date</label>
                <input type="text" className="form-control" value={formData.planned_finish_date} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Days to Finish</label>
                <input type="text" className="form-control" value={formData.days_to_finish} readOnly style={{ backgroundColor: '#f59e0b18', color: '#b45309', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Remaining Meters</label>
                <input type="text" className="form-control" value={formData.remaining_meters} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Completion %</label>
                <input type="text" className="form-control" value={formData.completion_pct ? `${formData.completion_pct}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Alert Triggered?</label>
                <input type="text" className="form-control" value={formData.alert_triggered} readOnly style={{ backgroundColor: formData.alert_triggered === 'Yes' ? '#10b98118' : 'var(--bg-secondary)', color: formData.alert_triggered === 'Yes' ? '#047857' : 'inherit', fontWeight: 700 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} /> 3. Alert Message
            </h4>
            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <strong style={{ fontSize: 16 }}>{formData.alert_title}</strong>
                <span style={{ padding: '2px 8px', background: '#ef444420', color: '#b91c1c', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{formData.priority}</span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>{formData.alert_message}</p>
              <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                <span style={{ padding: '4px 8px', background: '#10b98120', color: '#047857', borderRadius: 4, fontWeight: 600 }}>Next Available: {formData.next_order_available} ({formData.next_order_id})</span>
                <span style={{ padding: '4px 8px', background: '#3b82f620', color: '#1d4ed8', borderRadius: 4 }}>Action: {formData.suggested_action}</span>
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. Alert Log & Acknowledgement</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Sent To</label>
                <input type="text" className="form-control" value={formData.sent_to} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Sent Via</label>
                <input type="text" className="form-control" value={formData.sent_via} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Sent At</label>
                <input type="text" className="form-control" value={formData.sent_at} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ fontWeight: 600, color: formData.status === 'Resolved' ? '#047857' : '#b45309' }}>
                  <option value="Pending">🕐 Pending</option>
                  <option value="Resolved">✅ Resolved</option>
                  <option value="Missed">❌ Missed</option>
                </select>
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Action Taken to Resolve</label>
              <input type="text" className="form-control" value={formData.action_taken} onChange={e => setFormData({...formData, action_taken: e.target.value})} placeholder="e.g. ORD-2024-002 assigned to LM-001" />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Alert Log
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
            <Bell style={{ color: '#f59e0b' }} /> Finish Alert Configuration
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Configure and track automated completion warnings</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setFormData({...formData, alert_id: `FA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`});
              setIsFormOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f59e0b', borderColor: '#f59e0b', color: 'white' }}
          >
            <Plus size={16} /> Setup New Alert
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


        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Alert History & Configurations ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by ID or Loom..."
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
                  <th>Alert ID</th>
                  <th>Loom ID</th>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No configurations found</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td><span style={{ fontWeight: 700, color: '#f59e0b' }}>{record.code}</span></td>
                    <td>{record.extra_field_1}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: record.extra_field_2?.includes('Resolved') ? '#047857' : '#b45309' }}>
                        {record.extra_field_2}
                      </span>
                    </td>
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
