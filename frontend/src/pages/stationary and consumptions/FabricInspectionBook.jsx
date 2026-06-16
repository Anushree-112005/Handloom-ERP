import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Save, Trash2, X, FileText, CheckSquare, Layers, AlertCircle } from 'lucide-react';

export default function FabricInspectionBook() {
  const [inwardId, setInwardId] = useState('');
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [newRoll, setNewRoll] = useState({
    roll_no: '',
    declared_meters: '',
    actual_meters: '',
    points: 0,
    remarks: '',
    defects: {
      oil_spot: 0,
      weft_bar: 0,
      arrow_mark: 0,
      hole: 0
    }
  });

  const loadRolls = async () => {
    if (!inwardId) {
      alert('Please enter a Fabric Inward ID / Reference Number.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/stationary/inspection-rolls/${inwardId}`);
      setRolls(res.data);
      
      // Auto-populate next roll number
      const nextNo = res.data.length + 1;
      setNewRoll(prev => ({
        ...prev,
        roll_no: `R-${nextNo.toString().padStart(3, '0')}`,
        declared_meters: '',
        actual_meters: '',
        points: 0,
        remarks: '',
        defects: { oil_spot: 0, weft_bar: 0, arrow_mark: 0, hole: 0 }
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to load rolls.');
    } finally {
      setLoading(false);
    }
  };

  const handleDefectChange = (type, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    // 4-Point System estimation: say each defect adds points
    // Let's let the user override the points, or auto-calculate:
    const updatedDefects = { ...newRoll.defects, [type]: num };
    const calculatedPoints = Object.values(updatedDefects).reduce((a, b) => a + b, 0) * 2; // say 2 points per defect avg
    
    setNewRoll(prev => ({
      ...prev,
      defects: updatedDefects,
      points: calculatedPoints
    }));
  };

  const handleAddRoll = async (e) => {
    e.preventDefault();
    if (!inwardId) {
      alert('Please specify a Fabric Inward reference.');
      return;
    }
    if (!newRoll.roll_no || !newRoll.declared_meters || !newRoll.actual_meters) {
      alert('Roll no, declared meters, and actual meters are required.');
      return;
    }

    try {
      const payload = {
        fabric_inward_id: inwardId,
        roll_no: newRoll.roll_no,
        declared_meters: Number(newRoll.declared_meters),
        actual_meters: Number(newRoll.actual_meters),
        points: Number(newRoll.points),
        defects: newRoll.defects,
        remarks: newRoll.remarks
      };

      await api.post('/stationary/inspection-rolls/save', payload);
      alert('Roll inspection entry saved successfully.');
      loadRolls();
    } catch (err) {
      console.error(err);
      alert('Failed to save roll.');
    }
  };

  const handleDeleteRoll = async (id) => {
    if (!window.confirm('Delete this roll record?')) return;
    try {
      await api.delete(`/stationary/inspection-rolls/${id}`);
      loadRolls();
    } catch (err) {
      console.error(err);
      alert('Failed to delete roll.');
    }
  };

  // Metrics
  const totalMetersDeclared = rolls.reduce((acc, r) => acc + r.declared_meters, 0);
  const totalMetersActual = rolls.reduce((acc, r) => acc + r.actual_meters, 0);
  const totalDifference = totalMetersActual - totalMetersDeclared;
  const avgPoints = rolls.length > 0 ? (rolls.reduce((acc, r) => acc + r.points, 0) / rolls.length).toFixed(1) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header section */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Piece-to-Piece Fabric Inspection</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 0' }}>Digitized Inspection Book: log individual rolls, yardage, and defect counts</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            type="text" 
            placeholder="Enter Fabric Inward ID (e.g. INW-104)"
            value={inwardId}
            onChange={(e) => setInwardId(e.target.value)}
            className="form-control"
            style={{ width: '250px', borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <button onClick={loadRolls} className="btn btn-primary" style={{ borderRadius: '8px', padding: '10px 18px', fontWeight: 600 }}>
            Load Inspection
          </button>
        </div>
      </div>

      {inwardId && rolls.length > 0 && (
        /* Metrics Display */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: '16px 20px', borderRadius: '10px', background: 'white', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Rolls Inspected</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0 0' }}>{rolls.length}</h2>
          </div>
          <div className="card" style={{ padding: '16px 20px', borderRadius: '10px', background: 'white', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Declared Meters</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0 0', color: 'var(--text-primary)' }}>{totalMetersDeclared.toFixed(2)} m</h2>
          </div>
          <div className="card" style={{ padding: '16px 20px', borderRadius: '10px', background: 'white', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Actual Meters</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0 0', color: 'var(--primary)' }}>{totalMetersActual.toFixed(2)} m</h2>
          </div>
          <div className="card" style={{ padding: '16px 20px', borderRadius: '10px', background: 'white', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Difference / Shrinkage</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0 0', color: totalDifference >= 0 ? '#166534' : '#991b1b' }}>
              {totalDifference >= 0 ? '+' : ''}{totalDifference.toFixed(2)} m
            </h2>
          </div>
          <div className="card" style={{ padding: '16px 20px', borderRadius: '10px', background: 'white', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Avg Defect Points / Roll</span>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0 0', color: Number(avgPoints) > 10 ? '#b91c1c' : 'var(--text-primary)' }}>{avgPoints}</h2>
          </div>
        </div>
      )}

      {inwardId ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>
          {/* List of Rolls */}
          <div className="card" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Inspected Pieces / Rolls</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Declared (m)</th>
                  <th>Actual (m)</th>
                  <th>Diff (m)</th>
                  <th>Defect Points</th>
                  <th>Defects Breakdown</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'center' }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {rolls.map(roll => {
                  const diff = roll.actual_meters - roll.declared_meters;
                  const def = roll.defects || {};
                  return (
                    <tr key={roll.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{roll.roll_no}</td>
                      <td>{roll.declared_meters.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>{roll.actual_meters.toFixed(2)}</td>
                      <td style={{ color: diff >= 0 ? '#166534' : '#991b1b', fontWeight: 600 }}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 700 }}>{roll.points}</td>
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {Object.entries(def).map(([k, v]) => v > 0 ? `${k.replace('_', ' ')}: ${v}` : null).filter(Boolean).join(', ') || 'None'}
                        </div>
                      </td>
                      <td>{roll.remarks || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => handleDeleteRoll(roll.id)} className="btn btn-outline" style={{ padding: '4px 8px', minWidth: 0, color: '#dc2626', borderColor: '#fee2e2' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {rolls.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <CheckSquare size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <div>No rolls inspected yet for this Inward ID.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Roll Form */}
          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>New Roll Entry</h3>
            <form onSubmit={handleAddRoll} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Roll Number *</label>
                <input 
                  type="text" 
                  required 
                  value={newRoll.roll_no}
                  onChange={(e) => setNewRoll({ ...newRoll, roll_no: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Declared (m) *</label>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    min="0"
                    placeholder="e.g. 100.0"
                    value={newRoll.declared_meters}
                    onChange={(e) => setNewRoll({ ...newRoll, declared_meters: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label>Actual (m) *</label>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    min="0"
                    placeholder="e.g. 99.5"
                    value={newRoll.actual_meters}
                    onChange={(e) => setNewRoll({ ...newRoll, actual_meters: e.target.value })}
                    className="form-control"
                    style={{ borderRadius: '6px' }}
                  />
                </div>
              </div>

              {/* Defect Counters */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8, color: 'var(--text-secondary)' }}>Defect Counts (4-Point System)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Oil Spot</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.oil_spot}
                      onChange={(e) => handleDefectChange('oil_spot', e.target.value)}
                      className="form-control"
                      style={{ borderRadius: '6px', padding: '6px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Weft Bar</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.weft_bar}
                      onChange={(e) => handleDefectChange('weft_bar', e.target.value)}
                      className="form-control"
                      style={{ borderRadius: '6px', padding: '6px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Arrow Mark</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.arrow_mark}
                      onChange={(e) => handleDefectChange('arrow_mark', e.target.value)}
                      className="form-control"
                      style={{ borderRadius: '6px', padding: '6px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Holes</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.hole}
                      onChange={(e) => handleDefectChange('hole', e.target.value)}
                      className="form-control"
                      style={{ borderRadius: '6px', padding: '6px 10px' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label>Defect Points (Estimated)</label>
                <input 
                  type="number"
                  value={newRoll.points}
                  onChange={(e) => setNewRoll({ ...newRoll, points: Number(e.target.value) })}
                  className="form-control"
                  style={{ borderRadius: '6px', fontWeight: 700 }}
                />
              </div>

              <div>
                <label>Remarks</label>
                <input 
                  type="text" 
                  placeholder="e.g. minor stains"
                  value={newRoll.remarks}
                  onChange={(e) => setNewRoll({ ...newRoll, remarks: e.target.value })}
                  className="form-control"
                  style={{ borderRadius: '6px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', width: '100%', padding: '10px 0', borderRadius: '8px', fontWeight: 600, marginTop: 8 }}>
                <Save size={16} /> Save Roll Record
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={44} style={{ marginBottom: 12, color: 'var(--primary)', opacity: 0.8 }} />
          <h3>No Fabric Inward Loaded</h3>
          <p>Please enter a Fabric Inward ID above and click "Load Inspection" to view or enter inspection rolls.</p>
        </div>
      )}
    </div>
  );
}
