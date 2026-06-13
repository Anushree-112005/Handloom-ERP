import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { ppcAPI } from '../../services/api';

export default function SpeedMonitoring() {
  const [looms, setLooms] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLooms();
    // Simulate live data updates
    const interval = setInterval(updateLiveData, 5000);
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
      const current = (parseFloat(standard) * (Math.random() * 0.4 + 0.7)).toFixed(1); // 70% to 110%
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
      const change = (Math.random() * 2 - 1); // -1 to +1
      let newCurrent = d.current + change;
      if (newCurrent < d.standard * 0.5) newCurrent += 2; // Don't drop too low too fast
      if (newCurrent > d.standard * 1.1) newCurrent -= 2; // Don't go too high
      
      return { ...d, current: newCurrent };
    }));
  };

  const nowStr = new Date().toLocaleString();

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ color: '#eab308' }} /> Live Speed Monitoring
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Real-time telemetry and speed variance alerts</p>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} className="animate-spin" /> Live sync active
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {loading ? (
          <p style={{ padding: 20 }}>Loading live data...</p>
        ) : liveData.map((data, idx) => {
          const variance = (data.current - data.standard).toFixed(1);
          const percent = ((data.current / data.standard) * 100).toFixed(0);
          const isLow = percent < 85;
          const isHigh = percent > 105;

          return (
            <div key={idx} className="card" style={{ padding: 20, borderTop: `4px solid ${isLow ? '#ef4444' : isHigh ? '#3b82f6' : '#10b981'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{data.loom_id}</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{nowStr}</span>
              </div>
              
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Current Speed</p>
                  <h4 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: isLow ? '#ef4444' : 'var(--text-primary)' }}>{data.current.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>m/hr</span></h4>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Standard Speed</p>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}>{data.standard.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>m/hr</span></h4>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div>
                  <span style={{ fontSize: 11, display: 'block', color: 'var(--text-secondary)' }}>Variance</span>
                  <span style={{ fontWeight: 600, color: variance < 0 ? '#ef4444' : '#10b981' }}>{variance > 0 ? '+' : ''}{variance} m/hr</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, display: 'block', color: 'var(--text-secondary)' }}>Speed %</span>
                  <span style={{ fontWeight: 600, color: isLow ? '#ef4444' : 'var(--text-primary)' }}>{percent}%</span>
                </div>
              </div>

              {isLow && (
                <div style={{ marginTop: 12, padding: 8, background: '#ef444415', color: '#b91c1c', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} /> Alert: Low speed detected
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
