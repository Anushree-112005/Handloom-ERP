import React, { useState, useEffect } from 'react';
import { Layers, Search, AlertCircle, Clock, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { buyerOrderAPI, ppcAPI } from '../../services/api';

export default function MultiLoomView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [filterState, setFilterState] = useState({
    view_date: new Date().toISOString().split('T')[0],
    order_id: '',
    status_filter: 'All'
  });

  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Re-trigger live mock if order selected
      if (filterState.order_id) {
        generateDashboard(filterState.order_id);
      }
    }, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [filterState.order_id]);

  const fetchOrders = async () => {
    try {
      const res = await buyerOrderAPI.list();
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

  const generateDashboard = async (orderId) => {
    if (!orderId) {
      setDashboardData(null);
      return;
    }

    setLoading(true);
    try {
      const order = orders.find(o => o.order_no === orderId || o.id.toString() === orderId);
      
      const res = await ppcAPI.getLooms().catch(() => ({ data: [] }));
      const allLooms = res?.data || [];

      // MOCK DATA GENERATION BASED ON SCHEMA
      const totalOrderMeters = 30000;
      const numLooms = 3;
      const baseAlloc = 10000;
      
      let totalAllocated = 0;
      let totalProduced = 0;
      
      const loomGrid = Array.from({ length: numLooms }).map((_, i) => {
        const allocated = baseAlloc;
        const produced = Math.floor(allocated * (Math.random() * 0.4 + 0.4)); // 40-80% done
        const remaining = allocated - produced;
        const compPct = (produced / allocated) * 100;
        
        const targetToday = 425;
        const actualToday = Math.floor(targetToday * (Math.random() * 0.4 + 0.6)); // 60-100%
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
        time: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString()
      }));

      setDashboardData({
        header: {
          buyer_name: order?.party_name || 'H&M Sweden',
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

  if (!dashboardData && !filterState.order_id) {
    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers style={{ color: '#8b5cf6' }} /> Multi-Loom Order View
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Comprehensive multi-machine tracking for a single order</p>
          </div>
        </div>
        
        <div className="card" style={{ padding: 24, maxWidth: 500 }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Select Order to Analyze</h4>
          <div className="form-group">
            <label>Order ID</label>
            <select className="form-control" name="order_id" value={filterState.order_id} onChange={handleFilterChange}>
              <option value="">-- Choose Order --</option>
              {orders.map(o => (
                <option key={o.id} value={o.order_no || o.id}>{o.order_no || o.id} - {o.party_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !dashboardData) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading live dashboard...</div>;
  }

  const { header, grid, alerts } = dashboardData;

  // Filter grid
  const filteredGrid = filterState.status_filter === 'All' 
    ? grid 
    : grid.filter(g => g.status === filterState.status_filter);

  // Footer Calcs
  const avgEff = grid.reduce((s, g) => s + g.efficiency_today, 0) / grid.length;
  const totalDown = grid.reduce((s, g) => s + g.downtime_today, 0);
  const onTrackCount = grid.filter(g => g.delay_risk === 'On Track').length;
  const atRiskCount = grid.filter(g => g.delay_risk === 'At Risk').length;
  const delayedCount = grid.filter(g => g.delay_risk === 'Delayed').length;
  
  const etas = grid.map(g => new Date(g.eta).getTime());
  const minEta = new Date(Math.min(...etas)).toISOString().split('T')[0];
  const maxEta = new Date(Math.max(...etas)).toISOString().split('T')[0];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowX: 'hidden' }}>
      {/* Header Panel */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              {filterState.order_id} 
              <span style={{ fontSize: 13, background: '#8b5cf620', color: '#6d28d9', padding: '4px 10px', borderRadius: 12 }}>
                {header.buyer_name}
              </span>
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Fabric: {header.fabric_type} | Looms Assigned: {header.assigned_looms}</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <select className="form-control" style={{ padding: '6px 12px' }} name="status_filter" value={filterState.status_filter} onChange={handleFilterChange}>
                <option value="All">All Statuses</option>
                <option value="Running">Running</option>
                <option value="Idle">Idle</option>
                <option value="Breakdown">Breakdown</option>
              </select>
            </div>
            <button className="btn btn-secondary" onClick={() => setFilterState({...filterState, order_id: ''})} style={{ padding: '6px 12px' }}>Close</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Order Meters</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: 24 }}>{header.total_order_meters.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>m</span></h3>
          </div>
          <div style={{ padding: 16, background: '#10b98110', borderLeft: '3px solid #10b981', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: '#047857', textTransform: 'uppercase', fontWeight: 600 }}>Total Produced</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: 24, color: '#047857' }}>{header.total_produced.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>m</span></h3>
          </div>
          <div style={{ padding: 16, background: '#f59e0b10', borderLeft: '3px solid #f59e0b', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: '#b45309', textTransform: 'uppercase', fontWeight: 600 }}>Total Remaining</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: 24, color: '#b45309' }}>{header.total_remaining.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400 }}>m</span></h3>
          </div>
          <div style={{ padding: 16, background: '#3b82f610', borderLeft: '3px solid #3b82f6', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: '#1d4ed8', textTransform: 'uppercase', fontWeight: 600 }}>Overall Completion</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <h3 style={{ margin: 0, fontSize: 24, color: '#1d4ed8' }}>{header.overall_completion.toFixed(1)}%</h3>
              <div style={{ flex: 1, height: 6, background: '#3b82f630', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${header.overall_completion}%`, height: '100%', background: '#3b82f6' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Main Grid Area */}
        <div className="card" style={{ flex: 1, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Loom-wise Live Matrix</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Auto-updating... Last tick: {lastUpdate.toLocaleTimeString()}</span>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Loom</th>
                  <th>Allocated</th>
                  <th>Produced</th>
                  <th>Completion</th>
                  <th>Today Actual</th>
                  <th>Eff %</th>
                  <th>Status</th>
                  <th>ETA</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrid.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{row.loom_id}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{row.operator}</span>
                      </div>
                    </td>
                    <td>{row.allocated.toLocaleString()}m</td>
                    <td style={{ color: '#047857', fontWeight: 600 }}>{row.produced.toLocaleString()}m</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontWeight: 600 }}>{row.completion_pct.toFixed(0)}%</span>
                        <div style={{ width: 60, height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${row.completion_pct}%`, height: '100%', background: '#10b981' }}></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{row.actual_today}m</span> <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/ {row.target_today}m</span>
                    </td>
                    <td>
                      <span style={{ color: row.efficiency_today >= 90 ? '#047857' : row.efficiency_today >= 75 ? '#b45309' : '#b91c1c', fontWeight: 700 }}>
                        {row.efficiency_today.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: row.status === 'Running' ? '#047857' : row.status === 'Idle' ? '#b45309' : '#b91c1c', fontWeight: 600, fontSize: 12 }}>
                        {row.status === 'Running' && '🟢'}
                        {row.status === 'Idle' && '🟡'}
                        {row.status === 'Breakdown' && '🔴'}
                        {row.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{row.eta}</td>
                    <td>
                      <span style={{ 
                        color: row.delay_risk === 'On Track' ? '#047857' : row.delay_risk === 'At Risk' ? '#b45309' : '#b91c1c', 
                        backgroundColor: row.delay_risk === 'On Track' ? '#10b98120' : row.delay_risk === 'At Risk' ? '#f59e0b20' : '#ef444420', 
                        padding: '2px 6px', borderRadius: 10, fontSize: 11, fontWeight: 700
                      }}>
                        {row.delay_risk === 'On Track' && '✅'}
                        {row.delay_risk === 'At Risk' && '⚠️'}
                        {row.delay_risk === 'Delayed' && '❌'} {row.delay_risk}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredGrid.length === 0 && <tr><td colSpan="9" style={{ textAlign: 'center', padding: 20 }}>No looms match current filter.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            <div>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>Avg Efficiency</span>
              <span style={{ fontWeight: 700 }}>{avgEff.toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>Total Downtime</span>
              <span style={{ fontWeight: 700, color: totalDown > 0 ? '#ef4444' : 'inherit' }}>{totalDown.toFixed(1)} hrs</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>On Track / Risk / Delay</span>
              <span style={{ fontWeight: 700 }}>{onTrackCount} / {atRiskCount} / {delayedCount}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>Latest ETA</span>
              <span style={{ fontWeight: 700 }}>{maxEta}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>Order On Time?</span>
              <span style={{ fontWeight: 700, color: delayedCount > 0 ? '#ef4444' : '#10b981' }}>{delayedCount > 0 ? '❌ No' : '✅ Yes'}</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar Alerts */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} style={{ color: '#ef4444' }} /> Action Center
            </h3>
            
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ opacity: 0.2, margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: 13 }}>No active alerts.<br/>All looms running optimally.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {alerts.map((alt, i) => (
                  <div key={i} style={{ padding: 12, background: alt.type === 'Breakdown' ? '#ef444415' : '#f59e0b15', border: `1px solid ${alt.type === 'Breakdown' ? '#ef444440' : '#f59e0b40'}`, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: alt.type === 'Breakdown' ? '#b91c1c' : '#b45309' }}>{alt.loom} - {alt.type}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{alt.time}</span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--text-primary)' }}>{alt.message}</p>
                    <div style={{ fontSize: 11, fontWeight: 600, color: alt.type === 'Breakdown' ? '#ef4444' : '#f59e0b' }}>Action: {alt.action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
