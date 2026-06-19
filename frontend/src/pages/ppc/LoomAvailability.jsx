import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle, Settings, AlertTriangle, Activity, Eye, X } from 'lucide-react';
import { ppcAPI } from '../../services/api';

export default function LoomAvailability() {
  const [looms, setLooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoom, setSelectedLoom] = useState(null);
  
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

  const totalLooms = looms.length;
  const runningLooms = looms.filter(l => l.status === 'Running').length;
  const breakdownLooms = looms.filter(l => l.status === 'Breakdown').length;
  const maintenanceLooms = looms.filter(l => l.status === 'Maintenance').length;

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#e0e7ff', padding: 12, borderRadius: 12, display: 'flex' }}>
            <Activity size={24} style={{ color: '#4f46e5' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Looms</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{totalLooms}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#dcfce7', padding: 12, borderRadius: 12, display: 'flex' }}>
            <CheckCircle size={24} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Running</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{runningLooms}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fef3c7', padding: 12, borderRadius: 12, display: 'flex' }}>
            <AlertTriangle size={24} style={{ color: '#d97706' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Breakdown</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{breakdownLooms}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fee2e2', padding: 12, borderRadius: 12, display: 'flex' }}>
            <Settings size={24} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>Maintenance</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{maintenanceLooms}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
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
          <table className="table" style={{ width: '100%', whiteSpace: 'nowrap', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Loom ID/Name</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Current Status</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Current Order ID</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Available for Allocation</th>
                <th style={{ padding: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : filteredLooms.length === 0 ? (
                <tr><td colSpan="11" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No looms found</td></tr>
              ) : filteredLooms.map((loom, idx) => {
                const stats = getLoomStats(loom);
                return (
                  <tr key={loom.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: '#4f46e5' }}>{loom.id} - {loom.loom_name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                        background: loom.status === 'Running' ? '#ecfdf5' : (loom.status === 'Idle' ? '#fef3c7' : '#fef2f2'),
                        color: loom.status === 'Running' ? '#047857' : (loom.status === 'Idle' ? '#b45309' : '#b91c1c')
                      }}>
                        {loom.status || 'Idle'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: stats.orderId !== '-' ? '#4f46e5' : 'inherit', fontWeight: 500 }}>{stats.orderId}</td>
                    <td style={{ padding: '16px' }}>
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
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={() => setSelectedLoom({ loom, stats })}
                        style={{ 
                          background: 'none', border: 'none', cursor: 'pointer', 
                          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 
                        }}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loom Details Modal */}
      {selectedLoom && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ 
            background: '#fff', width: '500px', maxWidth: '90%', 
            borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ 
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                Loom Details: {selectedLoom.loom.loom_name}
              </h3>
              <button 
                onClick={() => setSelectedLoom(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Loom ID</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedLoom.loom.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Status</div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      background: selectedLoom.loom.status === 'Running' ? '#ecfdf5' : (selectedLoom.loom.status === 'Idle' ? '#fef3c7' : '#fef2f2'),
                      color: selectedLoom.loom.status === 'Running' ? '#047857' : (selectedLoom.loom.status === 'Idle' ? '#b45309' : '#b91c1c')
                    }}>
                      {selectedLoom.loom.status || 'Idle'}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Loom Type</div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>{selectedLoom.loom.loom_type || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Reed Width</div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>{selectedLoom.loom.reed_width ? `${selectedLoom.loom.reed_width} cm` : '-'}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0' }}></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Current Order ID</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}>{selectedLoom.stats.orderId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Planned Finish Date</div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>{selectedLoom.stats.finishDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Allocated Meters</div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>{selectedLoom.stats.allocMeters > 0 ? selectedLoom.stats.allocMeters.toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Remaining Meters</div>
                  <div style={{ fontWeight: 600, color: selectedLoom.stats.remMeters > 0 ? '#b45309' : 'inherit', marginTop: 4 }}>
                    {selectedLoom.stats.remMeters > 0 ? selectedLoom.stats.remMeters.toLocaleString() : '-'}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Available Capacity</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedLoom.stats.availableCapacity > 0 ? `${selectedLoom.stats.availableCapacity} m/day` : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Allocation Ready</div>
                  <div style={{ marginTop: 4 }}>
                    {selectedLoom.stats.available ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 600 }}>
                        <CheckCircle size={16} /> Yes
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontWeight: 500 }}>
                        <XCircle size={16} /> No
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
