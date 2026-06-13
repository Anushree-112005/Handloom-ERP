import React, { useState, useEffect } from 'react';
import { CheckSquare, Save, Search, Clock, Box } from 'lucide-react';
import { ppcAPI } from '../../services/api';

export default function ShiftProductionLog() {
  const [allocations, setAllocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logData, setLogData] = useState({
    allocation_id: '',
    meters_produced: '',
    downtime_minutes: '',
    remarks: ''
  });

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const res = await ppcAPI.getAllocations();
      // Only show Active allocations
      setAllocations(res.data.filter(a => a.allocation_status === 'Active' || a.allocation_status === 'Pending'));
    } catch (error) {
      console.error("Failed to fetch allocations", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ppcAPI.logProduction({
        ...logData,
        meters_produced: parseFloat(logData.meters_produced) || 0,
        downtime_minutes: parseInt(logData.downtime_minutes) || 0,
        allocation_id: parseInt(logData.allocation_id)
      });
      alert('Production log saved successfully!');
      setLogData({ allocation_id: '', meters_produced: '', downtime_minutes: '', remarks: '' });
      fetchAllocations(); // Refresh progress
    } catch (error) {
      console.error("Failed to log production", error);
      alert('Error saving log.');
    }
  };

  const selectedAlloc = allocations.find(a => a.id.toString() === logData.allocation_id);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckSquare style={{ color: 'var(--primary)' }} /> Shift Production Log
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manually log the meters produced per loom at the end of a shift.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Active Loom / Order *</label>
              <select 
                className="form-control" 
                value={logData.allocation_id}
                onChange={e => setLogData({...logData, allocation_id: e.target.value})}
                required
              >
                <option value="">-- Select Active Allocation --</option>
                {allocations.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.loom_name} - Order {a.order_id} ({a.fabric_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Meters Produced (This Shift) *</label>
                <input 
                  type="number" className="form-control" 
                  value={logData.meters_produced}
                  onChange={e => setLogData({...logData, meters_produced: e.target.value})}
                  required placeholder="Meters"
                />
              </div>
              <div className="form-group">
                <label>Downtime (Minutes)</label>
                <input 
                  type="number" className="form-control" 
                  value={logData.downtime_minutes}
                  onChange={e => setLogData({...logData, downtime_minutes: e.target.value})}
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Remarks / Notes</label>
              <input 
                type="text" className="form-control" 
                value={logData.remarks}
                onChange={e => setLogData({...logData, remarks: e.target.value})}
                placeholder="Any issues or shift handover notes..."
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
              <Save size={16} style={{ marginRight: 8 }} /> Save Production Entry
            </button>
          </form>
        </div>

        {selectedAlloc ? (
          <div className="card" style={{ padding: 24, backgroundColor: 'var(--bg-secondary)' }}>
            <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Order Context</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                <span style={{ fontWeight: 600 }}>{selectedAlloc.order_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Loom:</span>
                <span style={{ fontWeight: 600 }}>{selectedAlloc.loom_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fabric:</span>
                <span style={{ fontWeight: 600 }}>{selectedAlloc.fabric_type || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Assigned:</span>
                <span style={{ fontWeight: 600 }}>{selectedAlloc.assigned_meters} m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Already Completed:</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedAlloc.completed_meters} m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Remaining:</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>{selectedAlloc.assigned_meters - selectedAlloc.completed_meters} m</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <Box size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p>Select an allocation to view order context.</p>
          </div>
        )}
      </div>
    </div>
  );
}
