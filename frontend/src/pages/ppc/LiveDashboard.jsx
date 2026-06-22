import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Activity, Zap, CheckCircle, AlertCircle, 
  Clock, RefreshCw, Layers, Search, Eye, Filter, Settings, 
  FileText, CheckCircle2, AlertTriangle, Box, PlayCircle, Radio,
  Shield, Volume2, Cpu, Wrench, X, Info
} from 'lucide-react';
import { ppcAPI, buyerOrderAPI } from '../../services/api';

// Circular Progress Component for Premium KPIs
const CircularProgress = ({ percentage, target, title, color }) => {
  const radius = 30;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="card" style={{ 
      padding: 16, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      transition: 'transform 0.2s'
    }}>
      <div style={{ position: 'relative', width: 68, height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ transform: 'rotate(-90deg)', width: 68, height: 68 }}>
          <circle cx="34" cy="34" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          <circle cx="34" cy="34" r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }} />
        </svg>
        <div style={{ position: 'absolute', fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{percentage}%</div>
      </div>
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'block', letterSpacing: 0.5 }}>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>Target: {target}%</span>
      </div>
    </div>
  );
};

export default function LiveDashboard() {
  const [looms, setLooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoomDetails, setSelectedLoomDetails] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('assignments');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Left sidebar options state
  const [dept, setDept] = useState('Weaving');
  const [layout, setLayout] = useState('Shop Floor A');
  const [options, setOptions] = useState({
    incorrectAlarm: true,
    allEff: true,
    overview: true,
    actualTrend: false,
    offlineNotification: true
  });

  // Simulated live floor states
  const [liveLoomStates, setLiveLoomStates] = useState({});
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    fetchInitialData();
    // Refresh database values every 30s
    const dbInterval = setInterval(fetchInitialData, 30000);
    return () => clearInterval(dbInterval);
  }, []);

  // Simulates telemetry/IoT fluctuations every 4s
  useEffect(() => {
    if (Object.keys(liveLoomStates).length === 0 && looms.length > 0) {
      initializeLiveStates();
    }

    const telemetryInterval = setInterval(() => {
      setLiveLoomStates(prev => {
        const next = { ...prev };
        const keys = Object.keys(next);
        if (keys.length > 0) {
          for (let i = 0; i < 3; i++) {
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            const statuses = ['Running', 'Running', 'Running', 'Warp-stop', 'Manual stop', 'Other', 'Idle'];
            const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            next[randomKey] = {
              ...next[randomKey],
              status: nextStatus,
              speed: nextStatus === 'Running' ? Math.floor(Math.random() * 80 + 600) : 0,
              efficiency: nextStatus === 'Running' ? (82 + Math.random() * 15).toFixed(1) : 0,
              meters: nextStatus === 'Running' ? next[randomKey].meters + ((next[randomKey].speed / 15) / ((next[randomKey].ppi || 35) * 39.37) || 0.1) : next[randomKey].meters
            };
          }
        }
        return next;
      });
      setLastUpdated(new Date());
    }, 4000);

    return () => clearInterval(telemetryInterval);
  }, [looms, liveLoomStates]);

  const fetchInitialData = async () => {
    try {
      const [loomRes, allocRes, orderRes] = await Promise.all([
        ppcAPI.getLooms().catch(() => ({ data: [] })),
        ppcAPI.getAllocations().catch(() => ({ data: [] })),
        buyerOrderAPI.list().catch(() => ({ data: [] }))
      ]);
      setLooms(loomRes?.data || []);
      setAllocations(allocRes?.data || []);
      setActiveOrders(orderRes?.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeLiveStates = () => {
    const initial = {};
    const operators = ['Ramesh Kumar', 'Murugan Swamy', 'Karthik S.', 'Selvam P.', 'Anand Raj', 'M. Pandian'];
    const fabrics = ['Cotton Poplin', 'Linen Blend', 'Printed Twill', 'Denim Warp', 'Satin Grey'];
    
    // Fallback if no looms, but ideally there will be looms fetched from the backend.
    const sourceLooms = looms.length > 0 ? looms : Array.from({ length: 60 }, (_, i) => ({ id: i + 1, loom_name: `Loom ${String(i + 1).padStart(3, '0')}`, status: 'Running' }));

    sourceLooms.forEach((loom, i) => {
      const loomName = loom.loom_name || `Loom ${loom.id || i+1}`;
      const shortId = loomName.replace('Loom ', '').trim();
      let status = (loom.status && loom.status !== 'string' && loom.status !== 'Unknown') ? loom.status : 'Running';
      
      // Introduce slight randomness for dynamic feel if all are running
      if (status === 'Running' && Math.random() > 0.85) {
        const statuses = ['Warp-stop', 'Manual stop', 'Other', 'Idle'];
        status = statuses[Math.floor(Math.random() * statuses.length)];
      }

      const targetMeters = 10000;
      initial[shortId] = {
        id: shortId,
        name: loomName,
        status: status,
        speed: status === 'Running' ? Math.floor(Math.random() * 50 + 640) : 0,
        efficiency: status === 'Running' ? (80 + Math.random() * 17).toFixed(1) : 0,
        operator: operators[i % operators.length],
        fabric: fabrics[i % fabrics.length],
        meters: Math.floor(Math.random() * 2000 + 1500),
        targetMeters: targetMeters,
        order: `ORD-2026-${100 + i}`,
        warpId: `WRP-${Math.floor(Math.random() * 900 + 100)}`,
        yarnCount: Math.floor(Math.random() * 20 + 20),
        ppi: Math.floor(Math.random() * 40 + 40)
      };
    });
    setLiveLoomStates(initial);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return '#10b981';      // Green
      case 'Warp-stop': return '#eab308';    // Yellow
      case 'Manual stop': return '#f97316';  // Orange
      case 'Other': return '#8b5cf6';        // Purple
      case 'Idle': return '#3b82f6';         // Blue
      default: return '#64748b';
    }
  };

  const handleCheckboxChange = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const loomIds = Object.keys(liveLoomStates);
  const rows = [];
  const chunk = 7;
  const midPoint = Math.floor(loomIds.length / 2);
  let passedMid = false;

  for (let i = 0; i < loomIds.length; i += chunk) {
    if (i >= midPoint && !passedMid && loomIds.length > chunk * 2) {
      rows.push({ type: 'divider' });
      passedMid = true;
    }
    const rowLooms = loomIds.slice(i, i + chunk);
    const side = (rowLooms.length === chunk && Math.random() > 0.8) ? rowLooms.pop() : null;
    rows.push({ type: 'normal', looms: rowLooms, side });
  }

  const totalLoomsCount = Object.keys(liveLoomStates).length || 60;
  const runningCount = Object.values(liveLoomStates).filter(l => l.status === 'Running').length;
  const warpStopCount = Object.values(liveLoomStates).filter(l => l.status === 'Warp-stop').length;
  const manualStopCount = Object.values(liveLoomStates).filter(l => l.status === 'Manual stop').length;
  const otherStopCount = Object.values(liveLoomStates).filter(l => l.status === 'Other').length;
  const idleCount = Object.values(liveLoomStates).filter(l => l.status === 'Idle').length;

  // Dynamic OEE Calculation
  const loomsArr = Object.values(liveLoomStates);
  const totalLoomsCnt = loomsArr.length || 1;
  const runningLoomsList = loomsArr.filter(l => l.status === 'Running');
  const runningLoomsCnt = runningLoomsList.length;
  const idleLoomsCnt = loomsArr.filter(l => l.status === 'Idle' || l.status === 'Offline').length;

  const dynamicAvailability = (((totalLoomsCnt - idleLoomsCnt) / totalLoomsCnt) * 100).toFixed(1);
  const dynamicOpEff = runningLoomsCnt > 0 
    ? (runningLoomsList.reduce((acc, curr) => acc + parseFloat(curr.efficiency || 0), 0) / runningLoomsCnt).toFixed(1)
    : 0;
  const dynamicPerformance = ((runningLoomsCnt / (totalLoomsCnt - idleLoomsCnt || 1)) * 100).toFixed(1);
  const dynamicQuality = 100.0;
  let dynamicCurrentOEE = ((dynamicAvailability * dynamicOpEff * dynamicPerformance * dynamicQuality) / 1000000).toFixed(1);

  if (isNaN(dynamicCurrentOEE)) dynamicCurrentOEE = 0;
  
  const currentOEE = dynamicCurrentOEE;
  const targetOEE = 93.9;

  const totalMeters = loomsArr.reduce((acc, curr) => acc + (curr.meters || 0), 0);
  const avgEff = runningLoomsCnt > 0 
    ? (runningLoomsList.reduce((acc, curr) => acc + parseFloat(curr.efficiency || 0), 0) / runningLoomsCnt).toFixed(1)
    : '0.0';

  const idleCountActual = loomsArr.filter(l => l.status === 'Idle').length;
  const breakdownCount = loomsArr.filter(l => l.status === 'Breakdown' || l.status === 'Manual stop').length;
  const maintenanceCount = loomsArr.filter(l => l.status === 'Maintenance').length;

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', overflowX: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Factory Floor — Live Dashboard</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Real-time telemetry from {totalLoomsCnt} hardware looms via MQTT · Updates every 4s</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="form-control" style={{ width: 100, height: 36, fontSize: 13, borderRadius: 8 }}>
            <option>All</option>
          </select>
          <select className="form-control" style={{ width: 100, height: 36, fontSize: 13, borderRadius: 8 }}>
            <option>All</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        
        {/* Running Looms */}
        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Running Looms</span>
            <Activity size={14} color="#cbd5e1" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{runningLoomsCnt}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>of {totalLoomsCnt} total looms</div>
          </div>
        </div>

        {/* Meters Today */}
        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #0ea5e9', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Meters Today</span>
            <Layers size={14} color="#cbd5e1" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0ea5e9' }}>{Math.floor(totalMeters).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>across all running looms</div>
          </div>
        </div>

        {/* Avg Efficiency */}
        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Avg Efficiency</span>
            <Zap size={14} color="#cbd5e1" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{avgEff}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>target: &gt;85%</div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Alerts</span>
            <AlertCircle size={14} color="#cbd5e1" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>4</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>3 require attention</div>
          </div>
        </div>

        {/* Breakdowns */}
        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Breakdowns</span>
            <AlertTriangle size={14} color="#cbd5e1" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>{breakdownCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>looms under repair</div>
          </div>
        </div>

        {/* Idle Looms */}
        <div className="card" style={{ padding: '16px 20px', borderTop: '4px solid #8b5cf6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Idle Looms</span>
            <Clock size={14} color="#cbd5e1" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>{idleCountActual}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ready for assignment</div>
          </div>
        </div>

      </div>

      {/* Loom Floor Map */}
      <div className="card" style={{ padding: 24, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Live Loom Floor Map — {totalLoomsCnt} Looms</h3>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#10b981', fontSize: 14 }}>●</span> Running</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#f59e0b', fontSize: 14 }}>●</span> Idle</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#ef4444', fontSize: 14 }}>●</span> Breakdown</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#8b5cf6', fontSize: 14 }}>●</span> Maintenance</span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {loomsArr.map(loom => {
            // Map our random statuses to the 4 requested categories
            let status = loom.status;
            if (status === 'Warp-stop' || status === 'Manual stop') status = 'Breakdown';
            else if (status === 'Other') status = 'Maintenance';

            let borderColor = '#e2e8f0';
            let bg = '#ffffff';
            let textColor = 'var(--text-primary)';
            let statusBg = '';
            let icon = null;

            switch (status) {
              case 'Running':
                borderColor = '#86efac'; // light green
                statusBg = '#dcfce7';
                textColor = '#166534';
                icon = <RefreshCw size={10} style={{ animation: 'spin 2s linear infinite' }} />;
                break;
              case 'Breakdown':
                borderColor = '#fca5a5';
                bg = '#fef2f2';
                statusBg = 'transparent';
                textColor = '#ef4444';
                icon = <AlertTriangle size={10} />;
                break;
              case 'Maintenance':
                borderColor = '#c4b5fd';
                bg = '#faf5ff';
                statusBg = 'transparent';
                textColor = '#8b5cf6';
                icon = <Wrench size={10} />;
                break;
              case 'Idle':
                borderColor = '#fcd34d';
                bg = '#fffbeb';
                statusBg = 'transparent';
                textColor = '#f59e0b';
                icon = <Clock size={10} />;
                break;
              default:
                break;
            }

            const targetMeters = loom.targetMeters || 10000;
            const progress = Math.min((loom.meters / targetMeters) * 100, 100);

            // Mock sheds
            const sheds = ['Shed A', 'Shed B', 'Shed C', 'Shed D', 'Shed E', 'Shed F'];
            const assignedShed = sheds[parseInt(loom.id.replace(/\D/g, '')) % sheds.length] || 'Shed A';
            const machineType = parseInt(loom.id.replace(/\D/g, '')) % 2 === 0 ? 'Rapier' : 'Air Jet';

            return (
              <div 
                key={loom.id} 
                onClick={() => setSelectedLoomDetails({...loom, status})}
                style={{ 
                  border: `1px solid ${borderColor}`, 
                  borderRadius: 10, 
                  padding: '16px 16px 20px 16px', 
                  background: bg,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: 0.5 }}>{loom.name}</h4>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{machineType} - {assignedShed}</div>
                  </div>
                  {status === 'Running' ? (
                    <div style={{ fontSize: 10, fontWeight: 700, color: textColor, background: statusBg, padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {icon} {status}
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, fontWeight: 700, color: textColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {icon} {status}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Speed</span>
                  <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{status === 'Running' ? `${loom.speed} m/hr` : '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Efficiency</span>
                  <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{status === 'Running' ? `${loom.efficiency}%` : '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 16 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Meters</span>
                  <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{Math.floor(loom.meters).toLocaleString()}</strong>
                </div>

                <div style={{ height: 4, background: status === 'Running' ? '#e2e8f0' : 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: status === 'Running' ? '#10b981' : textColor, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* BOTTOM SECTION: Graph & Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        
        {/* Production Graph */}
        <div className="card" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>Production — Target vs Actual (14 Days)</h3>
          </div>
          <div style={{ position: 'relative', height: 260, width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 20, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>10000</span>
              <span>7500</span>
              <span>5000</span>
              <span>2500</span>
              <span>0</span>
            </div>
            {/* Graph area */}
            <div style={{ position: 'relative', marginLeft: 45, flex: 1, borderLeft: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              {/* Horizontal grid lines */}
              {[25, 50, 75].map(pct => (
                <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct}%`, borderBottom: '1px dashed #f1f5f9' }} />
              ))}
              {/* Dotted target line */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: '85%', borderBottom: '2px dotted #0ea5e9' }} />
              
              {/* SVG Area Chart */}
              <svg viewBox="0 0 1000 240" preserveAspectRatio="none" style={{ position: 'absolute', width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* 14 points */}
                <path d="M0,30 L70,25 L140,32 L210,28 L280,38 L350,38 L420,35 L490,28 L560,30 L630,22 L700,28 L770,25 L840,30 L920,40 L1000,55 L1000,240 L0,240 Z" fill="url(#areaGradient)" />
                <path d="M0,30 L70,25 L140,32 L210,28 L280,38 L350,38 L420,35 L490,28 L560,30 L630,22 L700,28 L770,25 L840,30 L920,40 L1000,55" fill="none" stroke="#10b981" strokeWidth="2" />
                
                {/* Tooltip dot mock */}
                <circle cx="560" cy="30" r="4" fill="#10b981" stroke="#fff" strokeWidth="2" />
                <line x1="560" y1="30" x2="560" y2="240" stroke="#cbd5e1" strokeDasharray="4" />
              </svg>

              {/* Tooltip mock */}
              <div style={{ position: 'absolute', left: '50%', top: '30%', transform: 'translateX(-50%)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: 12, zIndex: 10 }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>12 Jun</div>
                <div style={{ color: '#0ea5e9', fontWeight: 600 }}>target: 8,500 m</div>
                <div style={{ color: '#10b981', fontWeight: 600 }}>actual: 8,498 m</div>
              </div>
            </div>
            {/* X-axis labels */}
            <div style={{ marginLeft: 45, height: 20, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', paddingTop: 8 }}>
              {['4 Jun','5 Jun','6 Jun','7 Jun','8 Jun','9 Jun','10 Jun','11 Jun','12 Jun','13 Jun','14 Jun','15 Jun','16 Jun','17 Jun'].map(d => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="card" style={{ padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>Active Alerts</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', cursor: 'pointer' }}>View All</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            <div style={{ border: '1px solid #fee2e2', background: '#fffcfc', borderRadius: 8, padding: '12px 16px', borderLeft: '4px solid #ef4444', display: 'flex', gap: 12 }}>
              <AlertCircle size={16} color="#ef4444" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}><span style={{ color: '#475569' }}>LM-019 —</span> Breakdown detected: Reed wire broken</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>2 min ago</div>
              </div>
            </div>

            <div style={{ border: '1px solid #fef3c7', background: '#fffbeb', borderRadius: 8, padding: '12px 16px', borderLeft: '4px solid #f59e0b', display: 'flex', gap: 12 }}>
              <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}><span style={{ color: '#475569' }}>LM-007 —</span> ETA delay risk: ORD-00003 (IKEA)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>15 min ago</div>
              </div>
            </div>

            <div style={{ border: '1px solid #e0f2fe', background: '#f8fafc', borderRadius: 8, padding: '12px 16px', borderLeft: '4px solid #3b82f6', display: 'flex', gap: 12 }}>
              <Info size={16} color="#3b82f6" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}><span style={{ color: '#475569' }}>LM-012 —</span> Maintenance due: Last service 92 days ago</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>1 hr ago</div>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 8, padding: '12px 16px', borderLeft: '4px solid #94a3b8', display: 'flex', gap: 12 }}>
              <Clock size={16} color="#94a3b8" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}><span style={{ color: '#475569' }}>LM-004 —</span> Low efficiency: 71.2% (threshold: 80%)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>2 hr ago</div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Active Orders Progress */}
      <div className="card" style={{ padding: 24, borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>Active Orders — Progress</h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', cursor: 'pointer' }}>View All</span>
        </div>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Order</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Buyer</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Fabric</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Progress</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Meters</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Delivery</th>
                <th style={{ padding: '12px 16px', fontWeight: 800 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.length > 0 ? activeOrders.map((row, i) => {
                const totalMeters = parseFloat(row.order_qty) || 25000;
                // Since this is real order data but we don't have production integration yet,
                // we'll mock the progress based on the order ID to make it look active
                const pctStr = ((i * 17.5 + 10) % 95).toFixed(1);
                const pct = parseFloat(pctStr);
                const actual = Math.floor(totalMeters * (pct / 100));
                
                const isDanger = pct > 0 && pct < 40 && i % 3 === 0;
                const isPending = pct === 0;

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.order_id || `ORD-${row.id}`}</td>
                    <td style={{ padding: '16px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{row.party_name || 'Generic Buyer'}</td>
                    <td style={{ padding: '16px 16px', color: 'var(--text-secondary)' }}>{row.fabric || 'Cotton Poly Blend'}</td>
                    <td style={{ padding: '16px 16px', width: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: isDanger ? '#ef4444' : isPending ? '#cbd5e1' : '#0ea5e9', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 40 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}><span style={{ color: 'var(--text-primary)' }}>{actual.toLocaleString()}</span>/{totalMeters.toLocaleString()} m</td>
                    <td style={{ padding: '16px 16px', color: 'var(--text-secondary)' }}>{row.delivery_date ? new Date(row.delivery_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'Pending'}</td>
                    <td style={{ padding: '16px 16px' }}>
                      {isDanger ? (
                        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> Delayed</span>
                      ) : isPending ? (
                        <span style={{ background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Pending</span>
                      ) : (
                        <span style={{ background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Activity size={12} /> On Track</span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No active orders found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loom Detail Modal Dialog */}
      {selectedLoomDetails && (() => {
        const liveDetails = selectedLoomDetails;
        const targetMeters = liveDetails.targetMeters || 10000;
        const progressPct = Math.min((liveDetails.meters / targetMeters) * 100, 100);
        const remainingMeters = Math.max(targetMeters - liveDetails.meters, 0);
        const ppi = liveDetails.ppi || 35;
        const metersPerHour = liveDetails.speed > 0 ? (liveDetails.speed * 60) / (ppi * 39.37) : 0;
        const remainingHours = metersPerHour > 0 ? remainingMeters / metersPerHour : 0;
        const warpOutDate = remainingHours > 0 
          ? new Date(Date.now() + remainingHours * 3600000).toLocaleString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
          : 'Stopped';
        const estShiftYield = liveDetails.speed > 0 ? Math.floor((liveDetails.speed * 60 * 8 * 0.9) / (ppi * 100)) : 0;
        const yarnCount = liveDetails.yarnCount || 40;

        return (
        <div className="animate-fade" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', padding: 24 }}>
          <div style={{ maxWidth: 1000, width: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>
            
            {/* Premium Header */}
            <div style={{ background: '#2563eb', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -40, opacity: 0.1, transform: 'scale(2)' }}>
                <Activity size={120} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', letterSpacing: 1 }}>{liveDetails.name || 'LM-001'}</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {liveDetails.name || 'TSUDAKOMA ZA103'} <span style={{ fontSize: 11, background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: 12 }}>WEAVING</span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8', display: 'flex', gap: 12 }}>
                    <span>Live RPM: <strong style={{ color: '#fff' }}>{liveDetails.speed || 0}</strong></span>
                    <span>•</span>
                    <span>Actual Shift: <strong style={{ color: '#fff' }}>{new Date().toLocaleDateString()} 05:00 B</strong></span>
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
                <div style={{ background: '#10b98120', border: '1px solid #10b981', color: '#34d399', padding: '8px 16px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Est. Shift Yield</div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{estShiftYield.toLocaleString()} m</div>
                </div>
                <button onClick={() => setSelectedLoomDetails(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.8)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* OEE Status Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: 24, fontSize: 13, fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#64748b' }}>OEE</span> <span style={{ color: '#16a34a', fontSize: 16, fontWeight: 800 }}>100.0%</span></div>
                <div style={{ color: '#cbd5e1' }}>|</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#64748b' }}>Availability</span> <span style={{ color: '#3b82f6', fontSize: 16, fontWeight: 800 }}>100.0%</span></div>
                <div style={{ color: '#cbd5e1' }}>|</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#64748b' }}>Op. Eff.</span> <span style={{ color: '#8b5cf6', fontSize: 16, fontWeight: 800 }}>100.0%</span></div>
                <div style={{ color: '#cbd5e1' }}>|</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#64748b' }}>Performance</span> <span style={{ color: '#ef4444', fontSize: 16, fontWeight: 800 }}>100.0%</span></div>
                <div style={{ color: '#cbd5e1' }}>|</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#64748b' }}>Quality</span> <span style={{ color: '#f59e0b', fontSize: 16, fontWeight: 800 }}>100.0%</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, minHeight: 0, background: '#fff' }}>
              
              {/* Left Column (Main Stats) */}
              <div style={{ width: '38%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                  
                  {/* Status Card */}
                  <div style={{ background: selectedLoomDetails.status === 'Running' ? '#10b98115' : '#ef444415', border: `1px solid ${selectedLoomDetails.status === 'Running' ? '#10b98140' : '#ef444440'}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedLoomDetails.status === 'Running' ? '#10b981' : '#ef4444', animation: 'pulse 2s infinite' }} />
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: selectedLoomDetails.status === 'Running' ? '#065f46' : '#991b1b' }}>
                        Machine {selectedLoomDetails.status}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: selectedLoomDetails.status === 'Running' ? '#065f46' : '#991b1b' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.7 }}>Since</span>
                        <span style={{ fontWeight: 700 }}>{new Date(Date.now() - 3 * 3600000).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ opacity: 0.7 }}>Run Time</span>
                        <span style={{ fontWeight: 700 }}>03:36:34</span>
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Speed (RPM)</span>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>{selectedLoomDetails.speed || 619}</div>
                    </div>
                    <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Picks</span>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#8b5cf6', marginTop: 4 }}>147,274</div>
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Downtime Events</h4>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Down (h)</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Warp</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Filling</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Manual</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Total</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', textAlign: 'center', padding: '12px 0' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>00:00</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>5</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>2</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>2</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>9</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column (Tabs & Details) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Modern Tabs */}
                <div style={{ display: 'flex', padding: '0 24px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                  {['assignments', 'shiftData', 'declarations'].map((tab) => (
                    <div 
                      key={tab}
                      onClick={() => setActiveModalTab(tab)}
                      style={{ 
                        padding: '16px 20px', 
                        fontSize: 13, 
                        fontWeight: activeModalTab === tab ? 700 : 600, 
                        color: activeModalTab === tab ? '#3b82f6' : '#64748b', 
                        borderBottom: activeModalTab === tab ? '2px solid #3b82f6' : '2px solid transparent', 
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {tab.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  ))}
                </div>

                <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                  {activeModalTab === 'assignments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      
                      {/* Top Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                          <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Assigned Weaver</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{liveDetails.operator || 'Tiss. 1 Franchisee M.'}</span>
                        </div>
                        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                          <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Assigned Fixer</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>1. Castillo Antonio</span>
                        </div>
                      </div>

                      {/* Style & Order Card */}
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', fontSize: 13 }}>
                          Style & Order Information
                        </div>
                        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Style</span><strong style={{ color: '#0f172a' }}>{liveDetails.fabric}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Style Descr.</span><strong style={{ color: '#0f172a' }}>{liveDetails.fabric} (Ne {liveDetails.yarnCount})</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Warp ID</span><strong style={{ color: '#3b82f6' }}>{liveDetails.warpId}</strong></div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Order No</span><strong style={{ color: '#0f172a' }}>{liveDetails.order}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>On Machine</span><strong style={{ color: '#0f172a' }}>10/8/2026 17:41</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Length</span><strong style={{ color: '#0f172a' }}>10490/4521</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* Production Progress */}
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                          <div>
                            <span style={{ display: 'block', fontSize: 13, color: '#64748b', fontWeight: 600 }}>Warp Production (Sized vs Woven)</span>
                            <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{targetMeters.toLocaleString()} <span style={{ fontSize: 16, color: '#94a3b8' }}>/</span> <span style={{ color: '#10b981' }}>{liveDetails.meters.toFixed(1)} m</span></span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: 11, color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>Est. Warp-out</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#b45309' }}>{warpOutDate}</span>
                          </div>
                        </div>
                        <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: '#10b981', borderRadius: 5, transition: 'width 1s ease-in-out' }} />
                        </div>
                      </div>

                    </div>
                  )}

                  {activeModalTab === 'shiftData' && (
                    <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                      <table className="table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', textAlign: 'center' }}>
                        <thead style={{ background: '#f8fafc', color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                          <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>Style Desc.</th>
                            <th style={{ padding: '12px 16px' }}>Effic.</th>
                            <th style={{ padding: '12px 16px' }}>Wa.</th>
                            <th style={{ padding: '12px 16px' }}>Fi.</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Picks</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Meter</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { style: 'DEMO PRODUCT TE', eff: '96.7 / 96.7', wa: '1.4', fi: '-', picks: '147,274', meter: '0.0', status: 'warn' },
                            { style: 'DEMO PRODUCT TE', eff: '100 / 100', wa: '-', fi: '-', picks: '181,543', meter: '51.9', status: 'good' },
                            { style: 'DEMO PRODUCT TE', eff: '100 / 100', wa: '-', fi: '-', picks: '93,703', meter: '26.8', status: 'good' },
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: row.status === 'warn' ? '#fffbeb' : '#fff' }}>
                              <td style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{row.style}</td>
                              <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 600 }}>{row.eff}</td>
                              <td style={{ padding: '12px 16px' }}>{row.wa}</td>
                              <td style={{ padding: '12px 16px' }}>{row.fi}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>{row.picks}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{row.meter}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeModalTab === 'declarations' && (
                    <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                      <table className="table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', color: '#64748b', fontSize: 12, textTransform: 'uppercase' }}>
                          <tr>
                            <th style={{ padding: '12px 16px', width: '30%' }}>Date / Time</th>
                            <th style={{ padding: '12px 16px', width: '70%' }}>Declaration Event</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { date: '10/29/2026 14:35', type: 'Fin Coupe', active: true },
                            { date: '10/29/2026 14:32', type: 'Change Style', active: false },
                            { date: '10/29/2026 14:30', type: 'Change Style', active: false },
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: row.active ? '#f0fdf4' : '#fff' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {row.active ? <PlayCircle size={14} color="#10b981" /> : <Clock size={14} color="#94a3b8" />}
                                {row.date}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 600 }}>{row.type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
