import React, { useState, useEffect } from 'react';
import { PieChart, Search, FileText, Factory, TrendingUp, CheckCircle2, RefreshCw } from 'lucide-react';
import { buyerOrderAPI, subMasterAPI } from '../../services/api';

const ContributionGauge = ({ percent, color }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="90" height="90" style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.05))' }}>
        <circle cx="45" cy="45" r={radius} stroke="var(--bg-secondary)" strokeWidth="8" fill="none" />
        <circle 
          cx="45" cy="45" r={radius} 
          stroke={color} strokeWidth="8" fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={Math.max(0, strokeDashoffset)} 
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

export default function LoomContribution() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(() => sessionStorage.getItem('ppc_contrib_order') || '');
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    const savedOrder = sessionStorage.getItem('ppc_contrib_order');
    if (savedOrder) {
      handleOrderChange({ target: { value: savedOrder } });
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await subMasterAPI.list('ppc_order_progress');
      setOrders(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = async (e) => {
    const oId = e.target.value;
    setSelectedOrder(oId);
    sessionStorage.setItem('ppc_contrib_order', oId);
    
    if (!oId) {
      setAllocations([]);
      return;
    }

    setLoading(true);
    try {
      // Mock Data Generation
      const totalOrder = 30000;
      const numLooms = Math.floor(Math.random() * 3) + 2; 
      const allocMeters = Math.floor(totalOrder / numLooms);
      
      const mockAllocations = Array.from({ length: numLooms }).map((_, i) => {
        const allocated = i === numLooms - 1 ? totalOrder - (allocMeters * i) : allocMeters;
        const produced = Math.floor(allocated * (Math.random() * 0.8 + 0.1));
        const remaining = allocated - produced;
        const contribution = (produced / (totalOrder * 0.6)) * 100;
        
        return {
          loom_id: `LM-00${i + 1}`,
          allocated: allocated,
          produced: produced,
          remaining: remaining,
          contribution: contribution.toFixed(1),
          status: remaining === 0 ? 'Completed' : 'Running'
        };
      });

      const totalProduced = mockAllocations.reduce((sum, a) => sum + a.produced, 0);
      mockAllocations.forEach(a => {
        a.contribution = totalProduced > 0 ? ((a.produced / totalProduced) * 100).toFixed(1) : 0;
      });

      setAllocations(mockAllocations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalAllocated = allocations.reduce((s, a) => s + a.allocated, 0);
  const totalProduced = allocations.reduce((s, a) => s + a.produced, 0);
  const overallProgress = totalAllocated > 0 ? (totalProduced / totalAllocated) * 100 : 0;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart style={{ color: '#f59e0b' }} /> Loom Contribution Report
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Analyze which machines are driving order completion</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 300 }}>
          <select className="form-control" style={{ flex: 1, padding: '10px 16px', background: 'var(--bg-primary)', borderColor: 'var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} value={selectedOrder} onChange={handleOrderChange}>
            <option value="">-- Choose Order to Analyze --</option>
            {orders.map(o => (
              <option key={o.id} value={o.name}>{o.name} - {o.code}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedOrder ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', minHeight: 400, background: 'var(--bg-primary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
          <Factory size={64} style={{ opacity: 0.1, marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}>No Order Selected</h3>
          <p style={{ marginTop: 8 }}>Select an Order ID from the dropdown to view the loom contribution matrix.</p>
        </div>
      ) : loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>Processing Contribution Analytics...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <div className="card" style={{ padding: 24, borderLeft: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 8, background: '#3b82f615', borderRadius: 8, color: '#3b82f6' }}><Factory size={20} /></div>
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Allocated</h3>
              </div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{totalAllocated.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>meters</span></h2>
            </div>
            
            <div className="card" style={{ padding: 24, borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ padding: 8, background: '#10b98115', borderRadius: 8, color: '#10b981' }}><TrendingUp size={20} /></div>
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Produced</h3>
              </div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#10b981' }}>{totalProduced.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-muted)' }}>meters</span></h2>
            </div>
            
            <div className="card" style={{ padding: 24, borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Overall Progress</h3>
                <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{overallProgress.toFixed(1)}%</h2>
              </div>
              <ContributionGauge percent={overallProgress} color="#f59e0b" />
            </div>
          </div>

          {/* Loom Contribution Table */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Loom Breakdown</h3>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Loom ID</th>
                    <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Allocated</th>
                    <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Produced</th>
                    <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Remaining</th>
                    <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Contribution %</th>
                    <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((row, idx) => {
                    const isCompleted = row.status === 'Completed';
                    const cardColor = isCompleted ? '#10b981' : '#f59e0b';
                    const bgFade = isCompleted ? '#10b98115' : '#f59e0b15';

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cardColor, boxShadow: `0 0 8px ${cardColor}` }}></div>
                            {row.loom_id}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{row.allocated.toLocaleString()} m</td>
                        <td style={{ padding: '16px', fontWeight: 700, color: cardColor }}>{row.produced.toLocaleString()} m</td>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{row.remaining.toLocaleString()} m</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, color: cardColor }}>{row.contribution}%</span>
                            <div style={{ width: 60, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${row.contribution}%`, height: '100%', background: cardColor }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ background: bgFade, color: cardColor, padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {isCompleted ? <CheckCircle2 size={14} /> : <RefreshCw size={14} className="animate-spin" />}
                            {row.status}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {allocations.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No allocations available for this order</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
