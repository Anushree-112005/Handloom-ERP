import React, { useState, useEffect } from 'react';
import { Activity, Clock, PlayCircle, Settings, CheckCircle2, AlertTriangle, Box, Search, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ppcAPI } from '../../services/api';

export default function LiveLoomDashboard() {
  const [looms, setLooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Log Production Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [logData, setLogData] = useState({ meters_produced: '', downtime_minutes: '', remarks: '' });

  useEffect(() => {
    fetchData();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [loomsRes, allocsRes] = await Promise.all([
        ppcAPI.getLooms(),
        ppcAPI.getAllocations()
      ]);
      setLooms(loomsRes.data);
      setAllocations(allocsRes.data);
    } catch (error) {
      console.error("Error fetching PPC data", error);
    }
  };

  const handleOpenLogModal = (allocation) => {
    setSelectedAllocation(allocation);
    setLogData({ meters_produced: '', downtime_minutes: '', remarks: '' });
    setIsLogModalOpen(true);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await ppcAPI.logProduction({
        allocation_id: selectedAllocation.id,
        meters_produced: parseFloat(logData.meters_produced) || 0,
        downtime_minutes: parseInt(logData.downtime_minutes) || 0,
        remarks: logData.remarks
      });
      setIsLogModalOpen(false);
      fetchData(); // Refresh the dashboard
    } catch (error) {
      console.error("Error logging production", error);
      alert("Error submitting production log.");
    }
  };

  // Merge loom and allocation data for the grid
  const dashboardData = looms.map(loom => {
    // Find the active or pending allocation for this loom
    const currentAlloc = allocations.find(a => a.loom_id === loom.id && (a.allocation_status === 'Active' || a.allocation_status === 'Pending'));
    
    // Calculate ETA string from expected_finish_time
    let etaStr = '-';
    if (currentAlloc && currentAlloc.expected_finish_time) {
      const finishDate = new Date(currentAlloc.expected_finish_time);
      const now = new Date();
      if (finishDate > now) {
        const diffHours = Math.round((finishDate - now) / (1000 * 60 * 60));
        etaStr = diffHours > 24 ? `${(diffHours/24).toFixed(1)} days` : `${diffHours} hours`;
      } else {
        etaStr = 'Overdue / Finishing soon';
      }
    }

    return {
      ...loom,
      allocation: currentAlloc,
      etaStr
    };
  });

  const filteredLooms = dashboardData.filter(loom => {
    if (filter !== 'All' && loom.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!loom.loom_name.toLowerCase().includes(searchLower) && 
          !(loom.allocation && loom.allocation.order_id.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Running': return '#10b981'; // Green
      case 'Setup': return '#f59e0b'; // Amber/Yellow
      case 'Maintenance': return '#ef4444'; // Red
      case 'Idle': return '#64748b'; // Gray
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Running': return <PlayCircle size={16} />;
      case 'Setup': return <Settings size={16} />;
      case 'Maintenance': return <AlertTriangle size={16} />;
      case 'Idle': return <CheckCircle2 size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity style={{ color: 'var(--primary)' }} /> Live Loom Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Real-time production tracking and ETA monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Loom or Order..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 36, width: 250 }}
            />
          </div>
          <Link to="/ppc/allocation" className="btn btn-primary">
            <Box size={16} /> New Allocation
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: 20 }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Total Looms</p>
          <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{dashboardData.length}</h3>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: 20 }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Running</p>
          <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{dashboardData.filter(l => l.status === 'Running').length}</h3>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: 20 }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Setup / Changeover</p>
          <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{dashboardData.filter(l => l.status === 'Setup').length}</h3>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #64748b', padding: 20 }}>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Idle</p>
          <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{dashboardData.filter(l => l.status === 'Idle').length}</h3>
        </div>
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {['All', 'Running', 'Setup', 'Idle', 'Maintenance'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
              background: filter === f ? 'var(--primary-light)' : '#fff',
              color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
        {filteredLooms.map(loom => {
          const color = getStatusColor(loom.status);
          const hasOrder = !!loom.allocation;
          const assigned = hasOrder ? loom.allocation.assigned_meters : 0;
          const completed = hasOrder ? loom.allocation.completed_meters : 0;
          const progress = assigned > 0 ? (completed / assigned) * 100 : 0;
          
          return (
            <div key={loom.id} className="card" style={{ padding: 24, borderTop: `4px solid ${color}`, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{loom.loom_name}</h3>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 4, 
                    fontSize: 12, fontWeight: 600, padding: '2px 8px', 
                    borderRadius: 12, backgroundColor: `${color}20`, color: color 
                  }}>
                    {getStatusIcon(loom.status)} {loom.status}
                  </span>
                </div>
                {hasOrder && (
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Current Order</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{loom.allocation.order_id}</p>
                  </div>
                )}
              </div>

              {(loom.status === 'Running' || loom.status === 'Setup') && hasOrder ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                    <span style={{ fontWeight: 700 }}>{completed.toLocaleString()} / {assigned.toLocaleString()} m</span>
                  </div>
                  <div style={{ width: '100%', height: 8, backgroundColor: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: color, transition: 'width 1s ease-in-out' }} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Fabric</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: 13, fontWeight: 600 }}>{loom.allocation.fabric_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Efficiency Target</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: 13, fontWeight: 600, color: loom.efficiency_pct >= 80 ? '#10b981' : '#f59e0b' }}>{loom.efficiency_pct}%</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                      <Clock size={14} /> 
                      <span>ETA Finish: <strong style={{ color: progress > 90 ? '#ef4444' : 'var(--text-primary)' }}>{loom.etaStr}</strong></span>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={() => handleOpenLogModal(loom.allocation)}
                    >
                      Update Shift Log
                    </button>
                  </div>
                </>
              ) : loom.status === 'Idle' ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Box size={32} style={{ color: 'var(--border)', margin: '0 auto 12px auto' }} />
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: 14 }}>Machine is idle and ready for allocation</p>
                  <Link to="/ppc/allocation" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>Assign Order</Link>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <AlertTriangle size={32} style={{ color: '#ef4444', margin: '0 auto 12px auto' }} />
                  <p style={{ color: 'var(--text-secondary)', margin: '0', fontSize: 14 }}>Under Maintenance</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Production Log Modal */}
      {isLogModalOpen && selectedAllocation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade" style={{ width: 400, padding: 24, position: 'relative' }}>
            <button 
              onClick={() => setIsLogModalOpen(false)}
              style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>Log Shift Production</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
              Order: <strong>{selectedAllocation.order_id}</strong>
            </p>

            <form onSubmit={handleLogSubmit}>
              <div className="form-group">
                <label>Meters Produced (This Shift) *</label>
                <input 
                  type="number" className="form-control" 
                  value={logData.meters_produced} 
                  onChange={e => setLogData({...logData, meters_produced: e.target.value})} 
                  required autoFocus 
                />
              </div>
              <div className="form-group">
                <label>Downtime (Minutes)</label>
                <input 
                  type="number" className="form-control" 
                  value={logData.downtime_minutes} 
                  onChange={e => setLogData({...logData, downtime_minutes: e.target.value})} 
                  placeholder="e.g., 30 for yarn breakage"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Remarks</label>
                <input 
                  type="text" className="form-control" 
                  value={logData.remarks} 
                  onChange={e => setLogData({...logData, remarks: e.target.value})} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Save size={16} /> Save Production Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
