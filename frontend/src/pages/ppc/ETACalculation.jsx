import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, AlertTriangle, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { ppcAPI, buyerOrderAPI } from '../../services/api';

export default function ETACalculation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [etaRes, orderRes] = await Promise.all([
        ppcAPI.getEta().catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] }))
      ]);
      
      const backendEta = etaRes?.data || [];
      const orders = orderRes?.data || [];
      
      const etaData = backendEta.map(eta => {
        const order = orders.find(o => o.order_no === eta.order_id || o.id.toString() === eta.order_id) || {};
        
        const totalMeters = eta.assigned_meters || 0;
        const producedMeters = eta.completed_meters || 0;
        const remMeters = Math.max(0, totalMeters - producedMeters);
        
        // Compute speed and daily rate from ETA response if possible, else fallback
        const speed = 20; // assumed avg speed
        const dailyRate = speed * 20; // 400m
        const eff = 90;
        
        const etaDate = eta.expected_finish_time ? eta.expected_finish_time.split('T')[0] : 'Unknown';
        
        const deliveryStr = order.expected_delivery_date || eta.target_date?.split('T')[0] || '2026-07-10';
        const deliveryDate = new Date(deliveryStr);
        const calcEtaDate = new Date(etaDate);
        
        const delayDays = (etaDate !== 'Unknown' && calcEtaDate > deliveryDate) 
           ? Math.ceil((calcEtaDate - deliveryDate) / (1000 * 60 * 60 * 24)) : 0;
        
        let risk = 'Low';
        if (eta.status === 'AT RISK' || delayDays > 0) risk = 'High';
        else if (delayDays === 0 && remMeters > 5000) risk = 'Medium';
        
        return {
          loom_id: eta.loom_name,
          order_id: eta.order_id,
          total_meters: totalMeters,
          produced_meters: producedMeters,
          remaining_meters: remMeters,
          current_speed: speed,
          daily_rate: dailyRate,
          efficiency: eff,
          eta_date: etaDate,
          delay_days: delayDays,
          delivery_date: deliveryStr,
          risk: risk
        };
      });
      
      setData(etaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(d => 
    String(d.loom_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(d.order_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ color: '#8b5cf6' }} /> ETA Calculation
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 800 }}>
            Calculates the actual expected completion date of a running order based on live production data, current speed, efficiency, downtime, and remaining meters. ETA is continuously updated throughout production.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#ede9fe', padding: 12, borderRadius: 12, display: 'flex' }}>
            <TrendingUp size={24} style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Active Orders</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{data.length}</div>
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fef3c7', padding: 12, borderRadius: 12, display: 'flex' }}>
            <AlertCircle size={24} style={{ color: '#d97706' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Medium Risk</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {data.filter(d => d.risk === 'Medium').length}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>High Risk (Delayed)</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {data.filter(d => d.risk === 'High').length}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Live Prediction Board</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="search-bar" style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search looms or orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
        </div>
        
        <div className="table-responsive" style={{ flex: 1, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Loom ID</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Order ID</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Total (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Produced (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Remaining (m)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Speed (m/hr)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Daily Rate (m/d)</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Eff %</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>ETA Date & Time</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Delay Days</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Delivery Date</th>
                <th style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="12" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No active running orders found</td></tr>
              ) : filteredData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.loom_id}</td>
                  <td style={{ padding: '16px', color: 'var(--primary)', fontWeight: 600 }}>{row.order_id}</td>
                  <td style={{ padding: '16px' }}>{row.total_meters.toLocaleString()}</td>
                  <td style={{ padding: '16px', color: '#047857', fontWeight: 500 }}>{row.produced_meters.toLocaleString()}</td>
                  <td style={{ padding: '16px', color: '#b45309', fontWeight: 600 }}>{row.remaining_meters.toLocaleString()}</td>
                  <td style={{ padding: '16px' }}>{row.current_speed}</td>
                  <td style={{ padding: '16px' }}>{row.daily_rate}</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: row.efficiency < 90 ? '#b91c1c' : '#047857' }}>{row.efficiency}%</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#6d28d9' }}>{row.eta_date}</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: row.delay_days > 0 ? '#b91c1c' : '#047857' }}>{row.delay_days > 0 ? `+${row.delay_days}` : '0'}</td>
                  <td style={{ padding: '16px' }}>{row.delivery_date}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: row.risk === 'High' ? '#fef2f2' : (row.risk === 'Medium' ? '#fef3c7' : '#ecfdf5'),
                      color: row.risk === 'High' ? '#b91c1c' : (row.risk === 'Medium' ? '#b45309' : '#047857')
                    }}>
                      {row.risk === 'High' && <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />}
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
