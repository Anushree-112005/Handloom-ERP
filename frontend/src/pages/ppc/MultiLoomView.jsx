import React, { useState, useEffect } from 'react';
import { Layers, Search, AlertCircle, Clock, AlertTriangle, CheckCircle, TrendingDown, ArrowRight, Activity, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buyerOrderAPI, ppcAPI, subMasterAPI } from '../../services/api';

export default function MultiLoomView() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [filterState, setFilterState] = useState(() => {
    const saved = sessionStorage.getItem('ppc_multiloom_filter');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      view_date: new Date().toISOString().split('T')[0],
      order_id: '',
      status_filter: 'All'
    };
  });

  useEffect(() => {
    sessionStorage.setItem('ppc_multiloom_filter', JSON.stringify(filterState));
  }, [filterState]);

  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchOrders().then(() => {
      if (filterState.order_id) {
        generateDashboard(filterState.order_id);
      }
    });
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      if (filterState.order_id) {
        generateDashboard(filterState.order_id);
      }
    }, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [filterState.order_id]);

  const fetchOrders = async () => {
    try {
      const res = await subMasterAPI.list('ppc_order_progress');
      setOrders(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterState(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'order_id') generateDashboard(value);
      return next;
    });
  };

  const handleActionClick = (alt) => {
    if (alt.type === 'Breakdown') {
      navigate('/ppc/problem/breakdown-entry');
    } else {
      navigate('/ppc/daily/efficiency-calc');
    }
  };

  const generateDashboard = async (orderId) => {
    if (!orderId) {
      setDashboardData(null);
      return;
    }

    setLoading(true);
    try {
      const order = orders.find(o => o.name === orderId || o.id.toString() === orderId);
      
      const res = await ppcAPI.getLooms().catch(() => ({ data: [] }));
      const allLooms = res?.data || [];

      // MOCK DATA GENERATION
      const totalOrderMeters = 30000;
      const numLooms = 3;
      const baseAlloc = 10000;
      
      let totalAllocated = 0;
      let totalProduced = 0;
      
      const loomGrid = Array.from({ length: numLooms }).map((_, i) => {
        const allocated = baseAlloc;
        const produced = Math.floor(allocated * (Math.random() * 0.4 + 0.4)); 
        const remaining = allocated - produced;
        const compPct = (produced / allocated) * 100;
        
        const targetToday = 425;
        const actualToday = Math.floor(targetToday * (Math.random() * 0.4 + 0.6)); 
        const effToday = (actualToday / targetToday) * 100;
        
        const loomObj = allLooms[i] || { loom_name: `Loom ${i+1}`, status: 'Running' };
        
        const isBreakdown = Math.random() > 0.8;
        const status = isBreakdown ? 'Breakdown' : loomObj.status;
        const downtime = isBreakdown ? (Math.random() * 2).toFixed(1) : 0;
        
        const etaDays = Math.ceil(remaining / targetToday);
        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + etaDays);

        const delayRisk = effToday < 75 ? 'At Risk' : effToday < 50 ? 'Delayed' : 'On Track';

        totalAllocated += allocated;
        totalProduced += produced;

        return {
          loom_id: `LM-00${i+1}`,
          loom_name: loomObj.loom_name,
          allocated,
          produced,
          remaining,
          completion_pct: compPct,
          target_today: targetToday,
          actual_today: actualToday,
          efficiency_today: effToday,
          current_shift: Math.random() > 0.5 ? 'Day' : 'Night',
          operator: 'Ramesh Kumar',
          current_speed: Math.floor(Math.random() * 5 + 20),
          status,
          downtime_today: parseFloat(downtime),
          eta: etaDate.toISOString().split('T')[0],
          delay_risk: delayRisk
        };
      });

      const totalRemaining = totalAllocated - totalProduced;
      const overallCompPct = (totalProduced / totalAllocated) * 100;

      const alerts = loomGrid.filter(l => l.status === 'Breakdown' || l.efficiency_today < 80).map(l => ({
        type: l.status === 'Breakdown' ? 'Breakdown' : 'Low Efficiency',
        loom: l.loom_id,
        message: l.status === 'Breakdown' ? `${l.loom_id} is down for maintenance.` : `${l.loom_id} efficiency dropped to ${l.efficiency_today.toFixed(1)}%`,
        action: l.status === 'Breakdown' ? 'Check mechanical issue' : 'Check operator / yarn issue',
        time: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      setDashboardData({
        header: {
          buyer_name: order?.code || 'H&M Sweden',
          fabric_type: 'Cotton Poplin',
          total_order_meters: totalOrderMeters,
          total_produced: totalProduced,
          total_remaining: totalRemaining,
          overall_completion: overallCompPct,
          assigned_looms: numLooms
        },
        grid: loomGrid,
        alerts
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { header, grid, alerts } = dashboardData || {};
  const filteredGrid = dashboardData ? (filterState.status_filter === 'All' ? grid : grid.filter(g => g.status === filterState.status_filter)) : [];

  const avgEff = dashboardData ? grid.reduce((s, g) => s + g.efficiency_today, 0) / grid.length : 0;
  const totalDown = dashboardData ? grid.reduce((s, g) => s + g.downtime_today, 0) : 0;
  const delayedCount = dashboardData ? grid.filter(g => g.delay_risk === 'Delayed').length : 0;
  const etas = dashboardData ? grid.map(g => new Date(g.eta).getTime()) : [];
  const maxEta = dashboardData ? new Date(Math.max(...etas)).toISOString().split('T')[0] : '';

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowX: 'hidden' }}>
      
      {/* Universal Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers style={{ color: '#8b5cf6' }} /> Multi-Loom Order View
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Comprehensive multi-machine tracking for a single order</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 300 }}>
          <select className="form-control" style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-primary)', borderColor: 'var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} name="order_id" value={filterState.order_id} onChange={handleFilterChange}>
            <option value="">-- Choose Order to Analyze --</option>
            {orders.map(o => (
              <option key={o.id} value={o.name}>{o.name} - {o.code}</option>
            ))}
          </select>
        </div>
      </div>

      {!filterState.order_id ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: 400, background: 'var(--bg-primary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
          <Layers size={64} style={{ opacity: 0.1, marginBottom: 16, color: '#8b5cf6' }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}>No Order Selected</h3>
          <p style={{ marginTop: 8 }}>Select an Order ID from the dropdown to view the multi-loom telemetry.</p>
        </div>
      ) : loading && !dashboardData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
          <Activity className="animate-spin" size={40} style={{ color: '#8b5cf6', marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Syncing Multi-Loom Telemetry...</h3>
        </div>
      ) : dashboardData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Premium Sub-Header Panel */}
          <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ padding: 8, background: '#8b5cf620', borderRadius: 10, color: '#6d28d9' }}>
                    <Layers size={24} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#1e293b', letterSpacing: '-0.5px' }}>
                    {filterState.order_id}
                  </h2>
                  <span style={{ fontSize: 14, background: '#1e293b', color: '#fff', padding: '6px 14px', borderRadius: 20, fontWeight: 600, letterSpacing: '0.5px' }}>
                    {header.buyer_name}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#64748b', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Fabric: <strong style={{ color: '#334155' }}>{header.fabric_type}</strong></span>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <span>Looms Assigned: <strong style={{ color: '#334155' }}>{header.assigned_looms}</strong></span>
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <select className="form-control" style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontWeight: 600 }} name="status_filter" value={filterState.status_filter} onChange={handleFilterChange}>
                  <option value="All">All Statuses</option>
                  <option value="Running">Running</option>
                  <option value="Idle">Idle</option>
                  <option value="Breakdown">Breakdown</option>
                </select>
              </div>
            </div>

            {/* 4-Pillar Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ display: 'block', fontSize: 12, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Total Order</span>
                <h3 style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{header.total_order_meters.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>m</span></h3>
              </div>
              <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderBottom: '4px solid #10b981' }}>
                <span style={{ display: 'block', fontSize: 12, color: '#047857', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Produced</span>
                <h3 style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 800, color: '#10b981' }}>{header.total_produced.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>m</span></h3>
              </div>
              <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderBottom: '4px solid #f59e0b' }}>
                <span style={{ display: 'block', fontSize: 12, color: '#b45309', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Remaining</span>
                <h3 style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{header.total_remaining.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>m</span></h3>
              </div>
              <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderBottom: '4px solid #3b82f6' }}>
                <span style={{ display: 'block', fontSize: 12, color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Overall Progress</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{header.overall_completion.toFixed(1)}%</h3>
                  <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${header.overall_completion}%`, height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Left Side: Matrix & Summary */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Loom-wise Live Matrix</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></div>
                    Auto-updating • Last tick: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-secondary)' }}>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-primary)' }}>Loom & Operator</th>
                        <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Progress Tracker</th>
                        <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Today's Shift</th>
                        <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Live Eff.</th>
                        <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
                        <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Est. Finish</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGrid.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>{row.loom_id}</span>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{row.operator}</span>
                            </div>
                          </td>
                          <td style={{ width: 220, padding: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                                <span style={{ color: '#10b981' }}>{row.produced.toLocaleString()}m</span>
                                <span style={{ color: 'var(--text-muted)' }}>{row.allocated.toLocaleString()}m</span>
                              </div>
                              <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${row.completion_pct}%`, height: '100%', background: '#10b981' }}></div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.actual_today} m <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>produced</span></span>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Target: {row.target_today} m</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: 12, fontWeight: 800, fontSize: 13,
                              color: row.efficiency_today >= 90 ? '#047857' : row.efficiency_today >= 75 ? '#b45309' : '#b91c1c',
                              background: row.efficiency_today >= 90 ? '#10b98120' : row.efficiency_today >= 75 ? '#f59e0b20' : '#ef444420'
                            }}>
                              {row.efficiency_today.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: row.status === 'Running' ? '#10b981' : row.status === 'Idle' ? '#f59e0b' : '#ef4444' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></span>
                              {row.status}
                            </div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.eta}</span>
                              <span style={{ 
                                fontSize: 11, fontWeight: 700,
                                color: row.delay_risk === 'On Track' ? '#047857' : row.delay_risk === 'At Risk' ? '#b45309' : '#b91c1c', 
                              }}>
                                {row.delay_risk === 'On Track' && '✅ '}
                                {row.delay_risk === 'At Risk' && '⚠️ '}
                                {row.delay_risk === 'Delayed' && '❌ '} {row.delay_risk}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredGrid.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No looms match current filter.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border)' }}>
                  <div style={{ background: '#8b5cf615', color: '#8b5cf6', padding: 12, borderRadius: 12 }}><Activity size={24} /></div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Efficiency</span>
                    <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>{avgEff.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border)' }}>
                  <div style={{ background: '#ef444415', color: '#ef4444', padding: 12, borderRadius: 12 }}><Clock size={24} /></div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Downtime</span>
                    <span style={{ fontWeight: 800, fontSize: 20, color: totalDown > 0 ? '#ef4444' : 'var(--text-primary)' }}>{totalDown.toFixed(1)}h</span>
                  </div>
                </div>
                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border)' }}>
                  <div style={{ background: '#3b82f615', color: '#3b82f6', padding: 12, borderRadius: 12 }}><AlertCircle size={24} /></div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Risk Factor</span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{delayedCount} Delayed</span>
                  </div>
                </div>
                <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border)' }}>
                  <div style={{ background: '#10b98115', color: '#10b981', padding: 12, borderRadius: 12 }}><CheckCircle size={24} /></div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Latest ETA</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{maxEta}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Action Center */}
            <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '20px 24px', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BellRing size={20} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Action Center</h3>
                  <span style={{ marginLeft: 'auto', background: '#fff', color: '#ef4444', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 800 }}>{alerts.length}</span>
                </div>
                
                <div style={{ padding: 20, background: 'var(--bg-primary)', minHeight: 400 }}>
                  {alerts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <CheckCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px', color: '#10b981' }} />
                      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>All Clear!</h4>
                      <p style={{ margin: 0, fontSize: 13 }}>No active alerts. All machines are running efficiently.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {alerts.map((alt, i) => (
                        <div key={i} style={{ padding: 16, background: 'var(--bg-secondary)', border: `1px solid ${alt.type === 'Breakdown' ? '#ef444440' : '#f59e0b40'}`, borderRadius: 12, borderLeft: `4px solid ${alt.type === 'Breakdown' ? '#ef4444' : '#f59e0b'}`, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{alt.loom}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{alt.time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            {alt.type === 'Breakdown' ? <AlertTriangle size={14} color="#ef4444" /> : <TrendingDown size={14} color="#f59e0b" />}
                            <span style={{ fontSize: 12, fontWeight: 700, color: alt.type === 'Breakdown' ? '#ef4444' : '#f59e0b' }}>{alt.type}</span>
                          </div>
                          <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alt.message}</p>
                          
                          <div onClick={() => handleActionClick(alt)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#3b82f6', cursor: 'pointer', background: '#3b82f610', padding: '6px 12px', borderRadius: 6, width: 'fit-content' }}>
                            {alt.action} <ArrowRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
