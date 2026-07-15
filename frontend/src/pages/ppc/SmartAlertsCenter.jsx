import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Clock, AlertCircle } from 'lucide-react';
import { ppcAPI } from '../../services/api';

export default function SmartAlertsCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [etaRes, dashRes, breakdownRes, loomRes] = await Promise.all([
        ppcAPI.getEta().catch(() => ({ data: [] })),
        ppcAPI.getDashboard().catch(() => ({ data: null })),
        ppcAPI.getBreakdowns().catch(() => ({ data: [] })),
        ppcAPI.getLooms().catch(() => ({ data: [] }))
      ]);

      const generatedAlerts = [];
      const etas = etaRes?.data || [];
      const dashboard = dashRes?.data || null;
      const breakdowns = breakdownRes?.data || [];
      const looms = loomRes?.data || [];

      // 1. Delay Risk Alerts
      etas.forEach(eta => {
        if (eta.status === 'AT RISK') {
          generatedAlerts.push({
            type: 'danger',
            title: 'ETA Delay Risk',
            message: `Order ${eta.order_id} on ${eta.loom_name} is at risk of missing delivery target.`,
            time: 'Live'
          });
        }
      });

      // 2. Efficiency Alert
      if (dashboard && dashboard.avg_efficiency < 85) {
        generatedAlerts.push({
          type: 'warning',
          title: 'Low Factory Efficiency',
          message: `Average factory efficiency has dropped to ${dashboard.avg_efficiency}%. Threshold is 85%.`,
          time: 'Live'
        });
      }

      // 3. Breakdown Alerts
      breakdowns.forEach(bd => {
        const loomName = looms.find(l => l.id === bd.loom_id)?.loom_name || `Loom ${bd.loom_id}`;
        generatedAlerts.push({
          type: 'danger',
          title: `Breakdown: ${loomName}`,
          message: `Downtime recorded: ${bd.reason_category || 'Unknown'} (${bd.total_downtime || 0} mins)`,
          time: new Date(bd.date).toLocaleString()
        });
      });

      if (generatedAlerts.length === 0) {
        generatedAlerts.push({
          type: 'info',
          title: 'All Systems Nominal',
          message: 'No critical alerts or warnings at this time.',
          time: 'Live'
        });
      }

      setAlerts(generatedAlerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell style={{ color: 'var(--primary)' }} /> Smart Alerts Center
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Automated predictions and warnings for the production floor.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading alerts...</div>
        ) : alerts.map((alert, i) => {
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
