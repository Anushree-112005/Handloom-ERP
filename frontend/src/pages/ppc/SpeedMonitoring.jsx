import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { ppcAPI } from '../../services/api';

const SpeedGauge = ({ percent, isLow, isHigh }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;
  
  let color = '#10b981'; // Green
  if (isLow) color = '#ef4444'; // Red
  else if (isHigh) color = '#3b82f6'; // Blue
  else if (percent > 85 && percent <= 93) color = '#f59e0b'; // Orange

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

export default function SpeedMonitoring() {
  const [looms, setLooms] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLooms();
    // Simulate live data updates
    const interval = setInterval(updateLiveData, 3000); // Faster refresh for more "live" feel
    return () => clearInterval(interval);
  }, []);

  const fetchLooms = async () => {
    setLoading(true);
    try {
      const res = await ppcAPI.getLooms();
      const activeLooms = (res?.data || []).filter(l => l.status === 'Running' || l.status === 'Idle');
      setLooms(activeLooms);
      generateInitialLive(activeLooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialLive = (loomList) => {
    const initial = loomList.map(l => {
      // Standard speed m/hr = (capacity / 24)
      const standard = (l.capacity_per_day / 24).toFixed(1);
      // Current speed mock
      const current = (parseFloat(standard) * (Math.random() * 0.35 + 0.75)).toFixed(1); // 75% to 110%
      return {
        loom_id: l.loom_name,
        standard: parseFloat(standard),
        current: parseFloat(current)
      };
    });
    setLiveData(initial);
  };

  const updateLiveData = () => {
    setLiveData(prev => prev.map(d => {
      // Fluctuate current speed slightly
      const change = (Math.random() * 1.5 - 0.75); // -0.75 to +0.75
      let newCurrent = d.current + change;
      if (newCurrent < d.standard * 0.5) newCurrent += 2; // Don't drop too low too fast
      if (newCurrent > d.standard * 1.1) newCurrent -= 2; // Don't go too high
      
      return { ...d, current: newCurrent };
    }));
  };

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ color: '#eab308' }} /> Live Speed Monitoring
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Real-time telemetry and advanced variance analytics</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.1)', color: '#047857', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }}></span>
            Live Sync Active
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Last updated: {nowStr}</span>
        </div>
      </div>

      {/* Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Initializing telemetry streams...</p>
          </div>
        ) : liveData.map((data, idx) => {
          const variance = (data.current - data.standard).toFixed(1);
          const percent = ((data.current / data.standard) * 100);
          const isLow = percent < 85;
          const isHigh = percent > 105;
          const isWarning = percent >= 85 && percent <= 93;
          
          let statusColor = '#10b981'; // green
          let statusBg = '#10b98115';
          let StatusIcon = CheckCircle2;
          
          if (isLow) {
             statusColor = '#ef4444'; 
             statusBg = '#ef444415';
             StatusIcon = AlertTriangle;
          } else if (isWarning) {
             statusColor = '#f59e0b';
             statusBg = '#f59e0b15';
             StatusIcon = AlertTriangle;
          } else if (isHigh) {
             statusColor = '#3b82f6';
             statusBg = '#3b82f615';
             StatusIcon = ArrowUpRight;
          }

          return (
            <div key={idx} className="card" style={{ 
              padding: 0, 
              overflow: 'hidden', 
              transition: 'all 0.3s ease',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}>
              {/* Card Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{data.loom_id}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: statusBg, color: statusColor, padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  <StatusIcon size={14} />
                  {isLow ? 'Critical Low' : isWarning ? 'Warning' : isHigh ? 'Over-speeding' : 'Optimal'}
                </div>
              </div>
              
              {/* Card Body */}
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Speed</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <h4 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: statusColor, letterSpacing: '-1px' }}>
                        {data.current.toFixed(1)}
                      </h4>
                      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>m/hr</span>
                    </div>
                  </div>
                  
                  <SpeedGauge percent={percent} isLow={isLow} isHigh={isHigh} />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Target / Standard</p>
                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {data.standard.toFixed(1)} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>m/hr</span>
                    </h4>
                  </div>
                  
                  <div style={{ flex: 1, padding: 16, background: variance < 0 ? '#ef444410' : '#10b98110', borderRadius: 12, border: `1px solid ${variance < 0 ? '#ef444430' : '#10b98130'}` }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Variance</p>
                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: variance < 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {variance > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {Math.abs(variance).toFixed(1)} <span style={{ fontSize: 13, opacity: 0.7, fontWeight: 500 }}>m/hr</span>
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
