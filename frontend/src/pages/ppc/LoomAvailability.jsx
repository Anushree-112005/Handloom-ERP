import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import { ppcAPI } from '../../services/api';

export default function LoomAvailability() {
  const [looms, setLooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loomsRes, allocRes] = await Promise.all([
        ppcAPI.getLooms(),
        ppcAPI.getAllocations()
      ]);
      setLooms(loomsRes?.data || []);
      setAllocations(allocRes?.data || []);
    } catch (err) {
      console.error("Failed to fetch loom availability data", err);
    } finally {
      setLoading(false);
    }
  };

  const getLoomStats = (loom) => {
    const activeAlloc = allocations.find(a => a.loom_id === loom.id && ['Active', 'Pending'].includes(a.allocation_status));
    const orderId = activeAlloc ? activeAlloc.order_id : '-';
    const allocMeters = activeAlloc ? activeAlloc.assigned_meters : 0;
    const prodMeters = activeAlloc ? activeAlloc.completed_meters : 0;
    const remMeters = Math.max(0, allocMeters - prodMeters);
    
    let finishDate = '-';
    if (remMeters > 0 && loom.capacity_per_day > 0) {
       const daysNeeded = remMeters / loom.capacity_per_day;
       const d = new Date();
       d.setDate(d.getDate() + Math.ceil(daysNeeded));
       finishDate = d.toISOString().split('T')[0];
    } else if (activeAlloc) {
       finishDate = new Date().toISOString().split('T')[0];
    }
    
    const available = remMeters === 0;
    const availableCapacity = available ? loom.capacity_per_day : 0;

    return {
      orderId,
      allocMeters,
      remMeters,
      finishDate,
      availableCapacity,
      available
    };
  };

  const filteredLooms = looms.filter(l => 
    l.loom_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar style={{ color: '#10b981' }} /> Loom Availability Check
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 800 }}>
            Checks whether a loom is available for allocation before planning. Displays current workload, assigned order, planned finish date, and available capacity to help planners decide where to allocate new orders.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Loom Status Board</h3>
          </div>
          <div className="search-bar" style={{ position: 'relative', width: 250 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search looms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
        
        <div className="table-responsive" style={{ flex: 1, overflowX: 'auto', minHeight: 0 }}>
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr>
                <th>Loom ID</th>
                <th>Loom Name</th>
                <th>Current Status</th>
                <th>Current Order ID</th>
                <th>Allocated Meters</th>
                <th>Remaining Meters</th>
                <th>Planned Finish Date</th>
                <th>Available Capacity (m/day)</th>
                <th>Available for Allocation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filteredLooms.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No looms found</td></tr>
              ) : filteredLooms.map((loom, idx) => {
                const stats = getLoomStats(loom);
                return (
                  <tr key={loom.id || idx}>
                    <td style={{ fontWeight: 600 }}>{loom.id}</td>
                    <td>{loom.loom_name}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: loom.status === 'Running' ? '#ecfdf5' : (loom.status === 'Idle' ? '#fef3c7' : '#fef2f2'),
                        color: loom.status === 'Running' ? '#047857' : (loom.status === 'Idle' ? '#b45309' : '#b91c1c')
                      }}>
                        {loom.status || 'Idle'}
                      </span>
                    </td>
                    <td style={{ color: stats.orderId !== '-' ? 'var(--primary)' : 'inherit', fontWeight: 500 }}>{stats.orderId}</td>
                    <td>{stats.allocMeters > 0 ? stats.allocMeters.toLocaleString() : '-'}</td>
                    <td style={{ color: stats.remMeters > 0 ? '#b45309' : 'inherit', fontWeight: 500 }}>
                      {stats.remMeters > 0 ? stats.remMeters.toLocaleString() : '-'}
                    </td>
                    <td>{stats.finishDate}</td>
                    <td style={{ fontWeight: 600 }}>{stats.availableCapacity > 0 ? stats.availableCapacity : '-'}</td>
                    <td>
                      {stats.available ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 600 }}>
                          <CheckCircle size={16} /> Yes
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontWeight: 500 }}>
                          <XCircle size={16} /> No
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
