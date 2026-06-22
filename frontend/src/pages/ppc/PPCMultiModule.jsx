import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Settings, Layers, Calendar, Activity, Eye, TrendingUp, 
  AlertTriangle, Clock, Bell, PieChart, Construction 
} from 'lucide-react';

// Import existing modules to nest them inside this structure
import LoomRegistration from './LoomRegistration';
import OrderAllocation from './OrderAllocation';
import ShiftProductionLog from './ShiftProductionLog';
import LiveLoomDashboard from './LiveLoomDashboard';
import DowntimeTracking from './DowntimeTracking';
import LoomUtilizationReport from './LoomUtilizationReport';
import SmartAlertsCenter from './SmartAlertsCenter';
import { PPC_REGISTRY } from './PPCRegistry';

export default function PPCMultiModule() {
  const { moduleName, submodule } = useParams();
  const navigate = useNavigate();

  const moduleConfig = {
    'master': {
      title: 'Master Setup',
      subtitle: 'Manage looms, shifts, operators, yarn and fabric configurations',
      icon: Settings,
      tabs: [
        { id: 'loom-master', label: 'Loom Master', component: <LoomRegistration /> },
        // { id: 'shift-master', label: 'Shift Master' },
        // { id: 'operator-master', label: 'Operator Master' },
       // { id: 'yarn-master', label: 'Yarn Master' },
        //{ id: 'fabric-master', label: 'Fabric Master' },
        { id: 'downtime-reason', label: 'Downtime Reasons' }
      ]
    },
    'planning': {
      title: 'Loom Planning',
      icon: Layers,
      tabs: [
        { id: 'availability', label: 'Loom Availability Check' },
        { id: 'capacity', label: 'Capacity Calculation' },
        { id: 'order-breakdown', label: 'Order Breakdown' },
        //{ id: 'allocation', label: 'Loom Allocation', component: <OrderAllocation /> }
      ]
    },
    'scheduling': {
      title: 'Production Scheduling',
      icon: Calendar,
      tabs: [
        { id: 'start-end', label: 'Start & End Date Planning' },
        { id: 'shift-planning', label: 'Shift Planning' },
        { id: 'operator-assign', label: 'Operator Assignment' },
        { id: 'priority', label: 'Priority Scheduling' }
      ]
    },
    'execution': {
      title: 'Production Execution',
      icon: Activity,
      tabs: [
        { id: 'loom-start', label: 'Loom Start Entry' },
        { id: 'iot-entry', label: 'IoT / Auto Entry' },
        { id: 'speed-monitoring', label: 'Speed Monitoring' },
        { id: 'status-update', label: 'Loom Status Update' }
      ]
    },
    'monitoring': {
      title: 'Daily Monitoring',
      icon: Eye,
      tabs: [
        { id: 'target-actual', label: 'Target vs Actual' },
        { id: 'efficiency', label: 'Efficiency Calculation' },
        { id: 'loss-analysis', label: 'Loss Analysis' },
        { id: 'shift-summary', label: 'Shift-wise Summary' }
      ]
    },
    'tracking': {
      title: 'Progress Tracking',
      icon: TrendingUp,
      tabs: [
        { id: 'order-progress', label: 'Order Progress View' },
        { id: 'loom-contribution', label: 'Loom Contribution Report' },
        { id: 'multi-loom', label: 'Multi-loom Order View' }
      ]
    },
    'problem': {
      title: 'Problem Handling',
      icon: AlertTriangle,
      tabs: [
        { id: 'breakdown-entry', label: 'Breakdown Entry' },
        { id: 'downtime-calc', label: 'Downtime Calculation' },
        { id: 'lost-meters', label: 'Lost Meters Calculation' },
        { id: 'maintenance', label: 'Maintenance Log' }
      ]
    },
    'alerts': {
      title: 'Alert & Notification',
      icon: Bell,
      tabs: [
        { id: 'eta-calc', label: 'ETA Calculation' },
        { id: 'low-efficiency', label: 'Low Efficiency Alert' },
        { id: 'breakdown-alert', label: 'Breakdown Alert' }
      ]
    },
    'reports': {
      title: 'Reports',
      icon: PieChart,
      tabs: [
        { id: 'loom-wise', label: 'Loom-wise Production Report' },
        { id: 'order-wise', label: 'Order-wise Production Report' },
        { id: 'daily-factory', label: 'Daily Factory Report' },
        { id: 'downtime-history', label: 'Downtime Report' }
      ]
    }
  };

  const config = moduleConfig[moduleName];
  
  if (!config) return <div>Module not found</div>;

  const currentTab = submodule || config.tabs[0].id;
  const activeTabConfig = config.tabs.find(t => t.id === currentTab) || config.tabs[0];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Header and Tabs container */}
      <div style={{ padding: '24px 32px 0 32px', background: 'var(--bg-primary)' }}>
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{config.title}</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>{config.subtitle || `Manage settings and operations for ${config.title.toLowerCase()}`}</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-secondary)',
                      padding: 4, borderRadius: 10, border: '1px solid var(--border)', overflowX: 'auto' }}>
          {config.tabs.map(t => (
            <button key={t.id} onClick={() => navigate(`/ppc/${moduleName}/${t.id}`)}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                       fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s',
                       background: currentTab === t.id ? '#2563eb' : 'transparent',
                       color: currentTab === t.id ? 'white' : 'var(--text-secondary)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '0 32px 32px 32px', overflowY: 'auto', overflowX: 'hidden', minWidth: 0, background: 'var(--bg-primary)' }}>
          {activeTabConfig.component ? (
            activeTabConfig.component
          ) : PPC_REGISTRY[activeTabConfig.id] ? (
            PPC_REGISTRY[activeTabConfig.id]
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <Construction size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{activeTabConfig.label}</h3>
              <p>This sub-module is currently under development.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
