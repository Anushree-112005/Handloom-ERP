import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Save, Trash2, X, FileText, CheckSquare, Layers, AlertCircle, Search } from 'lucide-react';
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
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers style={{ color: '#6366f1' }} /> Piece-to-Piece Fabric Inspection
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 14 }}>Digitized Inspection Book: log individual rolls, yardage, and defect counts</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            placeholder="Enter Fabric Inward ID (e.g. INW-104)"
            value={inwardId}
            onChange={(e) => setInwardId(e.target.value)}
            className="form-control"
            style={{ width: '280px' }}
          />
          <button onClick={loadRolls} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} /> Load Inspection
          </button>
        </div>
      </div>

      {inwardId && rolls.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Rolls Inspected</span>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{rolls.length}</h2>
          </div>
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Declared (m)</span>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{totalMetersDeclared.toFixed(2)}</h2>
          </div>
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Actual (m)</span>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#4f46e5' }}>{totalMetersActual.toFixed(2)}</h2>
          </div>
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Difference / Shrinkage</span>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: totalDifference >= 0 ? '#10b981' : '#ef4444' }}>
              {totalDifference >= 0 ? '+' : ''}{totalDifference.toFixed(2)}
            </h2>
          </div>
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Defect Points</span>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: Number(avgPoints) > 10 ? '#ef4444' : 'var(--text-primary)' }}>{avgPoints}</h2>
          </div>
        </div>
      )}

      {inwardId ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'flex-start' }}>
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Inspected Pieces / Rolls</h3>
            </div>
            
            <div className="table-responsive" style={{ flex: 1 }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Declared (m)</th>
                    <th>Actual (m)</th>
                    <th>Diff (m)</th>
                    <th>Points</th>
                    <th>Defects Breakdown</th>
                    <th>Remarks</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rolls.map(roll => {
                    const diff = roll.actual_meters - roll.declared_meters;
                    const def = roll.defects || {};
                    return (
                      <tr key={roll.id}>
                        <td style={{ fontFamily: 'monospace', color: '#4f46e5', fontWeight: 600 }}>{roll.roll_no}</td>
                        <td>{roll.declared_meters.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>{roll.actual_meters.toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: diff >= 0 ? '#10b981' : '#ef4444' }}>
                          {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          <span style={{ background: roll.points > 10 ? '#fef2f2' : '#f8fafc', color: roll.points > 10 ? '#ef4444' : 'var(--text-primary)', padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>
                            {roll.points}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {Object.entries(def).map(([k, v]) => v > 0 ? `${k.replace('_', ' ')}: ${v}` : null).filter(Boolean).join(', ') || '-'}
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{roll.remarks || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => handleDeleteRoll(roll.id)} className="btn btn-outline" style={{ padding: '6px', minWidth: 0, color: '#dc2626', borderColor: '#fee2e2', borderRadius: '8px' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {rolls.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <CheckSquare size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No rolls inspected</h3>
                        <p style={{ margin: 0 }}>Start entering roll inspection data on the right panel.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: 10, background: '#6366f115', borderRadius: 10, color: '#6366f1' }}>
                <Plus size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>New Roll Entry</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Add inspection findings</p>
              </div>
            </div>

            <form onSubmit={handleAddRoll} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label>Roll Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  required 
                  value={newRoll.roll_no}
                  onChange={(e) => setNewRoll({ ...newRoll, roll_no: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Declared (m) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    min="0"
                    placeholder="e.g. 100.0"
                    value={newRoll.declared_meters}
                    onChange={(e) => setNewRoll({ ...newRoll, declared_meters: e.target.value })}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Actual (m) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    min="0"
                    placeholder="e.g. 99.5"
                    value={newRoll.actual_meters}
                    onChange={(e) => setNewRoll({ ...newRoll, actual_meters: e.target.value })}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 16, color: 'var(--text-primary)' }}>Defect Counts (4-Point System)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 13 }}>Oil Spot</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.oil_spot}
                      onChange={(e) => handleDefectChange('oil_spot', e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 13 }}>Weft Bar</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.weft_bar}
                      onChange={(e) => handleDefectChange('weft_bar', e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 13 }}>Arrow Mark</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.arrow_mark}
                      onChange={(e) => handleDefectChange('arrow_mark', e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 13 }}>Holes</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newRoll.defects.hole}
                      onChange={(e) => handleDefectChange('hole', e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Defect Points (Estimated)</label>
                <input 
                  type="number"
                  value={newRoll.points}
                  onChange={(e) => setNewRoll({ ...newRoll, points: Number(e.target.value) })}
                  className="form-control"
                  style={{ fontWeight: 700, color: '#4f46e5' }}
                />
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <input 
                  type="text" 
                  placeholder="e.g. minor stains"
                  value={newRoll.remarks}
                  onChange={(e) => setNewRoll({ ...newRoll, remarks: e.target.value })}
                  className="form-control"
                />
              </div>

              <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
                  <Save size={16} /> Save Roll Record
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="card" style={{ border: 'none', boxShadow: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', flex: 1 }}>
          <Search size={48} style={{ marginBottom: 16, color: '#cbd5e1' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No Fabric Inward Loaded</h3>
          <p style={{ margin: 0 }}>Please enter a Fabric Inward ID above and click "Load Inspection" to view or enter inspection rolls.</p>
        </div>
      )}
    </div>
  );
}
