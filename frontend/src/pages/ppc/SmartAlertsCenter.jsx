import React from 'react';
import { AlertTriangle, Bell, Clock, AlertCircle } from 'lucide-react';

export default function SmartAlertsCenter() {
  const alerts = [
    { type: 'warning', title: 'Loom L1 Finishing Soon', message: 'Order PO-00099 on Loom L1 will finish in approximately 8 hours. Prepare next warp.', time: '10 mins ago' },
    { type: 'danger', title: 'Low Efficiency Detected', message: 'Loom L2 has dropped below 60% efficiency in the last 4 hours.', time: '1 hour ago' },
    { type: 'info', title: 'Idle Loom', message: 'Loom L4 is currently idle. No orders are queued.', time: '3 hours ago' },
    { type: 'warning', title: 'Maintenance Due', message: 'Loom L3 has crossed 500 hours of runtime. Schedule preventive maintenance.', time: '1 day ago' },
  ];

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell style={{ color: 'var(--primary)' }} /> Smart Alerts Center
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Automated predictions and warnings for the production floor.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {alerts.map((alert, i) => {
          let bgColor = '#f8fafc';
          let iconColor = 'var(--text-muted)';
          let Icon = Bell;

          if (alert.type === 'warning') {
            bgColor = '#fffbeb';
            iconColor = '#f59e0b';
            Icon = AlertTriangle;
          } else if (alert.type === 'danger') {
            bgColor = '#fef2f2';
            iconColor = '#ef4444';
            Icon = AlertCircle;
          } else if (alert.type === 'info') {
            bgColor = '#eff6ff';
            iconColor = '#3b82f6';
            Icon = Clock;
          }

          return (
            <div key={i} className="card" style={{ padding: 20, backgroundColor: bgColor, borderLeft: `4px solid ${iconColor}` }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ marginTop: 2 }}>
                  <Icon size={24} color={iconColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{alert.title}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{alert.time}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{alert.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
