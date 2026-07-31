import React, { useState, useEffect } from 'react';
import { FileText, ArrowUpRight, ArrowDownLeft, RefreshCcw, Search, Filter, Download, BarChart2 } from 'lucide-react';
import { erpStockAPI } from '../../../services/api';

const StockLedger = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const response = await erpStockAPI.getMovements();
      setMovements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stock movements', error);
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'RECEIPT':
        return <ArrowDownLeft size={16} color="#10b981" />;
      case 'ISSUE':
      case 'DISPATCH':
      case 'TRANSFER_OUT':
        return <ArrowUpRight size={16} color="#f59e0b" />;
      default:
        return <RefreshCcw size={16} color="#3b82f6" />;
    }
  };

  const getStageStatus = (movement) => {
    const tracking = (movement.tracking_id || '').toUpperCase();
    const type = (movement.transaction_type || '').toUpperCase();
    const status = (movement.status || '').toUpperCase();

    // 1. Process / Voucher Reference matching
    if (tracking.startsWith('GRN-Y') || tracking.startsWith('PO-Y') || tracking.includes('YARN_PURCHASE') || tracking.includes('YARN_INWARD')) {
      return { label: 'Yarn Purchase Inward', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    }
    if (tracking.startsWith('GYD') || tracking.startsWith('DYD') || (type === 'TRANSFER_OUT' && tracking.startsWith('DYR'))) {
      return { label: 'Dyeing Delivery', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    }
    if (tracking.startsWith('DYR') || tracking.includes('DYED_YARN_RECEIPT')) {
      return { label: 'Dyeing Receipt', bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (tracking.startsWith('WRP') || tracking.startsWith('SIZ')) {
      return { label: 'Warping / Sizing Delivery', bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' };
    }
    if (tracking.startsWith('WVG')) {
      return { label: 'Weaving Delivery', bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' };
    }
    if (tracking.startsWith('FDD')) {
      return { label: 'Fabric Dyeing Delivery', bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' };
    }
    if (tracking.startsWith('DFR')) {
      return { label: 'Dyed Fabric Receipt', bg: '#d1fae5', color: '#047857', border: '#a7f3d0' };
    }
    if (tracking.startsWith('PRT')) {
      return { label: 'Printing Delivery', bg: '#fef9c3', color: '#a16207', border: '#fef08a' };
    }
    if (tracking.startsWith('FNS')) {
      return { label: 'Finishing Delivery', bg: '#cff4fc', color: '#055160', border: '#b6effb' };
    }
    if (tracking.startsWith('FAB-IN')) {
      return { label: 'Fabric Inward', bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' };
    }

    // 2. Status fallback
    if (status === 'AT_JOB_WORK') {
      return { label: 'Job Work Outward', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    }
    if (status === 'AVAILABLE') {
      if (type === 'RECEIPT') {
        return { label: 'Inward Receipt', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      }
      return { label: 'Available', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    }
    if (status === 'IN_INSPECTION') {
      return { label: 'Quality Inspection', bg: '#fef9c3', color: '#a16207', border: '#fef08a' };
    }

    return { label: status.replace(/_/g, ' ') || type.replace(/_/g, ' ') || 'Completed', bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  };

  const filteredMovements = movements.filter(m => {
    const stage = getStageStatus(m);
    const search = searchTerm.toLowerCase();
    const matchesSearch = (m.item_id || '').toLowerCase().includes(search) || 
                          (m.tracking_id || '').toLowerCase().includes(search) ||
                          (stage.label || '').toLowerCase().includes(search);
    const matchesType = typeFilter === 'ALL' || m.transaction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalMovements = movements.length;
  const totalReceipts = movements.filter(m => m.transaction_type === 'RECEIPT').length;
  const totalIssues = movements.filter(m => ['ISSUE', 'DISPATCH'].includes(m.transaction_type)).length;
  const totalAdjustments = movements.filter(m => m.transaction_type === 'ADJUSTMENT').length;

  return (
    <div className="animate-fade">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={24} color="var(--primary)" /> Stock Ledger
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Immutable transaction history of all stock movements.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <BarChart2 size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Movements</h3>
            <div className="value">{totalMovements}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            <ArrowDownLeft size={24} />
          </div>
          <div className="stat-details">
            <h3>Receipts</h3>
            <div className="value">{totalReceipts}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-details">
            <h3>Issues & Dispatches</h3>
            <div className="value">{totalIssues}</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <RefreshCcw size={24} />
          </div>
          <div className="stat-details">
            <h3>Adjustments</h3>
            <div className="value">{totalAdjustments}</div>
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
            placeholder="Search Item ID or Batch..."
            style={{ paddingLeft: 38, width: '100%', margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
            <Filter size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Filter:</span>
          </div>

          <select className="form-control" style={{ width: 150, margin: 0 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="RECEIPT">Receipts</option>
            <option value="ISSUE">Issues</option>
            <option value="DISPATCH">Dispatches</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Item ID</th>
                <th>Transaction Type</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Tracking (Batch/Lot)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading ledger data...</td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <p>No stock movements found.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => {
                  const stage = getStageStatus(movement);
                  return (
                    <tr key={movement.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {new Date(movement.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{movement.item_id}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {getTransactionIcon(movement.transaction_type)}
                          {movement.transaction_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: movement.quantity > 0 ? '#10b981' : '#f59e0b' }}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: '700',
                          backgroundColor: stage.bg, 
                          color: stage.color, 
                          border: `1px solid ${stage.border}` 
                        }}>
                          {stage.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                        {movement.tracking_id || '-'}
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
};

export default StockLedger;
