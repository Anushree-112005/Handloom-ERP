import React from 'react';
import { Activity, PieChart, TrendingUp } from 'lucide-react';

export default function LoomUtilizationReport() {
  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity style={{ color: 'var(--primary)' }} /> Loom Utilization Report
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Overall factory efficiency and production analytics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Factory Efficiency</p>
          <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#10b981' }}>84.2%</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> +2.4% from last week
          </p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Meters Produced (Week)</p>
          <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: 'var(--primary)' }}>45,200</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Target: 50,000 meters
          </p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Downtime (Week)</p>
          <h2 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#ef4444' }}>14 hrs</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Mainly due to warp changeovers
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <PieChart size={64} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
        <h3>Graphical Charts will appear here</h3>
        <p>This section is ready for Recharts / Chart.js integration.</p>
      </div>
    </div>
  );
}
