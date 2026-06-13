import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter } from 'lucide-react';
import { ppcAPI, buyerOrderAPI } from '../../services/api';

export default function RuntimeCalculation() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, loomsRes, orderRes] = await Promise.all([
        ppcAPI.getAllocations(),
        ppcAPI.getLooms(),
        buyerOrderAPI.list()
      ]);
      
      const allocs = allocRes?.data || [];
      const looms = loomsRes?.data || [];
      
      const calcData = allocs.map(alloc => {
        const loom = looms.find(l => l.id === alloc.loom_id || l.loom_name === alloc.loom_id) || {};
        
        const allocatedMeters = alloc.assigned_meters || 0;
        const maxCap = loom.capacity_per_day || 450;
        const eff = loom.efficiency_pct || 90;
        const plannedDailyProd = maxCap * (eff / 100);
        
        const runtimeRaw = plannedDailyProd > 0 ? (allocatedMeters / plannedDailyProd) : 0;
        const runtimeDays = Math.ceil(runtimeRaw);
        
        // Mock a planned start date from the past few days if active
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 5));
        const plannedStartStr = startDate.toISOString().split('T')[0];
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + runtimeDays);
        const plannedFinishStr = endDate.toISOString().split('T')[0];
        
        return {
          loom_id: alloc.loom_id || loom.loom_name || 'N/A',
          order_id: alloc.order_id,
          allocated_meters: allocatedMeters,
          planned_daily_prod: plannedDailyProd.toFixed(0),
          runtime_days: runtimeDays,
          planned_start: plannedStartStr,
          planned_finish: plannedFinishStr
        };
      });
      
      setData(calcData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(d => 
    d.loom_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.order_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock style={{ color: '#0ea5e9' }} /> Runtime Calculation
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 800 }}>
            Calculates the planned production duration before production starts. It uses allocated meters, loom capacity, and efficiency to estimate how many days the loom is expected to run. This value is used for production scheduling, start date planning, and resource allocation.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Planned Runtime Board</h3>
          </div>
          <div className="search-bar" style={{ position: 'relative', width: 250 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search looms or orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
        
        <div className="table-responsive" style={{ flex: 1 }}>
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr>
                <th>Loom ID</th>
                <th>Order ID</th>
                <th>Allocated Meters</th>
                <th>Planned Daily Production</th>
                <th>Planned Runtime (Days)</th>
                <th>Planned Start Date</th>
                <th>Planned Finish Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No planning data found</td></tr>
              ) : filteredData.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{row.loom_id}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{row.order_id}</td>
                  <td style={{ fontWeight: 600 }}>{row.allocated_meters > 0 ? row.allocated_meters.toLocaleString() : '-'}</td>
                  <td style={{ color: '#0369a1', fontWeight: 600 }}>{row.planned_daily_prod} m/day</td>
                  <td style={{ fontWeight: 700, color: '#0ea5e9' }}>{row.runtime_days} days</td>
                  <td>{row.planned_start}</td>
                  <td style={{ fontWeight: 600 }}>{row.planned_finish}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
