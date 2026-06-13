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
      icon: Settings,
      tabs: [
        { id: 'loom-master', label: 'Loom Master', component: <LoomRegistration /> },
        { id: 'shift-master', label: 'Shift Master' },
        { id: 'operator-master', label: 'Operator Master' },
        { id: 'downtime-reason', label: 'Downtime Reason Master' }
      ]
    },
    'planning': {
      title: 'Loom Planning',
      icon: Layers,
      tabs: [
        { id: 'availability', label: 'Loom Availability Check' },
        { id: 'capacity', label: 'Capacity Calculation' },
        { id: 'order-breakdown', label: 'Order Breakdown' },
        { id: 'load-balancing', label: 'Load Balancing' },
        { id: 'allocation', label: 'Loom Allocation', component: <OrderAllocation /> }
      ]
    },
    'scheduling': {
      title: 'Production Scheduling',
      icon: Calendar,
      tabs: [
        { id: 'start-end', label: 'Start & End Date Planning' },
        { id: 'runtime', label: 'Runtime Calculation' },
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
        { id: 'shift-entry', label: 'Shift-wise Production Entry' },
        { id: 'iot-entry', label: 'IoT / Auto Entry' },
        { id: 'speed-monitoring', label: 'Speed Monitoring' },
        { id: 'status-update', label: 'Loom Status Update' }
      ]
    },
    'monitoring': {
      title: 'Daily Monitoring',
      icon: Eye,
      tabs: [
        { id: 'daily-report', label: 'Daily Production Report' },
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
        { id: 'live-dashboard', label: 'Live Dashboard' },
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
        { id: 'reallocation', label: 'Reallocation Engine' },
        { id: 'maintenance', label: 'Maintenance Log' }
      ]
    },
    'prediction': {
      title: 'Finish Prediction (ETA)',
      icon: Clock,
      tabs: [
        { id: 'eta-calc', label: 'ETA Calculation' },
        { id: 'dynamic-eta', label: 'Dynamic ETA Update' }
      ]
    },
    'alerts': {
      title: 'Alert & Notification',
      icon: Bell,
      tabs: [
        { id: 'finishing-alert', label: 'Loom Finishing Alert' },
        { id: 'low-efficiency', label: 'Low Efficiency Alert' },
        { id: 'breakdown-alert', label: 'Breakdown Alert' },
        { id: 'delay-alert', label: 'Delay Risk Alert' },
        { id: 'next-order', label: 'Next Order Assignment Alert' }
      ]
    },
    'reports': {
      title: 'Reports',
      icon: PieChart,
      tabs: [
        { id: 'loom-wise', label: 'Loom-wise Production Report' },
        { id: 'order-wise', label: 'Order-wise Production Report' },
        { id: 'daily-factory', label: 'Daily Factory Report' },
        { id: 'efficiency-trend', label: 'Efficiency Report', component: <LoomUtilizationReport /> },
        { id: 'downtime-history', label: 'Downtime Report' },
        { id: 'delivery-forecast', label: 'Delivery Forecast Report' }
      ]
    }
  };

  const config = moduleConfig[moduleName];
  
  if (!config) return <div>Module not found</div>;

  const currentTab = submodule || config.tabs[0].id;
  const activeTabConfig = config.tabs.find(t => t.id === currentTab) || config.tabs[0];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ padding: 12, background: 'var(--primary-light)', borderRadius: 12, color: 'white' }}>
          <config.icon size={24} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{config.title}</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Production Planning & Control System</p>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: 32, overflowY: 'auto', background: 'var(--bg-primary)' }}>
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
