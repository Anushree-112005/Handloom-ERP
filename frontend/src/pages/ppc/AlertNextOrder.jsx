import React, { useState, useEffect } from 'react';
import { Layers, Search, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { buyerOrderAPI, ppcAPI, subMasterAPI } from '../../services/api';

export default function AlertNextOrder() {
  const [records, setRecords] = useState([]);
  const [looms, setLooms] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    alert_id: '',
    date: new Date().toISOString().split('T')[0],
    loom_id: '',
    loom_name: '',
    current_order_id: 'ORD-2024-001',
    remaining_meters: 500,
    expected_finish_date: '',
    days_to_free: 1,
    trigger_condition: 'Loom finishing in 1 day',
    alert_triggered: 'Yes',

    // Next Order
    pending_orders: 3,
    next_order_id: 'ORD-2024-002',
    next_buyer: 'Marks & Spencer UK',
    next_fabric: 'Cotton Twill',
    next_meters: 15000,
    next_priority: 'High',
    next_delivery: '',
    suitability: '✅ Compatible',
    suggested_start: '',
    prep_time: '1 day (beam change + setup)',

    // Message
    alert_title: '',
    alert_message: '',
    priority: '🟡 Medium',
    suggested_action: 'Confirm assignment of next order',

    // Delivery
    sent_to: 'Production Planner / Supervisor',
    sent_via: ['App', 'SMS', 'Email'],
    sent_at: '',
    acknowledged_by: 'Production Planner',
    assignment_confirmed: 'No',
    confirmed_by: '',
    confirmed_at: '',
    next_assigned_from: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, loomRes] = await Promise.all([
        subMasterAPI.list('ppc_alert_next_order').catch(() => ({ data: [] })),
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
      const finishDate = new Date();
      finishDate.setDate(finishDate.getDate() + 1);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 35);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 2); // 1 day prep

      setFormData({
        ...formData,
        alert_id: `NOA-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        loom_id: lId,
        loom_name: loom.loom_name,
        
        expected_finish_date: finishDate.toISOString().split('T')[0],
        next_delivery: deliveryDate.toISOString().split('T')[0],
        suggested_start: startDate.toISOString().split('T')[0],
        
        alert_title: `${loom.loom_name} free tomorrow — assign next order`,
        alert_message: `${loom.loom_name} will complete ORD-2024-001 on ${finishDate.toISOString().split('T')[0]}. Next order ORD-2024-002 (M&S UK — 15,000 m) ready to assign from ${startDate.toISOString().split('T')[0]}.`,
        sent_at: new Date().toLocaleString()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_alert_next_order', {
        name: formData.alert_id,
        code: formData.loom_name,
        extra_field_1: formData.next_order_id,
        extra_field_2: formData.status,
        description: `Start: ${formData.suggested_start} | Confirmed: ${formData.assignment_confirmed}`,
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
            <ArrowRight style={{ color: '#0ea5e9' }} /> Next Order Alert
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Proactively line up work for machines finishing soon</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => setIsFormOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#0ea5e9', borderColor: '#0ea5e9' }}
          >
            <Layers size={16} /> Assign Next Order
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
              <div style={{ padding: 10, background: '#0ea5e918', borderRadius: 10, color: '#0ea5e9' }}>
                <ArrowRight size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Assignment Workflow</h3>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#0ea5e918', color: '#0369a1', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.alert_id || 'NOA-NEW'}
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
                <label>Current Order</label>
                <input type="text" className="form-control" value={formData.current_order_id} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Expected Finish</label>
                <input type="text" className="form-control" value={formData.expected_finish_date} readOnly style={{ backgroundColor: '#10b98118', color: '#047857', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label>Days to Free</label>
                <input type="text" className="form-control" value={formData.days_to_free} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 700 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Recommended Next Order</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Next Order ID</label>
                <input type="text" className="form-control" value={formData.next_order_id} readOnly style={{ backgroundColor: '#0ea5e918', color: '#0369a1', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Next Buyer</label>
                <input type="text" className="form-control" value={formData.next_buyer} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Next Meters</label>
                <input type="text" className="form-control" value={`${formData.next_meters.toLocaleString()} m`} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Suitability</label>
                <input type="text" className="form-control" value={formData.suitability} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Suggested Start</label>
                <input type="text" className="form-control" value={formData.suggested_start} readOnly style={{ backgroundColor: '#10b98118', color: '#047857', fontWeight: 700 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Alert Message</h4>
            <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ color: '#0369a1' }}>{formData.alert_title}</strong>
                <span style={{ fontSize: 12, padding: '2px 8px', background: '#f59e0b', color: 'white', borderRadius: 12 }}>{formData.priority}</span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: 14 }}>{formData.alert_message}</p>
            </div>
            
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. Action & Resolution</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label>Assignment Confirmed?</label>
                <select className="form-control" value={formData.assignment_confirmed} onChange={e => setFormData({...formData, assignment_confirmed: e.target.value})}>
                  <option value="No">❌ No</option>
                  <option value="Yes">✅ Yes</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assigned From Date</label>
                <input type="date" className="form-control" value={formData.next_assigned_from} onChange={e => setFormData({...formData, next_assigned_from: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Confirmed By</label>
                <input type="text" className="form-control" value={formData.confirmed_by} onChange={e => setFormData({...formData, confirmed_by: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ fontWeight: 600 }}>
                  <option value="Pending">🕐 Pending</option>
                  <option value="Assigned">✅ Assigned</option>
                  <option value="Not Assigned">❌ Not Assigned</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Assignment Alert
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Order Assignment Alerts ({filteredRecords.length})</h3>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-control" style={{ paddingLeft: 36 }} />
            </div>
          </div>
          
          <div className="table-responsive" style={{ flex: 1 }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Loom ID</th>
                  <th>Next Order ID</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No assignment alerts!</td></tr>
                ) : filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx}>
                    <td style={{ fontWeight: 600 }}>{record.name}</td>
                    <td><span style={{ fontWeight: 700 }}>{record.code}</span></td>
                    <td style={{ color: '#0ea5e9', fontWeight: 600 }}>{record.extra_field_1}</td>
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
