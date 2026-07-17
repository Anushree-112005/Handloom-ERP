import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Save, ArrowLeft, Plus, Activity } from 'lucide-react';
import { buyerOrderAPI, ppcAPI, subMasterAPI } from '../../services/api';

export default function DelayRisk() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    risk_id: '',
    date: new Date().toISOString().split('T')[0],
    order_id: '',
    buyer_name: '',
    fabric_type: 'Cotton Poplin',
    loom_id: '',
    shift: 'Both',

    // Timeline
    order_start_date: '',
    planned_end_date: '',
    buyer_delivery_date: '',
    days_elapsed: 0,
    days_remaining: 0,
    total_duration: 0,

    // Production Status
    total_ordered: 0,
    total_produced: 0,
    remaining_meters: 0,
    completion_pct: 0,
    expected_pct: 0,
    variance_pct: 0,
    current_daily_rate: 0,
    required_daily_rate: 0,
    rate_gap: 0,

    // Risk Calc
    current_eta: '',
    buffer_days: 0,
    total_downtime: 0,
    lost_meters_so_far: 0,
    projected_lost: 0,
    efficiency_drop: 0,
    risk_score: 0,
    risk_level: '🟢 Low',
    risk_reason: '',
    delay_days: 0,
    recommended_action: '',

    // Action
    action_required: 'No',
    suggested_action: '',
    action_taken: '',
    action_by: 'Login User',
    action_date: new Date().toISOString().split('T')[0],
    post_action_eta: '',
    post_action_buffer: 0,

    loom_breakup: []
  });

  const [allocations, setAllocations] = useState([]);
  const [etaData, setEtaData] = useState([]);
  const [breakdowns, setBreakdowns] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes, allocRes, etaRes, bdRes] = await Promise.all([
        subMasterAPI.list('ppc_delay_risk').catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] })),
        ppcAPI.getAllocations().catch(() => ({ data: [] })),
        ppcAPI.getEta().catch(() => ({ data: [] })),
        ppcAPI.getBreakdowns().catch(() => ({ data: [] }))
      ]);
      setRecords(recRes?.data || []);
      setOrders(ordRes?.data || []);
      setAllocations(allocRes?.data || []);
      setEtaData(etaRes?.data || []);
      setBreakdowns(bdRes?.data || []);
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
      const orderAllocs = allocations.filter(a => a.order_id === oId);
      const totalOrdered = orderAllocs.reduce((sum, a) => sum + (a.assigned_meters || 0), 0) || 30000;
      const totalProduced = orderAllocs.reduce((sum, a) => sum + (a.completed_meters || 0), 0);
      const remain = totalOrdered - totalProduced;
      
      const compPct = totalOrdered > 0 ? (totalProduced / totalOrdered) * 100 : 0;
      
      const orderEtaList = etaData.filter(eta => eta.order_id === oId);
      let latestEtaDate = new Date();
      let totalAssignedEta = 0;
      if (orderEtaList.length > 0) {
        latestEtaDate = new Date(Math.max(...orderEtaList.map(e => e.expected_finish_time ? new Date(e.expected_finish_time) : new Date())));
        totalAssignedEta = orderEtaList.reduce((sum, e) => sum + (e.assigned_meters || 0), 0);
      }
      
      const orderBreakdowns = breakdowns.filter(b => orderAllocs.some(a => a.loom_id === b.loom_id));
      const totalDowntimeHours = orderBreakdowns.reduce((sum, b) => sum + (b.total_downtime || 0), 0);

      const startDate = orderAllocs.length > 0 ? new Date(Math.min(...orderAllocs.map(a => new Date(a.start_time)))) : new Date();
      const deliveryStr = order.expected_delivery_date || new Date(Date.now() + 27 * 86400000).toISOString().split('T')[0];
      const deliveryDate = new Date(deliveryStr);
      
      const daysElapsed = Math.max(0, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, Math.floor((deliveryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const totalDuration = daysElapsed + daysRemaining;
      
      const expPct = totalDuration > 0 ? (daysElapsed / totalDuration) * 100 : 0;
      const variance = compPct - expPct;
      
      const dailyRate = daysElapsed > 0 ? totalProduced / daysElapsed : 0;
      const requiredRate = daysRemaining > 0 ? remain / daysRemaining : remain;
      const rateGap = dailyRate - requiredRate;
      
      const buffer = Math.floor((deliveryDate.getTime() - latestEtaDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let riskScore = 20;
      if (variance < -5) riskScore += 30;
      if (buffer < 5) riskScore += 40;
      if (rateGap < 0) riskScore += 10;
      riskScore = Math.min(riskScore, 100);

      let rLevel = '🟢 Low';
      if (riskScore > 75) rLevel = '❌ Critical';
      else if (riskScore > 50) rLevel = '🔴 High';
      else if (riskScore > 25) rLevel = '🟡 Medium';

      const loomBreakup = orderAllocs.map(a => {
        const aEta = etaData.find(e => e.allocation_id === a.id);
        const etaStr = aEta && aEta.expected_finish_time ? aEta.expected_finish_time.split('T')[0] : latestEtaDate.toISOString().split('T')[0];
        return {
          loom: a.loom_name || `Loom ${a.loom_id}`,
          alloc: a.assigned_meters,
          prod: a.completed_meters,
          eta: etaStr,
          r_level: (aEta && aEta.status === 'AT RISK') ? '🔴 High' : '🟢 Low'
        }
      });

      setFormData({
        ...formData,
        risk_id: `DR-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        order_id: oId,
        buyer_name: order.party_name || 'Generic Buyer',
        loom_id: 'All',

        order_start_date: startDate.toISOString().split('T')[0],
        planned_end_date: latestEtaDate.toISOString().split('T')[0],
        buyer_delivery_date: deliveryStr,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        total_duration: totalDuration,

        total_ordered: totalOrdered,
        total_produced: totalProduced,
        remaining_meters: remain,
        completion_pct: compPct,
        expected_pct: expPct,
        variance_pct: variance,
        current_daily_rate: dailyRate,
        required_daily_rate: requiredRate,
        rate_gap: rateGap,

        current_eta: latestEtaDate.toISOString().split('T')[0],
        buffer_days: buffer,
        total_downtime: totalDowntimeHours,
        lost_meters_so_far: 0,
        projected_lost: 0,
        efficiency_drop: 0,
        risk_score: riskScore,
        risk_level: rLevel,
        risk_reason: riskScore > 50 ? 'Efficiency drop + downtime' : 'Normal variation',
        delay_days: buffer < 0 ? Math.abs(buffer) : 0,
        recommended_action: riskScore > 50 ? 'Increase night shift output' : 'Maintain speed',

        action_required: riskScore > 50 ? 'Yes' : 'No',
        suggested_action: riskScore > 50 ? 'Add loom / Overtime' : 'None',
        loom_breakup: loomBreakup
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subMasterAPI.create('ppc_delay_risk', {
        name: formData.risk_id,
        code: formData.order_id,
        extra_field_1: formData.risk_level,
        extra_field_2: `Score: ${formData.risk_score.toFixed(0)}`,
        description: `Action: ${formData.action_taken || 'Pending'}`,
        is_active: true
      });
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving delay risk assessment.');
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
              <div style={{ padding: 10, background: '#ef444418', borderRadius: 10, color: '#ef4444' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Order Risk Diagnostic</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Identify and mitigate production bottlenecks</p>
              </div>
            </div>
            <div style={{ padding: '4px 12px', background: '#ef444418', color: '#b91c1c', borderRadius: 12, fontWeight: 600, fontSize: 13 }}>
              {formData.risk_id || 'DR-NEW'}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 24, overflowX: 'hidden' }}>
            
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>1. Select Order & Timeline</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Order ID</label>
                <select className="form-control" value={formData.order_id} onChange={handleOrderChange} required>
                  <option value="">-- Select Order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Order Start Date</label>
                <input type="date" className="form-control" value={formData.order_start_date} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Buyer Delivery Date</label>
                <input type="date" className="form-control" value={formData.buyer_delivery_date} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12 }}>
              <div className="form-group">
                <label>Days Elapsed</label>
                <input type="text" className="form-control" value={formData.days_elapsed ? `${formData.days_elapsed} days` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Days Remaining (Planned)</label>
                <input type="text" className="form-control" value={formData.days_remaining ? `${formData.days_remaining} days` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Total Order Duration</label>
                <input type="text" className="form-control" value={formData.total_duration ? `${formData.total_duration} days` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>2. Production Status</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Total Ordered</label>
                <input type="text" className="form-control" value={formData.total_ordered ? `${formData.total_ordered.toLocaleString()} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Total Produced</label>
                <input type="text" className="form-control" value={formData.total_produced ? `${formData.total_produced.toLocaleString()} m` : ''} readOnly style={{ backgroundColor: '#10b98118', color: '#047857', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Remaining</label>
                <input type="text" className="form-control" value={formData.remaining_meters ? `${formData.remaining_meters.toLocaleString()} m` : ''} readOnly style={{ backgroundColor: '#f59e0b18', color: '#b45309', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Completion %</label>
                <input type="text" className="form-control" value={formData.completion_pct ? `${formData.completion_pct.toFixed(1)}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 700 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginTop: 12 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Expected %</label>
                <input type="text" className="form-control" value={formData.expected_pct ? `${formData.expected_pct.toFixed(1)}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Variance</label>
                <input type="text" className="form-control" value={formData.variance_pct ? `${formData.variance_pct > 0 ? '+' : ''}${formData.variance_pct.toFixed(1)}%` : ''} readOnly style={{ backgroundColor: formData.variance_pct < 0 ? '#ef444418' : '#10b98118', color: formData.variance_pct < 0 ? '#b91c1c' : '#047857', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Current Rate</label>
                <input type="text" className="form-control" value={formData.current_daily_rate ? `${formData.current_daily_rate.toFixed(0)} m/d` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Required Rate</label>
                <input type="text" className="form-control" value={formData.required_daily_rate ? `${formData.required_daily_rate.toFixed(0)} m/d` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Rate Gap</label>
                <input type="text" className="form-control" value={formData.rate_gap ? `${formData.rate_gap > 0 ? '+' : ''}${formData.rate_gap.toFixed(0)} m/d` : ''} readOnly style={{ backgroundColor: formData.rate_gap < 0 ? '#ef444418' : '#10b98118', color: formData.rate_gap < 0 ? '#b91c1c' : '#047857', fontWeight: 700 }} />
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>3. Risk Calculation</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Current ETA</label>
                <input type="text" className="form-control" value={formData.current_eta} readOnly style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Buffer Days</label>
                <input type="text" className="form-control" value={formData.buffer_days !== 0 || formData.order_id ? `${formData.buffer_days} days` : ''} readOnly style={{ backgroundColor: formData.buffer_days < 0 ? '#ef444418' : 'var(--bg-secondary)', color: formData.buffer_days < 0 ? '#b91c1c' : 'inherit', fontWeight: 600 }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Total Downtime</label>
                <input type="text" className="form-control" value={formData.total_downtime ? `${formData.total_downtime} hrs` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Lost Meters</label>
                <input type="text" className="form-control" value={formData.lost_meters_so_far ? `${formData.lost_meters_so_far} m` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c' }} />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 11 }}>Eff. Drop</label>
                <input type="text" className="form-control" value={formData.efficiency_drop ? `${formData.efficiency_drop}%` : ''} readOnly style={{ backgroundColor: 'var(--bg-secondary)', color: '#b91c1c' }} />
              </div>
            </div>
            
            <div style={{ padding: 20, marginTop: 16, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 24,
              border: formData.risk_score > 75 ? '1px solid #ef4444' : formData.risk_score > 50 ? '1px solid #f97316' : formData.risk_score > 25 ? '1px solid #f59e0b' : '1px solid #10b981',
              backgroundColor: formData.risk_score > 75 ? '#ef444415' : formData.risk_score > 50 ? '#f9731615' : formData.risk_score > 25 ? '#f59e0b15' : '#10b98115'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Risk Score</span>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{formData.risk_score.toFixed(0)} <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/ 100</span></span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 800, fontSize: 20 }}>{formData.risk_level}</span>
                  {formData.delay_days > 0 && <span style={{ padding: '2px 8px', background: '#ef4444', color: 'white', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{formData.delay_days} Days Late</span>}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 13 }}><strong>Reason:</strong> {formData.risk_reason}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 13 }}><strong>Recommendation:</strong> {formData.recommended_action}</p>
              </div>
            </div>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>4. Loom-wise Risk Breakup</h4>
            <table className="table" style={{ width: '100%', fontSize: 13 }}>
              <thead><tr><th>Loom ID</th><th>Allocated</th><th>Produced</th><th>ETA</th><th>Risk Level</th></tr></thead>
              <tbody>
                {formData.loom_breakup.map((l, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{l.loom}</td>
                    <td>{l.alloc.toLocaleString()} m</td>
                    <td>{l.prod.toLocaleString()} m</td>
                    <td>{l.eta}</td>
                    <td style={{ fontWeight: 700 }}>{l.r_level}</td>
                  </tr>
                ))}
                {formData.loom_breakup.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 10 }}>Select an order to view looms</td></tr>}
              </tbody>
            </table>

            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 8, margin: '24px 0 16px 0' }}>5. Action Required</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Action Taken</label>
                <input type="text" className="form-control" value={formData.action_taken} onChange={e => setFormData({...formData, action_taken: e.target.value})} placeholder="e.g. Added LM-006 to order" />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label>Post-Action ETA</label>
                  <input type="date" className="form-control" value={formData.post_action_eta} onChange={e => setFormData({...formData, post_action_eta: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Post-Action Buffer</label>
                  <input type="number" className="form-control" value={formData.post_action_buffer} onChange={e => setFormData({...formData, post_action_buffer: e.target.value})} placeholder="days" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                <Save size={16} style={{ marginRight: 8 }} /> Save Risk Assessment
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
            <AlertTriangle style={{ color: '#ef4444' }} /> Delay Risk Assessment
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Algorithmic detection of production shortfalls and delays</p>
        </div>
        {!isFormOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => setIsFormOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#ef4444', borderColor: '#ef4444' }}
          >
            <Plus size={16} /> New Assessment
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
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Risk Assessments Archive ({filteredRecords.length})</h3>
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
                  <th>Risk ID</th>
                  <th>Order ID</th>
                  <th>Risk Level</th>
                  <th>Score</th>
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
                    <td>{record.code}</td>
                    <td style={{ fontWeight: 800 }}>{record.extra_field_1}</td>
                    <td>{record.extra_field_2}</td>
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
