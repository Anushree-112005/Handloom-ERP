import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Search, AlertCircle, FileText, Download, CheckCircle, MapPin, Box } from 'lucide-react';
import { erpStockAPI } from '../../services/api';

export default function PhysicalAudit() {
  const [locationType, setLocationType] = useState('MAIN_GODOWN');
  const [stockItems, setStockItems] = useState([]);
  const [auditItems, setAuditItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchStockForAudit();
  }, [locationType]);

  const fetchStockForAudit = async () => {
    setLoading(true);
    try {
      const res = await erpStockAPI.getCurrentStock(`?location_type=${locationType}&status=AVAILABLE`);
      setStockItems(res.data);
      
      const initialAudit = {};
      res.data.forEach(item => {
        initialAudit[item.id] = {
          item_id: item.item_id,
          batch_id: item.batch_id,
          lot_id: item.lot_id,
          system_qty: item.quantity,
          physical_qty: item.quantity,
          variance: 0
        };
      });
      setAuditItems(initialAudit);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (id, value) => {
    const val = parseFloat(value) || 0;
    setAuditItems(prev => {
      const item = prev[id];
      return {
        ...prev,
        [id]: {
          ...item,
          physical_qty: val,
          variance: val - item.system_qty
        }
      };
    });
  };

  const handleSubmit = async () => {
    if (!window.confirm("Submit audit? Discrepancies will automatically adjust the system stock.")) return;
    
    setSubmitting(true);
    try {
      const payload = {
        location_type: locationType,
        audited_by: 1,
        notes: `Routine audit for ${locationType}`,
        items: Object.values(auditItems)
      };
      
      await erpStockAPI.submitAudit(payload);
      
      alert('Audit submitted successfully!');
      fetchStockForAudit();
    } catch (err) {
      alert('Failed to submit audit');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStock = stockItems.filter(item => {
    return item.item_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.batch_id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalItems = stockItems.length;
  const itemsAudited = stockItems.filter(item => auditItems[item.id]?.physical_qty !== undefined).length;
  const variancesFound = stockItems.filter(item => auditItems[item.id]?.variance !== 0).length;

  return (
    <div className="animate-fade">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={24} color="#059669" /> Physical Stock Audit
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Verify physical quantities against system records and register discrepancies.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> Export
            </button>
            {showExportMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden' }}>
                <button
                  onClick={() => setShowExportMenu(false)}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
                >
                  <FileText size={16} color="#ef4444" /> PDF Report
                </button>
                <button
                  onClick={() => setShowExportMenu(false)}
                  style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}
                >
                  <Download size={16} color="#10b981" /> Excel Sheet
                </button>
              </div>
            )}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit} 
            disabled={submitting || loading || stockItems.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={16} /> {submitting ? 'Submitting...' : 'Submit Audit'}
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Box size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Items in Location</h3>
            <div className="value">{totalItems}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Items Audited</h3>
            <div className="value">{itemsAudited}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>Variances Found</h3>
            <div className="value">{variancesFound}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-details">
            <h3>Current Location</h3>
            <div className="value" style={{ fontSize: 16 }}>{locationType.replace('_', ' ')}</div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 350 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by Item ID or Batch..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <MapPin size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Location:</span>
          </div>

          <select 
            className="form-control" 
            style={{ width: 200, margin: 0 }}
            value={locationType} 
            onChange={e => setLocationType(e.target.value)}
          >
            <option value="MAIN_GODOWN">Main Godown</option>
            <option value="YARN_STORE">Yarn Store</option>
            <option value="CHEMICAL_STORE">Chemical Store</option>
            <option value="WEAVING_UNIT">Weaving WIP</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Batch / Lot</th>
                <th style={{ textAlign: 'right' }}>System Qty</th>
                <th style={{ textAlign: 'center', width: '180px' }}>Physical Qty</th>
                <th style={{ textAlign: 'right' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading...</td>
                </tr>
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <ClipboardCheck size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <p>No stock found in this location.</p>
                  </td>
                </tr>
              ) : (
                filteredStock.map(item => {
                  const auditLine = auditItems[item.id];
                  if (!auditLine) return null;
                  
                  const hasVariance = auditLine.variance !== 0;
                  
                  return (
                    <tr key={item.id} style={{ backgroundColor: hasVariance ? 'rgba(239,68,68,0.05)' : 'inherit' }}>
                      <td style={{ fontWeight: 600 }}>{item.item_id}</td>
                      <td>
                        {item.batch_id && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>B: {item.batch_id}</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="form-control"
                          style={{ width: '120px', margin: '0 auto', textAlign: 'center', borderColor: hasVariance ? '#ef4444' : 'var(--border)' }}
                          value={auditLine.physical_qty}
                          onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        />
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        fontWeight: 700,
                        color: auditLine.variance < 0 ? '#ef4444' : auditLine.variance > 0 ? '#10b981' : 'inherit'
                      }}>
                        {auditLine.variance > 0 ? '+' : ''}{auditLine.variance}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
